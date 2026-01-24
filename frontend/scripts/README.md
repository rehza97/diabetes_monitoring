# Admin Account Creation Script

This directory contains scripts for creating admin accounts using Firebase Admin SDK.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. The service account key file (`serviceAccountKey.json`) is already configured.

## Usage

Run the admin creation script:

```bash
npm run create-admin
```

The script will prompt you for:
- Admin email address
- Admin password (minimum 6 characters)
- First name
- Last name
- Phone number (optional)

## What the script does

1. Initializes Firebase Admin SDK with the service account
2. Creates a user in Firebase Authentication (or updates if exists)
3. Sets custom claims with `role: "admin"` and `admin: true`
4. Creates/updates the user document in Firestore with:
   - Admin role
   - Active status
   - Default preferences
   - All required fields

## Security Note

The `serviceAccountKey.json` file is excluded from git via `.gitignore`. Never commit this file to version control as it contains sensitive credentials.
