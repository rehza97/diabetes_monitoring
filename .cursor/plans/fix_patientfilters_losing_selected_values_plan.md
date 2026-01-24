## Problem

The `PatientFilters` component maintains its own internal state (line 39-45) that is initialized once. When filters are applied and the parent component re-renders, the child component's state doesn't sync with the parent's state, causing selected values to be lost.

## Solution

Convert `PatientFilters` to a fully controlled component by:
1. Accepting current filter values as props
2. Using the props directly instead of internal state
3. Removing the internal `useState` for filters

## Changes

### `frontend/src/components/dashboard/filters/PatientFilters.tsx`

1. **Update interface** to accept current filters:
   ```typescript
   interface PatientFiltersProps {
     filters: PatientFiltersState;  // Add this
     onFilterChange: (filters: PatientFiltersState) => void;
     className?: string;
     doctors?: Array<{ id: string; firstName: string; lastName: string }>;
     nurses?: Array<{ id: string; firstName: string; lastName: string }>;
   }
   ```

2. **Update component** to use props instead of state:
   - Remove: `const [filters, setFilters] = useState<PatientFiltersState>({...});`
   - Update `handleFilterChange` to not call `setFilters`
   - Update `clearFilters` to not call `setFilters`
   - Use the `filters` prop directly throughout the component

### `frontend/src/pages/dashboard/PatientsManagementPage.tsx`

**Pass filters as prop** (line 468):
```typescript
<PatientFilters 
  filters={filters}  // Add this
  onFilterChange={setFilters} 
  doctors={doctors}
  nurses={nurses}
/>
```

This makes the component fully controlled, so selected values will persist when filters are applied.
