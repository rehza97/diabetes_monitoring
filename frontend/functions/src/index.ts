import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "admin" | "doctor" | "nurse";
  specialization?: string;
  licenseNumber?: string;
  isActive?: boolean;
}

/**
 * Cloud Function to create a new user
 * Only admins can call this function
 */
export const createUser = functions.https.onCall<CreateUserRequest>(async (request) => {
  const data = request.data;
  
  // Verify authentication
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to create users"
    );
  }

  // Verify user is admin
  const callerIdToken = await auth.getUser(request.auth.uid);
  const callerCustomClaims = callerIdToken.customClaims || {};
  
  if (callerCustomClaims.role !== "admin" && callerCustomClaims.admin !== true) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can create users"
    );
  }

  // Validate input data
  if (!data.email || !data.password || !data.firstName || !data.lastName || !data.role) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: email, password, firstName, lastName, role"
    );
  }

  // Validate email format
  if (!data.email.includes("@")) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid email address"
    );
  }

  // Validate password length
  if (data.password.length < 6) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Password must be at least 6 characters"
    );
  }

  // Validate role
  if (!["admin", "doctor", "nurse"].includes(data.role)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid role. Must be admin, doctor, or nurse"
    );
  }

  try {
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(data.email);
      throw new functions.https.HttpsError(
        "already-exists",
        `User with email ${data.email} already exists`
      );
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        // User doesn't exist, create new one
        try {
          userRecord = await auth.createUser({
            email: data.email,
            password: data.password,
            emailVerified: false,
            disabled: !(data.isActive ?? true),
          });
        } catch (createError: any) {
          throw new functions.https.HttpsError(
            "internal",
            `Failed to create user in Firebase Auth: ${createError.message}`
          );
        }
      } else if (error instanceof functions.https.HttpsError) {
        // Re-throw our custom errors
        throw error;
      } else {
        throw new functions.https.HttpsError(
          "internal",
          `Error checking user existence: ${error.message}`
        );
      }
    }

    // Set custom claims based on role
    const customClaims: Record<string, any> = {
      role: data.role,
    };

    if (data.role === "admin") {
      customClaims.admin = true;
    }

    await auth.setCustomUserClaims(userRecord.uid, customClaims);

    // Create user document in Firestore
    const userRef = db.collection("users").doc(userRecord.uid);
    const userDoc = await userRef.get();

    const userData: Record<string, any> = {
      id: userRecord.uid,
      email: data.email,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      role: data.role,
      isActive: data.isActive ?? true,
      emailVerified: false,
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

    // Add optional fields
    if (data.phone) {
      userData.phone = data.phone.trim();
    }

    if (data.specialization) {
      userData.specialization = data.specialization.trim();
    }

    if (data.licenseNumber) {
      userData.licenseNumber = data.licenseNumber.trim();
    }

    if (userDoc.exists) {
      await userRef.update(userData);
    } else {
      userData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      await userRef.set(userData);
    }

    // Return user ID
    return {
      success: true,
      userId: userRecord.uid,
      email: data.email,
    };
  } catch (error: any) {
    // If it's already an HttpsError, re-throw it
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Otherwise, wrap it in an HttpsError
    throw new functions.https.HttpsError(
      "internal",
      `Failed to create user: ${error.message}`
    );
  }
});
