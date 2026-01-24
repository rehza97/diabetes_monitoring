/**
 * Firestore Usage Examples
 * 
 * This file contains practical examples of how to use the Firestore helpers
 * in your application. These are reference examples, not meant to be imported.
 */

import { Timestamp, collection, doc, serverTimestamp } from "firebase/firestore";
import {
  createUser,
  getUser,
  updateUser,
  createPatient,
  getPatient,
  updatePatient,
  queryPatients,
  createReading,
  getReadings,
  createMedicalNote,
  createMedication,
  createNotification,
  getNotifications,
  createReport,
  createMessage,
  createBatch,
} from "./firestore-helpers";
import {
  validatePatient,
  validateReading,
  validateMedicalNote,
} from "./firestore-validators";
import { where, orderBy, limit } from "firebase/firestore";
import { updatePatientStatistics } from "@/utils/denormalize";
import { db } from "./firebase";
import type { CreateFirestoreReadingDto } from "@/types/firestore";

// ============================================
// USER EXAMPLES
// ============================================

/**
 * Example: Create a new doctor user
 */
export async function exampleCreateDoctor() {
  const userId = "doctor-123"; // From Firebase Auth
  
  await createUser(userId, {
    email: "doctor@example.com",
    firstName: "Ahmed",
    lastName: "Ali",
    phone: "+213555123456",
    role: "doctor",
    specialization: "Endocrinology",
    licenseNumber: "MED-12345",
    isActive: true,
    preferences: {
      language: "ar",
      theme: "light",
      timezone: "Africa/Algiers",
      dateFormat: "DD/MM/YYYY",
      measurementUnit: "mg/dL",
      notifications: {
        criticalReadings: true,
        reminders: true,
        messages: true,
        system: true,
      },
    },
  });
}

/**
 * Example: Get user and update preferences
 */
export async function exampleUpdateUserPreferences() {
  const userId = "user-123";
  const user = await getUser(userId);
  
  if (user) {
    await updateUser(userId, {
      preferences: {
        ...user.preferences,
        theme: "dark",
        language: "en",
      },
    });
  }
}

// ============================================
// PATIENT EXAMPLES
// ============================================

/**
 * Example: Create a new patient
 */
export async function exampleCreatePatient() {
  // Validate data first
  const patientData = validatePatient({
    firstName: "Mohammed",
    lastName: "Benali",
    dateOfBirth: Timestamp.fromDate(new Date("1985-05-15")),
    gender: "male",
    phone: "+213555987654",
    email: "mohammed@example.com",
    address: {
      street: "123 Main Street",
      city: "Algiers",
      country: "Algeria",
    },
    diabetesType: "type2",
    diagnosisDate: Timestamp.fromDate(new Date("2020-01-15")),
    bloodType: "O+",
    weight: 85,
    height: 175,
    doctorId: "doctor-123",
    nurseId: "nurse-456",
    chronicDiseases: ["hypertension"],
    allergies: {
      medications: ["penicillin"],
    },
    emergencyContact: {
      name: "Fatima Benali",
      relationship: "Wife",
      phone: "+213555987655",
    },
  });

  const patientId = await createPatient(patientData);
  return patientId;
}

/**
 * Example: Query patients by doctor
 */
export async function exampleGetDoctorPatients(doctorId: string) {
  const patients = await queryPatients([
    where("doctorId", "==", doctorId),
    where("isActive", "==", true),
    orderBy("createdAt", "desc"),
    limit(50),
  ]);
  
  return patients;
}

/**
 * Example: Get patients with critical readings
 */
export async function exampleGetCriticalPatients() {
  const patients = await queryPatients([
    where("status", "==", "critical"),
    orderBy("lastReadingDate", "desc"),
    limit(20),
  ]);
  
  return patients;
}

// ============================================
// READING EXAMPLES
// ============================================

/**
 * Example: Create a new reading
 */
export async function exampleCreateReading(
  patientId: string,
  recordedById: string,
  recordedByName: string
) {
  // Validate reading data
  const readingData = validateReading({
    value: 180,
    unit: "mg/dL",
    readingType: "post_breakfast",
    date: Timestamp.now(),
    time: "10:30",
    notes: "Patient reported feeling dizzy",
    symptoms: ["dizziness", "fatigue"],
    conditionDuringReading: "normal",
  });

  const readingId = await createReading(
    patientId,
    readingData,
    recordedById,
    recordedByName
  );

  // The helper automatically:
  // 1. Calculates status (normal/warning/critical)
  // 2. Updates patient's lastReadingDate, lastReadingValue, lastReadingStatus
  
  return readingId;
}

/**
 * Example: Get latest readings for a patient
 */
export async function exampleGetLatestReadings(patientId: string) {
  const readings = await getReadings(patientId, [limit(10)]);
  return readings;
}

/**
 * Example: Get critical readings for a patient
 */
export async function exampleGetCriticalReadings(patientId: string) {
  const readings = await getReadings(patientId, [
    where("status", "==", "critical"),
    orderBy("date", "desc"),
    limit(20),
  ]);
  
  return readings;
}

// ============================================
// MEDICAL NOTES EXAMPLES
// ============================================

/**
 * Example: Add a medical note
 */
export async function exampleAddMedicalNote(
  patientId: string,
  doctorId: string,
  doctorName: string
) {
  const noteData = validateMedicalNote({
    noteType: "diagnosis",
    content: "Patient shows improvement in glucose control. Continue current medication regimen.",
    isImportant: true,
    tags: ["followup", "medication"],
  });

  const noteId = await createMedicalNote(
    patientId,
    noteData,
    doctorId,
    doctorName
  );
  
  return noteId;
}

// ============================================
// MEDICATION EXAMPLES
// ============================================

/**
 * Example: Prescribe medication
 */
export async function examplePrescribeMedication(
  patientId: string,
  prescribedById: string,
  prescribedByName: string
) {
  const medicationId = await createMedication(
    patientId,
    {
      medicationName: "Metformin",
      dosage: "500mg",
      frequency: "twice_daily",
      startDate: Timestamp.now(),
      endDate: Timestamp.fromDate(
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      ),
      notes: "Take with meals",
      reminders: {
        enabled: true,
        times: ["08:00", "20:00"],
      },
    },
    prescribedById,
    prescribedByName
  );
  
  return medicationId;
}

// ============================================
// NOTIFICATION EXAMPLES
// ============================================

/**
 * Example: Create critical reading notification
 */
export async function exampleCreateCriticalReadingNotification(
  userId: string,
  patientId: string,
  readingId: string
) {
  const notificationId = await createNotification(userId, {
    type: "critical_reading",
    title: "Critical Reading Alert",
    message: "Patient has a critical blood sugar reading that requires immediate attention.",
    priority: "urgent",
    relatedEntityType: "reading",
    relatedEntityId: readingId,
    actionUrl: `/patients/${patientId}/readings/${readingId}`,
  });
  
  return notificationId;
}

/**
 * Example: Get unread notifications
 */
export async function exampleGetUnreadNotifications(userId: string) {
  const notifications = await getNotifications(userId, [
    where("isRead", "==", false),
    orderBy("createdAt", "desc"),
    limit(20),
  ]);
  
  return notifications;
}

// ============================================
// BATCH OPERATIONS EXAMPLES
// ============================================

/**
 * Example: Create reading with notification in a batch
 */
export async function exampleCreateReadingWithNotification(
  patientId: string,
  readingData: CreateFirestoreReadingDto,
  recordedById: string,
  recordedByName: string,
  doctorId: string
) {
  const batch = createBatch();
  
  // Create reading
  const readingsCollection = collection(
    db,
    `patients/${patientId}/readings`
  );
  const readingRef = doc(readingsCollection);
  const status = calculateReadingStatus(readingData.value, readingData.unit);
  
  batch.set(readingRef, {
    ...readingData,
    recordedById,
    recordedByName,
    status,
    isVerified: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  // Update patient
  const patientRef = doc(db, "patients", patientId);
  batch.update(patientRef, {
    lastReadingDate: readingData.date,
    lastReadingValue: readingData.value,
    lastReadingStatus: status,
    updatedAt: serverTimestamp(),
  });
  
  // Create notification if critical
  if (status === "critical") {
    const notificationsCollection = collection(
      db,
      `users/${doctorId}/notifications`
    );
    const notificationRef = doc(notificationsCollection);
    batch.set(notificationRef, {
      type: "critical_reading",
      title: "Critical Reading Alert",
      message: `Patient has a critical reading: ${readingData.value} ${readingData.unit}`,
      priority: "urgent",
      isRead: false,
      relatedEntityType: "reading",
      relatedEntityId: readingRef.id,
      createdAt: serverTimestamp(),
    });
  }
  
  await batch.commit();
}

// ============================================
// REPORT EXAMPLES
// ============================================

/**
 * Example: Create a custom report
 */
export async function exampleCreateReport(createdById: string) {
  const reportId = await createReport(
    {
      name: "Monthly Patient Summary",
      type: "period_summary",
      filters: {
        dateFrom: Timestamp.fromDate(
          new Date(new Date().setMonth(new Date().getMonth() - 1))
        ),
        dateTo: Timestamp.now(),
        status: ["critical", "warning"],
      },
      isScheduled: true,
      scheduleConfig: {
        frequency: "monthly",
        dayOfMonth: 1,
        time: "09:00",
        recipients: ["admin@example.com"],
      },
    },
    createdById
  );
  
  return reportId;
}

// ============================================
// MESSAGE EXAMPLES
// ============================================

/**
 * Example: Send message from doctor to nurse
 */
export async function exampleSendMessage(
  senderId: string,
  senderName: string,
  recipientId: string,
  patientId: string
) {
  const messageId = await createMessage(
    {
      recipientId,
      subject: "Patient Follow-up Required",
      message: "Please check on patient and record their morning reading.",
      relatedPatientId: patientId,
      priority: "high",
    },
    senderId,
    senderName
  );
  
  return messageId;
}

// ============================================
// UTILITY EXAMPLES
// ============================================

/**
 * Example: Recalculate patient statistics
 */
export async function exampleRecalculateStatistics(patientId: string) {
  await updatePatientStatistics(patientId);
}

// Helper function for examples
function calculateReadingStatus(
  value: number,
  unit: "mg/dL" | "mmol/L"
): "normal" | "warning" | "critical" {
  const valueInMgDl = unit === "mmol/L" ? value * 18.0182 : value;
  
  if (valueInMgDl < 70 || valueInMgDl > 250) {
    return "critical";
  } else if (valueInMgDl < 100 || valueInMgDl > 180) {
    return "warning";
  }
  return "normal";
}
