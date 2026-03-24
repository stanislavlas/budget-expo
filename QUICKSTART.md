# 🚀 Quick Start Guide

Complete setup instructions for local development.

## Step 1: Start LocalStack

```bash
docker compose up -d
```

This starts DynamoDB on **port 4565**.

## Step 2: Create DynamoDB Tables

```bash
./setup-localstack.sh
```

This creates all 5 required tables.

## Step 3: Seed Test User (Optional)

```bash
./seed-user.sh
```

Login credentials:
- Email: `test@example.com`
- Password: `password123`

## Step 4: Start Backend API

⚠️ **Requires AWS SAM CLI** - Install it first if needed:
```bash
brew install aws-sam-cli  # macOS
```

Then start the API:
```bash
cd backend
npm install
npm start
```

The API will run at `http://localhost:3001`

## Step 5: Start Expo App

In a new terminal:
```bash
npm install
npm start
```

Then:
- Press `a` for Android emulator
- Or scan QR code with Expo Go app

## Quick Commands

```bash
# Check LocalStack health
curl http://localhost:4565/_localstack/health

# List DynamoDB tables
aws --profile localstack --endpoint-url http://localhost:4565 dynamodb list-tables

# Test the API
cd backend && ./test-api.sh

# Stop LocalStack
docker compose down
```

## Troubleshooting

### SAM CLI not installed
- **macOS**: `brew install aws-sam-cli`
- **Linux**: See [backend/README.md](backend/README.md)
- **Windows**: Download from AWS docs

### Port conflicts
- LocalStack: 4565
- Backend API: 3001
- Expo: 8081

Change ports in `docker-compose.yml` and `template.yaml` if needed.

### Can't connect to API from Android emulator
Make sure `.env` has:
```
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3001
```

### Can't connect from physical phone
Update `.env` with your computer's local IP:
```
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.x:3001
```

Find your IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
