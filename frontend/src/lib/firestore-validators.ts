import { z } from "zod";

// User Validation Schemas
export const userRoleSchema = z.enum(["admin", "doctor", "nurse"]);
export const languageSchema = z.enum(["ar", "en", "fr"]);
export const themeSchema = z.enum(["light", "dark", "auto"]);
export const measurementUnitSchema = z.enum(["mg/dL", "mmol/L"]);

export const userPreferencesSchema = z.object({
  language: languageSchema,
  theme: themeSchema,
  timezone: z.string(),
  dateFormat: z.string(),
  measurementUnit: measurementUnitSchema,
  notifications: z.object({
    criticalReadings: z.boolean(),
    reminders: z.boolean(),
    messages: z.boolean(),
    system: z.boolean(),
  }),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  role: userRoleSchema,
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  isActive: z.boolean().optional(),
  preferences: userPreferencesSchema.partial().optional(),
});

// Patient Validation Schemas
export const diabetesTypeSchema = z.enum(["type1", "type2", "gestational"]);
export const patientStatusSchema = z.enum([
  "active",
  "inactive",
  "critical",
  "needs_followup",
]);
export const genderSchema = z.enum(["male", "female"]);

export const patientAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

export const patientAllergiesSchema = z.object({
  medications: z.array(z.string()).optional(),
  foods: z.array(z.string()).optional(),
  other: z.array(z.string()).optional(),
});

export const emergencyContactSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
});

export const customAlertRulesSchema = z.object({
  highThreshold: z.number().positive().optional(),
  lowThreshold: z.number().positive().optional(),
  enableAlerts: z.boolean(),
});

export const createPatientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.any(), // Timestamp
  gender: genderSchema,
  phone: z.string().min(1),
  email: z.string().email().optional(),
  address: patientAddressSchema.optional(),
  diabetesType: diabetesTypeSchema,
  diagnosisDate: z.any(), // Timestamp
  bloodType: z.string().optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  doctorId: z.string().min(1),
  nurseId: z.string().optional(),
  avatar: z.string().url().optional(),
  chronicDiseases: z.array(z.string()).optional(),
  allergies: patientAllergiesSchema.optional(),
  emergencyContact: emergencyContactSchema.optional(),
  customAlertRules: customAlertRulesSchema.optional(),
});

// Reading Validation Schemas
export const readingTypeSchema = z.enum([
  "fasting",
  "post_breakfast",
  "pre_lunch",
  "post_lunch",
  "pre_dinner",
  "post_dinner",
  "bedtime",
  "midnight",
  "random",
]);

export const readingStatusSchema = z.enum(["normal", "warning", "critical"]);
export const readingUnitSchema = z.enum(["mg/dL", "mmol/L"]);

export const symptomSchema = z.enum([
  "dizziness",
  "sweating",
  "tremor",
  "headache",
  "fatigue",
  "extreme_hunger",
]);

export const conditionDuringReadingSchema = z.enum([
  "normal",
  "after_exercise",
  "sick",
  "long_fasting",
]);

export const createReadingSchema = z.object({
  value: z.number().positive().max(1000), // Reasonable range
  unit: readingUnitSchema,
  readingType: readingTypeSchema,
  date: z.any(), // Timestamp
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  notes: z.string().max(1000).optional(),
  symptoms: z.array(symptomSchema).optional(),
  conditionDuringReading: conditionDuringReadingSchema.optional(),
});

// Medical Note Validation Schemas
export const medicalNoteTypeSchema = z.enum([
  "diagnosis",
  "prescription",
  "observation",
  "followup",
]);

export const createMedicalNoteSchema = z.object({
  noteType: medicalNoteTypeSchema,
  content: z.string().min(1).max(5000),
  attachments: z.array(z.string().url()).optional(),
  isImportant: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// Medication Validation Schemas
export const medicationRemindersSchema = z.object({
  enabled: z.boolean(),
  times: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)).optional(),
});

export const createMedicationSchema = z.object({
  medicationName: z.string().min(1).max(200),
  dosage: z.string().min(1).max(100),
  frequency: z.string().min(1).max(100),
  startDate: z.any(), // Timestamp
  endDate: z.any().optional(), // Timestamp
  notes: z.string().max(1000).optional(),
  reminders: medicationRemindersSchema.optional(),
});

// Scheduled Reading Validation Schemas
export const scheduledReadingStatusSchema = z.enum([
  "pending",
  "completed",
  "missed",
  "cancelled",
]);

export const createScheduledReadingSchema = z.object({
  readingType: readingTypeSchema,
  scheduledDate: z.any(), // Timestamp
  scheduledTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  assignedToNurseId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// Notification Validation Schemas
export const notificationTypeSchema = z.enum([
  "critical_reading",
  "reminder",
  "message",
  "system",
  "assignment",
]);

export const notificationPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "urgent",
]);

export const createNotificationSchema = z.object({
  type: notificationTypeSchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  priority: notificationPrioritySchema.optional(),
  relatedEntityType: z.enum(["patient", "reading", "user", "medication"]).optional(),
  relatedEntityId: z.string().optional(),
  actionUrl: z.string().url().optional(),
  expiresAt: z.any().optional(), // Timestamp
});

// Report Validation Schemas
export const reportTypeSchema = z.enum([
  "patient_summary",
  "period_summary",
  "comparison",
  "custom",
]);

export const reportFilterSchema = z.object({
  patientIds: z.array(z.string()).optional(),
  userIds: z.array(z.string()).optional(),
  dateFrom: z.any().optional(), // Timestamp
  dateTo: z.any().optional(), // Timestamp
  readingTypes: z.array(readingTypeSchema).optional(),
  status: z.array(readingStatusSchema).optional(),
  diabetesTypes: z.array(diabetesTypeSchema).optional(),
});

export const reportScheduleConfigSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly"]),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  recipients: z.array(z.string()).optional(),
});

export const createReportSchema = z.object({
  name: z.string().min(1).max(200),
  type: reportTypeSchema,
  filters: reportFilterSchema,
  isScheduled: z.boolean().optional(),
  scheduleConfig: reportScheduleConfigSchema.optional(),
});

// Message Validation Schemas
export const messagePrioritySchema = z.enum(["low", "medium", "high"]);

export const createMessageSchema = z.object({
  recipientId: z.string().min(1),
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(5000),
  relatedPatientId: z.string().optional(),
  relatedReadingId: z.string().optional(),
  priority: messagePrioritySchema.optional(),
});

// Settings Validation Schemas
export const settingCategorySchema = z.enum([
  "general",
  "measurements",
  "notifications",
  "security",
  "backup",
  "email",
  "alerts",
]);

export const createSettingSchema = z.object({
  key: z.string().min(1),
  value: z.any(), // JSON value
  category: settingCategorySchema,
  description: z.string().max(500).optional(),
});

// Validation helper functions
export function validateUser(data: unknown) {
  return createUserSchema.parse(data);
}

export function validatePatient(data: unknown) {
  return createPatientSchema.parse(data);
}

export function validateReading(data: unknown) {
  return createReadingSchema.parse(data);
}

export function validateMedicalNote(data: unknown) {
  return createMedicalNoteSchema.parse(data);
}

export function validateMedication(data: unknown) {
  return createMedicationSchema.parse(data);
}

export function validateScheduledReading(data: unknown) {
  return createScheduledReadingSchema.parse(data);
}

export function validateNotification(data: unknown) {
  return createNotificationSchema.parse(data);
}

export function validateReport(data: unknown) {
  return createReportSchema.parse(data);
}

export function validateMessage(data: unknown) {
  return createMessageSchema.parse(data);
}

export function validateSetting(data: unknown) {
  return createSettingSchema.parse(data);
}

// Patient Alert Validation Schemas
export const patientAlertTypeSchema = z.enum([
  "critical_reading",
  "threshold_breach",
  "missed_reading",
  "medication_due",
  "followup_required",
]);

export const alertPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

export const patientAlertMetadataSchema = z.object({
  readingValue: z.number().optional(),
  threshold: z.number().optional(),
  missedDate: z.any().optional(), // Timestamp
  medicationName: z.string().optional(),
  scheduledDate: z.any().optional(), // Timestamp
});

export const createPatientAlertSchema = z.object({
  alertType: patientAlertTypeSchema,
  priority: alertPrioritySchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  relatedReadingId: z.string().optional(),
  relatedMedicationId: z.string().optional(),
  relatedScheduledReadingId: z.string().optional(),
  metadata: patientAlertMetadataSchema.optional(),
});

export function validatePatientAlert(data: unknown) {
  return createPatientAlertSchema.parse(data);
}
