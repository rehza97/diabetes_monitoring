/**
 * Migration utilities for converting from relational database structure to Firestore
 * 
 * This file contains helper functions to migrate data from the old structure
 * (with snake_case and separate tables) to the new Firestore structure
 * (with camelCase and subcollections).
 */

import { Timestamp } from "firebase/firestore";
import {
  createPatient,
  createReading,
  createMedicalNote,
  createMedication,
  createUser,
} from "@/lib/firestore-helpers";
import type {
  CreateFirestorePatientDto,
  CreateFirestoreReadingDto,
  CreateFirestoreMedicalNoteDto,
  CreateFirestoreMedicationDto,
  CreateFirestoreUserDto,
} from "@/types/firestore";
import type {
  Patient,
  Reading,
  User,
} from "@/types";

/**
 * Convert old User format to new Firestore User format
 */
export function convertUserToFirestore(user: User): CreateFirestoreUserDto {
  return {
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    role: user.role,
    specialization: user.specialization,
    licenseNumber: user.license_number,
    isActive: user.is_active,
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
  };
}

/**
 * Convert old Patient format to new Firestore Patient format
 */
export function convertPatientToFirestore(
  patient: Patient
): CreateFirestorePatientDto {
  return {
    firstName: patient.first_name,
    lastName: patient.last_name,
    dateOfBirth: Timestamp.fromDate(new Date(patient.date_of_birth)),
    gender: patient.gender,
    phone: patient.phone,
    email: patient.email,
    address: patient.address
      ? {
          street: patient.address,
        }
      : undefined,
    diabetesType: patient.diabetes_type,
    diagnosisDate: Timestamp.fromDate(new Date(patient.diagnosis_date)),
    bloodType: patient.blood_type,
    weight: patient.weight,
    height: patient.height,
    doctorId: patient.doctor_id || "",
    nurseId: patient.nurse_id,
    avatar: patient.avatar,
  };
}

/**
 * Convert old Reading format to new Firestore Reading format
 */
export function convertReadingToFirestore(
  reading: Reading
): CreateFirestoreReadingDto {
  // Parse date and time from the old format
  const dateTime = new Date(reading.date);
  const timeString = reading.time || dateTime.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    value: reading.value,
    unit: reading.unit,
    readingType: reading.reading_type,
    date: Timestamp.fromDate(dateTime),
    time: timeString,
    notes: reading.notes,
    symptoms: reading.symptoms,
    conditionDuringReading: reading.condition_during_reading as
      | "normal"
      | "after_exercise"
      | "sick"
      | "long_fasting"
      | undefined,
  };
}

/**
 * Migrate a single user from old format to Firestore
 */
export async function migrateUser(
  oldUser: User,
  userId: string
): Promise<void> {
  const firestoreUser = convertUserToFirestore(oldUser);
  await createUser(userId, firestoreUser);
}

/**
 * Migrate a single patient with all related data
 */
export async function migratePatient(
  oldPatient: Patient,
  oldReadings: Reading[],
  oldNotes: any[],
  oldMedications: any[]
): Promise<string> {
  // Convert and create patient
  const firestorePatient = convertPatientToFirestore(oldPatient);
  const patientId = await createPatient(firestorePatient);

  // Migrate readings
  for (const reading of oldReadings) {
    if (reading.patient_id === oldPatient.id) {
      const firestoreReading = convertReadingToFirestore(reading);
      await createReading(
        patientId,
        firestoreReading,
        reading.recorded_by_id,
        undefined // recordedByName will be set by denormalization
      );
    }
  }

  // Migrate medical notes
  for (const note of oldNotes) {
    if (note.patient_id === oldPatient.id) {
      await createMedicalNote(
        patientId,
        {
          noteType: note.note_type as "diagnosis" | "prescription" | "observation",
          content: note.content,
          isImportant: false,
        },
        note.doctor_id,
        undefined // doctorName will be set by denormalization
      );
    }
  }

  // Migrate medications
  for (const medication of oldMedications) {
    if (medication.patient_id === oldPatient.id) {
      await createMedication(
        patientId,
        {
          medicationName: medication.medication_name,
          dosage: medication.dosage,
          frequency: medication.frequency,
          startDate: Timestamp.fromDate(new Date(medication.start_date)),
          endDate: medication.end_date
            ? Timestamp.fromDate(new Date(medication.end_date))
            : undefined,
          notes: medication.notes,
        },
        medication.prescribed_by_id,
        undefined // prescribedByName will be set by denormalization
      );
    }
  }

  return patientId;
}

/**
 * Batch migrate multiple patients
 */
export async function batchMigratePatients(
  oldPatients: Patient[],
  oldReadings: Reading[],
  oldNotes: any[],
  oldMedications: any[],
  batchSize: number = 10
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < oldPatients.length; i += batchSize) {
    const batch = oldPatients.slice(i, i + batchSize);

    await Promise.allSettled(
      batch.map(async (patient) => {
        try {
          await migratePatient(patient, oldReadings, oldNotes, oldMedications);
          success++;
        } catch (error: any) {
          failed++;
          errors.push(`Patient ${patient.id}: ${error.message}`);
          console.error(`Failed to migrate patient ${patient.id}:`, error);
        }
      })
    );

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < oldPatients.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { success, failed, errors };
}

/**
 * Validate migration data before running
 */
export function validateMigrationData(
  patients: Patient[],
  readings: Reading[],
  users: User[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate patients have required fields
  patients.forEach((patient, index) => {
    if (!patient.first_name || !patient.last_name) {
      errors.push(`Patient ${index}: Missing name`);
    }
    if (!patient.doctor_id) {
      errors.push(`Patient ${index}: Missing doctor_id`);
    }
    if (!patient.date_of_birth) {
      errors.push(`Patient ${index}: Missing date_of_birth`);
    }
  });

  // Validate readings reference valid patients
  const patientIds = new Set(patients.map((p) => p.id));
  readings.forEach((reading, index) => {
    if (!patientIds.has(reading.patient_id)) {
      errors.push(`Reading ${index}: Invalid patient_id ${reading.patient_id}`);
    }
    if (!reading.recorded_by_id) {
      errors.push(`Reading ${index}: Missing recorded_by_id`);
    }
  });

  // Validate users exist for references
  const userIds = new Set(users.map((u) => u.id));
  patients.forEach((patient, index) => {
    if (patient.doctor_id && !userIds.has(patient.doctor_id)) {
      errors.push(`Patient ${index}: Invalid doctor_id ${patient.doctor_id}`);
    }
    if (patient.nurse_id && !userIds.has(patient.nurse_id)) {
      errors.push(`Patient ${index}: Invalid nurse_id ${patient.nurse_id}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate migration report
 */
export interface MigrationReport {
  totalPatients: number;
  totalReadings: number;
  totalNotes: number;
  totalMedications: number;
  migratedPatients: number;
  migratedReadings: number;
  migratedNotes: number;
  migratedMedications: number;
  errors: string[];
  duration: number;
}

export async function generateMigrationReport(
  startTime: number,
  oldPatients: Patient[],
  oldReadings: Reading[],
  oldNotes: any[],
  oldMedications: any[],
  results: { success: number; failed: number; errors: string[] }
): Promise<MigrationReport> {
  const endTime = Date.now();
  const duration = endTime - startTime;

  return {
    totalPatients: oldPatients.length,
    totalReadings: oldReadings.length,
    totalNotes: oldNotes.length,
    totalMedications: oldMedications.length,
    migratedPatients: results.success,
    migratedReadings: oldReadings.length, // All readings are migrated with patients
    migratedNotes: oldNotes.length, // All notes are migrated with patients
    migratedMedications: oldMedications.length, // All medications are migrated with patients
    errors: results.errors,
    duration,
  };
}
