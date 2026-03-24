# Budget App — Expo (React Native)

Personal finance tracker built with Expo / React Native for Android.
The backend (AWS Lambda + DynamoDB) is identical to the web version.

---

## Project structure

```
budget-expo/
├── App.jsx                          # Root — auth gate, tab bar, month picker
├── app.json                         # Expo config (name, icon, Android package)
├── babel.config.js                  # Required by Expo
├── package.json
├── .env.example                     # Copy to .env and fill in API URL
│
├── app/screens/
│   ├── AuthScreen.jsx               # Sign in / Register
│   ├── DashboardScreen.jsx          # Balance, category bars, monthly chart
│   ├── AddScreen.jsx                # Manual entry form
│   ├── HistoryScreen.jsx            # Transaction list with search + filter
│   ├── HouseholdScreen.jsx          # Create / manage household
│   └── AccountScreen.jsx            # Change password, delete account, sign out
│
└── src/
    ├── hooks/
    │   ├── useAuth.js               # Auth state — rehydrates from AsyncStorage on launch
    │   ├── useEntries.js            # Entries with optimistic updates + AsyncStorage cache
    │   └── useHousehold.js          # Household state and actions
    ├── services/
    │   ├── auth.js                  # JWT login/register/refresh — uses AsyncStorage
    │   ├── dynamodb.js              # Entry CRUD via API (householdId-aware)
    │   └── household.js             # Household API calls
    └── utils/
        ├── categories.js            # 27 English categories with emojis and colors
        └── theme.js                 # Colors, shared StyleSheet tokens, fmt()
```

---

## 1. Prerequisites

- **Node.js** 18 or later
- **Expo CLI**: `npm install -g expo-cli` (or use `npx expo`)
- **Expo Go** app on your Android phone (free on Google Play)

---

## 2. Setup

```bash
cd budget-expo
npm install
cp .env.example .env
```

Edit `.env` and set your API Gateway URL:
```
EXPO_PUBLIC_API_BASE_URL=https://xxxxxxxxxx.execute-api.eu-central-1.amazonaws.com/prod
```

---

## 3. Run on your phone

```bash
npx expo start
```

This opens a QR code in your terminal. Open **Expo Go** on your Android phone and scan it.
Your phone and computer must be on the **same Wi-Fi network**.

---

## 4. Backend

The backend is unchanged from the web version. Use the same:
- `budget_users` DynamoDB table
- `budget_refresh_tokens` DynamoDB table
- `budget_entries` DynamoDB table (with `householdId-index` GSI)
- `budget_households` DynamoDB table
- Lambda function (`backend/lambda.js`)
- API Gateway with all routes

If you haven't set up the backend yet, see the `backend/` folder in the web project zip.

---

## 5. Build a standalone APK (optional)

To install the app directly on Android without Expo Go:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

This builds an `.apk` you can sideload, or an `.aab` for the Play Store.
You'll need a free [Expo account](https://expo.dev) for EAS Build.

---

## Key differences from the web version

| Web (Vite)          | Mobile (Expo)                        |
|---------------------|--------------------------------------|
| `localStorage`      | `AsyncStorage` (async)               |
| CSS / inline styles | `StyleSheet` / React Native props    |
| `<div>`, `<input>`  | `<View>`, `<TextInput>`, etc.        |
| Browser fetch       | React Native fetch (same API)        |
| Vite env vars       | `EXPO_PUBLIC_` env vars              |
| PWA install         | Expo Go or standalone APK            |

The services (`dynamodb.js`, `household.js`) and hooks (`useEntries`, `useHousehold`)
are logically identical — only `auth.js` and `useAuth.js` differ due to AsyncStorage.
