# Firestore Database Implementation

This document describes the complete Firestore database implementation for the diabetes monitoring system.

## Files Created

### 1. Security Rules
- **`firestore.rules`** - Complete security rules with role-based access control
  - Users can only access their own data or data they're assigned to
  - Doctors can manage their patients
  - Nurses can read assigned patients and create readings
  - Admins have full access

### 2. Indexes
- **`firestore.indexes.json`** - 47 composite indexes covering all query patterns
  - Users: 3 indexes
  - Patients: 9 indexes
  - Readings: 7 indexes
  - Medical Notes: 3 indexes
  - Medications: 3 indexes
  - Scheduled Readings: 3 indexes
  - Notifications: 4 indexes
  - Reports: 3 indexes
  - Audit Logs: 6 indexes
  - Messages: 4 indexes
  - Settings: 1 index
  - System Health: 1 index
  - Backups: 2 indexes

### 3. Type Definitions
- **`src/types/firestore.ts`** - Complete TypeScript interfaces matching Firestore structure
  - All collections and subcollections
  - Create DTOs for all entities
  - Proper Timestamp types

### 4. Helper Functions
- **`src/lib/firestore-helpers.ts`** - CRUD operations for all collections
  - User management
  - Patient management with subcollections
  - Reading creation with automatic status calculation
  - Medical notes, medications, scheduled readings
  - Notifications, reports, messages
  - Batch operations support
  - Pagination helpers

### 5. Validation Schemas
- **`src/lib/firestore-validators.ts`** - Zod validation schemas
  - All create DTOs validated
  - Type-safe validation
  - Error handling

### 6. Real-time Hooks
- **`src/hooks/useFirestore.ts`** - React hooks for real-time data
  - `useUser` - Single user document
  - `usePatient` - Single patient document
  - `usePatients` - Patient collection query
  - `useReadings` - Patient readings subcollection
  - `useMedicalNotes` - Medical notes subcollection
  - `useMedications` - Medications subcollection
  - `useNotifications` - User notifications subcollection
  - `useMessages` - Messages collection
  - `useUnreadNotificationsCount` - Unread count

### 7. Denormalization Utilities
- **`src/utils/denormalize.ts`** - Functions to maintain denormalized data
  - Update patient last reading info
  - Recalculate patient statistics
  - Update user names in related documents
  - Sync medication active status

## Database Structure

### Top-Level Collections

1. **`users`** - System users (admins, doctors, nurses)
   - Subcollections: `notifications`, `sessions`

2. **`patients`** - Patient information
   - Subcollections: `readings`, `medicalNotes`, `medications`, `scheduledReadings`, `documents`

3. **`reports`** - Saved report configurations
   - Subcollections: `exports`

4. **`auditLogs`** - System activity logs

5. **`settings`** - System-wide settings

6. **`messages`** - Messages between users

7. **`systemHealth`** - System monitoring metrics

8. **`backups`** - Backup records

## Key Features

### Denormalization
- Patient documents store `lastReadingDate`, `lastReadingValue`, `lastReadingStatus` for quick access
- User names are stored in readings, notes, and medications for quick display
- Patient statistics (total readings, average) are calculated and stored

### Security
- Role-based access control (RBAC)
- Path-based security rules
- Users can only access their assigned patients
- Audit logs are read-only for all users except admins

### Performance
- Composite indexes for all common query patterns
- Subcollections for related data (reduces read costs)
- Pagination support for large collections
- Batch operations for related writes

### Real-time Updates
- All hooks support real-time listeners
- Automatic cleanup on unmount
- Error handling built-in

## Usage Examples

### Creating a Patient
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
  doctorId: "doctor-id-here",
});
```

### Creating a Reading
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

### Using Real-time Hooks
```typescript
import { usePatient, useReadings } from "@/hooks/useFirestore";

function PatientProfile({ patientId }: { patientId: string }) {
  const { patient, loading: patientLoading } = usePatient(patientId);
  const { readings, loading: readingsLoading } = useReadings(patientId);
  
  if (patientLoading || readingsLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <h1>{patient?.firstName} {patient?.lastName}</h1>
      <ul>
        {readings.map(reading => (
          <li key={reading.id}>
            {reading.value} {reading.unit} - {reading.date.toDate().toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Validating Data
```typescript
import { validateReading } from "@/lib/firestore-validators";

try {
  const validatedData = validateReading({
    value: 120,
    unit: "mg/dL",
    readingType: "fasting",
    date: Timestamp.now(),
    time: "08:00",
  });
  // Use validatedData
} catch (error) {
  // Handle validation error
}
```

## Next Steps

1. **Deploy Rules and Indexes**
   ```bash
   npm run firebase deploy --only firestore:rules,firestore:indexes
   ```

2. **Test Security Rules**
   - Use Firebase emulator to test all access patterns
   - Verify role-based access works correctly

3. **Set Up Cloud Functions** (Optional)
   - Functions to maintain denormalized data
   - Functions to create audit logs
   - Scheduled report generation

4. **Migration** (If migrating from existing data)
   - Convert existing data to Firestore structure
   - Move related data to subcollections
   - Add denormalized fields

## Notes

- All Timestamp fields use Firestore Timestamp type
- Document IDs are auto-generated by Firestore
- References use document IDs (strings), not DocumentReference objects in types
- Validation happens before writes using Zod schemas
- Real-time hooks automatically unsubscribe on component unmount
