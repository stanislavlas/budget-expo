# Local Development with LocalStack

Run DynamoDB and API Gateway locally using LocalStack so you can develop
without touching real AWS resources or incurring any costs.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [Node.js 18+](https://nodejs.org/)

---

## 1. Start LocalStack

Create `docker-compose.yml` in your project root:

```yaml
version: "3.8"
services:
  localstack:
    image: localstack/localstack:3
    ports:
      - "4566:4566"       # LocalStack gateway (all services on one port)
    environment:
      - SERVICES=dynamodb
      - DEFAULT_REGION=eu-central-1
      - AWS_DEFAULT_REGION=eu-central-1
    volumes:
      - localstack_data:/var/lib/localstack
volumes:
  localstack_data:
```

Start it:

```bash
docker compose up -d
```

Check it's healthy:

```bash
curl http://localhost:4566/_localstack/health
# Should show "dynamodb": "running"
```

---

## 2. Configure AWS CLI for LocalStack

Add a LocalStack profile to your AWS config so you never accidentally run
commands against real AWS during development.

```bash
aws configure --profile localstack
# AWS Access Key ID:     test
# AWS Secret Access Key: test
# Default region:        eu-central-1
# Default output format: json
```

All commands below use `--profile localstack --endpoint-url http://localhost:4566`.
You can alias this to save typing:

```bash
# Add to your ~/.bashrc or ~/.zshrc
alias awslocal='aws --profile localstack --endpoint-url http://localhost:4566'
```

Then reload: `source ~/.bashrc`

---

## 3. Create the DynamoDB tables

Run these commands once. They are idempotent — safe to re-run.

### budget_users

```bash
awslocal dynamodb create-table \
  --table-name budget_users \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --global-secondary-indexes '[
    {
      "IndexName": "email-index",
      "KeySchema": [{"AttributeName":"email","KeyType":"HASH"}],
      "Projection": {"ProjectionType":"ALL"}
    }
  ]' \
  --billing-mode PAY_PER_REQUEST
```

### budget_refresh_tokens

```bash
awslocal dynamodb create-table \
  --table-name budget_refresh_tokens \
  --attribute-definitions \
    AttributeName=tokenHash,AttributeType=S \
  --key-schema \
    AttributeName=tokenHash,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

> TTL is not needed locally — LocalStack doesn't enforce it anyway.

### budget_entries

```bash
awslocal dynamodb create-table \
  --table-name budget_entries \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=entryId,AttributeType=S \
    AttributeName=householdId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=entryId,KeyType=RANGE \
  --global-secondary-indexes '[
    {
      "IndexName": "householdId-index",
      "KeySchema": [
        {"AttributeName":"householdId","KeyType":"HASH"},
        {"AttributeName":"entryId","KeyType":"RANGE"}
      ],
      "Projection": {"ProjectionType":"ALL"}
    }
  ]' \
  --billing-mode PAY_PER_REQUEST
```

### budget_households

```bash
awslocal dynamodb create-table \
  --table-name budget_households \
  --attribute-definitions \
    AttributeName=householdId,AttributeType=S \
  --key-schema \
    AttributeName=householdId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### budget_categories  ← new table for custom categories

```bash
awslocal dynamodb create-table \
  --table-name budget_categories \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=categoryId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=categoryId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

---

## 4. Verify tables were created

```bash
awslocal dynamodb list-tables
# Output:
# {
#   "TableNames": [
#     "budget_categories",
#     "budget_entries",
#     "budget_households",
#     "budget_refresh_tokens",
#     "budget_users"
#   ]
# }
```

Inspect a table:

```bash
awslocal dynamodb describe-table --table-name budget_users
```

---

## 5. Run the Lambda locally with `sam local`

Install AWS SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

Create `template.yaml` in your `backend/` folder:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Resources:
  BudgetApi:
    Type: AWS::Serverless::Function
    Properties:
      Handler: lambda.handler
      Runtime: nodejs20.x
      CodeUri: .
      Timeout: 10
      Environment:
        Variables:
          JWT_SECRET: local-dev-secret-32-chars-minimum
          TABLE_USERS: budget_users
          TABLE_TOKENS: budget_refresh_tokens
          TABLE_ENTRIES: budget_entries
          TABLE_HOUSEHOLDS: budget_households
          TABLE_CATEGORIES: budget_categories
          AWS_ENDPOINT_URL: http://host.docker.internal:4566
      Events:
        ApiProxy:
          Type: HttpApi
          Properties:
            Path: /{proxy+}
            Method: ANY
```

Start the local API:

```bash
cd backend
npm install
sam local start-api --port 3001 --warm-containers EAGER
```

Your API is now at `http://localhost:3001`.

---

## 6. Point the Expo app at local API

Edit your `.env`:

```
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3001
```

> `10.0.2.2` is the Android emulator's alias for `localhost` on your computer.
> If using a **physical phone** on the same Wi-Fi, use your computer's local IP instead:
> ```
> EXPO_PUBLIC_API_BASE_URL=http://192.168.1.x:3001
> ```
> Find your IP: `ipconfig` (Windows) or `ifconfig | grep 192` (Mac/Linux)

---

## 7. Seed a test user (optional)

```bash
# Hash a password manually (bcrypt hash for "password123")
HASH='$2b$12$KIXoK/1J4c7b1s6uQGkLCuXpfNoIOEz6dg5dYpBVwWl0JIZvamCkK'

awslocal dynamodb put-item \
  --table-name budget_users \
  --item '{
    "userId":       {"S": "test-user-001"},
    "name":         {"S": "Test User"},
    "email":        {"S": "test@example.com"},
    "passwordHash": {"S": "'"$HASH"'"},
    "createdAt":    {"N": "1700000000000"},
    "householdId":  {"NULL": true},
    "householdRole":{"NULL": true}
  }'
```

Login with `test@example.com` / `password123`.

---

## 8. Useful debug commands

```bash
# List all entries for a user
awslocal dynamodb query \
  --table-name budget_entries \
  --key-condition-expression "userId = :u" \
  --expression-attribute-values '{":u": {"S": "test-user-001"}}'

# List all custom categories for a user
awslocal dynamodb query \
  --table-name budget_categories \
  --key-condition-expression "userId = :u" \
  --expression-attribute-values '{":u": {"S": "test-user-001"}}'

# Wipe all entries (useful during testing)
awslocal dynamodb scan --table-name budget_entries \
  --query 'Items[*].{userId: userId.S, entryId: entryId.S}' \
  --output text | while read uid eid; do
    awslocal dynamodb delete-item \
      --table-name budget_entries \
      --key "{\"userId\":{\"S\":\"$uid\"},\"entryId\":{\"S\":\"$eid\"}}"
  done

# Stop LocalStack
docker compose down
```

---

## 9. Switch between local and production

| Environment | `.env` value |
|---|---|
| LocalStack (emulator) | `http://10.0.2.2:3001` |
| LocalStack (physical phone) | `http://192.168.1.x:3001` |
| AWS production | `https://xxxxxxxxxx.execute-api.eu-central-1.amazonaws.com/prod` |

Never commit `.env` to git — it's in `.gitignore`.
