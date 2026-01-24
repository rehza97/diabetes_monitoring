# Firestore Database Schema Documentation

Complete documentation of the Firestore database schema for the diabetes monitoring system.

## Table of Contents

1. [Overview](#overview)
2. [Collections](#collections)
3. [Subcollections](#subcollections)
4. [Data Relationships](#data-relationships)
5. [Security Rules](#security-rules)
6. [Indexes](#indexes)
7. [Validation Rules](#validation-rules)
8. [Best Practices](#best-practices)

## Overview

The database uses a hybrid structure optimized for Firestore:
- **Top-level collections** for entities that need independent queries
- **Subcollections** for related data that's always accessed in context
- **Denormalization** for frequently accessed data
- **References** instead of embedded data for relationships

## Collections

### 1. `users` Collection

**Path**: `/users/{userId}`

**Purpose**: Store all system users (admins, doctors, nurses)

**Document Structure**:
```typescript
{
  id: string,
  email: string (unique, indexed),
  firstName: string,
  lastName: string,
  phone?: string,
  role: "admin" | "doctor" | "nurse",
  avatar?: string,
  specialization?: string, // for doctors
  licenseNumber?: string,
  isActive: boolean,
  emailVerified: boolean,
  lastLogin?: Timestamp,
  preferences: {
    language: "ar" | "en" | "fr",
    theme: "light" | "dark" | "auto",
    timezone: string,
    dateFormat: string,
    measurementUnit: "mg/dL" | "mmol/L",
    notifications: {
      criticalReadings: boolean,
      reminders: boolean,
      messages: boolean,
      system: boolean
    }
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Subcollections**:
- `notifications` - User-specific notifications
- `sessions` - Active user sessions

**Security**:
- Users can read their own document
- Admins can read all users
- Doctors can read doctors and nurses
- Only admins can create/update/delete users

**Indexes**:
- `email` (unique)
- `role + isActive + createdAt`
- `role + lastLogin`

---

### 2. `patients` Collection

**Path**: `/patients/{patientId}`

**Purpose**: Store patient information

**Document Structure**:
```typescript
{
  id: string,
  fileNumber: string (unique, indexed),
  firstName: string,
  lastName: string,
  dateOfBirth: Timestamp,
  gender: "male" | "female",
  phone: string (indexed),
  email?: string,
  address?: {
    street?: string,
    city?: string,
    state?: string,
    zipCode?: string,
    country?: string
  },
  diabetesType: "type1" | "type2" | "gestational",
  diagnosisDate: Timestamp,
  bloodType?: string,
  weight?: number,
  height?: number,
  bmi?: number, // computed
  doctorId: string, // reference to users
  nurseId?: string, // reference to users
  avatar?: string,
  isActive: boolean,
  status: "active" | "inactive" | "critical" | "needs_followup",
  
  // Medical Information
  chronicDiseases?: string[],
  allergies?: {
    medications?: string[],
    foods?: string[],
    other?: string[]
  },
  emergencyContact?: {
    name: string,
    relationship: string,
    phone: string,
    email?: string
  },
  
  // Denormalized for quick access
  lastReadingDate?: Timestamp,
  lastReadingValue?: number,
  lastReadingStatus?: "normal" | "warning" | "critical",
  totalReadingsCount?: number,
  averageReadingValue?: number,
  
  // Custom alert rules
  customAlertRules?: {
    highThreshold?: number,
    lowThreshold?: number,
    enableAlerts: boolean
  },
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Subcollections**:
- `readings` - Blood sugar readings
- `medicalNotes` - Medical notes and observations
- `medications` - Prescribed medications
- `scheduledReadings` - Scheduled reading reminders
- `documents` - Patient documents/files
- `alerts` - Patient-specific alerts history

**Security**:
- Admins: Full access
- Doctors: Read/write their assigned patients (`doctorId == request.auth.uid`)
- Nurses: Read assigned patients, create readings (`nurseId == request.auth.uid`)

**Indexes**:
- `fileNumber` (unique)
- `doctorId + isActive + createdAt`
- `nurseId + isActive + createdAt`
- `status + lastReadingDate`
- `diabetesType + createdAt`
- `phone` (for search)

---

### 3. `patients/{patientId}/readings` Subcollection

**Path**: `/patients/{patientId}/readings/{readingId}`

**Purpose**: Store blood sugar readings for a patient

**Document Structure**:
```typescript
{
  id: string,
  value: number,
  unit: "mg/dL" | "mmol/L",
  readingType: "fasting" | "post_breakfast" | "pre_lunch" | 
               "post_lunch" | "pre_dinner" | "post_dinner" | 
               "bedtime" | "midnight" | "random",
  date: Timestamp (indexed),
  time: string, // HH:MM format
  notes?: string,
  symptoms?: string[], // dizziness, sweating, tremor, headache, fatigue, extreme_hunger
  conditionDuringReading?: "normal" | "after_exercise" | "sick" | "long_fasting",
  recordedById: string, // reference to users
  recordedByName?: string, // denormalized
  status: "normal" | "warning" | "critical", // computed
  isVerified: boolean,
  verifiedById?: string,
  verifiedAt?: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Status Calculation**:
- **Critical**: < 70 mg/dL or > 250 mg/dL (or custom thresholds)
- **Warning**: 70-100 mg/dL or 180-250 mg/dL
- **Normal**: 100-180 mg/dL

**Security**:
- Inherits parent patient permissions
- Doctors: Full access
- Nurses: Create and read (no delete/update after creation)

**Indexes**:
- `date` (descending) - for latest readings
- `date + status` - for filtering by date and status
- `date + readingType` - for filtering by type
- `recordedById + date` - for user's readings
- `status + date` - for critical readings alerts

---

### 4. `patients/{patientId}/medicalNotes` Subcollection

**Path**: `/patients/{patientId}/medicalNotes/{noteId}`

**Purpose**: Store medical notes and observations

**Document Structure**:
```typescript
{
  id: string,
  doctorId: string, // reference to users
  doctorName?: string, // denormalized
  noteType: "diagnosis" | "prescription" | "observation" | "followup",
  content: string,
  attachments?: string[], // Firebase Storage URLs
  isImportant: boolean,
  tags?: string[],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Security**:
- Only doctors can create/update/delete
- Inherits parent patient read permissions

**Indexes**:
- `doctorId + createdAt`
- `noteType + createdAt`
- `isImportant + createdAt`

---

### 5. `patients/{patientId}/medications` Subcollection

**Path**: `/patients/{patientId}/medications/{medicationId}`

**Purpose**: Store prescribed medications

**Document Structure**:
```typescript
{
  id: string,
  medicationName: string,
  dosage: string,
  frequency: string, // "daily", "twice_daily", "before_meals", etc.
  startDate: Timestamp,
  endDate?: Timestamp,
  notes?: string,
  prescribedById: string, // reference to users
  prescribedByName?: string, // denormalized
  isActive: boolean, // computed from dates
  reminders?: {
    enabled: boolean,
    times?: string[] // ["08:00", "20:00"]
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Security**:
- Only doctors can create/update/delete
- Inherits parent patient read permissions

**Indexes**:
- `prescribedById + createdAt`
- `isActive + startDate`
- `endDate` (for expired medications)

---

### 6. `patients/{patientId}/scheduledReadings` Subcollection

**Path**: `/patients/{patientId}/scheduledReadings/{scheduledId}`

**Purpose**: Store scheduled reading reminders

**Document Structure**:
```typescript
{
  id: string,
  readingType: ReadingType,
  scheduledDate: Timestamp,
  scheduledTime: string, // HH:MM format
  assignedToNurseId?: string, // reference to users
  status: "pending" | "completed" | "missed" | "cancelled",
  completedReadingId?: string, // reference to readings
  reminderSent: boolean,
  notes?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Security**:
- Doctors and nurses can create
- Nurses can update if assigned to them
- Inherits parent patient read permissions

**Indexes**:
- `scheduledDate + status`
- `assignedToNurseId + scheduledDate`
- `status + scheduledDate`

---

### 7. `patients/{patientId}/documents` Subcollection

**Path**: `/patients/{patientId}/documents/{documentId}`

**Purpose**: Store patient documents and files

**Document Structure**:
```typescript
{
  id: string,
  fileName: string,
  fileUrl: string, // Firebase Storage URL
  fileType: string, // "pdf", "image", "document"
  fileSize: number, // in bytes
  uploadedById: string, // reference to users
  category?: "lab_result" | "prescription" | "report" | "other",
  description?: string,
  createdAt: Timestamp
}
```

**Security**:
- Only doctors can create/update/delete
- Inherits parent patient read permissions

---

### 8. `patients/{patientId}/alerts` Subcollection

**Path**: `/patients/{patientId}/alerts/{alertId}`

**Purpose**: Store patient-specific alert history

**Document Structure**:
```typescript
{
  id: string,
  alertType: "critical_reading" | "threshold_breach" | "missed_reading" | "medication_due" | "followup_required",
  priority: "low" | "medium" | "high" | "urgent",
  title: string,
  message: string,
  relatedReadingId?: string, // reference to readings subcollection
  relatedMedicationId?: string, // reference to medications subcollection
  relatedScheduledReadingId?: string, // reference to scheduledReadings subcollection
  isResolved: boolean,
  resolvedById?: string, // reference to users
  resolvedAt?: Timestamp,
  acknowledgedBy?: string[], // Array of user IDs who acknowledged
  metadata?: {
    readingValue?: number,
    threshold?: number,
    missedDate?: Timestamp,
    medicationName?: string,
    scheduledDate?: Timestamp
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Alert Types**:
- `critical_reading` - Critical blood sugar reading detected
- `threshold_breach` - Patient's custom threshold exceeded
- `missed_reading` - Scheduled reading was missed
- `medication_due` - Medication reminder
- `followup_required` - Patient needs follow-up care

**Security**:
- Inherits parent patient read permissions
- Authenticated users can create alerts
- Doctors and admins can update (resolve alerts)
- Nurses can update if assigned to patient (acknowledge/resolve)
- Only admins can delete

**Indexes**:
- `isResolved + createdAt`
- `alertType + createdAt`
- `priority + createdAt`
- `isResolved + priority + createdAt`

---

### 9. `users/{userId}/notifications` Subcollection

**Path**: `/users/{userId}/notifications/{notificationId}`

**Purpose**: Store user-specific notifications

**Document Structure**:
```typescript
{
  id: string,
  type: "critical_reading" | "reminder" | "message" | "system" | "assignment",
  title: string,
  message: string,
  isRead: boolean,
  priority: "low" | "medium" | "high" | "urgent",
  relatedEntityType?: "patient" | "reading" | "user" | "medication",
  relatedEntityId?: string,
  actionUrl?: string, // deep link
  expiresAt?: Timestamp,
  createdAt: Timestamp,
  readAt?: Timestamp
}
```

**Security**:
- Users can only access their own notifications
- System can create notifications for any user

**Indexes**:
- `isRead + createdAt`
- `type + createdAt`
- `priority + createdAt`
- `isRead + priority + createdAt`

---

### 9. `users/{userId}/sessions` Subcollection

**Path**: `/users/{userId}/sessions/{sessionId}`

**Purpose**: Track active user sessions

**Document Structure**:
```typescript
{
  id: string,
  deviceInfo?: {
    platform: string,
    deviceId?: string,
    userAgent?: string
  },
  ipAddress?: string,
  lastActivity: Timestamp,
  isActive: boolean,
  createdAt: Timestamp,
  expiresAt: Timestamp
}
```

**Security**:
- Users can only access their own sessions
- Admins can delete sessions

---

### 10. `reports` Collection

**Path**: `/reports/{reportId}`

**Purpose**: Store saved report configurations

**Document Structure**:
```typescript
{
  id: string,
  name: string,
  type: "patient_summary" | "period_summary" | "comparison" | "custom",
  filters: {
    patientIds?: string[],
    userIds?: string[],
    dateFrom?: Timestamp,
    dateTo?: Timestamp,
    readingTypes?: string[],
    status?: string[],
    diabetesTypes?: string[]
  },
  createdById: string, // reference to users
  isScheduled: boolean,
  scheduleConfig?: {
    frequency: "daily" | "weekly" | "monthly",
    dayOfWeek?: number,
    dayOfMonth?: number,
    time?: string,
    recipients?: string[]
  },
  lastGeneratedAt?: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Subcollections**:
- `exports` - History of report exports

**Security**:
- Users can read their own reports
- Admins can read all reports
- Authenticated users can create reports

**Indexes**:
- `createdById + createdAt`
- `type + createdAt`
- `isScheduled + createdAt`

---

### 11. `reports/{reportId}/exports` Subcollection

**Path**: `/reports/{reportId}/exports/{exportId}`

**Purpose**: Store report export history

**Document Structure**:
```typescript
{
  id: string,
  format: "pdf" | "excel" | "csv",
  fileUrl?: string, // Firebase Storage URL
  generatedById: string, // reference to users
  recordCount?: number,
  fileSize?: number,
  createdAt: Timestamp
}
```

**Security**:
- Inherits parent report permissions

---

### 12. `auditLogs` Collection

**Path**: `/auditLogs/{logId}`

**Purpose**: System activity logs

**Document Structure**:
```typescript
{
  id: string,
  userId: string, // reference to users
  userName?: string, // denormalized
  action: "create" | "update" | "delete" | "view" | "export" | "login" | "logout",
  entityType: "patient" | "reading" | "user" | "medication" | "note" | "report" | "settings",
  entityId: string,
  oldData?: object,
  newData?: object,
  ipAddress?: string,
  userAgent?: string,
  location?: {
    country?: string,
    city?: string
  },
  createdAt: Timestamp
}
```

**Security**:
- Read-only for admins
- Only Cloud Functions can write

**Indexes**:
- `userId + createdAt`
- `entityType + createdAt`
- `action + createdAt`
- `entityId + createdAt`
- `userId + entityType + createdAt`
- `entityType + action + createdAt`

---

### 13. `settings` Collection

**Path**: `/settings/{settingId}`

**Purpose**: System-wide settings

**Document Structure**:
```typescript
{
  id: string,
  key: string (unique),
  value: any (JSON),
  category: "general" | "measurements" | "notifications" | 
            "security" | "backup" | "email" | "alerts",
  description?: string,
  updatedById: string, // reference to users
  updatedAt: Timestamp
}
```

**Key Settings Examples**:
- `measurement_ranges.normal.min` / `max`
- `measurement_ranges.warning.min` / `max`
- `measurement_ranges.critical.min` / `max`
- `default_measurement_unit`
- `session_timeout_minutes`
- `password_policy.min_length`
- `backup_frequency`
- `email_smtp_config`

**Security**:
- All authenticated users can read
- Only admins can write

**Indexes**:
- `category + updatedAt`

---

### 14. `messages` Collection

**Path**: `/messages/{messageId}`

**Purpose**: Messages between users

**Document Structure**:
```typescript
{
  id: string,
  senderId: string, // reference to users
  senderName?: string, // denormalized
  recipientId: string, // reference to users
  subject?: string,
  message: string,
  relatedPatientId?: string, // reference to patients
  relatedReadingId?: string, // reference to readings
  isRead: boolean,
  priority: "low" | "medium" | "high",
  createdAt: Timestamp,
  readAt?: Timestamp
}
```

**Security**:
- Users can read messages where they are sender or recipient
- Admins can read all messages
- Authenticated users can create messages

**Indexes**:
- `recipientId + isRead + createdAt`
- `senderId + createdAt`
- `relatedPatientId + createdAt`
- `recipientId + priority + createdAt`

---

### 15. `systemHealth` Collection

**Path**: `/systemHealth/{healthId}`

**Purpose**: System monitoring metrics

**Document Structure**:
```typescript
{
  id: string,
  metric: "api_response_time" | "database_query_time" | 
          "storage_usage" | "active_users" | "error_rate",
  value: number,
  unit?: string,
  timestamp: Timestamp,
  metadata?: object
}
```

**Security**:
- Read-only for admins
- Only Cloud Functions can write

**Indexes**:
- `metric + timestamp`

---

### 16. `backups` Collection

**Path**: `/backups/{backupId}`

**Purpose**: Backup records

**Document Structure**:
```typescript
{
  id: string,
  type: "automatic" | "manual",
  status: "pending" | "in_progress" | "completed" | "failed",
  fileUrl?: string, // Firebase Storage URL
  fileSize?: number,
  recordCounts?: {
    users?: number,
    patients?: number,
    readings?: number
  },
  createdById?: string, // reference to users
  startedAt: Timestamp,
  completedAt?: Timestamp,
  errorMessage?: string
}
```

**Security**:
- Read-only for admins
- Only Cloud Functions can write

**Indexes**:
- `status + startedAt`
- `type + startedAt`

---

## Data Relationships

### Reference Pattern

All relationships use document IDs (strings) as references, not DocumentReference objects in the TypeScript types. This keeps the data structure simple while maintaining referential integrity.

**Example**:
```typescript
// Patient document
{
  doctorId: "user-123", // Reference to users collection
  nurseId: "user-456"   // Reference to users collection
}

// Reading document
{
  recordedById: "user-123" // Reference to users collection
}
```

### Denormalization Pattern

Frequently accessed data is denormalized for performance:

1. **Patient → Last Reading Info**
   - `lastReadingDate`, `lastReadingValue`, `lastReadingStatus`
   - Updated automatically when a new reading is created

2. **Reading → Recorded By Name**
   - `recordedByName` stored in reading document
   - Updated when user name changes

3. **Medical Note → Doctor Name**
   - `doctorName` stored in note document
   - Updated when doctor name changes

4. **Medication → Prescribed By Name**
   - `prescribedByName` stored in medication document
   - Updated when doctor name changes

---

## Security Rules

### Access Control Matrix

| Collection | Admin | Doctor | Nurse |
|------------|-------|--------|-------|
| `users` | Read/Write All | Read Doctors/Nurses | Read Own |
| `patients` | Read/Write All | Read/Write Assigned | Read Assigned, Create Readings |
| `readings` | Read/Write All | Read/Write Assigned Patients | Create/Read Assigned Patients |
| `medicalNotes` | Read/Write All | Read/Write Assigned Patients | Read Only |
| `medications` | Read/Write All | Read/Write Assigned Patients | Read Only |
| `notifications` | Read/Write All | Read Own | Read Own |
| `reports` | Read/Write All | Read/Write Own | Read/Write Own |
| `auditLogs` | Read Only | No Access | No Access |
| `settings` | Read/Write | Read Only | Read Only |
| `messages` | Read All | Read Own | Read Own |

---

## Indexes

### Single-Field Indexes (Automatic)

Firestore automatically creates single-field indexes for:
- All document ID fields
- All fields used in `where()` clauses
- All fields used in `orderBy()` clauses

### Composite Indexes (Required)

47 composite indexes are defined in `firestore.indexes.json`:

**Patients** (9 indexes):
- `doctorId + isActive + createdAt`
- `nurseId + isActive + createdAt`
- `status + lastReadingDate`
- `diabetesType + createdAt`
- `status + createdAt`
- `doctorId + status + lastReadingDate`
- `nurseId + status + lastReadingDate`
- `isActive + createdAt`

**Readings** (7 indexes):
- `date + status`
- `date + readingType`
- `recordedById + date`
- `status + date`
- `readingType + date`
- `value + date`
- `isVerified + date`

**Medical Notes** (3 indexes):
- `doctorId + createdAt`
- `noteType + createdAt`
- `isImportant + createdAt`

**Medications** (3 indexes):
- `prescribedById + createdAt`
- `isActive + startDate`
- `endDate`

**Scheduled Readings** (3 indexes):
- `scheduledDate + status`
- `assignedToNurseId + scheduledDate`
- `status + scheduledDate`

**Notifications** (4 indexes):
- `isRead + createdAt`
- `type + createdAt`
- `priority + createdAt`
- `isRead + priority + createdAt`

**Reports** (3 indexes):
- `createdById + createdAt`
- `type + createdAt`
- `isScheduled + createdAt`

**Audit Logs** (6 indexes):
- `userId + createdAt`
- `entityType + createdAt`
- `action + createdAt`
- `entityId + createdAt`
- `userId + entityType + createdAt`
- `entityType + action + createdAt`

**Messages** (4 indexes):
- `recipientId + isRead + createdAt`
- `senderId + createdAt`
- `relatedPatientId + createdAt`
- `recipientId + priority + createdAt`

**Settings** (1 index):
- `category + updatedAt`

**System Health** (1 index):
- `metric + timestamp`

**Backups** (2 indexes):
- `status + startedAt`
- `type + startedAt`

---

## Validation Rules

### Patient Validation

- `fileNumber`: Required, unique, auto-generated format `PAT-{timestamp}`
- `firstName`: Required, 1-100 characters
- `lastName`: Required, 1-100 characters
- `dateOfBirth`: Required, must be valid Timestamp, must be in the past
- `gender`: Required, must be "male" or "female"
- `phone`: Required, must be valid phone format
- `email`: Optional, must be valid email format if provided
- `diabetesType`: Required, must be valid enum
- `diagnosisDate`: Required, must be valid Timestamp
- `doctorId`: Required, must reference existing user with role "doctor"
- `nurseId`: Optional, must reference existing user with role "nurse" if provided

### Reading Validation

- `value`: Required, must be positive number, range 20-600 mg/dL (or equivalent in mmol/L)
- `unit`: Required, must be "mg/dL" or "mmol/L"
- `readingType`: Required, must be valid enum
- `date`: Required, must be valid Timestamp, cannot be in future
- `time`: Required, must be HH:MM format (00:00-23:59)
- `recordedById`: Required, must reference existing user
- `symptoms`: Optional, array of valid symptom strings
- `conditionDuringReading`: Optional, must be valid enum

### User Validation

- `email`: Required, unique, valid email format
- `firstName`: Required, 1-100 characters
- `lastName`: Required, 1-100 characters
- `role`: Required, must be "admin", "doctor", or "nurse"
- `phone`: Optional, valid phone format
- `specialization`: Optional, required if role is "doctor"
- `licenseNumber`: Optional, for doctors and nurses

---

## Best Practices

### 1. Query Optimization

- Always use `limit()` for pagination (20-50 items)
- Use `startAfter()` for cursor-based pagination
- Avoid `!=` queries (use range queries instead)
- Use `in` queries sparingly (max 10 items)
- Use collection group queries only when necessary

### 2. Write Operations

- Use batch writes for related operations
- Update denormalized fields in the same batch
- Use transactions for critical updates
- Validate data before writing

### 3. Real-time Listeners

- Use targeted listeners on subcollections
- Always unsubscribe when components unmount
- Use query constraints to limit data
- Handle errors gracefully

### 4. Security

- Never trust client-side validation alone
- Always validate in security rules
- Use path-based rules for subcollections
- Test security rules thoroughly

### 5. Performance

- Denormalize frequently accessed data
- Use indexes for all query patterns
- Cache settings and configuration
- Monitor read/write costs

### 6. Data Integrity

- Use Cloud Functions to maintain denormalized data
- Validate references on write
- Handle orphaned references gracefully
- Regular data validation checks

---

## Migration Guide

See `src/utils/migration.ts` for migration utilities from relational database structure.

### Migration Steps

1. Validate all data before migration
2. Convert foreign keys to document IDs
3. Move related data to subcollections
4. Add denormalized fields
5. Set up indexes before deploying
6. Test security rules
7. Migrate in batches to avoid timeouts

---

## Support

For questions or issues:
- Check `FIRESTORE_IMPLEMENTATION.md` for implementation details
- Check `FIRESTORE_QUICK_START.md` for quick reference
- Check `src/lib/firestore-examples.ts` for usage examples
- Review Firebase documentation: https://firebase.google.com/docs/firestore
