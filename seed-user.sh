#!/bin/bash
# Seed a test user in LocalStack DynamoDB

ENDPOINT="http://localhost:4565"
PROFILE="localstack"

echo "🌱 Seeding test user..."

# bcrypt hash for "password123"
HASH='$2b$12$KIXoK/1J4c7b1s6uQGkLCuXpfNoIOEz6dg5dYpBVwWl0JIZvamCkK'

aws --profile $PROFILE --endpoint-url $ENDPOINT dynamodb put-item \
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

if [ $? -eq 0 ]; then
  echo "✅ Test user created!"
  echo ""
  echo "📧 Email: test@example.com"
  echo "🔑 Password: password123"
else
  echo "❌ Failed to create test user"
  exit 1
fi
