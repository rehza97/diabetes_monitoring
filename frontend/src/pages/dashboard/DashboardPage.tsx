import { useMemo, useEffect } from "react";
import { query, where, orderBy, limit, Timestamp } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { GaugeChart } from "@/components/dashboard/charts/GaugeChart";
import { ActivityTable } from "@/components/dashboard/ActivityTable";
import { AlertList } from "@/components/dashboard/AlertCard";
import { RecentItems } from "@/components/dashboard/RecentItems";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

// Logging utility
const logError = (
  context: string,
  error: unknown,
  details?: Record<string, unknown>,
) => {
  console.error(`[DashboardPage] Error in ${context}:`, error, details);
};

const logWarning = (
  context: string,
  message: string,
  details?: Record<string, unknown>,
) => {
  console.warn(`[DashboardPage] Warning in ${context}:`, message, details);
};

const logInfo = (
  context: string,
  message: string,
  details?: Record<string, unknown>,
) => {
  console.log(`[DashboardPage] Info in ${context}:`, message, details);
};
import {
  Users,
  UserCircle,
  UserCheck,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  Activity,
  CheckCircle2,
  UserPlus,
  Plus,
  Search,
  FileText,
  Clock,
} from "lucide-react";
import { useUsers, usePatients } from "@/hooks/useFirestore";
import { useRealtimeAuditLogs } from "@/hooks/useRealtime";
import {
  usersCollection,
  patientsCollection,
  auditLogsCollection,
} from "@/lib/firestore-helpers";
import type {
  FirestoreUser,
  FirestorePatient,
  FirestoreAuditLog,
} from "@/types/firestore";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/utils/helpers";
import { useAuth } from "@/context/AuthContext";

export function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Component lifecycle logging
  useEffect(() => {
    logInfo("componentMount", "DashboardPage mounted");
    return () => {
      logInfo("componentUnmount", "DashboardPage unmounting");
    };
  }, []);

  // Create queries
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

  const doctorsQuery = useMemo(() => {
    try {
      const q = query(
        usersCollection,
        where("role", "==", "doctor"),
        where("isActive", "==", true),
      );
      logInfo("doctorsQuery", "Query created successfully");
      return q;
    } catch (error) {
      logError("doctorsQuery", error);
      throw error;
    }
  }, []);

  const nursesQuery = useMemo(() => {
    try {
      const q = query(
        usersCollection,
        where("role", "==", "nurse"),
        where("isActive", "==", true),
      );
      logInfo("nursesQuery", "Query created successfully");
      return q;
    } catch (error) {
      logError("nursesQuery", error);
      throw error;
    }
  }, []);

  const recentAuditLogsQuery = useMemo(() => {
    try {
      const q = query(
        auditLogsCollection,
        orderBy("createdAt", "desc"),
        limit(5),
      );
      logInfo("recentAuditLogsQuery", "Query created successfully");
      return q;
    } catch (error) {
      logError("recentAuditLogsQuery", error);
      throw error;
    }
  }, []);

  const recentPatientsQuery = useMemo(() => {
    try {
      const q = query(
        patientsCollection,
        where("isActive", "==", true),
        orderBy("updatedAt", "desc"),
        limit(5),
      );
      logInfo("recentPatientsQuery", "Query created successfully");
      return q;
    } catch (error) {
      logError("recentPatientsQuery", error);
      throw error;
    }
  }, []);

  const criticalPatientsQuery = useMemo(() => {
    try {
      const q = query(
        patientsCollection,
        where("isActive", "==", true),
        where("lastReadingStatus", "==", "critical"),
        orderBy("lastReadingDate", "desc"),
        limit(5),
      );
      logInfo("criticalPatientsQuery", "Query created successfully");
      return q;
    } catch (error) {
      logError("criticalPatientsQuery", error);
      throw error;
    }
  }, []);

  // Only fetch data when authenticated
  const {
    data: users,
    loading: usersLoading,
    error: usersError,
  } = useUsers(usersQuery, isAuthenticated);
  const {
    data: patients,
    loading: patientsLoading,
    error: patientsError,
  } = usePatients(patientsQuery, isAuthenticated);
  const { data: doctors, loading: doctorsLoading } = useUsers(
    doctorsQuery,
    isAuthenticated,
  );
  const { data: nurses, loading: nursesLoading } = useUsers(
    nursesQuery,
    isAuthenticated,
  );
  const {
    data: auditLogs,
    loading: auditLogsLoading,
    error: auditLogsError,
  } = useRealtimeAuditLogs(recentAuditLogsQuery, { enabled: isAuthenticated });
  const { data: recentPatients, loading: recentPatientsLoading } = usePatients(
    recentPatientsQuery,
    isAuthenticated,
  );
  const { data: criticalPatients, loading: criticalPatientsLoading } =
    usePatients(criticalPatientsQuery, isAuthenticated);

  // Log data fetching status
  useEffect(() => {
    logInfo("dataFetching", "Data fetching status", {
      users: {
        loading: usersLoading,
        count: users?.length ?? 0,
        error: usersError?.message,
      },
      patients: {
        loading: patientsLoading,
        count: patients?.length ?? 0,
        error: patientsError?.message,
      },
      doctors: { loading: doctorsLoading, count: doctors?.length ?? 0 },
      nurses: { loading: nursesLoading, count: nurses?.length ?? 0 },
      auditLogs: {
        loading: auditLogsLoading,
        count: auditLogs?.length ?? 0,
        error: auditLogsError?.message,
      },
      recentPatients: {
        loading: recentPatientsLoading,
        count: recentPatients?.length ?? 0,
      },
      criticalPatients: {
        loading: criticalPatientsLoading,
        count: criticalPatients?.length ?? 0,
      },
    });
  }, [
    usersLoading,
    patientsLoading,
    doctorsLoading,
    nursesLoading,
    auditLogsLoading,
    recentPatientsLoading,
    criticalPatientsLoading,
    users?.length,
    patients?.length,
    doctors?.length,
    nurses?.length,
    auditLogs?.length,
    recentPatients?.length,
    criticalPatients?.length,
    usersError,
    patientsError,
    auditLogsError,
  ]);

  // Log errors when they occur
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
    if (auditLogsError) {
      const errorDetails: Record<string, unknown> = {
        query: "recentAuditLogsQuery",
        message: auditLogsError.message,
        name: auditLogsError.name,
      };
      if ("code" in auditLogsError) {
        errorDetails.code = (auditLogsError as any).code;
      }
      logError("auditLogsFetch", auditLogsError, errorDetails);
    }
  }, [auditLogsError]);

  // Calculate statistics
  const stats = useMemo(() => {
    try {
      logInfo("statsCalculation", "Starting stats calculation");

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);

      // Count today's readings from audit logs
      const todayReadings =
        auditLogs?.filter(
          (log) =>
            log.action === "create" &&
            log.entityType === "reading" &&
            log.createdAt &&
            log.createdAt.toMillis() >= todayTimestamp.toMillis(),
        ).length || 0;

      // Count critical patients (patients with critical last reading status)
      const criticalPatients =
        patients?.filter((p) => p.lastReadingStatus === "critical").length || 0;

      // Calculate average readings per day (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);
      const readingsLast30Days =
        auditLogs?.filter(
          (log) =>
            log.action === "create" &&
            log.entityType === "reading" &&
            log.createdAt &&
            log.createdAt.toMillis() >= thirtyDaysAgoTimestamp.toMillis(),
        ).length || 0;
      const avgDailyReadings =
        readingsLast30Days > 0 ? Math.round(readingsLast30Days / 30) : 0;

      // Calculate normal readings percentage (from patients' last reading status)
      const totalWithReadings =
        patients?.filter((p) => p.lastReadingStatus).length || 0;
      const normalReadings =
        patients?.filter((p) => p.lastReadingStatus === "normal").length || 0;
      const normalPercentage =
        totalWithReadings > 0
          ? Math.round((normalReadings / totalWithReadings) * 100)
          : 0;

      // Calculate average reading value (from patients' last reading value)
      const patientsWithValues =
        patients?.filter(
          (p) =>
            p.lastReadingValue !== undefined && p.lastReadingValue !== null,
        ) || [];
      const avgValue =
        patientsWithValues.length > 0
          ? Math.round(
              patientsWithValues.reduce(
                (sum, p) => sum + (p.lastReadingValue || 0),
                0,
              ) / patientsWithValues.length,
            )
          : 0;

      // Calculate adherence rate - requires scheduled readings data
      // For now, set to 0 until we have scheduled readings data
      const adherenceRate = 0; // TODO: Calculate from scheduled readings vs actual readings

      const result = {
        totalPatients: patients?.length || 0,
        totalDoctors: doctors?.length || 0,
        totalNurses: nurses?.length || 0,
        todayReadings,
        avgDailyReadings,
        criticalPatients,
        adherenceRate,
        normalPercentage,
        avgValue,
      };

      logInfo("statsCalculation", "Stats calculation completed", {
        totalPatients: result.totalPatients,
        todayReadings: result.todayReadings,
        avgDailyReadings: result.avgDailyReadings,
      });

      return result;
    } catch (error) {
      logError("statsCalculation", error, {
        patientsCount: patients?.length,
        doctorsCount: doctors?.length,
        nursesCount: nurses?.length,
        auditLogsCount: auditLogs?.length,
      });
      // Return default values on error
      return {
        totalPatients: 0,
        totalDoctors: 0,
        totalNurses: 0,
        todayReadings: 0,
        avgDailyReadings: 0,
        criticalPatients: 0,
        adherenceRate: 0,
        normalPercentage: 0,
        avgValue: 0,
      };
    }
  }, [patients, doctors, nurses, auditLogs]);

  // Transform audit logs to activities
  const activities = useMemo(() => {
    return (
      auditLogs?.slice(0, 5).map((log) => {
        const userName = log.userName || "Utilisateur";
        const userRole = log.userRole || "Utilisateur";

        let action = "";
        let type:
          | "report"
          | "other"
          | "reading"
          | "login"
          | "patient_added"
          | "notification" = "other";

        if (log.action === "create" && log.entityType === "reading") {
          action = "a enregistré une nouvelle mesure";
          type = "reading";
        } else if (log.action === "create" && log.entityType === "patient") {
          action = "a ajouté un nouveau patient";
          type = "patient_added";
        } else if (log.action === "create" && log.entityType === "user") {
          action = "a créé un nouvel utilisateur";
          type = "other";
        } else {
          action = `${log.action} ${log.entityType}`;
        }

        return {
          id: log.id,
          type,
          user: { name: userName, role: userRole },
          action,
          timestamp: log.createdAt?.toDate() || new Date(),
          relatedEntity: {
            type: log.entityType,
            id: log.entityId || "",
            name: log.entityName || "",
          },
        };
      }) || []
    );
  }, [auditLogs]);

  // Create alerts from critical patients
  const alerts = useMemo(() => {
    const criticalCount = stats.criticalPatients;
    if (criticalCount > 0) {
      return [
        {
          id: "critical",
          type: "critical" as const,
          title: "Cas critiques nécessitant suivi",
          message: `${criticalCount} patient${criticalCount > 1 ? "s" : ""} ${criticalCount > 1 ? "ont" : "a"} des mesures critiques nécessitant une attention immédiate`,
          timestamp: new Date(),
          actionLabel: "Voir les cas",
          onAction: () => navigate("/dashboard/patients?status=critical"),
        },
      ];
    }
    return [];
  }, [stats.criticalPatients, navigate]);

  // Chart data calculations - must be before early returns to follow Rules of Hooks
  // Line chart: readings trend (last 30 days)
  const readingsTrendData = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      date.setHours(0, 0, 0, 0);
      const dayTimestamp = Timestamp.fromDate(date);
      const nextDayTimestamp = Timestamp.fromDate(
        new Date(date.getTime() + 24 * 60 * 60 * 1000),
      );

      const dayReadings =
        auditLogs?.filter(
          (log) =>
            log.action === "create" &&
            log.entityType === "reading" &&
            log.createdAt &&
            log.createdAt.toMillis() >= dayTimestamp.toMillis() &&
            log.createdAt.toMillis() < nextDayTimestamp.toMillis(),
        ).length || 0;

      return {
        date: date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        }),
        value: dayReadings,
      };
    });
    return days;
  }, [auditLogs]);

  // Bar chart: monthly comparison
  const monthlyComparisonData = useMemo(() => {
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun"];
    return months.map((month, index) => {
      const monthStart = new Date(2024, index, 1);
      const monthEnd = new Date(2024, index + 1, 0);
      const monthStartTimestamp = Timestamp.fromDate(monthStart);
      const monthEndTimestamp = Timestamp.fromDate(monthEnd);

      const monthReadings =
        auditLogs?.filter(
          (log) =>
            log.action === "create" &&
            log.entityType === "reading" &&
            log.createdAt &&
            log.createdAt.toMillis() >= monthStartTimestamp.toMillis() &&
            log.createdAt.toMillis() <= monthEndTimestamp.toMillis(),
        ).length || 0;

      return { name: month, value: monthReadings };
    });
  }, [auditLogs]);

  // Pie chart: diabetes type distribution
  const diabetesTypeData = useMemo(() => {
    const type1 =
      patients?.filter((p) => p.diabetesType === "type1").length || 0;
    const type2 =
      patients?.filter((p) => p.diabetesType === "type2").length || 0;
    const gestational =
      patients?.filter((p) => p.diabetesType === "gestational").length || 0;
    return [
      { name: "Type 1", value: type1 },
      { name: "Type 2", value: type2 },
      { name: "Gestationnel", value: gestational },
    ];
  }, [patients]);

  // Doughnut chart: status distribution
  const statusData = useMemo(() => {
    const normal =
      patients?.filter((p) => p.lastReadingStatus === "normal").length || 0;
    const warning =
      patients?.filter((p) => p.lastReadingStatus === "warning").length || 0;
    const critical =
      patients?.filter((p) => p.lastReadingStatus === "critical").length || 0;
    return [
      { name: "Normal", value: normal },
      { name: "Avertissement", value: warning },
      { name: "Critique", value: critical },
    ];
  }, [patients]);

  // Area chart: patient growth
  const patientGrowthData = useMemo(() => {
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun"];
    return months.map((month, index) => {
      const monthEnd = new Date(2024, index + 1, 0);
      const monthEndTimestamp = Timestamp.fromDate(monthEnd);

      const patientsByMonth =
        patients?.filter(
          (p) =>
            p.createdAt &&
            p.createdAt.toMillis() <= monthEndTimestamp.toMillis(),
        ).length || 0;

      return { month, patients: patientsByMonth };
    });
  }, [patients]);

  // Heatmap: readings by hour
  const heatmapData = useMemo(() => {
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

    // Calculate readings per day/hour from audit logs
    const readingLogs =
      auditLogs?.filter(
        (log) => log.action === "create" && log.entityType === "reading",
      ) || [];

    // Create a map to count readings by day and hour
    const readingCounts: Record<string, number> = {};

    readingLogs.forEach((log) => {
      if (log.createdAt) {
        try {
          const date = log.createdAt.toDate();
          const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const hour = date.getHours();
          // Convert Sunday (0) to last position (6) to match our days array
          const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
          const key = `${adjustedDayIndex}-${hour}`;
          readingCounts[key] = (readingCounts[key] || 0) + 1;
        } catch (error) {
          // Skip invalid dates
        }
      }
    });

    return days.flatMap((day, dayIndex) =>
      Array.from({ length: 24 }, (_, hour) => ({
        day,
        hour,
        value: readingCounts[`${dayIndex}-${hour}`] || 0,
      })),
    );
  }, [auditLogs]);

  const loading =
    authLoading ||
    usersLoading ||
    patientsLoading ||
    doctorsLoading ||
    nursesLoading ||
    auditLogsLoading ||
    recentPatientsLoading ||
    criticalPatientsLoading;
  const errors = [usersError, patientsError, auditLogsError].filter(
    Boolean,
  ) as Error[];
  const error = errors[0];

  useEffect(() => {
    if (errors.length > 0) {
      logError("pageRender", "Errors detected during page render", {
        errors: errors.map((e) => ({ message: e.message, stack: e.stack })),
      });
    }
  }, [errors]);

  if (authLoading) {
    logInfo("pageRender", "Page is loading (auth)");
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <ErrorMessage message="Vous devez être connecté pour accéder à cette page." />
      </DashboardLayout>
    );
  }

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
    logError("pageRender", "Rendering error state", {
      errorMessage: error.message,
    });
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {errors.map((err, index) => (
            <ErrorMessage
              key={index}
              message={`Erreur lors du chargement des données: ${err.message}`}
            />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Tableau de bord
            </h1>
            <p className="text-muted-foreground mt-1">
              Vue d'ensemble de votre système de monitoring du diabète
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard/patients?action=add")}
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Ajouter patient
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ajouter un nouveau patient (Ctrl+N)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard/readings?action=add")}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Mesure rapide
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enregistrer une nouvelle mesure (Ctrl+R)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard/search")}
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  Recherche
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Recherche avancée (Ctrl+S)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard/reports")}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Rapports
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Générer et consulter les rapports</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* KPI Cards - 8 cartes selon le plan */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total des patients"
            value={stats.totalPatients.toString()}
            change="+0%"
            description="Depuis le mois dernier"
            trend="up"
            icon={Users}
            iconColor="text-primary"
          />
          <StatsCard
            title="Total des médecins"
            value={stats.totalDoctors.toString()}
            change="+0%"
            description="Médecins actifs"
            trend="up"
            icon={UserCheck}
            iconColor="text-primary"
          />
          <StatsCard
            title="Total des infirmières"
            value={stats.totalNurses.toString()}
            change="+0%"
            description="Infirmières actives"
            trend="up"
            icon={UserCircle}
            iconColor="text-primary"
          />
          <StatsCard
            title="Mesures aujourd'hui"
            value={stats.todayReadings.toString()}
            change="+0%"
            description="Mesures enregistrées"
            trend="up"
            icon={ClipboardList}
            iconColor="text-success"
          />
          <StatsCard
            title="Moyenne quotidienne"
            value={stats.avgDailyReadings.toString()}
            description="Mesures par jour"
            icon={TrendingUp}
            iconColor="text-primary"
          />
          <StatsCard
            title="Cas critiques"
            value={stats.criticalPatients.toString()}
            description="Nécessitent suivi"
            icon={AlertTriangle}
            iconColor="text-destructive"
          />
          <StatsCard
            title="Taux d'adhésion"
            value={`${stats.adherenceRate}%`}
            description="Mesures programmées"
            icon={CheckCircle2}
            iconColor="text-success"
          />
          <StatsCard
            title="% Mesures normales"
            value={`${stats.normalPercentage}%`}
            description="Dans les plages normales"
            icon={Activity}
            iconColor="text-success"
          />
        </div>

        {/* Gauge Charts pour KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Moyenne actuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <GaugeChart
                value={stats.avgValue}
                min={0}
                max={300}
                thresholds={{ low: 70, medium: 140, high: 180 }}
                label="Moyenne"
                unit="mg/dL"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Taux d'adhésion</CardTitle>
            </CardHeader>
            <CardContent>
              <GaugeChart
                value={stats.adherenceRate}
                min={0}
                max={100}
                thresholds={{ low: 50, medium: 70, high: 90 }}
                label="Adhésion"
                unit="%"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">% Mesures normales</CardTitle>
            </CardHeader>
            <CardContent>
              <GaugeChart
                value={stats.normalPercentage}
                min={0}
                max={100}
                thresholds={{ low: 50, medium: 70, high: 85 }}
                label="Normales"
                unit="%"
              />
            </CardContent>
          </Card>
        </div>

        {/* Graphiques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ChartCard
            title="Tendance des mesures"
            type="line"
            data={readingsTrendData}
          />
          <ChartCard
            title="Comparaison mensuelle"
            type="bar"
            data={monthlyComparisonData}
          />
          <ChartCard
            title="Distribution types diabète"
            type="pie"
            data={diabetesTypeData}
          />
          <ChartCard
            title="Distribution états"
            type="doughnut"
            data={statusData}
          />
          <ChartCard
            title="Croissance patients"
            type="area"
            data={patientGrowthData}
          />
          <ChartCard
            title="Distribution par heure"
            type="heatmap"
            data={heatmapData}
          />
        </div>

        {/* Quick Access Section */}
        <div className="grid gap-6 md:grid-cols-4">
          {/* Recent Items */}
          <RecentItems />

          {/* Recent Patients List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Patients récents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPatientsLoading ? (
                <LoadingSpinner size="sm" />
              ) : recentPatients && recentPatients.length > 0 ? (
                <div className="space-y-3">
                  {recentPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() =>
                        navigate(`/dashboard/patients/${patient.id}`)
                      }
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={patient.avatar} />
                        <AvatarFallback>
                          {getInitials(patient.firstName, patient.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {patient.fileNumber}
                        </p>
                      </div>
                      {patient.lastReadingStatus && (
                        <Badge
                          variant={
                            patient.lastReadingStatus === "critical"
                              ? "destructive"
                              : patient.lastReadingStatus === "warning"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {patient.lastReadingStatus === "critical"
                            ? "Critique"
                            : patient.lastReadingStatus === "warning"
                              ? "Avertissement"
                              : "Normal"}
                        </Badge>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => navigate("/dashboard/patients")}
                  >
                    Voir tous les patients
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun patient récent
                </p>
              )}
            </CardContent>
          </Card>

          {/* Critical Cases Widget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Cas critiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              {criticalPatientsLoading ? (
                <LoadingSpinner size="sm" />
              ) : criticalPatients && criticalPatients.length > 0 ? (
                <div className="space-y-3">
                  {criticalPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border-l-4 border-destructive"
                      onClick={() =>
                        navigate(`/dashboard/patients/${patient.id}`)
                      }
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={patient.avatar} />
                        <AvatarFallback>
                          {getInitials(patient.firstName, patient.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {patient.lastReadingValue && (
                            <span className="text-xs font-semibold text-destructive">
                              {patient.lastReadingValue} mg/dL
                            </span>
                          )}
                          {patient.lastReadingDate && (
                            <span className="text-xs text-muted-foreground">
                              {patient.lastReadingDate
                                .toDate()
                                .toLocaleDateString("fr-FR")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() =>
                      navigate("/dashboard/patients?status=critical")
                    }
                  >
                    Voir tous les cas critiques
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Aucun cas critique
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scheduled Readings Today */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Mesures programmées aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Fonctionnalité à venir
                </p>
                <p className="text-xs text-muted-foreground">
                  Les mesures programmées seront affichées ici
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts et Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Alertes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertes et notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AlertList alerts={alerts} />
            </CardContent>
          </Card>

          {/* Activité récente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTable activities={activities} limit={5} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
