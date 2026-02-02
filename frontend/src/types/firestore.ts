import type { Timestamp } from "firebase/firestore";

// Re-export Firestore types
export type { Timestamp, DocumentReference } from "firebase/firestore";

// User Types
export type UserRole = "admin" | "doctor" | "nurse";

export interface FirestoreUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  specialization?: string; // for doctors
  licenseNumber?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Timestamp;
  preferences: {
    language: "ar" | "en" | "fr";
    theme: "light" | "dark" | "auto";
    timezone: string;
    dateFormat: string;
    measurementUnit: "mg/dL" | "mmol/L";
    notifications: {
      criticalReadings: boolean;
      reminders: boolean;
      messages: boolean;
      system: boolean;
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreUserPreferences {
  language: "ar" | "en" | "fr";
  theme: "light" | "dark" | "auto";
  timezone: string;
  dateFormat: string;
  measurementUnit: "mg/dL" | "mmol/L";
  notifications: {
    criticalReadings: boolean;
    reminders: boolean;
    messages: boolean;
    system: boolean;
  };
}

// Patient Types
export type DiabetesType = "type1" | "type2" | "gestational";
export type PatientStatus =
  | "active"
  | "inactive"
  | "critical"
  | "needs_followup";

export interface PatientAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface PatientAllergies {
  medications?: string[];
  foods?: string[];
  other?: string[];
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface CustomAlertRules {
  highThreshold?: number;
  lowThreshold?: number;
  enableAlerts: boolean;
}

export interface FirestorePatient {
  id: string;
  fileNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Timestamp;
  gender: "male" | "female";
  phone: string;
  email?: string;
  address?: PatientAddress;
  diabetesType: DiabetesType;
  diagnosisDate: Timestamp;
  bloodType?: string;
  weight?: number;
  height?: number;
  bmi?: number; // computed
  doctorId: string; // DocumentReference to users
  nurseId?: string; // DocumentReference to users
  avatar?: string;
  isActive: boolean;
  status: PatientStatus;

  // Medical Information
  chronicDiseases?: string[];
  allergies?: PatientAllergies;
  emergencyContact?: EmergencyContact;

  // Denormalized for quick access
  lastReadingDate?: Timestamp;
  lastReadingValue?: number;
  lastReadingStatus?: "normal" | "warning" | "critical";
  totalReadingsCount?: number;
  averageReadingValue?: number;

  // Custom alert rules
  customAlertRules?: CustomAlertRules;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Reading Types
export type ReadingType =
  | "fasting"
  | "post_breakfast"
  | "pre_lunch"
  | "post_lunch"
  | "pre_dinner"
  | "post_dinner"
  | "bedtime"
  | "midnight"
  | "random";

export type ReadingStatus = "normal" | "warning" | "critical";
export type ReadingUnit = "mg/dL" | "mmol/L";

export interface FirestoreReading {
  id: string;
  value: number;
  unit: ReadingUnit;
  readingType: ReadingType;
  date: Timestamp;
  time: string;
  notes?: string;
  symptoms?: string[]; // dizziness, sweating, tremor, headache, fatigue, extreme_hunger
  conditionDuringReading?:
    | "normal"
    | "after_exercise"
    | "sick"
    | "long_fasting";
  recordedById: string; // DocumentReference to users
  recordedByName?: string; // denormalized for quick display
  status: ReadingStatus; // computed based on value and thresholds
  isVerified: boolean; // if doctor verified the reading
  verifiedById?: string; // DocumentReference to users
  verifiedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Medical Notes Types
export type MedicalNoteType =
  | "diagnosis"
  | "prescription"
  | "observation"
  | "followup";

export interface FirestoreMedicalNote {
  id: string;
  doctorId: string; // DocumentReference to users
  doctorName?: string; // denormalized
  noteType: MedicalNoteType;
  content: string;
  attachments?: string[]; // Firebase Storage URLs
  isImportant: boolean;
  tags?: string[]; // for categorization
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Medication Types
export interface FirestoreMedication {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string; // "daily", "twice_daily", "before_meals", etc.
  startDate: Timestamp;
  endDate?: Timestamp;
  notes?: string;
  prescribedById: string; // DocumentReference to users
  prescribedByName?: string; // denormalized
  isActive: boolean; // computed from dates
  reminders?: {
    enabled: boolean;
    times?: string[]; // ["08:00", "20:00"]
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Scheduled Reading Types
export type ScheduledReadingStatus =
  | "pending"
  | "completed"
  | "missed"
  | "cancelled";

export interface FirestoreScheduledReading {
  id: string;
  readingType: ReadingType;
  scheduledDate: Timestamp;
  scheduledTime: string;
  assignedToNurseId?: string; // DocumentReference to users
  status: ScheduledReadingStatus;
  completedReadingId?: string; // DocumentReference to readings
  reminderSent: boolean;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Document Types
export type DocumentCategory =
  | "lab_result"
  | "prescription"
  | "report"
  | "other";

export interface FirestorePatientDocument {
  id: string;
  fileName: string;
  fileUrl: string; // Firebase Storage URL
  fileType: string; // "pdf", "image", "document"
  fileSize: number; // in bytes
  uploadedById: string; // DocumentReference to users
  category?: DocumentCategory;
  description?: string;
  createdAt: Timestamp;
}

// Notification Types
export type NotificationType =
  | "critical_reading"
  | "reminder"
  | "message"
  | "system"
  | "assignment";
export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface FirestoreNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  priority: NotificationPriority;
  relatedEntityType?: "patient" | "reading" | "user" | "medication";
  relatedEntityId?: string;
  actionUrl?: string; // deep link to relevant page
  expiresAt?: Timestamp; // for time-sensitive notifications
  createdAt: Timestamp;
  readAt?: Timestamp;
}

// Session Types
export interface FirestoreUserSession {
  id: string;
  deviceInfo?: {
    platform: string;
    deviceId?: string;
    userAgent?: string;
  };
  ipAddress?: string;
  lastActivity: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

// Report Types
export type ReportType =
  | "patient_summary"
  | "period_summary"
  | "comparison"
  | "custom";

export interface ReportFilter {
  patientIds?: string[];
  userIds?: string[];
  dateFrom?: Timestamp;
  dateTo?: Timestamp;
  readingTypes?: string[];
  status?: string[];
  diabetesTypes?: string[];
}

export interface ReportScheduleConfig {
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek?: number;
  dayOfMonth?: number;
  time?: string;
  recipients?: string[];
}

export interface FirestoreReport {
  id: string;
  name: string;
  type: ReportType;
  filters: ReportFilter;
  createdById: string; // DocumentReference to users
  isScheduled: boolean;
  scheduleConfig?: ReportScheduleConfig;
  lastGeneratedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreReportExport {
  id: string;
  format: "pdf" | "excel" | "csv";
  fileUrl?: string; // Firebase Storage URL if saved
  generatedById: string; // DocumentReference to users
  recordCount?: number;
  fileSize?: number;
  createdAt: Timestamp;
}

// Audit Log Types
export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "view"
  | "export"
  | "login"
  | "logout";
export type AuditEntityType =
  | "patient"
  | "reading"
  | "user"
  | "medication"
  | "note"
  | "report"
  | "settings";

export interface FirestoreAuditLog {
  id: string;
  userId: string; // DocumentReference to users
  userName?: string; // denormalized
  userRole?: string; // denormalized
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string; // denormalized display name
  oldData?: object;
  newData?: object;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
  };
  createdAt: Timestamp;
}

// Settings Types
export type SettingCategory =
  | "general"
  | "measurements"
  | "notifications"
  | "security"
  | "backup"
  | "email"
  | "alerts";

export interface FirestoreSetting {
  id: string;
  key: string;
  value: any; // JSON
  category: SettingCategory;
  description?: string;
  updatedById: string; // DocumentReference to users
  updatedAt: Timestamp;
}

// Message Types
export type MessagePriority = "low" | "medium" | "high";

export interface FirestoreMessage {
  id: string;
  senderId: string; // DocumentReference to users
  senderName?: string; // denormalized
  recipientId: string; // DocumentReference to users
  subject?: string;
  message: string;
  relatedPatientId?: string; // DocumentReference to patients
  relatedReadingId?: string; // DocumentReference to readings
  isRead: boolean;
  priority: MessagePriority;
  createdAt: Timestamp;
  readAt?: Timestamp;
}

// System Health Types
export type SystemHealthMetric =
  | "api_response_time"
  | "database_query_time"
  | "storage_usage"
  | "active_users"
  | "error_rate";

export interface FirestoreSystemHealth {
  id: string;
  metric: SystemHealthMetric;
  value: number;
  unit?: string;
  timestamp: Timestamp;
  metadata?: object;
}

// Backup Types
export type BackupType = "automatic" | "manual";
export type BackupStatus = "pending" | "in_progress" | "completed" | "failed";

export interface FirestoreBackup {
  id: string;
  type: BackupType;
  status: BackupStatus;
  fileUrl?: string; // Firebase Storage URL
  fileSize?: number;
  recordCounts?: {
    users?: number;
    patients?: number;
    readings?: number;
  };
  createdById?: string; // DocumentReference to users
  startedAt: Timestamp;
  completedAt?: Timestamp;
  errorMessage?: string;
}

// Create DTOs
export interface CreateFirestoreUserDto {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  specialization?: string;
  licenseNumber?: string;
  isActive?: boolean;
  preferences?: Partial<FirestoreUserPreferences>;
}

export interface CreateFirestorePatientDto {
  firstName: string;
  lastName: string;
  dateOfBirth: Timestamp;
  gender: "male" | "female";
  phone: string;
  email?: string;
  address?: PatientAddress;
  diabetesType: DiabetesType;
  diagnosisDate: Timestamp;
  bloodType?: string;
  weight?: number;
  height?: number;
  doctorId: string;
  nurseId?: string;
  avatar?: string;
  chronicDiseases?: string[];
  allergies?: PatientAllergies;
  emergencyContact?: EmergencyContact;
  customAlertRules?: CustomAlertRules;
}

export interface CreateFirestoreReadingDto {
  value: number;
  unit: ReadingUnit;
  readingType: ReadingType;
  date: Timestamp;
  time: string;
  notes?: string;
  symptoms?: string[];
  conditionDuringReading?:
    | "normal"
    | "after_exercise"
    | "sick"
    | "long_fasting";
}

export interface CreateFirestoreMedicalNoteDto {
  noteType: MedicalNoteType;
  content: string;
  attachments?: string[];
  isImportant?: boolean;
  tags?: string[];
}

export interface CreateFirestoreMedicationDto {
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  notes?: string;
  reminders?: {
    enabled: boolean;
    times?: string[];
  };
}

export interface CreateFirestoreScheduledReadingDto {
  readingType: ReadingType;
  scheduledDate: Timestamp;
  scheduledTime: string;
  assignedToNurseId?: string;
  notes?: string;
}

export interface CreateFirestoreNotificationDto {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  relatedEntityType?: "patient" | "reading" | "user" | "medication";
  relatedEntityId?: string;
  actionUrl?: string;
  expiresAt?: Timestamp;
}

export interface CreateFirestoreReportDto {
  name: string;
  type: ReportType;
  filters: ReportFilter;
  isScheduled?: boolean;
  scheduleConfig?: ReportScheduleConfig;
}

export interface CreateFirestoreMessageDto {
  recipientId: string;
  subject?: string;
  message: string;
  relatedPatientId?: string;
  relatedReadingId?: string;
  priority?: MessagePriority;
}

// Reading Template Types
export interface FirestoreReadingTemplate {
  id: string;
  name: string;
  readingTypes: ReadingType[];
  defaultNotes?: string;
  createdById: string; // DocumentReference to users
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateFirestoreReadingTemplateDto {
  name: string;
  readingTypes: ReadingType[];
  defaultNotes?: string;
  isDefault?: boolean;
}

// Statistics Cache Types
export interface FirestoreStatisticsCache {
  id: string; // e.g., "daily_stats"
  date: Timestamp;
  totalPatients: number;
  totalReadings: number;
  criticalReadings: number;
  activeDoctors: number;
  activeNurses: number;
  averageReadingsPerPatient: number;
  updatedAt: Timestamp;
}

// Patient Alert Types
export type PatientAlertType =
  | "critical_reading"
  | "threshold_breach"
  | "missed_reading"
  | "medication_due"
  | "followup_required";
export type AlertPriority = "low" | "medium" | "high" | "urgent";

export interface PatientAlertMetadata {
  readingValue?: number;
  threshold?: number;
  missedDate?: Timestamp;
  medicationName?: string;
  scheduledDate?: Timestamp;
}

export interface FirestorePatientAlert {
  id: string;
  alertType: PatientAlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  relatedReadingId?: string; // Reference to readings subcollection
  relatedMedicationId?: string; // Reference to medications subcollection
  relatedScheduledReadingId?: string; // Reference to scheduledReadings subcollection
  isResolved: boolean;
  resolvedById?: string; // Reference to users
  resolvedAt?: Timestamp;
  acknowledgedBy?: string[]; // Array of user IDs who acknowledged
  metadata?: PatientAlertMetadata;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateFirestorePatientAlertDto {
  alertType: PatientAlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  relatedReadingId?: string;
  relatedMedicationId?: string;
  relatedScheduledReadingId?: string;
  metadata?: PatientAlertMetadata;
}
