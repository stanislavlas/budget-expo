#!/bin/bash
# LocalStack setup script for budget-expo
# This script creates all necessary DynamoDB tables

set -e

ENDPOINT="http://localhost:4565"
PROFILE="localstack"

echo "🔍 Checking LocalStack health..."
if ! curl -sf $ENDPOINT/_localstack/health > /dev/null; then
  echo "❌ LocalStack is not running. Please start it with: docker compose up -d"
  exit 1
fi

echo "✅ LocalStack is running"
echo ""
echo "📦 Creating DynamoDB tables..."

# Create budget_users table
echo "  → Creating budget_users..."
aws --profile $PROFILE --endpoint-url $ENDPOINT dynamodb create-table \
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
  --billing-mode PAY_PER_REQUEST > /dev/null 2>&1 || echo "    (already exists)"

# Create budget_refresh_tokens table
echo "  → Creating budget_refresh_tokens..."
aws --profile $PROFILE --endpoint-url $ENDPOINT dynamodb create-table \
  --table-name budget_refresh_tokens \
  --attribute-definitions \
    AttributeName=tokenHash,AttributeType=S \
  --key-schema \
    AttributeName=tokenHash,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST > /dev/null 2>&1 || echo "    (already exists)"

# Create budget_entries table
echo "  → Creating budget_entries..."
aws --profile $PROFILE --endpoint-url $ENDPOINT dynamodb create-table \
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
  --billing-mode PAY_PER_REQUEST > /dev/null 2>&1 || echo "    (already exists)"

# Create budget_households table
echo "  → Creating budget_households..."
aws --profile $PROFILE --endpoint-url $ENDPOINT dynamodb create-table \
  --table-name budget_households \
  --attribute-definitions \
    AttributeName=householdId,AttributeType=S \
  --key-schema \
    AttributeName=householdId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST > /dev/null 2>&1 || echo "    (already exists)"

# Create budget_categories table
echo "  → Creating budget_categories..."
aws --profile $PROFILE --endpoint-url $ENDPOINT dynamodb create-table \
  --table-name budget_categories \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=categoryId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=categoryId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST > /dev/null 2>&1 || echo "    (already exists)"

echo ""
echo "✅ All tables created successfully!"
echo ""
echo "📋 Listing tables:"
aws --profile $PROFILE --endpoint-url $ENDPOINT dynamodb list-tables

echo ""
echo "🎉 LocalStack setup complete!"
echo "   You can now run your backend with: cd backend && sam local start-api --port 3001"
