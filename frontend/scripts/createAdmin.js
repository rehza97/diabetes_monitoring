import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
const serviceAccountPath = join(__dirname, "serviceAccountKey.json");

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
} catch (error) {
  console.error("❌ Error reading service account key file:", error.message);
  console.error(`   Make sure the file exists at: ${serviceAccountPath}`);
  process.exit(1);
}

// Verify service account has required fields
if (!serviceAccount.project_id) {
  console.error("❌ Service account key is missing 'project_id' field");
  process.exit(1);
}

console.log(`✓ Using Firebase project: ${serviceAccount.project_id}`);

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
} catch (error) {
  console.error("❌ Error initializing Firebase Admin SDK:", error.message);
  if (error.code) {
    console.error(`   Error code: ${error.code}`);
  }
  console.error("\nTroubleshooting:");
  console.error("  1. Verify the service account key is valid");
  console.error("  2. Check that the project ID matches your Firebase project");
  console.error("  3. Ensure the service account has 'Firebase Admin SDK Administrator Service Agent' role");
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

/**
 * Helper function to check if an error is a configuration-not-found error.
 * Uses both error.code and error.hasCode for robust detection.
 */
function isConfigurationNotFoundError(error) {
  if (!error) return false;
  
  // Check direct code property
  if (error.code === "auth/configuration-not-found") {
    return true;
  }
  
  // Check hasCode method (for PrefixedFirebaseError)
  if (typeof error.hasCode === "function" && error.hasCode("configuration-not-found")) {
    return true;
  }
  
  return false;
}

/**
 * Helper function to print instructions for enabling Firebase Authentication.
 * Centralizes the error message to avoid duplication.
 */
function printAuthNotConfiguredInstructions() {
  console.error("\n❌ Firebase Authentication is not properly configured!");
  console.error("\n📋 To fix this:");
  console.error("   1. Go to: https://console.firebase.google.com/project/diabetes-monitoring-app-8e131/authentication");
  console.error("   2. Click 'Get started' (if you see it)");
  console.error("   3. Go to the 'Sign-in method' tab");
  console.error("   4. Click on 'Email/Password'");
  console.error("   5. Toggle 'Enable' to ON");
  console.error("   6. Click 'Save'");
  console.error("\n   Then run this script again.\n");
}

async function createAdminAccount() {
  try {
    console.log("\n=== Create Admin Account ===\n");

    // Get admin details from user
    const email = await question("Admin email address: ");
    if (!email || !email.includes("@")) {
      throw new Error("Invalid email address");
    }

    const password = await question("Admin password (min 6 characters): ");
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const firstName = await question("First name: ");
    if (!firstName || firstName.trim().length === 0) {
      throw new Error("First name is required");
    }

    const lastName = await question("Last name: ");
    if (!lastName || lastName.trim().length === 0) {
      throw new Error("Last name is required");
    }

    const phone = await question("Phone number (optional, press Enter to skip): ");
    const phoneNumber = phone.trim() || null;

    console.log("\nCreating admin account...");

    // First, verify Authentication is enabled by trying to list users (this will fail if Auth is not enabled)
    try {
      await auth.listUsers(1);
    } catch (authCheckError) {
      if (isConfigurationNotFoundError(authCheckError) || authCheckError.code === "auth/unauthorized") {
        printAuthNotConfiguredInstructions();
        throw new Error(
          "Firebase Authentication is not enabled. Please enable Email/Password authentication in Firebase Console."
        );
      }
      // If it's a different error, continue (might be permission issue, but Auth is enabled)
    }

    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`✓ User with email ${email} already exists. Updating...`);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        // Create new user in Firebase Authentication
        try {
          userRecord = await auth.createUser({
            email: email,
            password: password,
            emailVerified: true,
            disabled: false,
          });
          console.log(`✓ Created user in Firebase Authentication: ${userRecord.uid}`);
        } catch (createError) {
          if (isConfigurationNotFoundError(createError)) {
            printAuthNotConfiguredInstructions();
            throw new Error(
              "Firebase Authentication is not enabled. Please enable Email/Password authentication in Firebase Console."
            );
          }
          throw createError;
        }
      } else if (isConfigurationNotFoundError(error)) {
        printAuthNotConfiguredInstructions();
        throw new Error(
          "Firebase Authentication is not enabled. Please enable Email/Password authentication in Firebase Console."
        );
      } else {
        throw error;
      }
    }

    // Set custom claims for admin
    await auth.setCustomUserClaims(userRecord.uid, {
      role: "admin",
      admin: true,
    });
    console.log("✓ Set custom claims (role: admin)");

    // Create or update user document in Firestore
    const userRef = db.collection("users").doc(userRecord.uid);
    const userDoc = await userRef.get();

    const userData = {
      id: userRecord.uid,
      email: email,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: "admin",
      isActive: true,
      emailVerified: true,
      preferences: {
        language: "ar",
        theme: "light",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: "DD/MM/YYYY",
        measurementUnit: "mg/dL",
        notifications: {
          criticalReadings: true,
          reminders: true,
          messages: true,
          system: true,
        },
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Only include phone if it has a value
    if (phoneNumber) {
      userData.phone = phoneNumber;
    }

    if (userDoc.exists) {
      await userRef.update(userData);
      console.log("✓ Updated user document in Firestore");
    } else {
      userData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      await userRef.set(userData);
      console.log("✓ Created user document in Firestore");
    }

    console.log("\n✅ Admin account created successfully!");
    console.log("\nAccount Details:");
    console.log(`  Email: ${email}`);
    console.log(`  Name: ${firstName} ${lastName}`);
    console.log(`  User ID: ${userRecord.uid}`);
    console.log(`  Role: admin`);
    console.log(`  Status: Active`);
    console.log("\nYou can now log in to the application with this account.");

    rl.close();
    process.exit(0);
  } catch (error) {
    // Check for configuration-not-found error in outer catch as fallback
    // This ensures we always show friendly instructions even if inner handlers miss it
    if (isConfigurationNotFoundError(error)) {
      printAuthNotConfiguredInstructions();
      rl.close();
      process.exit(1);
    }
    
    // Generic error handling for all other errors
    console.error("\n❌ Error creating admin account:", error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    rl.close();
    process.exit(1);
  }
}

// Run the script
createAdminAccount();
