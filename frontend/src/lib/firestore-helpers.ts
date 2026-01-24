import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
  type DocumentReference,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type WriteBatch,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase";
import type {
  FirestoreUser,
  FirestorePatient,
  FirestoreReading,
  FirestoreMedicalNote,
  FirestoreMedication,
  FirestoreScheduledReading,
  FirestoreNotification,
  FirestoreReport,
  FirestoreMessage,
  FirestoreAuditLog,
  FirestoreSetting,
  FirestoreReadingTemplate,
  FirestorePatientDocument,
  FirestorePatientAlert,
  CreateFirestoreUserDto,
  CreateFirestorePatientDto,
  CreateFirestoreReadingDto,
  CreateFirestoreMedicalNoteDto,
  CreateFirestoreMedicationDto,
  CreateFirestoreScheduledReadingDto,
  CreateFirestoreNotificationDto,
  CreateFirestoreReportDto,
  CreateFirestoreMessageDto,
  CreateFirestoreReadingTemplateDto,
  CreateFirestorePatientAlertDto,
} from "@/types/firestore";

// Generic converter helper
function createConverter<T>(): FirestoreDataConverter<T> {
  return {
    toFirestore(data: T): DocumentData {
      return data as DocumentData;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      return { id: snapshot.id, ...snapshot.data() } as T;
    },
  };
}

// Collection references
export const usersCollection = collection(db, "users").withConverter(
  createConverter<FirestoreUser>()
);
export const patientsCollection = collection(db, "patients").withConverter(
  createConverter<FirestorePatient>()
);
export const reportsCollection = collection(db, "reports").withConverter(
  createConverter<FirestoreReport>()
);
export const auditLogsCollection = collection(db, "auditLogs").withConverter(
  createConverter<FirestoreAuditLog>()
);
export const settingsCollection = collection(db, "settings").withConverter(
  createConverter<FirestoreSetting>()
);
export const messagesCollection = collection(db, "messages").withConverter(
  createConverter<FirestoreMessage>()
);

// User Helpers
export async function getUser(userId: string): Promise<FirestoreUser | null> {
  const docRef = doc(usersCollection, userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

export async function createUser(
  userId: string,
  data: CreateFirestoreUserDto
): Promise<void> {
  const docRef = doc(usersCollection, userId);
  await setDoc(docRef, {
    id: userId,
    ...data,
    emailVerified: false,
    isActive: data.isActive ?? true,
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
      ...data.preferences,
    },
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  });
}

/**
 * Create a new user with Firebase Authentication
 * This calls a Cloud Function that uses Admin SDK to create the user
 */
export async function createUserWithAuth(
  data: CreateFirestoreUserDto & { password: string }
): Promise<{ userId: string; email: string }> {
  const createUserFunction = httpsCallable<
    {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      role: "admin" | "doctor" | "nurse";
      specialization?: string;
      licenseNumber?: string;
      isActive?: boolean;
    },
    { success: boolean; userId: string; email: string }
  >(functions, "createUser");

  try {
    const result = await createUserFunction({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role,
      specialization: data.specialization,
      licenseNumber: data.licenseNumber,
      isActive: data.isActive ?? true,
    });

    if (result.data.success) {
      return {
        userId: result.data.userId,
        email: result.data.email,
      };
    } else {
      throw new Error("Failed to create user");
    }
  } catch (error: any) {
    // Re-throw with a more user-friendly message
    if (error.code) {
      // Firebase Functions HttpsError
      const errorMessage = error.message || "Erreur inconnue lors de la création de l'utilisateur";
      throw new Error(errorMessage);
    }
    throw error;
  }
}

export async function updateUser(
  userId: string,
  data: Partial<FirestoreUser>
): Promise<void> {
  const docRef = doc(usersCollection, userId);
  
  // Filter out undefined values - Firestore doesn't accept undefined
  const cleanData: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleanData[key] = value;
    }
  }
  
  await updateDoc(docRef, {
    ...cleanData,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteUser(userId: string): Promise<void> {
  const docRef = doc(usersCollection, userId);
  await deleteDoc(docRef);
}

export async function queryUsers(
  constraints: QueryConstraint[] = []
): Promise<FirestoreUser[]> {
  const q = query(usersCollection, ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
}

// Patient Helpers
export function getPatientRef(patientId: string): DocumentReference {
  return doc(patientsCollection, patientId);
}

export async function getPatient(
  patientId: string
): Promise<FirestorePatient | null> {
  const docRef = getPatientRef(patientId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

export async function createPatient(
  data: CreateFirestorePatientDto
): Promise<string> {
  const docRef = doc(patientsCollection);
  
  // Filter out undefined values - Firestore doesn't accept undefined
  const cleanData: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleanData[key] = value;
    }
  }
  
  await setDoc(docRef, {
    ...cleanData,
    fileNumber: `PAT-${Date.now()}`, // Generate file number
    isActive: true,
    status: "active",
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  });
  return docRef.id;
}

export async function updatePatient(
  patientId: string,
  data: Partial<FirestorePatient>
): Promise<void> {
  const docRef = getPatientRef(patientId);
  
  // Filter out undefined values - Firestore doesn't accept undefined
  const cleanData: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleanData[key] = value;
    }
  }
  
  await updateDoc(docRef, {
    ...cleanData,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePatient(patientId: string): Promise<void> {
  const docRef = getPatientRef(patientId);
  await deleteDoc(docRef);
}

export async function queryPatients(
  constraints: QueryConstraint[]
): Promise<FirestorePatient[]> {
  const q = query(patientsCollection, ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
}

// Reading Helpers (Subcollection)
export function getReadingsCollection(patientId: string) {
  return collection(
    db,
    `patients/${patientId}/readings`
  ).withConverter(createConverter<FirestoreReading>());
}

export async function createReading(
  patientId: string,
  data: CreateFirestoreReadingDto,
  recordedById: string,
  recordedByName?: string
): Promise<string> {
  const readingsCollection = getReadingsCollection(patientId);
  const docRef = doc(readingsCollection);
  
  // Calculate status based on value
  const status = calculateReadingStatus(data.value, data.unit);
  
  await setDoc(docRef, {
    ...data,
    recordedById,
    recordedByName,
    status,
    isVerified: false,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  });
  
  // Update patient's last reading info (denormalization)
  await updatePatient(patientId, {
    lastReadingDate: data.date,
    lastReadingValue: data.value,
    lastReadingStatus: status,
  });
  
  return docRef.id;
}

export async function getReadings(
  patientId: string,
  constraints: QueryConstraint[] = []
): Promise<FirestoreReading[]> {
  const readingsCollection = getReadingsCollection(patientId);
  const q = query(
    readingsCollection,
    orderBy("date", "desc"),
    ...constraints
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
}

export async function updateReading(
  patientId: string,
  readingId: string,
  data: Partial<CreateFirestoreReadingDto>
): Promise<void> {
  const readingsCollection = getReadingsCollection(patientId);
  const docRef = doc(readingsCollection, readingId);
  
  // Recalculate status if value changed
  const updateData: any = { ...data };
  if (data.value !== undefined && data.unit) {
    updateData.status = calculateReadingStatus(data.value, data.unit);
  }
  
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: serverTimestamp(),
  });
  
  // Update patient's last reading if this is the most recent
  if (data.date) {
    const patient = await getPatient(patientId);
    if (patient && patient.lastReadingDate && data.date.toMillis() >= patient.lastReadingDate.toMillis()) {
      await updatePatient(patientId, {
        lastReadingDate: data.date,
        lastReadingValue: data.value,
        lastReadingStatus: updateData.status,
      });
    }
  }
}

export async function deleteReading(
  patientId: string,
  readingId: string
): Promise<void> {
  const readingsCollection = getReadingsCollection(patientId);
  const docRef = doc(readingsCollection, readingId);
  await deleteDoc(docRef);
}

// Collection group query for all readings across all patients
export function getReadingsCollectionGroup() {
  return collectionGroup(db, "readings").withConverter(createConverter<FirestoreReading>());
}

export async function queryAllReadings(
  constraints: QueryConstraint[] = []
): Promise<Array<FirestoreReading & { patientId: string }>> {
  const readingsGroup = getReadingsCollectionGroup();
  const q = query(
    readingsGroup,
    orderBy("date", "desc"),
    ...constraints
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    // Extract patientId from path: patients/{patientId}/readings/{readingId}
    const pathParts = doc.ref.path.split("/");
    const patientId = pathParts[1]; // patients/{patientId}
    return {
      ...doc.data(),
      patientId,
    };
  });
}

function calculateReadingStatus(
  value: number,
  unit: "mg/dL" | "mmol/L"
): "normal" | "warning" | "critical" {
  // Convert to mg/dL for comparison
  const valueInMgDl = unit === "mmol/L" ? value * 18.0182 : value;
  
  if (valueInMgDl < 70 || valueInMgDl > 250) {
    return "critical";
  } else if (valueInMgDl < 100 || valueInMgDl > 180) {
    return "warning";
  }
  return "normal";
}

// Medical Notes Helpers
export function getMedicalNotesCollection(patientId: string) {
  return collection(
    db,
    `patients/${patientId}/medicalNotes`
  ).withConverter(createConverter<FirestoreMedicalNote>());
}

export async function createMedicalNote(
  patientId: string,
  data: CreateFirestoreMedicalNoteDto,
  doctorId: string,
  doctorName?: string
): Promise<string> {
  const notesCollection = getMedicalNotesCollection(patientId);
  const docRef = doc(notesCollection);
  await setDoc(docRef, {
    ...data,
    doctorId,
    doctorName,
    isImportant: data.isImportant ?? false,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  });
  return docRef.id;
}

// Medications Helpers
export function getMedicationsCollection(patientId: string) {
  return collection(
    db,
    `patients/${patientId}/medications`
  ).withConverter(createConverter<FirestoreMedication>());
}

export async function createMedication(
  patientId: string,
  data: CreateFirestoreMedicationDto,
  prescribedById: string,
  prescribedByName?: string
): Promise<string> {
  const medicationsCollection = getMedicationsCollection(patientId);
  const docRef = doc(medicationsCollection);
  const isActive = !data.endDate || data.endDate.toMillis() > Date.now();
  
  await setDoc(docRef, {
    ...data,
    prescribedById,
    prescribedByName,
    isActive,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  });
  return docRef.id;
}

// Scheduled Readings Helpers
export function getScheduledReadingsCollection(patientId: string) {
  return collection(
    db,
    `patients/${patientId}/scheduledReadings`
  ).withConverter(createConverter<FirestoreScheduledReading>());
}

export async function createScheduledReading(
  patientId: string,
  data: CreateFirestoreScheduledReadingDto
): Promise<string> {
  const scheduledCollection = getScheduledReadingsCollection(patientId);
  const docRef = doc(scheduledCollection);
  await setDoc(docRef, {
    ...data,
    status: "pending",
    reminderSent: false,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  });
  return docRef.id;
}

// Notifications Helpers (User Subcollection)
export function getNotificationsCollection(userId: string) {
  return collection(
    db,
    `users/${userId}/notifications`
  ).withConverter(createConverter<FirestoreNotification>());
}

export async function createNotification(
  userId: string,
  data: CreateFirestoreNotificationDto
): Promise<string> {
  const notificationsCollection = getNotificationsCollection(userId);
  const docRef = doc(notificationsCollection);
  await setDoc(docRef, {
    ...data,
    isRead: false,
    priority: data.priority ?? "medium",
    createdAt: serverTimestamp() as Timestamp,
  });
  return docRef.id;
}

export async function getNotifications(
  userId: string,
  constraints: QueryConstraint[] = []
): Promise<FirestoreNotification[]> {
  const notificationsCollection = getNotificationsCollection(userId);
  const q = query(
    notificationsCollection,
    orderBy("createdAt", "desc"),
    ...constraints
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
}

export async function updateNotification(
  userId: string,
  notificationId: string,
  data: Partial<FirestoreNotification>
): Promise<void> {
  const notificationsCollection = getNotificationsCollection(userId);
  const docRef = doc(notificationsCollection, notificationId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNotification(
  userId: string,
  notificationId: string
): Promise<void> {
  const notificationsCollection = getNotificationsCollection(userId);
  const docRef = doc(notificationsCollection, notificationId);
  await deleteDoc(docRef);
}

// Reports Helpers
export function getReportRef(reportId: string): DocumentReference {
  return doc(reportsCollection, reportId);
}

export async function getReport(
  reportId: string
): Promise<FirestoreReport | null> {
  const docRef = getReportRef(reportId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

export async function createReport(
  data: CreateFirestoreReportDto,
  createdById: string
): Promise<string> {
  const docRef = doc(reportsCollection);
  await setDoc(docRef, {
    ...data,
    createdById,
    isScheduled: data.isScheduled ?? false,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  });
  return docRef.id;
}

export async function updateReport(
  reportId: string,
  data: Partial<FirestoreReport>
): Promise<void> {
  const docRef = getReportRef(reportId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteReport(reportId: string): Promise<void> {
  const docRef = getReportRef(reportId);
  await deleteDoc(docRef);
}

export async function queryReports(
  constraints: QueryConstraint[]
): Promise<FirestoreReport[]> {
  const q = query(reportsCollection, ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
}

// Messages Helpers
export async function createMessage(
  data: CreateFirestoreMessageDto,
  senderId: string,
  senderName?: string
): Promise<string> {
  const docRef = doc(messagesCollection);
  await setDoc(docRef, {
    ...data,
    senderId,
    senderName,
    isRead: false,
    priority: data.priority ?? "medium",
    createdAt: serverTimestamp() as Timestamp,
  });
  return docRef.id;
}

// Settings Helpers
export async function getSetting(key: string): Promise<FirestoreSetting | null> {
  const q = query(settingsCollection, where("key", "==", key), limit(1));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  return querySnapshot.docs[0].data();
}

export async function getSettingsByCategory(
  category: string
): Promise<FirestoreSetting[]> {
  const q = query(
    settingsCollection,
    where("category", "==", category),
    orderBy("updatedAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
}

export async function updateSetting(
  settingId: string,
  value: any,
  updatedById: string
): Promise<void> {
  const docRef = doc(settingsCollection, settingId);
  await updateDoc(docRef, {
    value,
    updatedById,
    updatedAt: serverTimestamp(),
  });
}

export async function createSetting(
  data: {
    key: string;
    value: any;
    category: string;
    description?: string;
  },
  createdById: string
): Promise<string> {
  const docRef = doc(settingsCollection);
  await setDoc(docRef, {
    ...data,
    updatedById: createdById,
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// Patient Documents Helpers
export function getPatientDocumentsCollection(patientId: string) {
  return collection(
    db,
    `patients/${patientId}/documents`
  ).withConverter(createConverter<FirestorePatientDocument>());
}

export async function createPatientDocument(
  patientId: string,
  data: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    category?: "lab_result" | "prescription" | "report" | "other";
    description?: string;
  },
  uploadedById: string
): Promise<string> {
  const documentsCollection = getPatientDocumentsCollection(patientId);
  const docRef = doc(documentsCollection);
  await setDoc(docRef, {
    ...data,
    uploadedById,
    createdAt: serverTimestamp() as Timestamp,
  });
  return docRef.id;
}

export async function getPatientDocuments(
  patientId: string
): Promise<FirestorePatientDocument[]> {
  const documentsCollection = getPatientDocumentsCollection(patientId);
  const q = query(documentsCollection, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
}

// Reading Templates Helpers (stored in settings or separate collection)
export function getReadingTemplatesCollection() {
  return collection(db, "readingTemplates").withConverter(
    createConverter<FirestoreReadingTemplate>()
  );
}

export async function getReadingTemplates(
  createdById?: string
): Promise<FirestoreReadingTemplate[]> {
  const templatesCollection = getReadingTemplatesCollection();
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
  
  if (createdById) {
    constraints.unshift(where("createdById", "==", createdById));
  }
  
  const q = query(templatesCollection, ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
}

export async function createReadingTemplate(
  data: CreateFirestoreReadingTemplateDto,
  createdById: string
): Promise<string> {
  const templatesCollection = getReadingTemplatesCollection();
  const docRef = doc(templatesCollection);
  await setDoc(docRef, {
    ...data,
    createdById,
    isDefault: data.isDefault ?? false,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  });
  return docRef.id;
}

// Patient Alerts Helpers
export function getPatientAlertsCollection(patientId: string) {
  return collection(
    db,
    `patients/${patientId}/alerts`
  ).withConverter(createConverter<FirestorePatientAlert>());
}

export async function createPatientAlert(
  patientId: string,
  data: CreateFirestorePatientAlertDto
): Promise<string> {
  const alertsCollection = getPatientAlertsCollection(patientId);
  const docRef = doc(alertsCollection);
  await setDoc(docRef, {
    ...data,
    isResolved: false,
    acknowledgedBy: [],
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  });
  return docRef.id;
}

export async function getPatientAlerts(
  patientId: string,
  options?: {
    resolved?: boolean;
    limitCount?: number;
  }
): Promise<FirestorePatientAlert[]> {
  const alertsCollection = getPatientAlertsCollection(patientId);
  const constraints: QueryConstraint[] = [];
  
  if (options?.resolved !== undefined) {
    constraints.push(where("isResolved", "==", options.resolved));
  }
  
  constraints.push(orderBy("createdAt", "desc"));
  
  if (options?.limitCount) {
    constraints.push(limit(options.limitCount));
  }
  
  const q = query(alertsCollection, ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
}

export async function resolvePatientAlert(
  patientId: string,
  alertId: string,
  resolvedById: string
): Promise<void> {
  const alertsCollection = getPatientAlertsCollection(patientId);
  const docRef = doc(alertsCollection, alertId);
  await updateDoc(docRef, {
    isResolved: true,
    resolvedById,
    resolvedAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  });
}

export async function acknowledgePatientAlert(
  patientId: string,
  alertId: string,
  userId: string
): Promise<void> {
  const alertsCollection = getPatientAlertsCollection(patientId);
  const docRef = doc(alertsCollection, alertId);
  const alertDoc = await getDoc(docRef);
  
  if (!alertDoc.exists()) {
    throw new Error("Alert not found");
  }
  
  const alertData = alertDoc.data();
  const acknowledgedBy = alertData.acknowledgedBy || [];
  
  if (!acknowledgedBy.includes(userId)) {
    await updateDoc(docRef, {
      acknowledgedBy: [...acknowledgedBy, userId],
      updatedAt: serverTimestamp() as Timestamp,
    });
  }
}

// Batch Operations Helper
export function createBatch(): WriteBatch {
  return writeBatch(db);
}

// Pagination Helper
export interface PaginationOptions {
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot;
}

export function getPaginationConstraints(
  options: PaginationOptions = {}
): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];
  const pageSize = options.pageSize ?? 20;
  
  constraints.push(limit(pageSize));
  
  if (options.lastDoc) {
    constraints.push(startAfter(options.lastDoc));
  }
  
  return constraints;
}

// Audit Log Helpers
export async function queryAuditLogs(
  constraints: QueryConstraint[] = []
): Promise<FirestoreAuditLog[]> {
  const q = query(auditLogsCollection, ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
}
