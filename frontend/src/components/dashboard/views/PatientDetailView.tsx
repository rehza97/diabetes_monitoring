import { useMemo, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Calendar,
  FileText,
  Activity,
  Pill,
  Stethoscope,
  UserCircle,
  ClipboardList,
  Upload,
  Download,
  Trash2,
  Eye,
} from "lucide-react";
import {
  formatDate,
  formatDateTime,
  calculateAge,
  calculateBMI,
} from "@/utils/formatters";
import { getInitials, formatFullName, getReadingStatus } from "@/utils/helpers";
import { EmptyState } from "@/components/shared/EmptyState";
import { Inbox } from "lucide-react";
import { usePatient } from "@/hooks/useFirestore";
import { useRecentItems } from "@/hooks/useRecentItems";
import {
  useRealtimeReadings,
  useRealtimeMedications,
  useRealtimeMedicalNotes,
  useRealtimePatientAlerts,
} from "@/hooks/useRealtime";
import { useRealtimeAuditLogs } from "@/hooks/useRealtime";
import {
  auditLogsCollection,
  getPatientDocuments,
  createPatientDocument,
} from "@/lib/firestore-helpers";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNotification } from "@/context/NotificationContext";
import { MedicalNoteForm } from "@/components/dashboard/forms/MedicalNoteForm";
import { MedicationForm } from "@/components/dashboard/forms/MedicationForm";
import {
  createMedicalNote,
  updateMedicalNote,
  deleteMedicalNote,
  createMedication,
  updateMedication,
  deleteMedication,
} from "@/lib/firestore-helpers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { query, where, orderBy, limit } from "firebase/firestore";
import { useUsers } from "@/hooks/useFirestore";
import { usersCollection } from "@/lib/firestore-helpers";
import type {
  FirestorePatient,
  FirestoreUser,
  FirestoreMedicalNote,
  FirestoreMedication,
  MedicalNoteType,
} from "@/types/firestore";

const diabetesTypeLabels = {
  type1: "Type 1",
  type2: "Type 2",
  gestational: "Gestationnel",
};

const noteTypeLabels: Record<string, string> = {
  diagnosis: "Diagnostic",
  prescription: "Ordonnance",
  observation: "Observation",
  followup: "Suivi",
};

// Debug logging utility
const debugLog = (location: string, data?: any) => {
  console.log(
    `[PatientDetailView] ${new Date().toISOString().split("T")[1]} ${location}`,
    data || "",
  );
};

export function PatientDetailView() {
  debugLog("=== COMPONENT RENDER ===", { timestamp: new Date().toISOString() });

  const { id } = useParams<{ id: string }>();
  debugLog("Route params", { id });

  // Component lifecycle
  useEffect(() => {
    debugLog("Component mounted", { id });
    return () => {
      debugLog("Component unmounting", { id });
    };
  }, [id]);

  const { addRecentItem } = useRecentItems();

  // Fetch patient data
  const {
    patient,
    loading: patientLoading,
    error: patientError,
  } = usePatient(id || null);

  useEffect(() => {
    debugLog("Patient data changed", {
      hasPatient: !!patient,
      patientId: patient?.id,
      loading: patientLoading,
      error: patientError?.message,
      patientData: patient
        ? {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            doctorId: patient.doctorId,
            nurseId: patient.nurseId,
            isActive: patient.isActive,
          }
        : null,
    });
  }, [patient, patientLoading, patientError]);

  // Add to recent items when patient is loaded
  useEffect(() => {
    if (patient && id) {
      addRecentItem({
        id: id,
        type: "patient",
        title:
          `${patient.firstName || ""} ${patient.lastName || ""}`.trim() ||
          "Patient",
        path: `/dashboard/patients/${id}`,
      });
    }
  }, [patient, id, addRecentItem]);

  // Convert undefined to null for hooks that expect string | null
  const patientId = id ?? null;

  // Memoize options to prevent infinite re-subscriptions
  const readingsOptions = useMemo(
    () => ({ enabled: !!patientId }),
    [patientId],
  );
  const medicationsOptions = useMemo(
    () => ({ enabled: !!patientId }),
    [patientId],
  );
  const notesOptions = useMemo(() => ({ enabled: !!patientId }), [patientId]);
  const alertsOptions = useMemo(
    () => ({ enabled: !!patientId, resolved: false }),
    [patientId],
  );

  // Fetch subcollections
  const { data: readings, loading: readingsLoading } = useRealtimeReadings(
    patientId,
    readingsOptions,
  );
  const { data: medications, loading: medicationsLoading } =
    useRealtimeMedications(patientId, medicationsOptions);
  const { data: medicalNotes, loading: notesLoading } = useRealtimeMedicalNotes(
    patientId,
    notesOptions,
  );
  const { data: alerts, loading: alertsLoading } = useRealtimePatientAlerts(
    patientId,
    alertsOptions,
  );

  useEffect(() => {
    debugLog("Subcollections data", {
      readingsCount: readings?.length || 0,
      readingsLoading,
      medicationsCount: medications?.length || 0,
      medicationsLoading,
      notesCount: medicalNotes?.length || 0,
      notesLoading,
      alertsCount: alerts?.length || 0,
      alertsLoading,
    });
  }, [
    readings,
    readingsLoading,
    medications,
    medicationsLoading,
    medicalNotes,
    notesLoading,
    alerts,
    alertsLoading,
  ]);

  // Fetch users for doctor/nurse names
  const usersQuery = useMemo(() => {
    debugLog("Creating usersQuery");
    return query(usersCollection, where("isActive", "==", true));
  }, []);
  const { data: users } = useUsers(usersQuery);

  useEffect(() => {
    debugLog("Users data", {
      usersCount: users?.length || 0,
      userIds: users?.map((u) => u.id).slice(0, 5),
    });
  }, [users]);

  const usersMap = useMemo(() => {
    debugLog("Building usersMap", { usersCount: users?.length || 0 });
    const map = new Map<string, FirestoreUser>();
    users?.forEach((user) => {
      if (user.id) map.set(user.id, user);
    });
    debugLog("usersMap built", { mapSize: map.size });
    return map;
  }, [users]);

  // Medical Note Form State
  const [medicalNoteFormOpen, setMedicalNoteFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<FirestoreMedicalNote | null>(
    null,
  );

  // Medication Form State
  const [medicationFormOpen, setMedicationFormOpen] = useState(false);
  const [editingMedication, setEditingMedication] =
    useState<FirestoreMedication | null>(null);

  const { addNotification } = useNotification();
  const { user: currentUser } = useAuth();

  const handleMedicalNoteSubmit = async (data: {
    noteType: string;
    content: string;
    isImportant?: boolean;
    tags?: string[];
  }) => {
    if (!patient?.id || !currentUser?.id) return;

    try {
      if (editingNote) {
        await updateMedicalNote(patient.id, editingNote.id, {
          ...data,
          noteType: data.noteType as MedicalNoteType,
        });
        addNotification({
          type: "success",
          title: "Note modifiée",
          message: "La note médicale a été modifiée avec succès.",
        });
      } else {
        const doctorName =
          currentUser.first_name && currentUser.last_name
            ? `${currentUser.first_name} ${currentUser.last_name}`.trim()
            : undefined;
        await createMedicalNote(
          patient.id,
          { ...data, noteType: data.noteType as MedicalNoteType },
          currentUser.id,
          doctorName,
        );
        addNotification({
          type: "success",
          title: "Note créée",
          message: "La note médicale a été créée avec succès.",
        });
      }
      setMedicalNoteFormOpen(false);
      setEditingNote(null);
    } catch (error: any) {
      console.error("Error saving medical note:", error);
      addNotification({
        type: "error",
        title: "Erreur",
        message:
          error?.message ||
          "Une erreur est survenue lors de l'enregistrement de la note.",
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!patient?.id) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette note ?")) return;

    try {
      await deleteMedicalNote(patient.id, noteId);
      addNotification({
        type: "success",
        title: "Note supprimée",
        message: "La note médicale a été supprimée avec succès.",
      });
    } catch (error: any) {
      console.error("Error deleting medical note:", error);
      addNotification({
        type: "error",
        title: "Erreur",
        message:
          error?.message ||
          "Une erreur est survenue lors de la suppression de la note.",
      });
    }
  };

  const handleMedicationSubmit = async (data: {
    medicationName: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    notes?: string;
  }) => {
    if (!patient?.id || !currentUser?.id) return;

    try {
      const { Timestamp } = await import("firebase/firestore");
      const startDateTimestamp = Timestamp.fromDate(new Date(data.startDate));
      const endDateTimestamp = data.endDate
        ? Timestamp.fromDate(new Date(data.endDate))
        : undefined;

      if (editingMedication) {
        await updateMedication(patient.id, editingMedication.id, {
          medicationName: data.medicationName,
          dosage: data.dosage,
          frequency: data.frequency,
          startDate: startDateTimestamp,
          endDate: endDateTimestamp,
          notes: data.notes || undefined,
        });
        addNotification({
          type: "success",
          title: "Médicament modifié",
          message: "Le médicament a été modifié avec succès.",
        });
      } else {
        const doctorName =
          currentUser.first_name && currentUser.last_name
            ? `${currentUser.first_name} ${currentUser.last_name}`.trim()
            : undefined;
        await createMedication(
          patient.id,
          {
            medicationName: data.medicationName,
            dosage: data.dosage,
            frequency: data.frequency,
            startDate: startDateTimestamp,
            endDate: endDateTimestamp,
            notes: data.notes || undefined,
          },
          currentUser.id,
          doctorName,
        );
        addNotification({
          type: "success",
          title: "Médicament prescrit",
          message: "Le médicament a été prescrit avec succès.",
        });
      }
      setMedicationFormOpen(false);
      setEditingMedication(null);
    } catch (error: any) {
      console.error("Error saving medication:", error);
      addNotification({
        type: "error",
        title: "Erreur",
        message:
          error?.message ||
          "Une erreur est survenue lors de l'enregistrement du médicament.",
      });
    }
  };

  const handleDeleteMedication = async (medicationId: string) => {
    if (!patient?.id) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce médicament ?")) return;

    try {
      await deleteMedication(patient.id, medicationId);
      addNotification({
        type: "success",
        title: "Médicament supprimé",
        message: "Le médicament a été supprimé avec succès.",
      });
    } catch (error: any) {
      console.error("Error deleting medication:", error);
      addNotification({
        type: "error",
        title: "Erreur",
        message:
          error?.message ||
          "Une erreur est survenue lors de la suppression du médicament.",
      });
    }
  };

  // Fetch audit logs for this patient
  const auditLogsQuery = useMemo(() => {
    debugLog("Creating auditLogsQuery", { id });
    if (!id) {
      debugLog("auditLogsQuery: no id, returning null");
      return null;
    }
    const q = query(
      auditLogsCollection,
      where("entityType", "==", "patient"),
      where("entityId", "==", id),
      orderBy("createdAt", "desc"),
      limit(100),
    );
    debugLog("auditLogsQuery created", { hasQuery: !!q });
    return q;
  }, [id]);
  const { data: auditLogs, loading: auditLogsLoading } =
    useRealtimeAuditLogs(auditLogsQuery);

  useEffect(() => {
    debugLog("Audit logs data", {
      auditLogsCount: auditLogs?.length || 0,
      auditLogsLoading,
      queryId: id,
    });
  }, [auditLogs, auditLogsLoading, id]);

  // Fetch documents
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  useEffect(() => {
    const loadDocuments = async () => {
      debugLog("loadDocuments called", { id });
      if (!id) {
        debugLog("loadDocuments: no id, skipping");
        setDocumentsLoading(false);
        return;
      }
      setDocumentsLoading(true);
      try {
        debugLog("loadDocuments: fetching documents", { patientId: id });
        const docs = await getPatientDocuments(id);
        debugLog("loadDocuments: documents fetched", {
          count: docs?.length || 0,
        });
        setDocuments(docs);
      } catch (error) {
        debugLog("loadDocuments: ERROR", {
          error: error instanceof Error ? error.message : String(error),
        });
        console.error("Error loading documents:", error);
      } finally {
        setDocumentsLoading(false);
        debugLog("loadDocuments: finished", { loading: false });
      }
    };
    loadDocuments();
  }, [id]);

  // Memoize loading calculation to prevent unnecessary re-renders
  const loading = useMemo(() => {
    return (
      patientLoading ||
      readingsLoading ||
      medicationsLoading ||
      notesLoading ||
      alertsLoading ||
      auditLogsLoading ||
      documentsLoading
    );
  }, [
    patientLoading,
    readingsLoading,
    medicationsLoading,
    notesLoading,
    alertsLoading,
    auditLogsLoading,
    documentsLoading,
  ]);

  const error = patientError;

  useEffect(() => {
    debugLog("Loading state", {
      patientLoading,
      readingsLoading,
      medicationsLoading,
      notesLoading,
      alertsLoading,
      auditLogsLoading,
      documentsLoading,
      totalLoading: loading,
    });
  }, [
    patientLoading,
    readingsLoading,
    medicationsLoading,
    notesLoading,
    alertsLoading,
    auditLogsLoading,
    documentsLoading,
    loading,
  ]);

  useEffect(() => {
    if (error) {
      debugLog("ERROR detected", {
        errorMessage: error.message,
        errorName: error.name,
        errorStack: error.stack,
      });
    }
  }, [error]);

  if (loading) {
    debugLog("Rendering loading state");
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !patient) {
    debugLog("Rendering error/not found state", {
      hasError: !!error,
      errorMessage: error?.message,
      hasPatient: !!patient,
    });
    return (
      <DashboardLayout>
        <EmptyState
          icon={Inbox}
          title="Patient non trouvé"
          description={
            error
              ? `Erreur: ${error.message}`
              : "Le patient demandé n'existe pas ou a été supprimé."
          }
        />
      </DashboardLayout>
    );
  }

  debugLog("Calculating derived values", {
    hasDateOfBirth: !!patient.dateOfBirth,
    hasWeight: !!patient.weight,
    hasHeight: !!patient.height,
    doctorId: patient.doctorId,
    nurseId: patient.nurseId,
  });

  const age = patient.dateOfBirth
    ? calculateAge(patient.dateOfBirth.toDate().toISOString().split("T")[0])
    : 0;
  const bmi =
    patient.weight && patient.height
      ? calculateBMI(patient.weight, patient.height)
      : 0;

  const doctorName = patient.doctorId
    ? usersMap.get(patient.doctorId)
    : undefined;
  const nurseName = patient.nurseId ? usersMap.get(patient.nurseId) : undefined;

  debugLog("Derived values calculated", {
    age,
    bmi,
    doctorName: doctorName
      ? `${doctorName.firstName} ${doctorName.lastName}`
      : "Not found",
    nurseName: nurseName
      ? `${nurseName.firstName} ${nurseName.lastName}`
      : "Not found",
    usersMapSize: usersMap.size,
  });

  debugLog("Rendering main content", {
    readingsCount: readings?.length || 0,
    medicationsCount: medications?.length || 0,
    notesCount: medicalNotes?.length || 0,
    alertsCount: alerts?.length || 0,
    auditLogsCount: auditLogs?.length || 0,
    documentsCount: documents?.length || 0,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard/patients">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {formatFullName(
                  patient.firstName || "",
                  patient.lastName || "",
                )}
              </h1>
              <p className="text-muted-foreground mt-1">
                Dossier: {patient.fileNumber || ""} • {age} ans
              </p>
            </div>
          </div>
          <Button asChild>
            <Link to={`/dashboard/patients?edit=${patient.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
        </div>

        {/* Informations principales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={patient.avatar} />
                <AvatarFallback className="text-2xl">
                  {getInitials(patient.firstName || "", patient.lastName || "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nom complet</p>
                  <p className="font-medium">
                    {formatFullName(
                      patient.firstName || "",
                      patient.lastName || "",
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Date de naissance
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {patient.dateOfBirth
                        ? formatDate(
                            patient.dateOfBirth
                              .toDate()
                              .toISOString()
                              .split("T")[0],
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {patient.phone || "Non renseigné"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {patient.email || "Non renseigné"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Type de diabète
                  </p>
                  <Badge variant="outline">
                    {diabetesTypeLabels[patient.diabetesType]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Année de diagnostic
                  </p>
                  <p className="font-medium">
                    {patient.diagnosisDate
                      ? String(patient.diagnosisDate.toDate().getFullYear())
                      : "N/A"}
                  </p>
                </div>
                {patient.bloodType && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Groupe sanguin
                    </p>
                    <p className="font-medium">{patient.bloodType}</p>
                  </div>
                )}
                {bmi > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">IMC</p>
                    <p className="font-medium">{bmi.toFixed(1)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">
                    Médecin responsable
                  </p>
                  <p className="font-medium">
                    {doctorName
                      ? `${doctorName.firstName || ""} ${doctorName.lastName || ""}`.trim()
                      : "Non assigné"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Infirmière responsable
                  </p>
                  <p className="font-medium">
                    {nurseName
                      ? `${nurseName.firstName || ""} ${nurseName.lastName || ""}`.trim()
                      : "Non assignée"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs pour différentes sections */}
        <Tabs defaultValue="readings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="readings">Mesures</TabsTrigger>
            <TabsTrigger value="charts">Graphiques</TabsTrigger>
            <TabsTrigger value="statistics">Statistiques</TabsTrigger>
            <TabsTrigger value="medications">Médicaments</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="nurse">Infirmière</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="readings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dernières mesures</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={[
                    { header: "Valeur", accessor: "value" },
                    { header: "Type", accessor: "type" },
                    { header: "Date/Heure", accessor: "date" },
                    { header: "Enregistré par", accessor: "recorded_by" },
                    { header: "État", accessor: "status" },
                    { header: "Notes", accessor: "notes" },
                  ]}
                  data={(readings || []).slice(0, 20).map((reading) => {
                    const status =
                      reading.status || getReadingStatus(reading.value);
                    return {
                      value: `${reading.value} ${reading.unit}`,
                      type: reading.readingType,
                      date: formatDateTime(
                        reading.date?.toDate().toISOString() || "",
                      ),
                      recorded_by:
                        reading.recordedByName || "Utilisateur inconnu",
                      status: (
                        <Badge
                          className={
                            status === "critical"
                              ? "bg-destructive/10 text-destructive"
                              : status === "warning"
                                ? "bg-warning/10 text-warning"
                                : "bg-success/10 text-success"
                          }
                        >
                          {status === "critical"
                            ? "Critique"
                            : status === "warning"
                              ? "Avertissement"
                              : "Normal"}
                        </Badge>
                      ),
                      notes: reading.notes || "-",
                    };
                  })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <ChartCard title="Tendance des mesures (semaine)" type="line" />
              <ChartCard title="Tendance des mesures (mois)" type="line" />
              <ChartCard title="Distribution par type" type="pie" />
              <ChartCard title="Distribution par état" type="doughnut" />
            </div>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            {(() => {
              const readingsList = readings || [];
              const values = readingsList.map((r) => r.value);
              const avg =
                values.length > 0
                  ? Math.round(
                      values.reduce((a, b) => a + b, 0) / values.length,
                    )
                  : 0;
              const min = values.length > 0 ? Math.min(...values) : 0;
              const max = values.length > 0 ? Math.max(...values) : 0;
              const normalCount = readingsList.filter(
                (r) => r.status === "normal",
              ).length;
              const warningCount = readingsList.filter(
                (r) => r.status === "warning",
              ).length;
              const criticalCount = readingsList.filter(
                (r) => r.status === "critical",
              ).length;
              const normalPercentage =
                readingsList.length > 0
                  ? Math.round((normalCount / readingsList.length) * 100)
                  : 0;

              // Calculate monthly measurement count (current month)
              const now = new Date();
              const currentMonthStart = new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
              );
              const monthlyCount = readingsList.filter((r) => {
                if (!r.date) return false;
                const readingDate =
                  r.date &&
                  typeof (r.date as { toDate?: () => Date }).toDate ===
                    "function"
                    ? (r.date as { toDate: () => Date }).toDate()
                    : new Date(r.date as unknown as string | number | Date);
                return readingDate >= currentMonthStart;
              }).length;

              // Calculate total readings count
              const totalReadingsCount = readingsList.length;

              // HbA1c calculation (estimated from average glucose: HbA1c = (avgGlucose + 46.7) / 28.7)
              // This is an approximation - real HbA1c should come from lab results
              const estimatedHbA1c =
                avg > 0 ? ((avg + 46.7) / 28.7).toFixed(1) : null;

              return (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Moyenne
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{avg} mg/dL</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Sur {totalReadingsCount} mesure
                          {totalReadingsCount > 1 ? "s" : ""}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Minimum
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{min} mg/dL</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Plus basse valeur
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Maximum
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{max} mg/dL</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Plus haute valeur
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          % Mesures normales
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {normalPercentage}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {normalCount} normale{normalCount > 1 ? "s" : ""} /{" "}
                          {totalReadingsCount} total
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Mesures ce mois
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{monthlyCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {now.toLocaleDateString("fr-FR", {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total mesures
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {totalReadingsCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Depuis le début
                        </p>
                      </CardContent>
                    </Card>
                    {estimatedHbA1c && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            HbA1c estimé
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {estimatedHbA1c}%
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Estimation basée sur la moyenne
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Répartition
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-success">Normales:</span>
                            <span className="font-semibold">{normalCount}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-warning">Avertissement:</span>
                            <span className="font-semibold">
                              {warningCount}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-destructive">Critiques:</span>
                            <span className="font-semibold">
                              {criticalCount}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Évolution mensuelle</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartCard title="Mesures mensuelles" type="bar" />
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="medications" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Médicaments prescrits</CardTitle>
                  <Button
                    onClick={() => {
                      setEditingMedication(null);
                      setMedicationFormOpen(true);
                    }}
                    size="sm"
                  >
                    <Pill className="mr-2 h-4 w-4" />
                    Prescrire un médicament
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {medications && medications.length > 0 ? (
                  <div className="space-y-4">
                    {medications.map((med) => {
                      const doctor = med.prescribedById
                        ? usersMap.get(med.prescribedById)
                        : undefined;
                      const doctorName = doctor
                        ? `${doctor.firstName || ""} ${doctor.lastName || ""}`.trim()
                        : med.prescribedByName || "Médecin inconnu";
                      return (
                        <div
                          key={med.id}
                          className="border rounded-lg p-4 space-y-2 relative group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">
                                  {med.medicationName}
                                </h4>
                                {med.isActive && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Actif
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {med.dosage} · {med.frequency}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Du{" "}
                                {formatDate(
                                  med.startDate
                                    .toDate()
                                    .toISOString()
                                    .split("T")[0],
                                )}
                                {med.endDate
                                  ? ` au ${formatDate(med.endDate.toDate().toISOString().split("T")[0])}`
                                  : " (en cours)"}
                              </p>
                              {med.notes && (
                                <p className="text-sm mt-2">{med.notes}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                Prescrit par {doctorName}
                              </p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingMedication(med);
                                  setMedicationFormOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteMedication(med.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={Pill}
                    title="Aucun médicament prescrit"
                    description="Aucun médicament n'a été prescrit pour ce patient."
                  />
                )}
              </CardContent>
            </Card>
            <MedicationForm
              medication={
                editingMedication
                  ? {
                      id: editingMedication.id,
                      medicationName: editingMedication.medicationName,
                      dosage: editingMedication.dosage,
                      frequency: editingMedication.frequency,
                      startDate: editingMedication.startDate,
                      endDate: editingMedication.endDate,
                      notes: editingMedication.notes,
                    }
                  : undefined
              }
              isOpen={medicationFormOpen}
              onClose={() => {
                setMedicationFormOpen(false);
                setEditingMedication(null);
              }}
              onSubmit={handleMedicationSubmit}
            />
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Notes médicales</CardTitle>
                  <Button
                    onClick={() => {
                      setEditingNote(null);
                      setMedicalNoteFormOpen(true);
                    }}
                    size="sm"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Ajouter une note
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medicalNotes && medicalNotes.length > 0 ? (
                    medicalNotes.map((note) => {
                      const doctor = note.doctorId
                        ? usersMap.get(note.doctorId)
                        : undefined;
                      const doctorName = doctor
                        ? `${doctor.firstName || ""} ${doctor.lastName || ""}`.trim()
                        : note.doctorName || "Médecin inconnu";
                      return (
                        <div
                          key={note.id}
                          className="border-l-4 border-primary pl-4 py-2 relative group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {noteTypeLabels[note.noteType]}
                              </Badge>
                              {note.isImportant && (
                                <Badge variant="secondary" className="text-xs">
                                  Important
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {formatDateTime(
                                  note.createdAt?.toDate().toISOString() || "",
                                )}
                              </span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setEditingNote(note);
                                    setMedicalNoteFormOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleDeleteNote(note.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <p className="font-medium mb-1">{note.content}</p>
                          <p className="text-sm text-muted-foreground">
                            Par {doctorName}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <EmptyState
                      icon={FileText}
                      title="Aucune note médicale"
                      description="Aucune note médicale n'a été enregistrée pour ce patient."
                    />
                  )}
                </div>
              </CardContent>
            </Card>
            <MedicalNoteForm
              note={
                editingNote
                  ? {
                      id: editingNote.id,
                      noteType: editingNote.noteType,
                      content: editingNote.content,
                      isImportant: editingNote.isImportant,
                      tags: editingNote.tags,
                    }
                  : undefined
              }
              isOpen={medicalNoteFormOpen}
              onClose={() => {
                setMedicalNoteFormOpen(false);
                setEditingNote(null);
              }}
              onSubmit={handleMedicalNoteSubmit}
            />
          </TabsContent>

          <TabsContent value="nurse" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Infirmière responsable</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <UserCircle className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-lg">
                      {nurseName
                        ? `${nurseName.firstName || ""} ${nurseName.lastName || ""}`.trim()
                        : "Non assignée"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {nurseName
                        ? "Infirmière responsable du suivi de ce patient"
                        : "Aucune infirmière n'est actuellement assignée à ce patient"}
                    </p>
                  </div>
                  {nurseName && (
                    <Button variant="outline" className="ml-auto">
                      Changer l'infirmière
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <PatientDocumentsSection
              patientId={id || ""}
              documents={documents}
              documentsLoading={documentsLoading}
              onDocumentsChange={() => {
                // Reload documents
                if (id) {
                  getPatientDocuments(id)
                    .then(setDocuments)
                    .catch(console.error);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  Historique des modifications (Audit Trail)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={[
                    { header: "Date/Heure", accessor: "date" },
                    { header: "Utilisateur", accessor: "user" },
                    { header: "Action", accessor: "action" },
                    { header: "Détails", accessor: "details" },
                  ]}
                  data={(auditLogs || []).map((log) => {
                    const user = log.userId
                      ? usersMap.get(log.userId)
                      : undefined;
                    const userName = user
                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                      : log.userName || "Utilisateur inconnu";
                    return {
                      date: formatDateTime(
                        log.createdAt?.toDate().toISOString() || "",
                      ),
                      user: userName,
                      action:
                        log.action === "create"
                          ? "Création"
                          : log.action === "update"
                            ? "Modification"
                            : log.action === "delete"
                              ? "Suppression"
                              : log.action,
                      details:
                        log.entityName || `${log.action} ${log.entityType}`,
                    };
                  })}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function PatientDocumentsSection({
  patientId,
  documents,
  documentsLoading,
  onDocumentsChange,
}: {
  patientId: string;
  documents: any[];
  documentsLoading: boolean;
  onDocumentsChange: () => void;
}) {
  const { user: currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<
    "lab_result" | "prescription" | "report" | "other"
  >("other");
  const [description, setDescription] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !currentUser?.id) {
      addNotification({
        type: "error",
        title: "Erreur",
        message: "Veuillez sélectionner un fichier",
      });
      return;
    }

    setUploading(true);
    try {
      // TODO: Upload file to Firebase Storage first, then create document record
      // For now, we'll create a placeholder URL
      const fileUrl = URL.createObjectURL(file);

      await createPatientDocument(
        patientId,
        {
          fileName: file.name,
          fileUrl: fileUrl, // In production, this should be the Firebase Storage URL
          fileType: file.type,
          fileSize: file.size,
          category,
          description: description || undefined,
        },
        currentUser.id,
      );

      addNotification({
        type: "success",
        title: "Document uploadé",
        message: "Le document a été uploadé avec succès",
      });

      setUploadDialogOpen(false);
      setFile(null);
      setCategory("other");
      setDescription("");
      onDocumentsChange();
    } catch (error) {
      console.error("Error uploading document:", error);
      addNotification({
        type: "error",
        title: "Erreur",
        message: "Erreur lors de l'upload du document",
      });
    } finally {
      setUploading(false);
    }
  };

  const categoryLabels = {
    lab_result: "Résultat de laboratoire",
    prescription: "Ordonnance",
    report: "Rapport",
    other: "Autre",
  };

  if (documentsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Gérez les documents du patient (résultats de laboratoire,
              ordonnances, rapports)
            </CardDescription>
          </div>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Uploader un document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Uploader un document</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau document pour ce patient
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Fichier</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {file && (
                    <p className="text-sm text-muted-foreground">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select
                    value={category}
                    onValueChange={(value: any) => setCategory(value)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lab_result">
                        Résultat de laboratoire
                      </SelectItem>
                      <SelectItem value="prescription">Ordonnance</SelectItem>
                      <SelectItem value="report">Rapport</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optionnel)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description du document..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setUploadDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleUpload} disabled={!file || uploading}>
                    {uploading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Upload en cours...
                      </>
                    ) : (
                      "Uploader"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucun document"
            description="Aucun document n'a été uploadé pour ce patient"
          />
        ) : (
          <DataTable
            columns={[
              { header: "Nom du fichier", accessor: "file_name" },
              { header: "Catégorie", accessor: "category" },
              { header: "Taille", accessor: "size" },
              { header: "Date", accessor: "date" },
              { header: "Actions", accessor: "actions" },
            ]}
            data={documents.map((doc) => ({
              file_name: doc.fileName || "Document",
              category:
                (categoryLabels as Record<string, string>)[
                  doc.category || "other"
                ] || "Autre",
              size: doc.fileSize
                ? `${(doc.fileSize / 1024).toFixed(2)} KB`
                : "N/A",
              date: doc.createdAt
                ? formatDate(doc.createdAt.toDate().toISOString())
                : "N/A",
              actions: (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(doc.fileUrl, "_blank")}
                    title="Voir"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = doc.fileUrl;
                      link.download = doc.fileName || "document";
                      link.click();
                    }}
                    title="Télécharger"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ),
            }))}
          />
        )}
      </CardContent>
    </Card>
  );
}
