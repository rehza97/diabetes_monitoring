# Setting Up Admin Account

## Prerequisites

Before running the `create-admin` script, you need to ensure Firebase Authentication is properly configured.

## Step 1: Enable Email/Password Authentication

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `diabetes-monitoring-app-8e131`
3. Navigate to **Authentication** in the left sidebar
4. Click **Get started** (if you haven't set up Authentication yet)
5. Go to the **Sign-in method** tab
6. Click on **Email/Password**
7. Enable the **Email/Password** provider (toggle it ON)
8. Click **Save**

## Step 2: Verify Service Account Permissions

The service account needs proper permissions. In Firebase Console:

1. Go to **Project Settings** (gear icon)
2. Go to the **Service accounts** tab
3. Ensure the service account `firebase-adminsdk-fbsvc@diabetes-monitoring-app-8e131.iam.gserviceaccount.com` exists
4. If it doesn't have proper permissions, you may need to:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to **IAM & Admin** > **Service Accounts**
   - Find the service account
   - Ensure it has the **Firebase Admin SDK Administrator Service Agent** role

## Step 3: Run the Script

Once Authentication is enabled, run:

```bash
cd frontend
npm run create-admin
```

## Troubleshooting

### Error: "auth/configuration-not-found"

This means Firebase Authentication is not enabled. Follow Step 1 above.

### Error: "Permission denied"

The service account doesn't have proper permissions. Follow Step 2 above.

### Error: "Service account key not found"

Make sure `scripts/serviceAccountKey.json` exists. If not:
1. Go to Firebase Console > Project Settings > Service accounts
2. Click **Generate new private key**
3. Save it as `frontend/scripts/serviceAccountKey.json`

## Alternative: Create Admin via Firebase Console

If the script doesn't work, you can manually create an admin:

1. Go to Firebase Console > Authentication
2. Click **Add user**
3. Enter email and password
4. After creating, go to Firestore and create a document in `users` collection:
   - Document ID: Use the UID from Authentication
   - Fields:
     - `id`: (the UID)
     - `email`: (the email)
     - `firstName`: "Admin"
     - `lastName`: "User"
     - `role`: "admin"
     - `isActive`: true
     - `emailVerified`: true
     - `createdAt`: (timestamp)
     - `updatedAt`: (timestamp)
