# Firebase Project Setup Guide

This guide will walk you through creating and configuring a Firebase project for your diabetes monitoring system.

## Step 1: Authenticate with Firebase

First, you need to log in to Firebase (or re-authenticate if your session expired):

```bash
cd frontend
npm run firebase login
```

This will open a browser window for you to authenticate with your Google account (tfethallahzohier@gmail.com).

## Step 2: Create a New Firebase Project

After authentication, create a new Firebase project:

```bash
npm run firebase projects:create
```

You'll be prompted to:
- Enter a project ID (e.g., `diabetes-monitoring-app` or `diabetes-monitoring-{your-name}`)
- Optionally set a display name
- Choose whether to enable Google Analytics (recommended: Yes)

**Note:** Project IDs must be globally unique, so you might need to try a few variations.

## Step 3: Initialize Firebase in Your Project

Navigate to your frontend directory and initialize Firebase:

```bash
cd frontend
npm run firebase init
```

### During initialization, you'll be asked:

1. **Which Firebase features do you want to set up?**
   - Select the features you need:
     - ✅ **Firestore** - For database (patients, readings, reports)
     - ✅ **Authentication** - For user login/management
     - ✅ **Hosting** - For deploying your React dashboard
     - ✅ **Functions** - (Optional) For backend logic
     - ✅ **Storage** - (Optional) For file uploads

2. **Select a default Firebase project**
   - Choose the project you just created

3. **What file should be used for Firestore Rules?**
   - Default: `firestore.rules` (press Enter)

4. **What file should be used for Firestore indexes?**
   - Default: `firestore.indexes.json` (press Enter)

5. **What do you want to use as your public directory?**
   - For Vite: `dist` (this is where Vite builds your app)

6. **Configure as a single-page app?**
   - Yes (Y) - since you're using React Router

7. **Set up automatic builds and deploys with GitHub?**
   - No (N) - unless you want CI/CD

8. **File firestore.rules already exists. Overwrite?**
   - No (N) - if you want to keep existing rules

## Step 4: Verify Setup

After initialization, you should have these files created:

- `firebase.json` - Firebase configuration
- `.firebaserc` - Project aliases
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore indexes

## Step 5: Install Firebase SDK

Install the Firebase JavaScript SDK for your React app:

```bash
npm install firebase
```

## Step 6: Configure Firebase in Your App

Create a Firebase configuration file:

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Your config will be in Firebase Console > Project Settings > General
  // Add your web app's Firebase configuration here
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

**To get your Firebase config:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the gear icon ⚙️ > Project Settings
4. Scroll down to "Your apps" section
5. Click the web icon `</>` to add a web app (if not already added)
6. Copy the `firebaseConfig` object

## Step 7: Set Up Firestore Database

1. Go to Firebase Console > Firestore Database
2. Click "Create database"
3. Start in **test mode** (for development) or **production mode** (with security rules)
4. Choose a location (closest to your users)

## Step 8: Set Up Authentication

1. Go to Firebase Console > Authentication
2. Click "Get started"
3. Enable sign-in methods:
   - **Email/Password** - For doctors, nurses, and admins
   - **Anonymous** - (Optional) For guest access

## Quick Commands Reference

```bash
# Login
npm run firebase login

# List projects
npm run firebase projects:list

# Create project
npm run firebase projects:create

# Initialize Firebase
npm run firebase init

# Deploy hosting
npm run firebase deploy --only hosting

# Deploy Firestore rules
npm run firebase deploy --only firestore:rules

# Deploy everything
npm run firebase deploy

# View logs
npm run firebase functions:log

# Open Firebase Console
npm run firebase open
```

## Recommended Project Structure

Based on your diabetes monitoring system, you'll need these Firestore collections:

- `users` - Admin, doctors, nurses
- `patients` - Patient information
- `readings` - Blood sugar readings
- `reports` - Medical reports
- `notifications` - System notifications
- `audit_logs` - Activity logs

## Next Steps

1. Set up Firestore security rules
2. Create Firestore indexes for queries
3. Configure authentication providers
4. Set up Firebase Hosting for deployment
5. (Optional) Set up Cloud Functions for backend logic

---

**Need help?** Check the [Firebase Documentation](https://firebase.google.com/docs)
