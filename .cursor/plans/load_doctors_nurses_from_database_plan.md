## Problem

The PatientFilters component has hardcoded doctor and nurse options:
- Line 144-145: Hardcoded doctor "Dr. Ahmed Benali"
- Line 160-161: Hardcoded nurse "Fatima Khelifi"
- Comments indicate "TODO: Charger depuis API"

PatientsManagementPage already fetches users from the database but doesn't pass them to PatientFilters.

## Solution

1. Update PatientFilters interface to accept `doctors` and `nurses` arrays
2. Filter users by role in PatientsManagementPage
3. Pass filtered doctors and nurses to PatientFilters
4. Update PatientFilters to render the real data from props

## Changes

### `frontend/src/components/dashboard/filters/PatientFilters.tsx`

1. **Update interface** to accept doctors and nurses:
   ```typescript
   interface PatientFiltersProps {
     onFilterChange: (filters: PatientFiltersState) => void;
     className?: string;
     doctors?: Array<{ id: string; firstName: string; lastName: string }>;
     nurses?: Array<{ id: string; firstName: string; lastName: string }>;
   }
   ```

2. **Import formatFullName** helper:
   ```typescript
   import { formatFullName } from "@/utils/helpers";
   ```

3. **Update doctor select** (lines 133-147) to use real data:
   ```typescript
   <SelectContent>
     <SelectItem value="all">Tous les médecins</SelectItem>
     {doctors?.map((doctor) => (
       <SelectItem key={doctor.id} value={doctor.id}>
         {formatFullName(doctor.firstName, doctor.lastName)}
       </SelectItem>
     ))}
   </SelectContent>
   ```

4. **Update nurse select** (lines 149-163) to use real data:
   ```typescript
   <SelectContent>
     <SelectItem value="all">Toutes les infirmières</SelectItem>
     {nurses?.map((nurse) => (
       <SelectItem key={nurse.id} value={nurse.id}>
         {formatFullName(nurse.firstName, nurse.lastName)}
       </SelectItem>
     ))}
   </SelectContent>
   ```

### `frontend/src/pages/dashboard/PatientsManagementPage.tsx`

1. **Filter users by role** after fetching:
   ```typescript
   const doctors = useMemo(() => 
     users?.filter(u => u.role === "doctor") || [], 
     [users]
   );
   const nurses = useMemo(() => 
     users?.filter(u => u.role === "nurse") || [], 
     [users]
   );
   ```

2. **Pass doctors and nurses to PatientFilters** (line 458):
   ```typescript
   <PatientFilters 
     onFilterChange={setFilters} 
     doctors={doctors}
     nurses={nurses}
   />
   ```

This will populate the doctor and nurse dropdowns with real data from the database.
