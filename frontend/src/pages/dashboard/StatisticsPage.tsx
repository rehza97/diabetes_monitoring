import { useMemo, useEffect, useState } from "react";
import { query, where, orderBy, Timestamp, limit as firestoreLimit } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { KPICard } from "@/components/dashboard/KPICard";
import { GaugeChart } from "@/components/dashboard/charts/GaugeChart";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserPlus,
  ClipboardList,
  TrendingUp,
  UserCheck,
  UserCircle,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { usePatients, useUsers } from "@/hooks/useFirestore";
import { useRealtimeAuditLogs } from "@/hooks/useRealtime";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { auth } from "@/lib/firebase";
import {
  patientsCollection,
  usersCollection,
  auditLogsCollection,
  queryAllReadings,
  getReadings,
  queryPatients,
} from "@/lib/firestore-helpers";
import type { FirestoreReading } from "@/types/firestore";

const READING_TYPE_LABELS: Record<string, string> = {
  fasting: "À jeun",
  post_breakfast: "Après petit-déj.",
  pre_lunch: "Avant déjeuner",
  post_lunch: "Après déjeuner",
  pre_dinner: "Avant dîner",
  post_dinner: "Après dîner",
  bedtime: "Coucher",
  midnight: "Minuit",
  random: "Aléatoire",
};

export function StatisticsPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const currentUserId = currentUser?.id ?? auth.currentUser?.uid ?? null;

  const [readings, setReadings] = useState<Array<FirestoreReading & { patientId: string }>>([]);
  const [readingsLoading, setReadingsLoading] = useState(true);
  const [readingsError, setReadingsError] = useState<Error | null>(null);

  // Fetch all data
  const patientsQuery = useMemo(
    () => query(patientsCollection, where("isActive", "==", true)),
    []
  );
  const usersQuery = useMemo(
    () => query(usersCollection, where("isActive", "==", true)),
    []
  );
  const auditLogsQuery = useMemo(
    () => query(auditLogsCollection, orderBy("createdAt", "desc"), firestoreLimit(10000)),
    []
  );

  const { data: patients, loading: patientsLoading, error: patientsError } = usePatients(patientsQuery);
  const { data: users, loading: usersLoading, error: usersError } = useUsers(usersQuery);
  const { data: auditLogs, loading: auditLogsLoading, error: auditLogsError } = useRealtimeAuditLogs(auditLogsQuery);

  // Fetch readings (role-based)
  useEffect(() => {
    const loadReadings = async () => {
      if (authLoading) return;
      setReadingsLoading(true);
      setReadingsError(null);
      if (!currentUserId) {
        setReadings([]);
        setReadingsLoading(false);
        setReadingsError(new Error("User not authenticated"));
        return;
      }
      try {
        let allReadings: Array<FirestoreReading & { patientId: string }> = [];
        if (currentUser?.role === "admin") {
          try {
            allReadings = await queryAllReadings([firestoreLimit(10000)]);
          } catch (queryErr) {
            const err = queryErr instanceof Error ? queryErr : new Error("Failed to query readings");
            const isPermissionError =
              err.message.includes("permission") ||
              err.message.includes("Missing or insufficient") ||
              err.message.includes("insufficient") ||
              ("code" in err && (err as { code?: string }).code === "permission-denied");
            if (isPermissionError) {
              const allPatients = await queryPatients([where("isActive", "==", true)]);
              const perPatient = await Promise.all(
                allPatients.map(async (p) => {
                  try {
                    const list = await getReadings(p.id, [firestoreLimit(1000)]);
                    return list.map((r) => ({ ...r, patientId: p.id }));
                  } catch {
                    return [];
                  }
                })
              );
              allReadings = perPatient.flat();
              allReadings.sort((a, b) => {
                const dA = a.date?.toMillis?.() ?? 0;
                const dB = b.date?.toMillis?.() ?? 0;
                return dB - dA;
              });
            } else throw queryErr;
          }
        } else if (currentUser) {
          const assigned =
            currentUser.role === "doctor"
              ? await queryPatients([where("doctorId", "==", currentUserId), where("isActive", "==", true)])
              : currentUser.role === "nurse"
                ? await queryPatients([where("nurseId", "==", currentUserId), where("isActive", "==", true)])
                : [];
          const perPatient = await Promise.all(
            assigned.map(async (p) => {
              try {
                const list = await getReadings(p.id, [firestoreLimit(1000)]);
                return list.map((r) => ({ ...r, patientId: p.id }));
              } catch {
                return [];
              }
            })
          );
          allReadings = perPatient.flat();
          allReadings.sort((a, b) => {
            const dA = a.date?.toMillis?.() ?? 0;
            const dB = b.date?.toMillis?.() ?? 0;
            return dB - dA;
          });
        }
        setReadings(allReadings);
        setReadingsError(null);
      } catch (err) {
        setReadings([]);
        setReadingsError(err instanceof Error ? err : new Error("Failed to load readings"));
      } finally {
        setReadingsLoading(false);
      }
    };
    loadReadings();
  }, [authLoading, currentUserId, currentUser?.role]);

  // Filter patients by role (admin: all; doctor/nurse: assigned only)
  const filteredPatients = useMemo(() => {
    if (!patients?.length) return [];
    if (!currentUser?.role || currentUser.role === "admin") return patients;
    if (!currentUserId) return patients;
    if (currentUser.role === "doctor")
      return patients.filter((p) => p.doctorId === currentUserId);
    if (currentUser.role === "nurse")
      return patients.filter((p) => p.nurseId === currentUserId);
    return patients;
  }, [patients, currentUser?.role, currentUserId]);

  // Calculate statistics
  const stats = useMemo(() => {
    try {
      const now = new Date();
      let oneMonthAgoTimestamp: Timestamp;
      try {
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        oneMonthAgoTimestamp = Timestamp.fromDate(oneMonthAgo);
      } catch {
        oneMonthAgoTimestamp = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      }
      let thirtyDaysAgoTimestamp: Timestamp;
      try {
        const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);
      } catch {
        thirtyDaysAgoTimestamp = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      }

      // Patient statistics (role-scoped)
      const totalPatients = filteredPatients.length;
      const newPatientsThisMonth = filteredPatients.filter((p) =>
        p.createdAt && p.createdAt.toMillis() >= oneMonthAgoTimestamp.toMillis()
      ).length;
      const type1Patients = filteredPatients.filter((p) => p.diabetesType === "type1").length;
      const type2Patients = filteredPatients.filter((p) => p.diabetesType === "type2").length;
      const gestationalPatients = filteredPatients.filter((p) => p.diabetesType === "gestational").length;

      // User statistics
      const doctors = users?.filter((u) => u.role === "doctor").length ?? 0;
      const nurses = users?.filter((u) => u.role === "nurse").length ?? 0;
      const admins = users?.filter((u) => u.role === "admin").length ?? 0;

      // Reading statistics (real readings)
      const totalReadings = readings?.length ?? 0;
      const readingsLast30Days = (readings ?? []).filter((r) => {
        const ms = r.date?.toMillis?.();
        return typeof ms === "number" && ms >= thirtyDaysAgoTimestamp.toMillis();
      });
      const avgDailyReadings = readingsLast30Days.length > 0 ? Math.round(readingsLast30Days.length / 30) : 0;

      const normalReadings = (readings ?? []).filter((r) => r.status === "normal").length;
      const warningReadings = (readings ?? []).filter((r) => r.status === "warning").length;
      const criticalReadings = (readings ?? []).filter((r) => r.status === "critical").length;
      const totalWithReadings = normalReadings + warningReadings + criticalReadings;
      const normalPercentage = totalWithReadings > 0 ? Math.round((normalReadings / totalWithReadings) * 100) : 0;
      const criticalPercentage = totalWithReadings > 0 ? Math.round((criticalReadings / totalWithReadings) * 100) : 0;
      
      // Age distribution (filtered patients)
      const ageGroups = {
        "0-20": 0,
        "21-40": 0,
        "41-60": 0,
        "61-80": 0,
        "80+": 0,
      };
      filteredPatients.forEach((patient) => {
        try {
          if (patient.dateOfBirth) {
            const birthDate = patient.dateOfBirth.toDate();
            if (isNaN(birthDate.getTime())) return;
            const age = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
            if (age < 0 || age > 150) return;
            if (age <= 20) ageGroups["0-20"]++;
            else if (age <= 40) ageGroups["21-40"]++;
            else if (age <= 60) ageGroups["41-60"]++;
            else if (age <= 80) ageGroups["61-80"]++;
            else ageGroups["80+"]++;
          }
        } catch {
          /* skip */
        }
      });

      const genderDistribution = {
        male: filteredPatients.filter((p) => p.gender === "male").length,
        female: filteredPatients.filter((p) => p.gender === "female").length,
      };

      // Login statistics (from audit logs only)
      let activeUsers = 0;
      let loginRate = 0;
      const loginLogs = auditLogs?.filter(
        (log) =>
          log.action === "login" &&
          log.createdAt &&
          log.createdAt.toMillis() >= thirtyDaysAgoTimestamp.toMillis()
      ) ?? [];
      activeUsers = new Set(loginLogs.map((l) => l.userId).filter(Boolean)).size;
      loginRate = users?.length ? Math.round((activeUsers / users.length) * 100) : 0;

      return {
        totalPatients,
        newPatientsThisMonth,
        type1Patients,
        type2Patients,
        gestationalPatients,
        doctors,
        nurses,
        admins,
        totalReadings,
        avgDailyReadings,
        normalReadings,
        warningReadings,
        criticalReadings,
        normalPercentage,
        criticalPercentage,
        ageGroups,
        genderDistribution,
        loginRate,
        adherenceRate: null as number | null,
        avgResponseTime: null as number | null,
        improvementRate: null as number | null,
      };
    } catch {
      return {
        totalPatients: 0,
        newPatientsThisMonth: 0,
        type1Patients: 0,
        type2Patients: 0,
        gestationalPatients: 0,
        doctors: 0,
        nurses: 0,
        admins: 0,
        totalReadings: 0,
        avgDailyReadings: 0,
        normalReadings: 0,
        warningReadings: 0,
        criticalReadings: 0,
        normalPercentage: 0,
        criticalPercentage: 0,
        ageGroups: { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "80+": 0 },
        genderDistribution: { male: 0, female: 0 },
        loginRate: 0,
        adherenceRate: null as number | null,
        avgResponseTime: null as number | null,
        improvementRate: null as number | null,
      };
    }
  }, [filteredPatients, users, auditLogs, readings]);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  const chartDiabetesTypePie = useMemo(
    () => [
      { name: "Type 1", value: stats.type1Patients },
      { name: "Type 2", value: stats.type2Patients },
      { name: "Gestationnel", value: stats.gestationalPatients },
    ].filter((d) => d.value > 0),
    [stats.type1Patients, stats.type2Patients, stats.gestationalPatients]
  );

  const chartAgeBar = useMemo(
    () =>
      ["0-20", "21-40", "41-60", "61-80", "80+"].map((name) => ({
        name,
        value: stats.ageGroups[name as keyof typeof stats.ageGroups],
      })),
    [stats.ageGroups]
  );

  const chartGenderPie = useMemo(
    () => [
      { name: "Homme", value: stats.genderDistribution.male },
      { name: "Femme", value: stats.genderDistribution.female },
    ].filter((d) => d.value > 0),
    [stats.genderDistribution]
  );

  const chartRolePie = useMemo(
    () => [
      { name: "Médecins", value: stats.doctors },
      { name: "Infirmières", value: stats.nurses },
      { name: "Admins", value: stats.admins },
    ].filter((d) => d.value > 0),
    [stats.doctors, stats.nurses, stats.admins]
  );

  const chartReadingsTrendLine = useMemo(() => {
    const dayCounts = new Map<string, number>();
    const list = readings ?? [];
    list.forEach((r) => {
      const d = r.date?.toDate?.();
      if (!d || d < thirtyDaysAgo) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
    });
    return Array.from(dayCounts.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [readings]);

  const chartMonthlyBar = useMemo(() => {
    const monthCounts = new Map<string, number>();
    const list = readings ?? [];
    list.forEach((r) => {
      const d = r.date?.toDate?.();
      if (!d || d < sixMonthsAgo) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    });
    const months: { name: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        name: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        value: monthCounts.get(key) ?? 0,
      });
    }
    return months;
  }, [readings]);

  const chartPatientGrowthArea = useMemo(() => {
    const monthCounts = new Map<string, number>();
    filteredPatients.forEach((p) => {
      const d = p.createdAt?.toDate?.();
      if (!d || d < sixMonthsAgo) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    });
    const months: { month: string; patients: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        month: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        patients: monthCounts.get(key) ?? 0,
      });
    }
    return months;
  }, [filteredPatients]);

  const chartReadingsStatusDoughnut = useMemo(
    () => [
      { name: "Normal", value: stats.normalReadings },
      { name: "Avertissement", value: stats.warningReadings },
      { name: "Critique", value: stats.criticalReadings },
    ].filter((d) => d.value > 0),
    [stats.normalReadings, stats.warningReadings, stats.criticalReadings]
  );

  const chartReadingsTypeBar = useMemo(() => {
    const byType = new Map<string, number>();
    (readings ?? []).forEach((r) => {
      const t = r.readingType ?? "random";
      byType.set(t, (byType.get(t) ?? 0) + 1);
    });
    return Array.from(byType.entries()).map(([k, value]) => ({
      name: READING_TYPE_LABELS[k] ?? k,
      value,
    }));
  }, [readings]);

  const heatmapDayOrder = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const getDayLabel = (d: Date) => heatmapDayOrder[(d.getDay() + 6) % 7];
  const chartHeatmap = useMemo(() => {
    const grid = new Map<string, number>();
    (readings ?? []).forEach((r) => {
      const d = r.date?.toDate?.();
      if (!d) return;
      const day = getDayLabel(d);
      let hour = 0;
      if (typeof r.time === "string" && /^\d{1,2}/.test(r.time)) {
        hour = parseInt(r.time.slice(0, 2), 10);
        if (hour > 23) hour = 23;
      }
      const key = `${day}-${hour}`;
      grid.set(key, (grid.get(key) ?? 0) + 1);
    });
    return Array.from(grid.entries()).map(([k, value]) => {
      const [day, h] = k.split("-");
      return { day, hour: parseInt(h, 10), value };
    });
  }, [readings]);

  const chartUserActivityBar = useMemo(() => {
    const loginCounts = new Map<string, number>();
    const loginLogs = auditLogs?.filter((l) => l.action === "login") ?? [];
    loginLogs.forEach((l) => {
      const id = l.userId ?? "";
      loginCounts.set(id, (loginCounts.get(id) ?? 0) + 1);
    });
    const userIds = Array.from(loginCounts.keys());
    return userIds.map((id) => {
      const u = users?.find((x) => x.id === id);
      const label = u ? `${u.firstName} ${u.lastName}`.trim() || u.email : id || "—";
      return { name: label, value: loginCounts.get(id) ?? 0 };
    }).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [auditLogs, users]);

  const loading = patientsLoading || usersLoading || auditLogsLoading || readingsLoading;
  const errors = [patientsError, usersError, auditLogsError, readingsError].filter(Boolean) as Error[];
  const hasError = errors.length > 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (hasError) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {errors.map((error, index) => (
            <ErrorMessage
              key={index}
              message={`Erreur lors du chargement des statistiques: ${error.message}`}
            />
          ))}
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Statistiques détaillées</h1>
          <p className="text-muted-foreground mt-1">
            Analyse approfondie des données du système avec graphiques et indicateurs de performance
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="readings">Mesures</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="kpis">KPIs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total patients"
                value={stats.totalPatients.toString()}
                icon={Users}
                iconColor="text-primary"
              />
              <StatsCard
                title="Nouveaux patients (mois)"
                value={stats.newPatientsThisMonth.toString()}
                icon={UserPlus}
                iconColor="text-success"
              />
              <StatsCard
                title="Total mesures"
                value={stats.totalReadings.toString()}
                icon={ClipboardList}
                iconColor="text-primary"
              />
              <StatsCard
                title="Moyenne quotidienne"
                value={stats.avgDailyReadings.toString()}
                icon={TrendingUp}
                iconColor="text-primary"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <ChartCard
                title="Tendance des mesures"
                type="line"
                data={chartReadingsTrendLine}
                config={{ xAxisKey: "date", lines: [{ key: "value", name: "Mesures" }] }}
              />
              <ChartCard title="Répartition par type de diabète" type="pie" data={chartDiabetesTypePie} />
              <ChartCard
                title="Comparaison mensuelle"
                type="bar"
                data={chartMonthlyBar}
                config={{ xAxisKey: "name", bars: [{ key: "value", name: "Mesures" }] }}
              />
              <ChartCard
                title="Distribution des âges"
                type="bar"
                data={chartAgeBar}
                config={{ xAxisKey: "name", bars: [{ key: "value", name: "Patients" }] }}
              />
            </div>
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard title="Total patients" value={stats.totalPatients.toString()} icon={Users} />
              <StatsCard title="Nouveaux (mois)" value={stats.newPatientsThisMonth.toString()} icon={UserPlus} />
              <StatsCard title="Type 1" value={stats.type1Patients.toString()} icon={UserCircle} />
              <StatsCard title="Type 2" value={stats.type2Patients.toString()} icon={UserCircle} />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <ChartCard
                title="Distribution des âges"
                type="bar"
                data={chartAgeBar}
                config={{ xAxisKey: "name", bars: [{ key: "value", name: "Patients" }] }}
              />
              <ChartCard title="Distribution par sexe" type="pie" data={chartGenderPie} />
              <ChartCard title="Distribution types diabète" type="doughnut" data={chartDiabetesTypePie} />
              <ChartCard
                title="Croissance patients"
                type="area"
                data={chartPatientGrowthArea}
                config={{ xAxisKey: "month", areas: [{ key: "patients", name: "Patients" }] }}
              />
            </div>
          </TabsContent>

          <TabsContent value="readings" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard title="Total mesures" value={stats.totalReadings.toString()} icon={ClipboardList} />
              <StatsCard title="Moyenne quotidienne" value={stats.avgDailyReadings.toString()} icon={TrendingUp} />
              <StatsCard title="Mesures normales" value={stats.normalReadings.toString()} icon={Activity} iconColor="text-success" />
              <StatsCard title="Cas critiques" value={stats.criticalReadings.toString()} icon={AlertTriangle} iconColor="text-destructive" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <ChartCard
                title="Tendance des mesures"
                type="line"
                data={chartReadingsTrendLine}
                config={{ xAxisKey: "date", lines: [{ key: "value", name: "Mesures" }] }}
              />
              <ChartCard title="Distribution par état" type="doughnut" data={chartReadingsStatusDoughnut} />
              <ChartCard
                title="Distribution par type"
                type="bar"
                data={chartReadingsTypeBar}
                config={{ xAxisKey: "name", bars: [{ key: "value", name: "Mesures" }] }}
              />
              <ChartCard title="Distribution par heure" type="heatmap" data={chartHeatmap} />
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard title="Médecins actifs" value={stats.doctors.toString()} icon={UserCheck} />
              <StatsCard title="Infirmières actives" value={stats.nurses.toString()} icon={UserCircle} />
              <StatsCard title="Taux connexion" value={`${stats.loginRate}%`} icon={Activity} />
              <StatsCard title="Taux activité" value={`${stats.loginRate}%`} icon={TrendingUp} />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <ChartCard
                title="Activité utilisateurs"
                type="bar"
                data={chartUserActivityBar}
                config={{ xAxisKey: "name", bars: [{ key: "value", name: "Connexions" }] }}
              />
              <ChartCard title="Répartition par rôle" type="pie" data={chartRolePie} />
            </div>
          </TabsContent>

          <TabsContent value="kpis" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Taux adhésion mesures"
                value={stats.adherenceRate != null ? `${stats.adherenceRate}%` : "—"}
                target="90%"
                description="Objectif: 90%"
                icon={CheckCircle2}
              />
              <KPICard
                title="Temps réponse moyen"
                value={stats.avgResponseTime != null ? `${stats.avgResponseTime}h` : "—"}
                target="2h"
                description="Objectif: 2h"
                icon={Clock}
              />
              <KPICard
                title="% Amélioration"
                value={stats.improvementRate != null ? `+${stats.improvementRate}%` : "—"}
                target="+15%"
                description="Objectif: +15%"
                icon={TrendingUp}
              />
              <KPICard
                title="Taux cas critiques"
                value={`${stats.criticalPercentage}%`}
                target="<3%"
                description="Objectif: <3%"
                icon={AlertTriangle}
              />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Taux d'adhésion</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.adherenceRate != null ? (
                    <GaugeChart
                      value={stats.adherenceRate}
                      min={0}
                      max={100}
                      thresholds={{ low: 50, medium: 70, high: 90 }}
                      label="Adhésion"
                      unit="%"
                    />
                  ) : (
                    <p className="text-muted-foreground text-sm py-8 text-center">Non disponible</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">% Amélioration</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.improvementRate != null ? (
                    <GaugeChart
                      value={stats.improvementRate}
                      min={0}
                      max={30}
                      thresholds={{ low: 5, medium: 10, high: 20 }}
                      label="Amélioration"
                      unit="%"
                    />
                  ) : (
                    <p className="text-muted-foreground text-sm py-8 text-center">Non disponible</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Taux cas critiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <GaugeChart
                    value={stats.criticalPercentage}
                    min={0}
                    max={20}
                    thresholds={{ low: 3, medium: 7, high: 15 }}
                    label="Critiques"
                    unit="%"
                  />
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <ChartCard title="Évolution KPIs" type="line" />
              <ChartCard title="Comparaison objectifs" type="bar" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
