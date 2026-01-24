# Firestore Quick Start Guide

## Quick Reference

### Import Helpers
```typescript
import {
  createPatient,
  getPatient,
  createReading,
  getReadings,
  // ... other helpers
} from "@/lib/firestore-helpers";
```

### Import Hooks
```typescript
import {
  usePatient,
  useReadings,
  useNotifications,
  // ... other hooks
} from "@/hooks/useFirestore";
```

### Import Types
```typescript
import type {
  FirestorePatient,
  FirestoreReading,
  CreateFirestorePatientDto,
  // ... other types
} from "@/types/firestore";
```

### Import Validators
```typescript
import {
  validatePatient,
  validateReading,
  // ... other validators
} from "@/lib/firestore-validators";
```

## Common Operations

### 1. Create a Patient
```typescript
import { createPatient } from "@/lib/firestore-helpers";
import { Timestamp } from "firebase/firestore";

const patientId = await createPatient({
  firstName: "John",
  lastName: "Doe",
  dateOfBirth: Timestamp.fromDate(new Date("1990-01-01")),
  gender: "male",
  phone: "+1234567890",
  diabetesType: "type2",
  diagnosisDate: Timestamp.now(),
  doctorId: "doctor-id",
});
```

### 2. Create a Reading
```typescript
import { createReading } from "@/lib/firestore-helpers";
import { Timestamp } from "firebase/firestore";

const readingId = await createReading(
  patientId,
  {
    value: 120,
    unit: "mg/dL",
    readingType: "fasting",
    date: Timestamp.now(),
    time: "08:00",
  },
  currentUserId,
  "Dr. Smith"
);
```

### 3. Use Real-time Hooks
```typescript
import { usePatient, useReadings } from "@/hooks/useFirestore";

function PatientView({ patientId }: { patientId: string }) {
  const { patient, loading } = usePatient(patientId);
  const { readings } = useReadings(patientId);
  
  // Component implementation
}
```

### 4. Query Patients
```typescript
import { queryPatients } from "@/lib/firestore-helpers";
import { where, orderBy, limit } from "firebase/firestore";

const patients = await queryPatients([
  where("doctorId", "==", doctorId),
  where("isActive", "==", true),
  orderBy("createdAt", "desc"),
  limit(20),
]);
```

### 5. Validate Before Creating
```typescript
import { validateReading } from "@/lib/firestore-validators";

try {
  const validated = validateReading({
    value: 120,
    unit: "mg/dL",
    readingType: "fasting",
    date: Timestamp.now(),
    time: "08:00",
  });
  // Use validated data
} catch (error) {
  // Handle validation error
}
```

## Collection Paths Reference

- `users/{userId}` - User documents
- `users/{userId}/notifications/{notificationId}` - User notifications
- `patients/{patientId}` - Patient documents
- `patients/{patientId}/readings/{readingId}` - Patient readings
- `patients/{patientId}/medicalNotes/{noteId}` - Medical notes
- `patients/{patientId}/medications/{medicationId}` - Medications
- `patients/{patientId}/scheduledReadings/{scheduledId}` - Scheduled readings
- `patients/{patientId}/documents/{documentId}` - Patient documents
- `reports/{reportId}` - Report configurations
- `reports/{reportId}/exports/{exportId}` - Report exports
- `auditLogs/{logId}` - Audit logs
- `settings/{settingId}` - System settings
- `messages/{messageId}` - Messages

## Security Rules Summary

- **Users**: Can read own data, admins can read all
- **Patients**: Doctors can read/write their patients, nurses can read assigned patients
- **Readings**: Inherit patient permissions, nurses can create
- **Notes/Medications**: Only doctors can create/update
- **Notifications**: Users can only access their own
- **Audit Logs**: Read-only for admins, only Cloud Functions can write
- **Settings**: All authenticated users can read, only admins can write

## Indexes Summary

All required indexes are defined in `firestore.indexes.json`. The system will automatically create them when you deploy.

## Next Steps

1. Deploy rules and indexes: `npm run firebase deploy --only firestore:rules,firestore:indexes`
2. Start using helpers in your components
3. Set up real-time listeners where needed
4. Implement Cloud Functions for audit logging (optional)
