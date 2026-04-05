import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  query,
  where,
  orderBy,
  Timestamp,
  deleteField,
} from "firebase/firestore";
import { subYears } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { PatientsTable } from "@/components/dashboard/tables/PatientsTable";
import {
  PatientFilters,
  type PatientFiltersState,
} from "@/components/dashboard/filters/PatientFilters";
import { PatientForm } from "@/components/dashboard/forms/PatientForm";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Plus } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";
import { usePatients, useUsers } from "@/hooks/useFirestore";
import {
  patientsCollection,
  usersCollection,
  deletePatient,
} from "@/lib/firestore-helpers";
import type { FirestorePatient, FirestoreUser } from "@/types/firestore";

// Logging utility
const logError = (
  context: string,
  error: unknown,
  details?: Record<string, unknown>,
) => {
  console.error(
    `[PatientsManagementPage] Error in ${context}:`,
    error,
    details,
  );
};

const logWarning = (
  context: string,
  message: string,
  details?: Record<string, unknown>,
) => {
  console.warn(
    `[PatientsManagementPage] Warning in ${context}:`,
    message,
    details,
  );
};

const logInfo = (
  context: string,
  message: string,
  details?: Record<string, unknown>,
) => {
  console.log(`[PatientsManagementPage] Info in ${context}:`, message, details);
};

export function PatientsManagementPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  // PatientForm expects snake_case format, so we store the transformed patient
  const [editingPatient, setEditingPatient] = useState<
    | {
        id: string;
        file_number?: string;
        first_name: string;
        last_name: string;
        date_of_birth: string;
        gender: "male" | "female";
        phone: string;
        address?: string;
        diabetes_type: "type1" | "type2" | "gestational";
        diagnosis_year: number;
        blood_type?: string;
        weight?: number;
        height?: number;
        doctor_id?: string;
        nurse_id?: string;
      }
    | undefined
  >();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<PatientFiltersState>({
    search: "",
    diabetesType: "all",
    status: "all",
    doctorId: "all",
    nurseId: "all",
  });
  const { addNotification } = useNotification();

  // Component lifecycle logging
  useEffect(() => {
    logInfo("componentMount", "PatientsManagementPage mounted");
    return () => {
      logInfo("componentUnmount", "PatientsManagementPage unmounting");
    };
  }, []);

  // Create query based on filters
  const patientsQuery = useMemo(() => {
    try {
      const constraints: any[] = [orderBy("createdAt", "desc")];

      if (filters.diabetesType !== "all") {
        constraints.push(where("diabetesType", "==", filters.diabetesType));
      }

      if (filters.status !== "all") {
        constraints.push(where("lastReadingStatus", "==", filters.status));
      }

      if (filters.doctorId !== "all") {
        constraints.push(where("doctorId", "==", filters.doctorId));
      }

      if (filters.nurseId !== "all") {
        constraints.push(where("nurseId", "==", filters.nurseId));
      }

      const q = query(patientsCollection, ...constraints);
      logInfo("patientsQuery", "Query created successfully", { filters });
      return q;
    } catch (error) {
      logError("patientsQuery", error, { filters });
      throw error;
    }
  }, [filters.diabetesType, filters.status, filters.doctorId, filters.nurseId]);

  // Fetch patients and users (for doctor/nurse names)
  const {
    data: patients,
    loading: patientsLoading,
    error: patientsError,
  } = usePatients(patientsQuery);
  const usersQuery = useMemo(() => {
    try {
      const q = query(usersCollection, where("isActive", "==", true));
      logInfo("usersQuery", "Query created successfully");
      return q;
    } catch (error) {
      logError("usersQuery", error);
      throw error;
    }
  }, []);
  const {
    data: users,
    loading: usersLoading,
    error: usersError,
  } = useUsers(usersQuery);

  // Filter users by role for dropdowns
  const doctors = useMemo(
    () => users?.filter((u) => u.role === "doctor") || [],
    [users],
  );
  const nurses = useMemo(
    () => users?.filter((u) => u.role === "nurse") || [],
    [users],
  );

  // Log data fetching status
  useEffect(() => {
    logInfo("dataFetching", "Data fetching status", {
      patients: {
        loading: patientsLoading,
        count: patients?.length ?? 0,
        error: patientsError?.message,
      },
      users: {
        loading: usersLoading,
        count: users?.length ?? 0,
        error: usersError?.message,
      },
    });
  }, [
    patientsLoading,
    usersLoading,
    patients?.length,
    users?.length,
    patientsError,
    usersError,
  ]);

  // Log errors when they occur
  useEffect(() => {
    if (patientsError) {
      const errorDetails: Record<string, unknown> = {
        query: "patientsQuery",
        message: patientsError.message,
        name: patientsError.name,
      };
      if ("code" in patientsError) {
        errorDetails.code = (patientsError as any).code;
      }
      logError("patientsFetch", patientsError, errorDetails);
    }
  }, [patientsError]);

  useEffect(() => {
    if (usersError) {
      const errorDetails: Record<string, unknown> = {
        query: "usersQuery",
        message: usersError.message,
        name: usersError.name,
      };
      if ("code" in usersError) {
        errorDetails.code = (usersError as any).code;
      }
      logError("usersFetch", usersError, errorDetails);
    }
  }, [usersError]);

  // Create a map of user IDs to names
  const userNamesMap = useMemo(() => {
    const map = new Map<string, string>();
    users?.forEach((user) => {
      if (user.id) {
        map.set(
          user.id,
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email ||
            "",
        );
      }
    });
    return map;
  }, [users]);

  // Filter and transform patients to match table format
  const filteredPatients = useMemo(() => {
    if (!patients) return [];

    return patients
      .filter((patient) => {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesSearch =
            patient.firstName?.toLowerCase().includes(searchLower) ||
            patient.lastName?.toLowerCase().includes(searchLower) ||
            patient.fileNumber?.toLowerCase().includes(searchLower);
          if (!matchesSearch) return false;
        }
        return true;
      })
      .map((patient) => ({
        id: patient.id,
        file_number: patient.fileNumber || "",
        first_name: patient.firstName || "",
        last_name: patient.lastName || "",
        date_of_birth:
          patient.dateOfBirth?.toDate().toISOString().split("T")[0] || "",
        diabetes_type: patient.diabetesType,
        doctor_name: patient.doctorId
          ? userNamesMap.get(patient.doctorId)
          : undefined,
        nurse_name: patient.nurseId
          ? userNamesMap.get(patient.nurseId)
          : undefined,
        last_reading:
          patient.lastReadingValue && patient.lastReadingDate
            ? {
                value: patient.lastReadingValue,
                date: patient.lastReadingDate
                  .toDate()
                  .toISOString()
                  .split("T")[0],
              }
            : undefined,
        status: patient.lastReadingStatus || "normal",
        avatar: patient.avatar,
      }));
  }, [patients, filters.search, userNamesMap]);

  const handleAddPatient = () => {
    setEditingPatient(undefined);
    setIsFormOpen(true);
  };

  const handleViewPatient = (patient: { id: string }) => {
    navigate(`/dashboard/patients/${patient.id}`);
  };

  const handleEditPatient = (patient: { id: string }) => {
    logInfo("handleEditPatient", "Starting edit patient", {
      patientId: patient.id,
    });

    // Find the original FirestorePatient from the patients array
    // The patient passed from the table might be transformed (snake_case)
    const originalPatient = patients?.find((p) => p.id === patient.id);

    if (!originalPatient) {
      console.error(
        "❌ [handleEditPatient] Patient not found in patients array:",
        patient.id,
      );
      logError("handleEditPatient", new Error("Patient not found"), {
        patientId: patient.id,
      });
      return;
    }

    console.group("🔍 [handleEditPatient] Patient data transformation");
    console.log("Original FirestorePatient:", originalPatient);
    console.log("  firstName:", originalPatient.firstName);
    console.log("  lastName:", originalPatient.lastName);
    console.log("  phone:", originalPatient.phone);
    console.log("  doctorId:", originalPatient.doctorId);
    console.log("  nurseId:", originalPatient.nurseId);
    console.log("  dateOfBirth:", originalPatient.dateOfBirth);
    console.log("  diabetesType:", originalPatient.diabetesType);

    // Transform FirestorePatient (camelCase) to PatientForm format (snake_case)
    const formPatient = {
      id: originalPatient.id,
      file_number: originalPatient.fileNumber || "",
      first_name: originalPatient.firstName || "",
      last_name: originalPatient.lastName || "",
      date_of_birth:
        originalPatient.dateOfBirth?.toDate().toISOString().split("T")[0] || "",
      gender: originalPatient.gender,
      phone: originalPatient.phone || "",
      address: originalPatient.address
        ? typeof originalPatient.address === "string"
          ? originalPatient.address
          : JSON.stringify(originalPatient.address)
        : "",
      diabetes_type: originalPatient.diabetesType,
      diagnosis_year:
        originalPatient.diagnosisDate?.toDate().getFullYear() ??
        new Date().getFullYear(),
      blood_type: originalPatient.bloodType || "",
      weight: originalPatient.weight,
      height: originalPatient.height,
      doctor_id: originalPatient.doctorId || "",
      nurse_id: originalPatient.nurseId || "",
    };

    console.log("Transformed form patient:", formPatient);
    console.log("  first_name:", formPatient.first_name);
    console.log("  last_name:", formPatient.last_name);
    console.log("  phone:", formPatient.phone);
    console.log("  doctor_id:", formPatient.doctor_id);
    console.log("  nurse_id:", formPatient.nurse_id);
    console.groupEnd();

    // Set both state updates together - React will batch them
    setEditingPatient(formPatient as any);
    setIsFormOpen(true);
  };

  const handleDeletePatient = async (patient: {
    id: string;
    first_name?: string;
    last_name?: string;
  }) => {
    const name =
      patient.first_name && patient.last_name
        ? `${patient.first_name} ${patient.last_name}`
        : "ce patient";
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${name} ?`)) {
      return;
    }

    try {
      logInfo("deletePatient", "Deleting patient", {
        patientId: patient.id,
        patientName: name,
      });
      await deletePatient(patient.id);
      logInfo("deletePatient", "Patient deleted successfully", {
        patientId: patient.id,
      });
      addNotification({
        type: "success",
        title: "Patient supprimé",
        message: `${name} a été supprimé.`,
      });
    } catch (error) {
      logError("deletePatient", error, { patientId: patient.id });
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible de supprimer le patient: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      const { createPatient, updatePatient } =
        await import("@/lib/firestore-helpers");

      // Transform form data (snake_case) to Firestore format (camelCase)
      const firstName = data.first_name || data.firstName;
      const lastName = data.last_name || data.lastName;
      const age = data.age as number | undefined;
      const gender = data.gender;
      const phoneRaw = data.phone != null ? String(data.phone) : "";
      const phone = phoneRaw.replace(/\s/g, "");
      const address = data.address;
      const diabetesType = data.diabetes_type || data.diabetesType;
      const diagnosisYearRaw =
        data.diagnosis_year ?? data.diagnosisYear;
      const diagnosisYear =
        diagnosisYearRaw !== undefined && diagnosisYearRaw !== null
          ? Number(diagnosisYearRaw)
          : NaN;
      const diagnosisTimestamp = !Number.isNaN(diagnosisYear)
        ? Timestamp.fromDate(new Date(diagnosisYear, 0, 1))
        : undefined;
      const bloodType = data.blood_type || data.bloodType;
      const weight = data.weight;
      const height = data.height;
      // Convert "none" to empty string, then to undefined if empty
      const doctorId =
        (data.doctor_id || data.doctorId) === "none" ||
        !(data.doctor_id || data.doctorId)
          ? undefined
          : data.doctor_id || data.doctorId;
      const nurseId =
        (data.nurse_id || data.nurseId) === "none" ||
        !(data.nurse_id || data.nurseId)
          ? undefined
          : data.nurse_id || data.nurseId;

      // Validate that at least one assignment is selected (form should handle this, but double-check)
      if (!doctorId && !nurseId) {
        throw new Error(
          "Veuillez sélectionner au moins un médecin ou une infirmière responsable.",
        );
      }

      const ageNum =
        age !== undefined && !Number.isNaN(age) ? age : undefined;
      const dateOfBirthTs =
        ageNum !== undefined
          ? Timestamp.fromDate(subYears(new Date(), ageNum))
          : Timestamp.fromDate(subYears(new Date(), 0));

      if (editingPatient) {
        logInfo("updatePatient", "Updating patient", {
          patientId: editingPatient.id,
        });
        const updatePayload: Record<string, unknown> = {
          firstName,
          lastName,
          gender,
          phone,
          email: deleteField(),
          address,
          diabetesType,
          diagnosisDate: diagnosisTimestamp,
          bloodType,
          weight,
          height,
          doctorId,
          nurseId,
        };
        if (ageNum !== undefined) {
          updatePayload.dateOfBirth = dateOfBirthTs;
        }
        await updatePatient(
          editingPatient.id,
          updatePayload as unknown as Parameters<typeof updatePatient>[1],
        );
        logInfo("updatePatient", "Patient updated successfully", {
          patientId: editingPatient.id,
        });
        addNotification({
          type: "success",
          title: "Patient modifié",
          message: `${firstName} ${lastName} a été modifié avec succès.`,
        });
      } else {
        logInfo("createPatient", "Creating patient", {
          patientName: `${firstName} ${lastName}`,
        });
        await createPatient({
          firstName,
          lastName,
          dateOfBirth: dateOfBirthTs,
          gender,
          phone,
          address,
          diabetesType,
          diagnosisDate:
            diagnosisTimestamp ?? Timestamp.fromDate(new Date()),
          bloodType,
          weight,
          height,
          doctorId,
          nurseId,
        });
        logInfo("createPatient", "Patient created successfully", {
          patientName: `${firstName} ${lastName}`,
        });
        addNotification({
          type: "success",
          title: "Patient créé",
          message: `${firstName} ${lastName} a été créé avec succès.`,
        });
      }
      setIsFormOpen(false);
      setEditingPatient(undefined);
    } catch (error) {
      logError("formSubmit", error, {
        isEdit: !!editingPatient,
        patientId: editingPatient?.id,
      });
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible de ${editingPatient ? "modifier" : "créer"} le patient: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer ${selectedIds.length} patient(s) ?`,
      )
    ) {
      return;
    }

    try {
      logInfo("bulkDelete", "Bulk deleting patients", {
        count: selectedIds.length,
        patientIds: selectedIds,
      });
      await Promise.all(selectedIds.map((id) => deletePatient(id)));
      logInfo("bulkDelete", "Bulk delete completed successfully", {
        count: selectedIds.length,
      });
      addNotification({
        type: "success",
        title: "Patients supprimés",
        message: `${selectedIds.length} patient(s) ont été supprimés.`,
      });
      setSelectedIds([]);
    } catch (error) {
      logError("bulkDelete", error, { count: selectedIds.length });
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible de supprimer les patients: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }
  };

  if (patientsLoading) {
    logInfo("pageRender", "Page is loading");
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (patientsError) {
    logError("pageRender", "Rendering error state", {
      errorMessage: patientsError.message,
    });
    return (
      <DashboardLayout>
        <ErrorMessage
          message={`Erreur lors du chargement des patients: ${patientsError.message}`}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Gestion des patients
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez la base de données complète des patients du système
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleAddPatient}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un patient
            </Button>
          </div>
        </div>

        <PatientFilters
          filters={filters}
          onFilterChange={setFilters}
          doctors={doctors}
          nurses={nurses}
        />

        {selectedIds.length > 0 && (
          <BulkActions
            selectedCount={selectedIds.length}
            onDelete={handleBulkDelete}
            deleteLabel="Supprimer les patients sélectionnés"
          />
        )}

        <PatientsTable
          patients={filteredPatients}
          onView={handleViewPatient}
          onEdit={handleEditPatient}
          onDelete={handleDeletePatient}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />

        <PatientForm
          patient={editingPatient}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingPatient(undefined);
          }}
          onSubmit={handleFormSubmit}
        />
      </div>
    </DashboardLayout>
  );
}
