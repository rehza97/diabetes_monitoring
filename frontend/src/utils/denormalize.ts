import {
  updateDoc,
  serverTimestamp,
  getDocs,
  orderBy,
  query,
  collection,
  where,
  type DocumentReference,
} from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { getPatientRef, getReadingsCollection } from "@/lib/firestore-helpers";
import { db } from "@/lib/firebase";
import type {
  FirestorePatient,
  FirestoreReading,
  FirestoreUser,
} from "@/types/firestore";

/**
 * Update patient's last reading information when a new reading is created
 */
export async function updatePatientLastReading(
  patientId: string,
  reading: FirestoreReading,
): Promise<void> {
  const patientRef = getPatientRef(patientId);

  await updateDoc(patientRef, {
    lastReadingDate: reading.date,
    lastReadingValue: reading.value,
    lastReadingStatus: reading.status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Recalculate and update patient statistics from readings
 */
export async function updatePatientStatistics(
  patientId: string,
): Promise<void> {
  const readingsCollection = getReadingsCollection(patientId);

  // Get all readings for this patient
  const q = query(readingsCollection, orderBy("date", "desc"));
  const snapshot = await getDocs(q);

  const readings = snapshot.docs.map(
    (doc: { id: string; data: () => object }) =>
      ({ id: doc.id, ...doc.data() }) as FirestoreReading,
  );

  if (readings.length === 0) {
    return;
  }

  // Calculate statistics
  const totalReadings = readings.length;
  const sum = readings.reduce(
    (acc: number, r: FirestoreReading) => acc + r.value,
    0,
  );
  const average = sum / totalReadings;

  const latestReading = readings[0];

  // Update patient document
  const patientRef = getPatientRef(patientId);
  await updateDoc(patientRef, {
    totalReadingsCount: totalReadings,
    averageReadingValue: average,
    lastReadingDate: latestReading.date,
    lastReadingValue: latestReading.value,
    lastReadingStatus: latestReading.status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update denormalized user name in related documents
 */
export async function updateUserNameInDocuments(
  userId: string,
  userName: { firstName: string; lastName: string },
): Promise<void> {
  const fullName = `${userName.firstName} ${userName.lastName}`;

  // Update in patients where user is doctor
  const patientsRef = collection(db, "patients");
  const patientsQuery = query(patientsRef, where("doctorId", "==", userId));
  const patientsSnapshot = await getDocs(patientsQuery);

  const updatePromises: Promise<void>[] = [];

  patientsSnapshot.docs.forEach((doc: { ref: DocumentReference }) => {
    updatePromises.push(
      updateDoc(doc.ref, {
        // Note: We don't store doctor name in patient, but we could add it
        updatedAt: serverTimestamp(),
      }),
    );
  });

  // Update in readings
  const readingsRef = collection(db, "readings");
  const readingsQuery = query(readingsRef, where("recordedById", "==", userId));
  const readingsSnapshot = await getDocs(readingsQuery);

  readingsSnapshot.docs.forEach((doc: { ref: DocumentReference }) => {
    updatePromises.push(
      updateDoc(doc.ref, {
        recordedByName: fullName,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  await Promise.all(updatePromises);
}

/**
 * Update denormalized doctor name in medical notes
 */
export async function updateDoctorNameInMedicalNotes(
  patientId: string,
  doctorId: string,
  doctorName: string,
): Promise<void> {
  const notesRef = collection(db, `patients/${patientId}/medicalNotes`);
  const q = query(notesRef, where("doctorId", "==", doctorId));
  const snapshot = await getDocs(q);

  const updatePromises = snapshot.docs.map((doc: { ref: DocumentReference }) =>
    updateDoc(doc.ref, {
      doctorName,
      updatedAt: serverTimestamp(),
    }),
  );

  await Promise.all(updatePromises);
}

/**
 * Update denormalized prescribed by name in medications
 */
export async function updatePrescribedByNameInMedications(
  patientId: string,
  doctorId: string,
  doctorName: string,
): Promise<void> {
  const medicationsRef = collection(db, `patients/${patientId}/medications`);
  const q = query(medicationsRef, where("prescribedById", "==", doctorId));
  const snapshot = await getDocs(q);

  const updatePromises = snapshot.docs.map((doc: { ref: DocumentReference }) =>
    updateDoc(doc.ref, {
      prescribedByName: doctorName,
      updatedAt: serverTimestamp(),
    }),
  );

  await Promise.all(updatePromises);
}

/**
 * Batch update denormalized data when user information changes
 */
export async function batchUpdateUserDenormalizedData(
  userId: string,
  userData: Partial<FirestoreUser>,
): Promise<void> {
  if (!userData.firstName && !userData.lastName) {
    return; // No name changes
  }

  const userName = {
    firstName: userData.firstName || "",
    lastName: userData.lastName || "",
  };

  await updateUserNameInDocuments(userId, userName);
}

/**
 * Calculate reading status based on value and thresholds
 */
export function calculateReadingStatus(
  value: number,
  unit: "mg/dL" | "mmol/L",
  customThresholds?: { high?: number; low?: number },
): "normal" | "warning" | "critical" {
  // Convert to mg/dL for comparison
  const valueInMgDl = unit === "mmol/L" ? value * 18.0182 : value;

  const highThreshold = customThresholds?.high ?? 250;
  const lowThreshold = customThresholds?.low ?? 70;

  if (valueInMgDl < lowThreshold || valueInMgDl > highThreshold) {
    return "critical";
  } else if (valueInMgDl < 100 || valueInMgDl > 180) {
    return "warning";
  }
  return "normal";
}

/**
 * Update medication active status based on dates
 */
export function calculateMedicationActiveStatus(
  startDate: Timestamp,
  endDate?: Timestamp,
): boolean {
  const now = Date.now();
  const start = startDate.toMillis();

  if (start > now) {
    return false; // Not started yet
  }

  if (endDate) {
    const end = endDate.toMillis();
    return end > now; // Active if end date is in the future
  }

  return true; // No end date means active indefinitely
}

/**
 * Sync medication active status for a patient
 */
export async function syncMedicationActiveStatus(
  patientId: string,
): Promise<void> {
  const medicationsRef = collection(db, `patients/${patientId}/medications`);
  const snapshot = await getDocs(medicationsRef);

  const updatePromises = snapshot.docs.map(
    (doc: {
      ref: DocumentReference;
      data: () => {
        startDate?: unknown;
        endDate?: unknown;
        isActive?: boolean;
      };
    }) => {
      const data = doc.data();
      const isActive = calculateMedicationActiveStatus(
        data.startDate as Timestamp,
        data.endDate as Timestamp | undefined,
      );

      if (data.isActive !== isActive) {
        return updateDoc(doc.ref, {
          isActive,
          updatedAt: serverTimestamp(),
        });
      }
      return Promise.resolve();
    },
  );

  await Promise.all(updatePromises);
}
