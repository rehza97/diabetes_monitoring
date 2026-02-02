import { useState, useMemo, useEffect } from "react";
import { query, where, orderBy, Timestamp } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Plus, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";
import { usePatients } from "@/hooks/useFirestore";
import { useRealtimeScheduledReadings } from "@/hooks/useRealtime";
import {
  patientsCollection,
  getScheduledReadingsCollection,
  createScheduledReading,
  updateScheduledReading,
  deleteScheduledReading,
} from "@/lib/firestore-helpers";
import { ScheduledReadingForm } from "@/components/dashboard/forms/ScheduledReadingForm";
import { formatDate, formatDateTime } from "@/utils/formatters";
import { formatFullName } from "@/utils/helpers";
import type {
  FirestorePatient,
  FirestoreScheduledReading,
} from "@/types/firestore";

const readingTypeLabels: Record<string, string> = {
  fasting: "À jeun",
  post_breakfast: "Après petit-déjeuner",
  pre_lunch: "Avant déjeuner",
  post_lunch: "Après déjeuner",
  pre_dinner: "Avant dîner",
  post_dinner: "Après dîner",
  bedtime: "Au coucher",
  midnight: "Minuit",
  random: "Aléatoire",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  completed: "Complété",
  missed: "Manqué",
  cancelled: "Annulé",
};

export function ScheduledReadingsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScheduled, setEditingScheduled] = useState<{
    scheduled: FirestoreScheduledReading;
    patientId: string;
  } | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("all");
  const { addNotification } = useNotification();

  // Fetch patients
  const patientsQuery = useMemo(() => {
    return query(patientsCollection, where("isActive", "==", true));
  }, []);
  const { data: patients, loading: patientsLoading } =
    usePatients(patientsQuery);

  // Fetch scheduled readings - for single patient use hook, for all use manual fetch
  const singlePatientScheduled = useRealtimeScheduledReadings(
    selectedPatientId !== "all" ? selectedPatientId : null,
    { enabled: selectedPatientId !== "all" && !patientsLoading },
  );

  const [allScheduledReadings, setAllScheduledReadings] = useState<
    Array<FirestoreScheduledReading & { patientId: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (selectedPatientId !== "all") {
      // Use hook data for single patient
      if (singlePatientScheduled.data) {
        setAllScheduledReadings(
          singlePatientScheduled.data.map((s) => ({
            ...s,
            patientId: selectedPatientId,
          })),
        );
        setLoading(singlePatientScheduled.loading);
        setError(singlePatientScheduled.error);
      }
      return;
    }

    // For "all", fetch from all patients
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const all: Array<FirestoreScheduledReading & { patientId: string }> =
          [];

        if (!patients) {
          setLoading(false);
          return;
        }

        for (const patient of patients) {
          if (!patient.id) continue;
          try {
            const scheduledCollection = getScheduledReadingsCollection(
              patient.id,
            );
            const q = query(
              scheduledCollection,
              orderBy("scheduledDate", "asc"),
            );
            const { getDocs } = await import("firebase/firestore");
            const snapshot = await getDocs(q);
            snapshot.docs.forEach((doc) => {
              all.push({ ...doc.data(), id: doc.id, patientId: patient.id });
            });
          } catch (err) {
            console.error(
              `Error fetching scheduled readings for patient ${patient.id}:`,
              err,
            );
          }
        }

        setAllScheduledReadings(all);
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    if (patients && !patientsLoading) {
      fetchAll();
    }
  }, [
    patients,
    patientsLoading,
    selectedPatientId,
    singlePatientScheduled.data,
    singlePatientScheduled.loading,
    singlePatientScheduled.error,
  ]);

  const handleFormSubmit = async (data: {
    patientId: string;
    readingType: string;
    scheduledDate: string;
    scheduledTime: string;
    notes?: string;
  }) => {
    try {
      const { Timestamp } = await import("firebase/firestore");
      const scheduledDate = Timestamp.fromDate(new Date(data.scheduledDate));

      if (editingScheduled) {
        await updateScheduledReading(
          editingScheduled.patientId,
          editingScheduled.scheduled.id,
          {
            readingType: data.readingType as any,
            scheduledDate,
            scheduledTime: data.scheduledTime,
            notes: data.notes || undefined,
          },
        );
        addNotification({
          type: "success",
          title: "Planning modifié",
          message: "Le planning a été modifié avec succès.",
        });
      } else {
        await createScheduledReading(data.patientId, {
          readingType: data.readingType as any,
          scheduledDate,
          scheduledTime: data.scheduledTime,
          notes: data.notes || undefined,
        });
        addNotification({
          type: "success",
          title: "Planning créé",
          message: "Le planning a été créé avec succès.",
        });
      }
      setIsFormOpen(false);
      setEditingScheduled(null);
    } catch (error: any) {
      console.error("Error saving scheduled reading:", error);
      addNotification({
        type: "error",
        title: "Erreur",
        message:
          error?.message ||
          "Une erreur est survenue lors de l'enregistrement du planning.",
      });
    }
  };

  const handleDelete = async (patientId: string, scheduledId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce planning ?")) return;

    try {
      await deleteScheduledReading(patientId, scheduledId);
      addNotification({
        type: "success",
        title: "Planning supprimé",
        message: "Le planning a été supprimé avec succès.",
      });
    } catch (error: any) {
      console.error("Error deleting scheduled reading:", error);
      addNotification({
        type: "error",
        title: "Erreur",
        message:
          error?.message ||
          "Une erreur est survenue lors de la suppression du planning.",
      });
    }
  };

  const handleMarkAsCompleted = async (
    patientId: string,
    scheduledId: string,
  ) => {
    try {
      await updateScheduledReading(patientId, scheduledId, {
        status: "completed",
      });
      addNotification({
        type: "success",
        title: "Planning complété",
        message: "Le planning a été marqué comme complété.",
      });
    } catch (error: any) {
      console.error("Error updating scheduled reading:", error);
      addNotification({
        type: "error",
        title: "Erreur",
        message: error?.message || "Une erreur est survenue.",
      });
    }
  };

  const handleMarkAsMissed = async (patientId: string, scheduledId: string) => {
    try {
      await updateScheduledReading(patientId, scheduledId, {
        status: "missed",
      });
      addNotification({
        type: "success",
        title: "Planning manqué",
        message: "Le planning a été marqué comme manqué.",
      });
    } catch (error: any) {
      console.error("Error updating scheduled reading:", error);
      addNotification({
        type: "error",
        title: "Erreur",
        message: error?.message || "Une erreur est survenue.",
      });
    }
  };

  const patientsMap = useMemo(() => {
    const map = new Map<string, FirestorePatient>();
    patients?.forEach((patient) => {
      if (patient.id) map.set(patient.id, patient);
    });
    return map;
  }, [patients]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Planning des mesures</h1>
            <p className="text-muted-foreground mt-1">
              Gérez les mesures planifiées pour vos patients
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingScheduled(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouveau planning
          </Button>
        </div>

        {patientsLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error?.message ?? "Une erreur est survenue"} />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Filtres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">
                      Patient
                    </label>
                    <select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="all">Tous les patients</option>
                      {patients?.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {formatFullName(
                            patient.firstName || "",
                            patient.lastName || "",
                          )}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plannings</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <LoadingSpinner />
                ) : allScheduledReadings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun planning trouvé
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allScheduledReadings.map((item) => {
                      const patient = patientsMap.get(item.patientId);
                      return (
                        <div
                          key={`${item.patientId}-${item.id}`}
                          className="border rounded-lg p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">
                                  {patient
                                    ? formatFullName(
                                        patient.firstName || "",
                                        patient.lastName || "",
                                      )
                                    : `Patient ${item.patientId}`}
                                </h4>
                                <Badge variant="outline">
                                  {readingTypeLabels[item.readingType] ||
                                    item.readingType}
                                </Badge>
                                <Badge
                                  variant={
                                    item.status === "completed"
                                      ? "default"
                                      : item.status === "missed"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {statusLabels[item.status] || item.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(
                                  item.scheduledDate
                                    .toDate()
                                    .toISOString()
                                    .split("T")[0],
                                )}{" "}
                                à {item.scheduledTime}
                              </p>
                              {item.notes && (
                                <p className="text-sm mt-1">{item.notes}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {item.status === "pending" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      handleMarkAsCompleted(
                                        item.patientId,
                                        item.id,
                                      )
                                    }
                                    title="Marquer comme complété"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      handleMarkAsMissed(
                                        item.patientId,
                                        item.id,
                                      )
                                    }
                                    title="Marquer comme manqué"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setEditingScheduled({
                                    scheduled: item,
                                    patientId: item.patientId,
                                  });
                                  setIsFormOpen(true);
                                }}
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  handleDelete(item.patientId, item.id)
                                }
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <ScheduledReadingForm
          scheduledReading={
            editingScheduled
              ? {
                  id: editingScheduled.scheduled.id,
                  patientId: editingScheduled.patientId,
                  readingType: editingScheduled.scheduled.readingType,
                  scheduledDate: editingScheduled.scheduled.scheduledDate,
                  scheduledTime: editingScheduled.scheduled.scheduledTime,
                  notes: editingScheduled.scheduled.notes,
                }
              : undefined
          }
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingScheduled(null);
          }}
          onSubmit={handleFormSubmit}
          patients={patients?.map((p) => ({
            id: p.id || "",
            firstName: p.firstName || "",
            lastName: p.lastName || "",
            fileNumber: p.fileNumber,
          }))}
        />
      </div>
    </DashboardLayout>
  );
}
