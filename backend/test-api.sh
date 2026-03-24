#!/bin/bash
# Quick test script for the Budget API

API_BASE="http://localhost:3001"

echo "🧪 Testing Budget API..."
echo ""

# Test server is running (any response means it's up)
echo "1️⃣  Testing server is running..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_BASE/auth/login)
if [ $STATUS -eq 400 ] || [ $STATUS -eq 401 ] || [ $STATUS -eq 200 ]; then
  echo "✅ Server is responding (HTTP $STATUS)"
else
  echo "❌ Server is not responding (got HTTP $STATUS)"
  exit 1
fi
echo ""

# Register a test user
echo "2️⃣  Registering test user..."
REGISTER_RESPONSE=$(curl -s -X POST $API_BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test'$(date +%s)'@example.com","password":"password123"}')

ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Registration failed"
  echo "Response: $REGISTER_RESPONSE"
  exit 1
fi
echo "✅ User registered successfully"
echo ""

# Create an entry
echo "3️⃣  Creating an entry..."
ENTRY_RESPONSE=$(curl -s -X PUT $API_BASE/entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "type": "expense",
    "amount": 42.50,
    "category": "groceries",
    "date": "2026-03-24",
    "note": "Test entry",
    "necessity": "necessary"
  }')

ENTRY_ID=$(echo $ENTRY_RESPONSE | grep -o '"entryId":"[^"]*' | cut -d'"' -f4)
if [ -z "$ENTRY_ID" ]; then
  echo "❌ Entry creation failed"
  echo "Response: $ENTRY_RESPONSE"
  exit 1
fi
echo "✅ Entry created: $ENTRY_ID"
echo ""

# List entries
echo "4️⃣  Listing entries..."
ENTRIES=$(curl -s -X GET $API_BASE/entries \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$ENTRIES" | grep -q "$ENTRY_ID"; then
  echo "✅ Entry found in list"
else
  echo "❌ Entry not found in list"
  echo "Response: $ENTRIES"
  exit 1
fi
echo ""

# Create a household
echo "5️⃣  Creating a household..."
HOUSEHOLD_RESPONSE=$(curl -s -X POST $API_BASE/household \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"name":"Test Household"}')

HOUSEHOLD_ID=$(echo $HOUSEHOLD_RESPONSE | grep -o '"householdId":"[^"]*' | cut -d'"' -f4)
if [ -z "$HOUSEHOLD_ID" ]; then
  echo "❌ Household creation failed"
  echo "Response: $HOUSEHOLD_RESPONSE"
  exit 1
fi
echo "✅ Household created: $HOUSEHOLD_ID"
echo ""

echo "🎉 All tests passed!"
echo ""
echo "📝 Access Token (valid for 15 min):"
echo "$ACCESS_TOKEN"
