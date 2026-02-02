import { useState, useMemo, useEffect } from "react";
import { query, where, orderBy, Timestamp, limit } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ReadingsTable } from "@/components/dashboard/tables/ReadingsTable";
import {
  ReadingFilters,
  type ReadingFiltersState,
} from "@/components/dashboard/filters/ReadingFilters";
import { ReadingForm } from "@/components/dashboard/forms/ReadingForm";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Trash2, Plus, AlertCircle } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";
import { usePatients, useUsers } from "@/hooks/useFirestore";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { auth } from "@/lib/firebase";
import {
  patientsCollection,
  usersCollection,
  getReadingsCollectionGroup,
  queryAllReadings,
  queryPatients,
  getReadings,
  deleteReading,
  createReading,
  updateReading,
} from "@/lib/firestore-helpers";
import { exportReadingsToExcel, exportReadingsToCSV } from "@/utils/export";
import type {
  FirestoreReading,
  FirestorePatient,
  FirestoreUser,
} from "@/types/firestore";

// Logging utility
const logError = (
  context: string,
  error: unknown,
  details?: Record<string, unknown>,
) => {
  console.error(
    `[ReadingsManagementPage] Error in ${context}:`,
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
    `[ReadingsManagementPage] Warning in ${context}:`,
    message,
    details,
  );
};

const logInfo = (
  context: string,
  message: string,
  details?: Record<string, unknown>,
) => {
  console.log(`[ReadingsManagementPage] Info in ${context}:`, message, details);
};

export function ReadingsManagementPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<
    (FirestoreReading & { patientId?: string }) | undefined
  >();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReadingFiltersState>({
    patientId: "all",
    userId: "all",
    readingType: "all",
    status: "all",
  });
  const [readings, setReadings] = useState<
    Array<FirestoreReading & { patientId: string }>
  >([]);
  const [readingsLoading, setReadingsLoading] = useState(true);
  const [readingsError, setReadingsError] = useState<Error | null>(null);
  const [hasPermissionsError, setHasPermissionsError] = useState(false);
  const { addNotification } = useNotification();
  const { user: currentUser, isLoading: authLoading } = useAuth();

  // Get Firebase Auth UID as fallback (in case currentUser.id is undefined)
  const currentUserId = currentUser?.id || auth.currentUser?.uid || null;

  // Component lifecycle logging
  useEffect(() => {
    logInfo("componentMount", "ReadingsManagementPage mounted");
    return () => {
      logInfo("componentUnmount", "ReadingsManagementPage unmounting");
    };
  }, []);

  // Fetch patients and users for names
  const patientsQuery = useMemo(() => {
    try {
      const q = query(patientsCollection, where("isActive", "==", true));
      logInfo("patientsQuery", "Query created successfully");
      return q;
    } catch (error) {
      logError("patientsQuery", error);
      throw error;
    }
  }, []);
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
    data: patients,
    loading: patientsLoading,
    error: patientsError,
  } = usePatients(patientsQuery);
  const {
    data: users,
    loading: usersLoading,
    error: usersError,
  } = useUsers(usersQuery);

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
      readings: {
        loading: readingsLoading,
        count: readings.length,
        error: readingsError?.message,
      },
    });
  }, [
    patientsLoading,
    usersLoading,
    readingsLoading,
    patients?.length,
    users?.length,
    readings.length,
    patientsError,
    usersError,
    readingsError,
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

  useEffect(() => {
    if (readingsError) {
      logError("readingsFetch", readingsError, { filters });
    }
  }, [readingsError, filters]);

  // Create maps for quick lookup
  const patientsMap = useMemo(() => {
    const map = new Map<string, FirestorePatient>();
    patients?.forEach((patient) => {
      if (patient.id) map.set(patient.id, patient);
    });
    return map;
  }, [patients]);

  const usersMap = useMemo(() => {
    const map = new Map<string, FirestoreUser>();
    users?.forEach((user) => {
      if (user.id) map.set(user.id, user);
    });
    return map;
  }, [users]);

  // Fetch readings with role-based access control
  useEffect(() => {
    const loadReadings = async () => {
      // Wait for auth to finish loading before attempting to load readings
      if (authLoading) {
        console.log(
          "🔐 [ReadingsManagementPage] Auth still loading, skipping readings fetch",
        );
        return;
      }

      setReadingsLoading(true);
      setReadingsError(null);

      // Log current user context for permission debugging
      console.group(
        "🔐 [ReadingsManagementPage] Loading readings with permission check",
      );
      console.log(
        "Current user:",
        currentUser
          ? {
              id: currentUserId,
              role: currentUser.role,
              email: currentUser.email,
            }
          : "Not authenticated",
      );
      console.log("Firebase Auth UID:", auth.currentUser?.uid);
      console.log("Filters:", filters);
      console.groupEnd();

      // Only treat as unauthenticated if auth has finished loading and no user ID
      if (!currentUserId) {
        console.warn(
          "🔐 [ReadingsManagementPage] No user ID available - cannot load readings",
        );
        setReadings([]);
        setReadingsLoading(false);
        setReadingsError(new Error("User not authenticated"));
        return;
      }

      try {
        logInfo("loadReadings", "Loading readings", {
          filters,
          currentUser: currentUser
            ? {
                id: currentUserId,
                role: currentUser.role,
                email: currentUser.email,
              }
            : null,
        });

        let allReadings: Array<FirestoreReading & { patientId: string }> = [];

        if (currentUser?.role === "admin") {
          // Admins can query all readings using collection group query
          console.log(
            "🔐 [ReadingsManagementPage] Executing admin query: queryAllReadings",
          );
          const constraints: any[] = [];

          if (filters.userId !== "all") {
            constraints.push(where("recordedById", "==", filters.userId));
          }

          if (filters.readingType !== "all") {
            constraints.push(where("readingType", "==", filters.readingType));
          }

          if (filters.status !== "all") {
            constraints.push(where("status", "==", filters.status));
          }

          if (filters.valueMin !== undefined) {
            constraints.push(where("value", ">=", filters.valueMin));
          }

          if (filters.valueMax !== undefined) {
            constraints.push(where("value", "<=", filters.valueMax));
          }

          console.log(
            "🔐 [ReadingsManagementPage] Admin query constraints:",
            constraints,
          );

          try {
            allReadings = await queryAllReadings(constraints);
            console.log(
              "🔐 [ReadingsManagementPage] Admin query successful, fetched",
              allReadings.length,
              "readings",
            );
          } catch (queryError) {
            // If collection group query fails with permission error, fallback to per-patient fetching
            const errorObj =
              queryError instanceof Error
                ? queryError
                : new Error("Failed to query readings");
            const isPermissionError =
              errorObj.message.includes("permission") ||
              errorObj.message.includes("Missing or insufficient") ||
              errorObj.message.includes("insufficient") ||
              ("code" in errorObj &&
                (errorObj as any).code === "permission-denied");

            if (isPermissionError && currentUser?.role === "admin") {
              logInfo(
                "loadReadings",
                "Using per-patient fallback (collection group query unavailable)",
                { filters },
              );

              // Fallback: Fetch all active patients, then get readings from each
              const allPatients = await queryPatients([
                where("isActive", "==", true),
              ]);
              logInfo(
                "loadReadings",
                "Fallback: fetching readings per patient",
                { patientCount: allPatients.length },
              );

              // Fetch readings from each patient with the same constraints
              const readingsPromises = allPatients.map(async (patient) => {
                try {
                  const patientConstraints: any[] = [];
                  if (filters.readingType !== "all") {
                    patientConstraints.push(
                      where("readingType", "==", filters.readingType),
                    );
                  }
                  if (filters.status !== "all") {
                    patientConstraints.push(
                      where("status", "==", filters.status),
                    );
                  }
                  if (filters.valueMin !== undefined) {
                    patientConstraints.push(
                      where("value", ">=", filters.valueMin),
                    );
                  }
                  if (filters.valueMax !== undefined) {
                    patientConstraints.push(
                      where("value", "<=", filters.valueMax),
                    );
                  }
                  if (filters.userId !== "all") {
                    patientConstraints.push(
                      where("recordedById", "==", filters.userId),
                    );
                  }

                  const patientReadings = await getReadings(patient.id, [
                    ...patientConstraints,
                    limit(1000),
                  ]);
                  return patientReadings.map((reading) => ({
                    ...reading,
                    patientId: patient.id,
                  }));
                } catch (patientError) {
                  console.error(
                    "🔐 [ReadingsManagementPage] Error in fallback for patient:",
                    patient.id,
                    patientError,
                  );
                  return [];
                }
              });

              const readingsArrays = await Promise.all(readingsPromises);
              allReadings = readingsArrays.flat();

              // Sort by date descending
              allReadings.sort((a, b) => {
                const dateA =
                  a.date && typeof a.date.toDate === "function"
                    ? a.date.toDate()
                    : a.date instanceof Date
                      ? a.date
                      : new Date(0);
                const dateB =
                  b.date && typeof b.date.toDate === "function"
                    ? b.date.toDate()
                    : b.date instanceof Date
                      ? b.date
                      : new Date(0);
                return dateB.getTime() - dateA.getTime();
              });

              logInfo("loadReadings", "Fallback successful", {
                count: allReadings.length,
              });
              setHasPermissionsError(true); // Show banner that we're using fallback
            } else {
              // Re-throw non-permission errors
              throw queryError;
            }
          }

          // Apply patient filter in memory if needed
          if (filters.patientId !== "all") {
            allReadings = allReadings.filter(
              (r) => r.patientId === filters.patientId,
            );
            console.log(
              "🔐 [ReadingsManagementPage] After patient filter:",
              allReadings.length,
              "readings",
            );
          }
        } else if (currentUser) {
          // Non-admin users: fetch readings from assigned patients only
          console.log(
            "🔐 [ReadingsManagementPage] Executing non-admin query: fetching from assigned patients",
          );

          // Get assigned patients based on role
          let assignedPatients: FirestorePatient[] = [];
          if (currentUser.role === "doctor") {
            console.log(
              "🔐 [ReadingsManagementPage] Doctor role: querying patients with doctorId =",
              currentUserId,
            );
            assignedPatients = await queryPatients([
              where("doctorId", "==", currentUserId),
              where("isActive", "==", true),
            ]);
          } else if (currentUser.role === "nurse") {
            console.log(
              "🔐 [ReadingsManagementPage] Nurse role: querying patients with nurseId =",
              currentUserId,
            );
            assignedPatients = await queryPatients([
              where("nurseId", "==", currentUserId),
              where("isActive", "==", true),
            ]);
          }

          console.log(
            "🔐 [ReadingsManagementPage] Found",
            assignedPatients.length,
            "assigned patients",
          );

          // Fetch readings from each assigned patient
          const readingsPromises = assignedPatients.map(async (patient) => {
            try {
              console.log(
                "🔐 [ReadingsManagementPage] Fetching readings for patient:",
                patient.id,
                "patient name:",
                `${patient.firstName || ""} ${patient.lastName || ""}`,
              );

              // Apply filters that can be done at query level
              const patientConstraints: any[] = [];
              if (filters.readingType !== "all") {
                patientConstraints.push(
                  where("readingType", "==", filters.readingType),
                );
              }
              if (filters.status !== "all") {
                patientConstraints.push(where("status", "==", filters.status));
              }
              if (filters.valueMin !== undefined) {
                patientConstraints.push(where("value", ">=", filters.valueMin));
              }
              if (filters.valueMax !== undefined) {
                patientConstraints.push(where("value", "<=", filters.valueMax));
              }
              if (filters.userId !== "all") {
                patientConstraints.push(
                  where("recordedById", "==", filters.userId),
                );
              }

              const patientReadings = await getReadings(patient.id, [
                ...patientConstraints,
                limit(1000),
              ]);
              console.log(
                "🔐 [ReadingsManagementPage] Successfully fetched",
                patientReadings.length,
                "readings for patient:",
                patient.id,
              );

              // Add patientId to each reading
              return patientReadings.map((reading) => ({
                ...reading,
                patientId: patient.id,
              }));
            } catch (patientError) {
              console.error(
                "🔐 [ReadingsManagementPage] Error fetching readings for patient:",
                {
                  patientId: patient.id,
                  patientName: `${patient.firstName || ""} ${patient.lastName || ""}`,
                  error: patientError,
                  errorMessage:
                    patientError instanceof Error
                      ? patientError.message
                      : String(patientError),
                  errorStack:
                    patientError instanceof Error
                      ? patientError.stack
                      : undefined,
                  currentUser: {
                    id: currentUserId,
                    role: currentUser.role,
                    email: currentUser.email,
                  },
                },
              );
              // Return empty array for this patient to continue with others
              return [];
            }
          });

          const readingsArrays = await Promise.all(readingsPromises);
          allReadings = readingsArrays.flat();
          console.log(
            "🔐 [ReadingsManagementPage] Total readings from assigned patients:",
            allReadings.length,
          );

          // Sort by date descending
          allReadings.sort((a, b) => {
            const dateA =
              a.date && typeof a.date.toDate === "function"
                ? a.date.toDate()
                : a.date instanceof Date
                  ? a.date
                  : new Date(0);
            const dateB =
              b.date && typeof b.date.toDate === "function"
                ? b.date.toDate()
                : b.date instanceof Date
                  ? b.date
                  : new Date(0);
            return dateB.getTime() - dateA.getTime();
          });

          // Apply patient filter in memory if needed (for non-admin, this is redundant but keep for consistency)
          if (filters.patientId !== "all") {
            allReadings = allReadings.filter(
              (r) => r.patientId === filters.patientId,
            );
            console.log(
              "🔐 [ReadingsManagementPage] After patient filter:",
              allReadings.length,
              "readings",
            );
          }
        } else {
          // No current user
          console.warn(
            "🔐 [ReadingsManagementPage] No current user - returning empty readings",
          );
          allReadings = [];
        }

        logInfo("loadReadings", "Readings loaded successfully", {
          count: allReadings.length,
          queryType:
            currentUser?.role === "admin"
              ? "queryAllReadings"
              : "getReadings from assigned patients",
        });
        setReadings(allReadings);
        setHasPermissionsError(false); // Reset permissions error on success
      } catch (error) {
        // Log detailed error information for debugging Firestore rules
        const errorObj =
          error instanceof Error ? error : new Error("Failed to load readings");
        const isPermissionError =
          errorObj.message.includes("permission") ||
          errorObj.message.includes("Missing or insufficient") ||
          errorObj.message.includes("insufficient");

        console.error("🔐 [ReadingsManagementPage] Error loading readings:", {
          error: errorObj.message,
          errorStack: errorObj.stack,
          fullError: error,
          errorName: errorObj.name,
          errorCode: "code" in errorObj ? (errorObj as any).code : undefined,
          currentUser: currentUser
            ? {
                id: currentUserId,
                role: currentUser.role,
                email: currentUser.email,
              }
            : null,
          queryType:
            currentUser?.role === "admin"
              ? "queryAllReadings with constraints"
              : "getReadings from assigned patients",
          filters,
          timestamp: new Date().toISOString(),
        });

        // Handle permissions errors gracefully
        if (isPermissionError) {
          console.warn(
            "🔐 [ReadingsManagementPage] Permissions error detected:",
            errorObj.message,
          );
          setReadings([]);
          setReadingsError(null);
          setHasPermissionsError(true);
          logWarning("loadReadings", "Permissions error - showing empty list", {
            filters,
            currentUser: currentUser
              ? {
                  id: currentUserId,
                  role: currentUser.role,
                }
              : null,
            errorMessage: errorObj.message,
            errorCode: "code" in errorObj ? (errorObj as any).code : undefined,
          });
        } else {
          logError("loadReadings", error, {
            filters,
            currentUser: currentUser
              ? {
                  id: currentUserId,
                  role: currentUser.role,
                }
              : null,
          });
          setReadingsError(errorObj);
          setHasPermissionsError(false);
        }
      } finally {
        setReadingsLoading(false);
      }
    };

    loadReadings();
  }, [
    filters.userId,
    filters.readingType,
    filters.status,
    filters.valueMin,
    filters.valueMax,
    filters.patientId,
    currentUser,
    authLoading,
    currentUserId,
  ]);

  // Filter and transform readings to match table format
  const filteredReadings = useMemo(() => {
    return readings
      .filter((reading) => {
        if (
          filters.patientId !== "all" &&
          reading.patientId !== filters.patientId
        )
          return false;
        return true;
      })
      .map((reading) => {
        const patient = reading.patientId
          ? patientsMap.get(reading.patientId)
          : undefined;
        const user = reading.recordedById
          ? usersMap.get(reading.recordedById)
          : undefined;
        const dateTime = reading.date?.toDate() || new Date();

        return {
          id: reading.id,
          patient: {
            id: reading.patientId || "",
            name: patient
              ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
              : "Patient inconnu",
            file_number: patient?.fileNumber || "",
          },
          value: reading.value,
          unit: reading.unit,
          reading_type: reading.readingType,
          date: dateTime.toISOString().split("T")[0],
          time: dateTime.toTimeString().slice(0, 5),
          recorded_by: {
            id: reading.recordedById || "",
            name: user
              ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
              : reading.recordedByName || "Utilisateur inconnu",
            role:
              user?.role === "doctor"
                ? "Médecin"
                : user?.role === "nurse"
                  ? "Infirmière"
                  : "Utilisateur",
          },
          status: reading.status,
          notes: reading.notes,
        };
      });
  }, [readings, filters.patientId, patientsMap, usersMap]);

  const handleAddReading = () => {
    setEditingReading(undefined);
    setIsFormOpen(true);
  };

  const handleEditReading = (reading: any) => {
    // Find the original reading from Firestore
    const originalReading = readings.find((r) => r.id === reading.id);
    if (originalReading) {
      setEditingReading(originalReading);
      setIsFormOpen(true);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      // Form uses snake_case (patient_id, reading_type), but Firestore helpers expect camelCase
      const patientId = data.patient_id || editingReading?.patientId;
      const readingType = data.reading_type;

      if (editingReading && editingReading.patientId) {
        // Update existing reading
        logInfo("updateReading", "Updating reading", {
          readingId: editingReading.id,
          patientId: editingReading.patientId,
        });
        await updateReading(editingReading.patientId, editingReading.id, {
          value: data.value,
          unit: data.unit,
          readingType: readingType,
          date: Timestamp.fromDate(new Date(`${data.date}T${data.time}`)),
          time: data.time,
          notes: data.notes,
        });
        logInfo("updateReading", "Reading updated successfully", {
          readingId: editingReading.id,
        });
        addNotification({
          type: "success",
          title: "Mesure modifiée",
          message: "La mesure a été modifiée avec succès.",
        });
      } else if (patientId) {
        // Create new reading
        logInfo("createReading", "Creating reading", { patientId: patientId });
        await createReading(
          patientId,
          {
            value: data.value,
            unit: data.unit,
            readingType: readingType,
            date: Timestamp.fromDate(new Date(`${data.date}T${data.time}`)),
            time: data.time,
            notes: data.notes,
          },
          currentUserId || "",
          currentUser
            ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() ||
                undefined
            : undefined,
        );
        logInfo("createReading", "Reading created successfully", {
          patientId: patientId,
        });
        addNotification({
          type: "success",
          title: "Mesure créée",
          message: "La mesure a été créée avec succès.",
        });
      }
      setIsFormOpen(false);
      setEditingReading(undefined);
    } catch (error) {
      logError("formSubmit", error, {
        isEdit: !!editingReading,
        readingId: editingReading?.id,
        patientId: editingReading?.patientId || data.patient_id,
      });
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible de ${editingReading ? "modifier" : "créer"} la mesure: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }
  };

  const handleDeleteReading = async (reading: any) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette mesure ?")) {
      return;
    }

    try {
      const originalReading = readings.find((r) => r.id === reading.id);
      if (originalReading && originalReading.patientId) {
        logInfo("deleteReading", "Deleting reading", {
          readingId: originalReading.id,
          patientId: originalReading.patientId,
        });
        await deleteReading(originalReading.patientId, originalReading.id);
        logInfo("deleteReading", "Reading deleted successfully", {
          readingId: originalReading.id,
        });
        addNotification({
          type: "success",
          title: "Mesure supprimée",
          message: "La mesure a été supprimée avec succès.",
        });
      }
    } catch (error) {
      logError("deleteReading", error, { readingId: reading.id });
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible de supprimer la mesure: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }
  };

  const handleExport = (format: "excel" | "csv" = "excel") => {
    try {
      logInfo("exportReadings", "Exporting readings", {
        format,
        count: filteredReadings.length,
      });
      if (format === "excel") {
        exportReadingsToExcel(
          filteredReadings as unknown as Parameters<
            typeof exportReadingsToExcel
          >[0],
        );
      } else {
        exportReadingsToCSV(
          filteredReadings as unknown as Parameters<
            typeof exportReadingsToCSV
          >[0],
        );
      }
      logInfo("exportReadings", "Export completed successfully", { format });
      addNotification({
        type: "success",
        title: "Export réussi",
        message: `Les mesures ont été exportées en format ${format.toUpperCase()}.`,
      });
    } catch (error) {
      logError("exportReadings", error, { format });
      addNotification({
        type: "error",
        title: "Erreur d'export",
        message: `Impossible d'exporter les données: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer ${selectedIds.length} mesure(s) ?`,
      )
    ) {
      return;
    }

    try {
      logInfo("bulkDelete", "Bulk deleting readings", {
        count: selectedIds.length,
        readingIds: selectedIds,
      });
      await Promise.all(
        selectedIds.map((id) => {
          const reading = readings.find((r) => r.id === id);
          if (reading && reading.patientId) {
            return deleteReading(reading.patientId, reading.id);
          }
        }),
      );
      logInfo("bulkDelete", "Bulk delete completed successfully", {
        count: selectedIds.length,
      });
      addNotification({
        type: "success",
        title: "Mesures supprimées",
        message: `${selectedIds.length} mesure(s) ont été supprimées.`,
      });
      setSelectedIds([]);
    } catch (error) {
      logError("bulkDelete", error, { count: selectedIds.length });
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible de supprimer les mesures: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }
  };

  // Show loading state while auth is loading or readings are loading
  if (authLoading || readingsLoading) {
    logInfo("pageRender", "Page is loading", { authLoading, readingsLoading });
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (readingsError) {
    // Don't show error state for permissions errors - they're handled gracefully with empty list
    const isPermissionsError =
      readingsError.message.includes("permissions") ||
      readingsError.message.includes("insufficient");
    if (isPermissionsError) {
      logInfo("pageRender", "Permissions error - rendering with empty list", {
        errorMessage: readingsError.message,
      });
      // Continue to render the page with empty readings list
    } else {
      logError("pageRender", "Rendering error state", {
        errorMessage: readingsError.message,
      });
      return (
        <DashboardLayout>
          <ErrorMessage
            message={`Erreur lors du chargement des mesures: ${readingsError.message}`}
          />
        </DashboardLayout>
      );
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Gestion des mesures
            </h1>
            <p className="text-muted-foreground mt-1">
              Consultez et gérez toutes les mesures de glycémie enregistrées
              dans le système
            </p>
          </div>
          <Button onClick={handleAddReading}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une mesure
          </Button>
        </div>

        <ReadingFilters
          filters={filters}
          onFilterChange={setFilters}
          patients={patients?.map((p) => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            fileNumber: p.fileNumber,
          }))}
          users={users?.map((u) => ({
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role,
          }))}
        />

        {hasPermissionsError && (
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Permissions insuffisantes</AlertTitle>
            <AlertDescription>
              Vous n'avez pas les permissions nécessaires pour afficher toutes
              les mesures. La liste est vide. Veuillez contacter un
              administrateur si vous pensez que c'est une erreur.
            </AlertDescription>
          </Alert>
        )}

        {selectedIds.length > 0 && (
          <BulkActions
            selectedCount={selectedIds.length}
            onExport={handleExport}
            onDelete={handleBulkDelete}
            exportLabel="Exporter les mesures sélectionnées"
            deleteLabel="Supprimer les mesures sélectionnées"
          />
        )}

        <ReadingsTable
          readings={filteredReadings}
          onEdit={handleEditReading}
          onDelete={handleDeleteReading}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />

        <ReadingForm
          reading={
            editingReading
              ? {
                  id: editingReading.id,
                  patient_id: editingReading.patientId || "",
                  value: editingReading.value,
                  unit: editingReading.unit,
                  reading_type: editingReading.readingType,
                  date:
                    editingReading.date?.toDate().toISOString().split("T")[0] ||
                    new Date().toISOString().split("T")[0],
                  time:
                    editingReading.time ||
                    new Date().toTimeString().slice(0, 5),
                  notes: editingReading.notes,
                }
              : undefined
          }
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingReading(undefined);
          }}
          onSubmit={handleFormSubmit}
          patients={patients?.map((p) => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            fileNumber: p.fileNumber,
          }))}
        />
      </div>
    </DashboardLayout>
  );
}
