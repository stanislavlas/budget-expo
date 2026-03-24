# Budget Backend

Lambda-based API for the Budget Expo app.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Make sure LocalStack is running

```bash
# From project root
docker compose up -d
```

### 3. Start the API with SAM Local

```bash
npm start
# or
sam local start-api --port 3001 --warm-containers EAGER
```

Your API will be available at `http://localhost:3001`

## Prerequisites

- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)

### Installing AWS SAM CLI

**macOS:**
```bash
brew install aws-sam-cli
```

**Linux:**
```bash
# Download and install
curl -L https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip -o sam-cli.zip
unzip sam-cli.zip -d sam-installation
sudo ./sam-installation/install
```

**Windows:**
Download installer from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout
- `DELETE /auth/account` - Delete account
- `PUT /auth/password` - Change password

### Entries
- `GET /entries?yearMonth=YYYY-MM&householdId=xxx` - List entries
- `PUT /entries` - Create/update entry
- `DELETE /entries/:entryId` - Delete entry

### Household
- `GET /household` - Get current household
- `POST /household` - Create household
- `PUT /household` - Rename household
- `DELETE /household` - Delete household
- `POST /household/leave` - Leave household
- `POST /household/members` - Add member
- `DELETE /household/members/:userId` - Remove member

### Categories
- `GET /categories` - List custom categories
- `POST /categories` - Create custom category
- `DELETE /categories/:categoryId` - Delete custom category

## Environment Variables

Set in `template.yaml`:

- `JWT_SECRET` - Secret for signing JWTs (min 32 chars)
- `TABLE_USERS` - DynamoDB users table
- `TABLE_TOKENS` - DynamoDB refresh tokens table
- `TABLE_ENTRIES` - DynamoDB entries table
- `TABLE_HOUSEHOLDS` - DynamoDB households table
- `TABLE_CATEGORIES` - DynamoDB categories table
- `AWS_ENDPOINT_URL` - LocalStack endpoint (for local dev)

## Testing

Create a test user:

```bash
# From project root
HASH='$2b$12$KIXoK/1J4c7b1s6uQGkLCuXpfNoIOEz6dg5dYpBVwWl0JIZvamCkK'

aws --profile localstack --endpoint-url http://localhost:4565 dynamodb put-item \
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

Login with: `test@example.com` / `password123`

## Development Tips

- SAM Local uses Docker containers to run Lambda functions
- The first request is slow (cold start) - use `--warm-containers EAGER` to keep them warm
- Logs appear in the terminal where you ran `sam local start-api`
- Changes to `lambda.js` require restarting SAM
- LocalStack DynamoDB runs at `http://localhost:4565` (mapped to port 4566 inside the container)

## Troubleshooting

### "Cannot connect to Docker"
Make sure Docker Desktop is running.

### "Table not found"
Run the LocalStack setup script:
```bash
cd ..
./setup-localstack.sh
```

### "Connection refused to localhost:4565"
Check that LocalStack is running:
```bash
curl http://localhost:4565/_localstack/health
```
