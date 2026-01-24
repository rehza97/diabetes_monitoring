import { useState, useMemo, useEffect, useCallback } from "react";
import { query, where, orderBy, limit } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReportBuilder } from "@/components/dashboard/ReportBuilder";
import { TrendsDashboard } from "@/components/dashboard/analytics/TrendsDashboard";
import { ComparisonsDashboard } from "@/components/dashboard/analytics/ComparisonsDashboard";
import { ScheduleReportDialog, type ReportSchedule } from "@/components/dashboard/forms/ScheduleReportDialog";
import { ShareReportDialog, type ShareConfig } from "@/components/dashboard/ShareReportDialog";
import { DataTable } from "@/components/dashboard/DataTable";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { useReports, usePatients, useUsers } from "@/hooks/useFirestore";
import {
  reportsCollection,
  patientsCollection,
  usersCollection,
  createReport,
  deleteReport,
  queryPatients,
  getReadings,
  queryAllReadings,
} from "@/lib/firestore-helpers";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { formatFullName } from "@/utils/helpers";
import type { FirestoreReport, FirestoreReading } from "@/types/firestore";

// Logging utility
const logError = (context: string, error: unknown, details?: Record<string, unknown>) => {
  console.error(`[ReportsPage] Error in ${context}:`, error, details);
};

const logWarning = (context: string, message: string, details?: Record<string, unknown>) => {
  console.warn(`[ReportsPage] Warning in ${context}:`, message, details);
};

const logInfo = (context: string, message: string, details?: Record<string, unknown>) => {
  console.log(`[ReportsPage] Info in ${context}:`, message, details);
};
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  AlertTriangle,
  Share2,
  Clock,
  Edit,
  Trash2,
  Play,
  Search,
  TrendingUp,
  GitCompare,
  MoreHorizontal,
} from "lucide-react";
import { useNotification } from "@/context/NotificationContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ReportConfig {
  type: "patient" | "period" | "performance" | "comparison" | "critical";
  fields: string[];
  dateFrom?: Date;
  dateTo?: Date;
  patientIds?: string[];
  visualization: "table" | "chart" | "both";
  name?: string;
}

type ReportReading = FirestoreReading & { patientId?: string };

function mapReportTypeToFirestore(t: string): "patient_summary" | "period_summary" | "comparison" | "custom" {
  if (t === "patient") return "patient_summary";
  if (t === "period") return "period_summary";
  if (t === "comparison") return "comparison";
  return "custom";
}

export function ReportsPage() {
  const { user: currentUser } = useAuth();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"reports" | "trends" | "comparisons">("reports");
  const [tabReadings, setTabReadings] = useState<ReportReading[]>([]);
  const [tabReadingsLoading, setTabReadingsLoading] = useState(false);
  const { addNotification } = useNotification();

  const currentUserId = currentUser?.id ?? null;

  // Component lifecycle logging
  useEffect(() => {
    logInfo("componentMount", "ReportsPage mounted");
    return () => {
      logInfo("componentUnmount", "ReportsPage unmounting");
    };
  }, []);

  // Fetch patients and users for report data
  const patientsQuery = useMemo(
    () => query(patientsCollection, where("isActive", "==", true)),
    []
  );
  const usersQuery = useMemo(
    () => query(usersCollection, where("isActive", "==", true)),
    []
  );
  const { data: patients = [] } = usePatients(patientsQuery);
  const { data: users = [] } = useUsers(usersQuery);
  const doctors = useMemo(() => users.filter((u) => u.role === "doctor"), [users]);
  const nurses = useMemo(() => users.filter((u) => u.role === "nurse"), [users]);
  const patientsMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);
  const usersMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  // Fetch saved reports (use currentUser.id = Firebase uid)
  const reportsQuery = useMemo(() => {
    try {
      if (currentUserId) {
        const q = query(reportsCollection, where("createdById", "==", currentUserId), orderBy("createdAt", "desc"));
        logInfo("reportsQuery", "Query created successfully", { userId: currentUserId });
        return q;
      }
      logInfo("reportsQuery", "No user ID, query not created");
      return null;
    } catch (err) {
      logError("reportsQuery", err, { userId: currentUserId });
      throw err;
    }
  }, [currentUserId]);

  const { data: savedReports, loading, error } = useReports(reportsQuery);

  // Log data fetching status
  useEffect(() => {
    logInfo("dataFetching", "Data fetching status", {
      loading,
      count: savedReports?.length ?? 0,
      error: error?.message,
    });
  }, [loading, savedReports?.length, error]);

  // Log errors when they occur
  useEffect(() => {
    if (error) {
      const errorDetails: Record<string, unknown> = { 
        query: "reportsQuery",
        message: error.message,
        name: error.name,
      };
      if ('code' in error) {
        errorDetails.code = (error as any).code;
      }
      logError("reportsFetch", error, errorDetails);
    }
  }, [error]);

  const handlePrebuiltReport = (type: string) => {
    setSelectedReport(type);
    setSelectedPatientId(null);
    setReportDateFrom("");
    setReportDateTo("");
    setIsPreviewOpen(true);
  };

  const handleGenerateReport = (config: ReportConfig) => {
    logInfo("generateReport", "Generating report", { configType: config.type });
    addNotification({
      type: "info",
      title: "Génération du rapport",
      message: "Le rapport est en cours de génération...",
    });
    // TODO: Générer le rapport
    logWarning("generateReport", "Report generation not yet implemented", { configType: config.type });
  };

  const handleSaveReport = async (config: ReportConfig) => {
    if (!currentUserId) {
      logWarning("saveReport", "User not authenticated");
      addNotification({
        type: "error",
        title: "Erreur",
        message: "Vous devez être connecté pour sauvegarder un rapport.",
      });
      return;
    }
    
    try {
      logInfo("saveReport", "Saving report", { reportName: config.name, reportType: config.type });
      await createReport({
        name: config.name || "Rapport sans nom",
        type: mapReportTypeToFirestore(config.type),
        filters: {
          patientIds: config.patientIds,
          dateFrom: config.dateFrom ? Timestamp.fromDate(config.dateFrom) : undefined,
          dateTo: config.dateTo ? Timestamp.fromDate(config.dateTo) : undefined,
        },
        isScheduled: false,
        scheduleConfig: undefined,
      }, currentUserId);
      logInfo("saveReport", "Report saved successfully", { reportName: config.name });
      addNotification({
        type: "success",
        title: "Rapport sauvegardé",
        message: `Le rapport "${config.name}" a été sauvegardé.`,
      });
    } catch (error) {
      logError("saveReport", error, { reportName: config.name, reportType: config.type });
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible de sauvegarder le rapport: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }
  };

  const handleExport = (format: "pdf" | "excel" | "csv") => {
    addNotification({
      type: "info",
      title: "Export en cours",
      message: `Le rapport est en cours d'export en format ${format.toUpperCase()}...`,
    });
  };

  const handleSchedule = (schedule: ReportSchedule) => {
    addNotification({
      type: "success",
      title: "Rapport planifié",
      message: `Le rapport sera envoyé ${schedule.frequency === "daily" ? "quotidiennement" : schedule.frequency === "weekly" ? "hebdomadairement" : "mensuellement"} à ${schedule.time}`,
    });
  };

  const handleShare = (_shareConfig: ShareConfig) => {
    addNotification({
      type: "success",
      title: "Rapport partagé",
      message: "Le lien de partage a été généré avec succès",
    });
  };

  const handleDeleteSavedReport = async (id: string) => {
    try {
      logInfo("deleteReport", "Deleting report", { reportId: id });
      await deleteReport(id);
      logInfo("deleteReport", "Report deleted successfully", { reportId: id });
      addNotification({
        type: "success",
        title: "Rapport supprimé",
        message: "Le rapport sauvegardé a été supprimé",
      });
    } catch (error) {
      logError("deleteReport", error, { reportId: id });
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible de supprimer le rapport: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }
  };

  const handleRunSavedReport = (report: FirestoreReport) => {
    logInfo("runSavedReport", "Running saved report", { reportId: report.id, reportType: report.type, reportName: report.name });
    const uiType = report.type === "patient_summary" ? "patient" : report.type === "period_summary" ? "period" : report.type === "comparison" ? "comparison" : "performance";
    setSelectedReport(uiType);
    setIsPreviewOpen(true);
    addNotification({
      type: "info",
      title: "Génération du rapport",
      message: `Génération du rapport "${report.name}"...`,
    });
  };

  const filteredSavedReports = useMemo(() => {
    if (!savedReports) return [];
    return savedReports.filter((report) =>
      report.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [savedReports, searchQuery]);


  // Report preview data
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [reportDateFrom, setReportDateFrom] = useState<string>("");
  const [reportDateTo, setReportDateTo] = useState<string>("");
  const [reportReadings, setReportReadings] = useState<ReportReading[]>([]);
  const [reportReadingsLoading, setReportReadingsLoading] = useState(false);

  const loadReportReadings = useCallback(
    async (type: string | null, patientId: string | null, dateFrom: string, dateTo: string) => {
      if (!type) {
        setReportReadings([]);
        return;
      }
      setReportReadingsLoading(true);
      setReportReadings([]);
      try {
        if (type === "patient" && patientId) {
          const r = await getReadings(patientId, [limit(2000)]);
          setReportReadings(r.map((x) => ({ ...x, patientId })));
          return;
        }
        if ((type === "critical" || type === "period") && dateFrom && dateTo) {
          const from = Timestamp.fromDate(new Date(dateFrom));
          const to = Timestamp.fromDate(new Date(dateTo + "T23:59:59"));
          try {
            const constraints: any[] = [
              where("date", ">=", from),
              where("date", "<=", to),
              limit(2000),
            ];
            if (type === "critical") constraints.push(where("status", "==", "critical"));
            const all = await queryAllReadings(constraints);
            setReportReadings(all);
            return;
          } catch {
            const active = await queryPatients([where("isActive", "==", true)]);
            const arr: ReportReading[] = [];
            for (const p of active) {
              const c: any[] = [where("date", ">=", from), where("date", "<=", to), limit(500)];
              if (type === "critical") c.push(where("status", "==", "critical"));
              const r = await getReadings(p.id, c);
              arr.push(...r.map((x) => ({ ...x, patientId: p.id })));
            }
            arr.sort((a, b) => {
              const da = a.date?.toMillis?.() ?? 0;
              const db = b.date?.toMillis?.() ?? 0;
              return db - da;
            });
            setReportReadings(arr);
            return;
          }
        }
        if (type === "performance" || type === "comparison") {
          try {
            const all = await queryAllReadings([limit(2000)]);
            setReportReadings(all);
            return;
          } catch {
            const active = await queryPatients([where("isActive", "==", true)]);
            const arr: ReportReading[] = [];
            for (const p of active) {
              const r = await getReadings(p.id, [limit(500)]);
              arr.push(...r.map((x) => ({ ...x, patientId: p.id })));
            }
            arr.sort((a, b) => {
              const da = a.date?.toMillis?.() ?? 0;
              const db = b.date?.toMillis?.() ?? 0;
              return db - da;
            });
            setReportReadings(arr);
            return;
          }
        }
      } catch (e) {
        logError("loadReportReadings", e, { type, patientId, dateFrom, dateTo });
        setReportReadings([]);
      } finally {
        setReportReadingsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isPreviewOpen || !selectedReport) return;
    if (selectedReport === "patient") {
      if (selectedPatientId) loadReportReadings(selectedReport, selectedPatientId, "", "");
      else {
        setReportReadings([]);
        setReportReadingsLoading(false);
      }
      return;
    }
    if (selectedReport === "critical" || selectedReport === "period") {
      if (reportDateFrom && reportDateTo) loadReportReadings(selectedReport, null, reportDateFrom, reportDateTo);
      else {
        setReportReadings([]);
        setReportReadingsLoading(false);
      }
      return;
    }
    if (selectedReport === "performance" || selectedReport === "comparison") {
      loadReportReadings(selectedReport, null, "", "");
    }
  }, [isPreviewOpen, selectedReport, selectedPatientId, reportDateFrom, reportDateTo, loadReportReadings]);

  useEffect(() => {
    if (!isPreviewOpen) {
      setSelectedPatientId(null);
      setReportDateFrom("");
      setReportDateTo("");
      setReportReadings([]);
    }
  }, [isPreviewOpen]);

  const loadTabReadings = useCallback(async () => {
    setTabReadingsLoading(true);
    setTabReadings([]);
    try {
      try {
        const all = await queryAllReadings([limit(2000)]);
        setTabReadings(all);
      } catch {
        const active = await queryPatients([where("isActive", "==", true)]);
        const arr: ReportReading[] = [];
        for (const p of active) {
          const r = await getReadings(p.id, [limit(500)]);
          arr.push(...r.map((x) => ({ ...x, patientId: p.id })));
        }
        arr.sort((a, b) => {
          const da = a.date?.toMillis?.() ?? 0;
          const db = b.date?.toMillis?.() ?? 0;
          return db - da;
        });
        setTabReadings(arr);
      }
    } catch (e) {
      logError("loadTabReadings", e, {});
      setTabReadings([]);
    } finally {
      setTabReadingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "trends" || activeTab === "comparisons") loadTabReadings();
    else {
      setTabReadings([]);
      setTabReadingsLoading(false);
    }
  }, [activeTab, loadTabReadings]);

  const patientReportStats = useMemo(() => {
    if (!selectedPatientId || !reportReadings.length) return null;
    const vals = reportReadings.map((r) => r.value).filter((v) => typeof v === "number");
    const critical = reportReadings.filter((r) => r.status === "critical").length;
    const total = reportReadings.length;
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const byType: Record<string, { count: number; sum: number; min: number; max: number; critical: number }> = {};
    for (const r of reportReadings) {
      const t = r.readingType || "other";
      if (!byType[t]) byType[t] = { count: 0, sum: 0, min: Infinity, max: -Infinity, critical: 0 };
      byType[t].count++;
      byType[t].sum += r.value;
      byType[t].min = Math.min(byType[t].min, r.value);
      byType[t].max = Math.max(byType[t].max, r.value);
      if (r.status === "critical") byType[t].critical++;
    }
    const statsByType = Object.entries(byType).map(([t, s]) => ({
      type: t,
      count: s.count,
      average: s.count ? Math.round((s.sum / s.count) * 10) / 10 : 0,
      min: s.min === Infinity ? 0 : s.min,
      max: s.max === -Infinity ? 0 : s.max,
      critical: s.critical,
    }));
    const adherence = total > 0 ? Math.min(100, Math.round((total / 30) * 100)) : 0;
    return { total, avg, critical, adherence, statsByType };
  }, [selectedPatientId, reportReadings]);

  const criticalReportStats = useMemo(() => {
    if (selectedReport !== "critical" || !reportDateFrom || !reportDateTo) return null;
    const list = reportReadings.filter((r) => r.status === "critical");
    const total = list.length;
    const resolved = list.filter((r) => r.isVerified).length;
    const enCours = total - resolved;
    return {
      total,
      resolved,
      enCours,
      resolvedPct: total ? Math.round((resolved / total) * 1000) / 10 : 0,
      enCoursPct: total ? Math.round((enCours / total) * 1000) / 10 : 0,
    };
  }, [selectedReport, reportDateFrom, reportDateTo, reportReadings]);

  const performanceData = useMemo(() => {
    if (selectedReport !== "performance" && selectedReport !== "comparison") return { doctors: [], nurses: [] };
    const byDoctor: Record<string, { patients: Set<string>; readings: number }> = {};
    const byNurse: Record<string, { patients: Set<string>; readings: number }> = {};
    for (const p of patients) {
      const did = p.doctorId || "";
      const nid = p.nurseId || "";
      if (did && !byDoctor[did]) byDoctor[did] = { patients: new Set(), readings: 0 };
      if (nid && !byNurse[nid]) byNurse[nid] = { patients: new Set(), readings: 0 };
      if (did) byDoctor[did].patients.add(p.id);
      if (nid) byNurse[nid].patients.add(p.id);
    }
    for (const r of reportReadings) {
      const pid = r.patientId;
      const p = pid ? patientsMap.get(pid) : null;
      if (!p) continue;
      const did = p.doctorId || "";
      const nid = p.nurseId || "";
      if (did) byDoctor[did].readings++;
      if (nid) byNurse[nid].readings++;
    }
    const doctorsRows = doctors.map((d: { id: string; firstName: string; lastName: string }) => {
      const s = byDoctor[d.id];
      return {
        name: formatFullName(d.firstName, d.lastName),
        patients: s?.patients.size ?? 0,
        readings: s?.readings ?? 0,
        criticalVerified: 0,
        verificationRate: "—",
        avgResponse: "—",
        consultations: "—",
      };
    });
    const nursesList = nurses.map((n: { id: string; firstName: string; lastName: string }) => {
      const s = byNurse[n.id];
      return {
        name: formatFullName(n.firstName, n.lastName),
        patients: s?.patients.size ?? 0,
        readings: s?.readings ?? 0,
        punctualityRate: "—",
        avgResponse: "—",
        dataQuality: "—",
      };
    });
    return { doctors: doctorsRows, nurses: nursesList };
  }, [selectedReport, patients, reportReadings, doctors, nurses, patientsMap]);

  const patientChartData = useMemo(() => {
    if (!selectedPatientId || !reportReadings.length) return [];
    return reportReadings
      .slice(0, 100)
      .map((r) => {
        const d = r.date?.toDate?.();
        return {
          date: d ? format(d, "yyyy-MM-dd") : "",
          value: r.value,
          name: r.readingType || "measure",
        };
      })
      .reverse();
  }, [selectedPatientId, reportReadings]);

  const criticalTableData = useMemo(() => {
    if (selectedReport !== "critical") return [];
    return reportReadings
      .filter((r) => r.status === "critical")
      .map((r) => {
        const p = r.patientId ? patientsMap.get(r.patientId) : null;
        const u = r.recordedById ? usersMap.get(r.recordedById) : null;
        const d = r.date?.toDate?.();
        return {
          patient: p ? formatFullName(p.firstName, p.lastName) : "—",
          diabetesType: p?.diabetesType ?? "—",
          value: r.value,
          readingType: r.readingType ?? "—",
          datetime: d ? format(d, "dd/MM/yyyy HH:mm", { locale: fr }) : "—",
          severity: r.status,
          status: r.isVerified ? "Résolu" : "En cours",
          doctor: u ? formatFullName(u.firstName, u.lastName) : "—",
        };
      });
  }, [selectedReport, reportReadings, patientsMap, usersMap]);

  const criticalChartData = useMemo(() => {
    if (selectedReport !== "critical" || !reportReadings.length) return [];
    const byDate: Record<string, number> = {};
    for (const r of reportReadings) {
      const d = r.date?.toDate?.();
      const key = d ? format(d, "yyyy-MM-dd") : "";
      if (!key) continue;
      byDate[key] = (byDate[key] ?? 0) + 1;
    }
    return Object.entries(byDate)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedReport, reportReadings]);

  const periodChartData = useMemo(() => {
    if (selectedReport !== "period" || !reportReadings.length) return [];
    const byDate: Record<string, { count: number; sum: number }> = {};
    for (const r of reportReadings) {
      const d = r.date?.toDate?.();
      const key = d ? format(d, "yyyy-MM-dd") : "";
      if (!key) continue;
      if (!byDate[key]) byDate[key] = { count: 0, sum: 0 };
      byDate[key].count++;
      byDate[key].sum += r.value ?? 0;
    }
    return Object.entries(byDate)
      .map(([date, s]) => ({ date, value: s.count > 0 ? Math.round((s.sum / s.count) * 10) / 10 : 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedReport, reportReadings]);

  if (loading) {
    logInfo("pageRender", "Page is loading");
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    logError("pageRender", "Rendering error state", { errorMessage: error.message });
    return (
      <DashboardLayout>
        <ErrorMessage message={`Erreur lors du chargement des rapports: ${error.message}`} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rapports et analyses</h1>
          <p className="text-muted-foreground mt-1">
            Créez et exportez des rapports personnalisés pour analyser les données du système
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-6">
          <TabsList>
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" />
              Rapports
            </TabsTrigger>
            <TabsTrigger value="trends">
              <TrendingUp className="h-4 w-4 mr-2" />
              Tendances
            </TabsTrigger>
            <TabsTrigger value="comparisons">
              <GitCompare className="h-4 w-4 mr-2" />
              Comparaisons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Rapports prédéfinis */}
              <Card>
                <CardHeader>
                  <CardTitle>Rapports prédéfinis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handlePrebuiltReport("patient")}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Rapport complet patient
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handlePrebuiltReport("period")}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Rapport période
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handlePrebuiltReport("performance")}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Rapport performance
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handlePrebuiltReport("comparison")}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Rapport comparatif
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handlePrebuiltReport("critical")}
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Rapport cas critiques
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Constructeur de rapports */}
              <Card>
                <CardHeader>
                  <CardTitle>Constructeur de rapports personnalisés</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReportBuilder onGenerate={handleGenerateReport} onSave={handleSaveReport} />
                </CardContent>
              </Card>
            </div>

            {/* Rapports sauvegardés */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Rapports sauvegardés</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredSavedReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>
                      {searchQuery ? "Aucun rapport trouvé" : "Aucun rapport sauvegardé"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSavedReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{report.name}</h4>
                            {report.isScheduled && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Planifié
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>Type: {report.type}</span>
                            <span>
                              Créé le: {format(report.createdAt?.toDate?.() ?? new Date(), "dd/MM/yyyy", { locale: fr })}
                            </span>
                            {report.lastGeneratedAt && (
                              <span>
                                Dernière exécution: {format(report.lastGeneratedAt.toDate(), "dd/MM/yyyy", { locale: fr })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRunSavedReport(report)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Exécuter
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setIsScheduleOpen(true)}>
                                <Clock className="mr-2 h-4 w-4" />
                                Planifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setIsShareOpen(true)}>
                                <Share2 className="mr-2 h-4 w-4" />
                                Partager
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteSavedReport(report.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <TrendsDashboard
              patients={patients}
              users={users}
              readings={tabReadings}
              loading={tabReadingsLoading}
            />
          </TabsContent>

          <TabsContent value="comparisons">
            <ComparisonsDashboard
              patients={patients}
              users={users}
              readings={tabReadings}
              loading={tabReadingsLoading}
            />
          </TabsContent>
        </Tabs>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedReport === "patient" && "Rapport complet patient"}
                {selectedReport === "period" && "Rapport période"}
                {selectedReport === "performance" && "Rapport performance"}
                {selectedReport === "comparison" && "Rapport comparatif"}
                {selectedReport === "critical" && "Rapport cas critiques"}
              </DialogTitle>
              <DialogDescription>
                Aperçu et options d'export du rapport
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedReport === "patient" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Sélectionner un patient</Label>
                    <Select
                      value={selectedPatientId ?? ""}
                      onValueChange={(v) => setSelectedPatientId(v || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {formatFullName(p.firstName, p.lastName)}
                            {p.fileNumber ? ` (${p.fileNumber})` : ""}
                          </SelectItem>
                        ))}
                        {!patients.length && (
                          <SelectItem value="" disabled>
                            Aucun patient disponible
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {reportReadingsLoading && (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  )}

                  {!reportReadingsLoading && (
                    <>
                      <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total mesures</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{patientReportStats?.total ?? 0}</div>
                            <p className="text-xs text-muted-foreground">
                              {selectedPatientId ? "Données du patient" : "Sélectionner un patient"}
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Moyenne</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {patientReportStats ? `${Math.round(patientReportStats.avg * 10) / 10} mg/dL` : "0 mg/dL"}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {selectedPatientId ? "Données du patient" : "Sélectionner un patient"}
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Cas critiques</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-destructive">
                              {patientReportStats?.critical ?? 0}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {selectedPatientId ? "Données du patient" : "Sélectionner un patient"}
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Taux adhésion</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-success">
                              {patientReportStats ? `${patientReportStats.adherence}%` : "0%"}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {selectedPatientId ? "Est. sur 30 jours" : "Sélectionner un patient"}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">Statistiques par type de mesure</h3>
                        <DataTable
                          columns={[
                            { header: "Type de mesure", accessor: "type", sortable: true },
                            { header: "Nombre", accessor: "count", sortable: true },
                            { header: "Moyenne", accessor: "average", sortable: true },
                            { header: "Min", accessor: "min", sortable: true },
                            { header: "Max", accessor: "max", sortable: true },
                            { header: "Cas critiques", accessor: "critical", sortable: true },
                          ]}
                          data={patientReportStats?.statsByType ?? []}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <ChartCard
                          title="Évolution temporelle des mesures"
                          type="line"
                          data={patientChartData}
                          config={{ xAxisKey: "date", lines: [{ key: "value", name: "Valeur" }] }}
                        />
                        <ChartCard
                          title="Distribution par type de mesure"
                          type="bar"
                          data={patientReportStats?.statsByType?.map((s) => ({ name: s.type, value: s.count })) ?? []}
                          config={{ xAxisKey: "name", bars: [{ key: "value", name: "Nombre" }] }}
                        />
                      </div>

                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <p className="font-medium">Contenu du rapport:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Informations patient, mesures et statuts</li>
                          <li>Statistiques par type de mesure</li>
                          <li>Graphiques d’évolution et distribution</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              )}
              {selectedReport === "performance" && (
                <div className="space-y-6">
                  {reportReadingsLoading && (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  )}
                  {!reportReadingsLoading && (
                    <>
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Médecins</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{performanceData.doctors.length}</div>
                            <p className="text-xs text-muted-foreground">Avec patients assignés</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Infirmières</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{performanceData.nurses.length}</div>
                            <p className="text-xs text-muted-foreground">Avec patients assignés</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total mesures</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{reportReadings.length}</div>
                            <p className="text-xs text-muted-foreground">Dans la base</p>
                          </CardContent>
                        </Card>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">Performance des médecins</h3>
                        <DataTable
                          columns={[
                            { header: "Médecin", accessor: "name", sortable: true },
                            { header: "Patients", accessor: "patients", sortable: true },
                            { header: "Mesures", accessor: "readings", sortable: true },
                            { header: "Taux vérification", accessor: "verificationRate", sortable: true },
                            { header: "Temps réponse", accessor: "avgResponse", sortable: true },
                            { header: "Consultations", accessor: "consultations", sortable: true },
                          ]}
                          data={performanceData.doctors}
                        />
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">Performance des infirmières</h3>
                        <DataTable
                          columns={[
                            { header: "Infirmière", accessor: "name", sortable: true },
                            { header: "Patients suivis", accessor: "patients", sortable: true },
                            { header: "Mesures enregistrées", accessor: "readings", sortable: true },
                            { header: "Taux ponctualité", accessor: "punctualityRate", sortable: true },
                            { header: "Temps réponse", accessor: "avgResponse", sortable: true },
                            { header: "Qualité données", accessor: "dataQuality", sortable: true },
                          ]}
                          data={performanceData.nurses}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <ChartCard
                          title="Comparaison nombre de patients"
                          type="bar"
                          data={performanceData.doctors.map((d: { name: string; patients: number }) => ({ name: d.name, value: d.patients }))}
                          config={{ xAxisKey: "name", bars: [{ key: "value", name: "Patients" }] }}
                        />
                        <ChartCard
                          title="Mesures par médecin"
                          type="bar"
                          data={performanceData.doctors.map((d: { name: string; readings: number }) => ({ name: d.name, value: d.readings }))}
                          config={{ xAxisKey: "name", bars: [{ key: "value", name: "Mesures" }] }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
              {selectedReport === "critical" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Période d'analyse</Label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Date de début</Label>
                        <Input
                          type="date"
                          value={reportDateFrom}
                          onChange={(e) => setReportDateFrom(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date de fin</Label>
                        <Input
                          type="date"
                          value={reportDateTo}
                          onChange={(e) => setReportDateTo(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {reportReadingsLoading && (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  )}

                  {!reportReadingsLoading && reportDateFrom && reportDateTo && (
                    <>
                      <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total cas critiques</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{criticalReportStats?.total ?? 0}</div>
                            <p className="text-xs text-muted-foreground">Sur la période</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Résolus</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-success">
                              {criticalReportStats?.resolved ?? 0}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {criticalReportStats?.resolvedPct ?? 0}%
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">En cours</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-warning">
                              {criticalReportStats?.enCours ?? 0}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {criticalReportStats?.enCoursPct ?? 0}%
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Moyenne</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {reportReadings.length
                                ? Math.round(
                                    (reportReadings.reduce((a, r) => a + (r.value ?? 0), 0) / reportReadings.length) *
                                      10
                                  ) / 10
                                : "—"}
                            </div>
                            <p className="text-xs text-muted-foreground">mg/dL (cas critiques)</p>
                          </CardContent>
                        </Card>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">Liste détaillée des cas critiques</h3>
                        <DataTable
                          columns={[
                            { header: "Patient", accessor: "patient", sortable: true },
                            { header: "Type diabète", accessor: "diabetesType", sortable: true },
                            { header: "Valeur", accessor: "value", sortable: true },
                            { header: "Type mesure", accessor: "readingType", sortable: true },
                            { header: "Date/Heure", accessor: "datetime", sortable: true },
                            { header: "Criticité", accessor: "severity", sortable: true },
                            { header: "Statut", accessor: "status", sortable: true },
                            { header: "Enregistré par", accessor: "doctor", sortable: true },
                          ]}
                          data={criticalTableData}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <ChartCard
                          title="Répartition par statut"
                          type="pie"
                          data={[
                            { name: "Résolus", value: criticalReportStats?.resolved ?? 0 },
                            { name: "En cours", value: criticalReportStats?.enCours ?? 0 },
                          ].filter((d) => d.value > 0)}
                        />
                        <ChartCard
                          title="Évolution temporelle des cas"
                          type="line"
                          data={criticalChartData}
                          config={{ xAxisKey: "date", lines: [{ key: "value", name: "Cas critiques" }] }}
                        />
                      </div>
                    </>
                  )}

                  {!reportReadingsLoading && (!reportDateFrom || !reportDateTo) && (
                    <p className="text-sm text-muted-foreground py-4">
                      Sélectionnez une date de début et une date de fin pour charger les cas critiques.
                    </p>
                  )}
                </div>
              )}
              {selectedReport === "period" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Période</Label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Date de début</Label>
                        <Input
                          type="date"
                          value={reportDateFrom}
                          onChange={(e) => setReportDateFrom(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date de fin</Label>
                        <Input
                          type="date"
                          value={reportDateTo}
                          onChange={(e) => setReportDateTo(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {reportReadingsLoading && (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  )}

                  {!reportReadingsLoading && reportDateFrom && reportDateTo && (
                    <>
                      <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total mesures</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{reportReadings.length}</div>
                            <p className="text-xs text-muted-foreground">Sur la période</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Moyenne</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {reportReadings.length
                                ? `${Math.round((reportReadings.reduce((a, r) => a + (r.value ?? 0), 0) / reportReadings.length) * 10) / 10} mg/dL`
                                : "—"}
                            </div>
                            <p className="text-xs text-muted-foreground">Valeur moyenne</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Cas critiques</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-destructive">
                              {reportReadings.filter((r) => r.status === "critical").length}
                            </div>
                            <p className="text-xs text-muted-foreground">Sur la période</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Patients</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {new Set(reportReadings.map((r) => r.patientId).filter(Boolean)).size}
                            </div>
                            <p className="text-xs text-muted-foreground">Avec mesures</p>
                          </CardContent>
                        </Card>
                      </div>

                      <ChartCard
                        title="Évolution des mesures sur la période (moyenne mg/dL par jour)"
                        type="line"
                        data={periodChartData}
                        config={{ xAxisKey: "date", lines: [{ key: "value", name: "Moyenne" }] }}
                      />

                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <p className="font-medium">Contenu du rapport:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Statistiques de la période sélectionnée</li>
                          <li>Graphiques d’évolution</li>
                        </ul>
                      </div>
                    </>
                  )}

                  {!reportReadingsLoading && (!reportDateFrom || !reportDateTo) && (
                    <p className="text-sm text-muted-foreground py-4">
                      Sélectionnez une date de début et une date de fin pour charger les données.
                    </p>
                  )}
                </div>
              )}
              {selectedReport === "comparison" && (
                <div className="space-y-6">
                  {reportReadingsLoading && (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  )}
                  {!reportReadingsLoading && (
                    <>
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Médecins</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{performanceData.doctors.length}</div>
                            <p className="text-xs text-muted-foreground">Avec patients</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Infirmières</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{performanceData.nurses.length}</div>
                            <p className="text-xs text-muted-foreground">Avec patients</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total mesures</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{reportReadings.length}</div>
                            <p className="text-xs text-muted-foreground">En base</p>
                          </CardContent>
                        </Card>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">Comparatif médecins</h3>
                        <DataTable
                          columns={[
                            { header: "Médecin", accessor: "name", sortable: true },
                            { header: "Patients", accessor: "patients", sortable: true },
                            { header: "Mesures", accessor: "readings", sortable: true },
                          ]}
                          data={performanceData.doctors}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Comparatif infirmières</h3>
                        <DataTable
                          columns={[
                            { header: "Infirmière", accessor: "name", sortable: true },
                            { header: "Patients", accessor: "patients", sortable: true },
                            { header: "Mesures", accessor: "readings", sortable: true },
                          ]}
                          data={performanceData.nurses}
                        />
                      </div>

                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <p className="font-medium">Contenu du rapport:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Comparaison médecins / infirmières</li>
                          <li>Patients et mesures par rôle</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              )}
              {!selectedReport && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez un rapport pour voir l'aperçu
                  </p>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsScheduleOpen(true)}>
                  <Clock className="mr-2 h-4 w-4" />
                  Planifier
                </Button>
                <Button variant="outline" onClick={() => setIsShareOpen(true)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Partager
                </Button>
                <Button variant="outline" onClick={() => handleExport("csv")}>
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => handleExport("excel")}>
                  Export Excel
                </Button>
                <Button onClick={() => handleExport("pdf")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Dialog */}
        <ScheduleReportDialog
          open={isScheduleOpen}
          onOpenChange={setIsScheduleOpen}
          reportName={
            selectedReport === "patient"
              ? "Rapport complet patient"
              : selectedReport === "period"
                ? "Rapport période"
                : selectedReport === "performance"
                  ? "Rapport performance"
                  : selectedReport === "comparison"
                    ? "Rapport comparatif"
                    : selectedReport === "critical"
                      ? "Rapport cas critiques"
                      : "Rapport"
          }
          onSchedule={handleSchedule}
        />

        {/* Share Dialog */}
        <ShareReportDialog
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          reportId={selectedReport ?? undefined}
          reportName={
            selectedReport === "patient"
              ? "Rapport complet patient"
              : selectedReport === "period"
                ? "Rapport période"
                : selectedReport === "performance"
                  ? "Rapport performance"
                  : selectedReport === "comparison"
                    ? "Rapport comparatif"
                    : selectedReport === "critical"
                      ? "Rapport cas critiques"
                      : "Rapport"
          }
          onShare={handleShare}
        />
      </div>
    </DashboardLayout>
  );
}
