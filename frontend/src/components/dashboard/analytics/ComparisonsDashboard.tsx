import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Users, UserCheck, UserCircle, Activity } from "lucide-react";
import { format } from "date-fns";

type PatientLike = { id: string; doctorId?: string; nurseId?: string; diabetesType?: string };
type UserLike = { id: string; firstName: string; lastName: string; role: string };
type ReadingLike = { value?: number; patientId?: string; date?: { toDate?: () => Date }; status?: string };

function formatName(first: string, last: string) {
  return `${first || ""} ${last || ""}`.trim() || "—";
}

interface ComparisonsDashboardProps {
  patients: PatientLike[];
  users: UserLike[];
  readings: ReadingLike[];
  loading: boolean;
}

export function ComparisonsDashboard({ patients, users, readings, loading }: ComparisonsDashboardProps) {
  const [comparisonType, setComparisonType] = useState<
    "doctors" | "nurses" | "periods" | "diabetes_types"
  >("doctors");

  const doctors = useMemo(() => users.filter((u) => u.role === "doctor"), [users]);
  const nurses = useMemo(() => users.filter((u) => u.role === "nurse"), [users]);
  const patientsMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  const byDoctor = useMemo(() => {
    const map: Record<string, { patients: Set<string>; readings: number }> = {};
    for (const p of patients) {
      const did = p.doctorId || "";
      if (!did) continue;
      if (!map[did]) map[did] = { patients: new Set(), readings: 0 };
      map[did].patients.add(p.id);
    }
    for (const r of readings) {
      const p = r.patientId ? patientsMap.get(r.patientId) : null;
      const did = p?.doctorId || "";
      if (did && map[did]) map[did].readings++;
    }
    return map;
  }, [patients, readings, patientsMap]);

  const byNurse = useMemo(() => {
    const map: Record<string, { patients: Set<string>; readings: number }> = {};
    for (const p of patients) {
      const nid = p.nurseId || "";
      if (!nid) continue;
      if (!map[nid]) map[nid] = { patients: new Set(), readings: 0 };
      map[nid].patients.add(p.id);
    }
    for (const r of readings) {
      const p = r.patientId ? patientsMap.get(r.patientId) : null;
      const nid = p?.nurseId || "";
      if (nid && map[nid]) map[nid].readings++;
    }
    return map;
  }, [patients, readings, patientsMap]);

  const doctorsData = useMemo(
    () =>
      doctors.map((d) => ({
        name: formatName(d.firstName, d.lastName),
        patients: byDoctor[d.id]?.patients.size ?? 0,
        readings: byDoctor[d.id]?.readings ?? 0,
        avgResponse: "—",
      })),
    [doctors, byDoctor]
  );

  const nursesData = useMemo(
    () =>
      nurses.map((n) => ({
        name: formatName(n.firstName, n.lastName),
        patients: byNurse[n.id]?.patients.size ?? 0,
        readings: byNurse[n.id]?.readings ?? 0,
        avgResponse: "—",
      })),
    [nurses, byNurse]
  );

  const periodsData = useMemo(() => {
    const byMonth: Record<string, { readings: number; sum: number; critical: number }> = {};
    for (const r of readings) {
      const d = r.date?.toDate?.();
      const key = d ? format(d, "yyyy-MM") : "";
      if (!key) continue;
      if (!byMonth[key]) byMonth[key] = { readings: 0, sum: 0, critical: 0 };
      byMonth[key].readings++;
      byMonth[key].sum += r.value ?? 0;
      if (r.status === "critical") byMonth[key].critical++;
    }
    return Object.entries(byMonth)
      .map(([period, s]) => ({
        period,
        readings: s.readings,
        avgValue: s.readings ? Math.round((s.sum / s.readings) * 10) / 10 : 0,
        critical: s.critical,
      }))
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-12);
  }, [readings]);

  const diabetesTypesData = useMemo(() => {
    const byType: Record<string, { patients: Set<string>; readings: number; sum: number }> = {};
    for (const p of patients) {
      const t = p.diabetesType || "non spécifié";
      if (!byType[t]) byType[t] = { patients: new Set(), readings: 0, sum: 0 };
      byType[t].patients.add(p.id);
    }
    for (const r of readings) {
      const p = r.patientId ? patientsMap.get(r.patientId) : null;
      const t = p?.diabetesType || "non spécifié";
      if (byType[t]) {
        byType[t].readings++;
        byType[t].sum += r.value ?? 0;
      }
    }
    return Object.entries(byType).map(([type, s]) => ({
      type,
      patients: s.patients.size,
      avgReadings: s.patients.size ? Math.round((s.readings / s.patients.size) * 10) / 10 : 0,
      improvement: "—",
    }));
  }, [patients, readings, patientsMap]);

  const doctorsColumns = [
    { header: "Médecin", accessor: "name" as const },
    { header: "Patients", accessor: "patients" as const },
    { header: "Mesures", accessor: "readings" as const },
    { header: "Temps réponse moyen", accessor: "avgResponse" as const },
  ];

  const nursesColumns = [
    { header: "Infirmière", accessor: "name" as const },
    { header: "Patients", accessor: "patients" as const },
    { header: "Mesures", accessor: "readings" as const },
    { header: "Temps réponse moyen", accessor: "avgResponse" as const },
  ];

  const periodsColumns = [
    { header: "Période", accessor: "period" as const },
    { header: "Mesures", accessor: "readings" as const },
    { header: "Moyenne", accessor: "avgValue" as const },
    { header: "Cas critiques", accessor: "critical" as const },
  ];

  const diabetesTypesColumns = [
    { header: "Type", accessor: "type" as const },
    { header: "Patients", accessor: "patients" as const },
    { header: "Moyenne mesures", accessor: "avgReadings" as const },
    { header: "Amélioration", accessor: "improvement" as const },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard des comparaisons</h2>
          <p className="text-muted-foreground mt-1">
            Comparez les performances, périodes et types de diabète
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Label htmlFor="comparisonType">Type de comparaison:</Label>
          <Select
            value={comparisonType}
            onValueChange={(v) => setComparisonType(v as typeof comparisonType)}
          >
            <SelectTrigger id="comparisonType" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="doctors">Médecins</SelectItem>
              <SelectItem value="nurses">Infirmières</SelectItem>
              <SelectItem value="periods">Périodes</SelectItem>
              <SelectItem value="diabetes_types">Types diabète</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={comparisonType} onValueChange={(v) => setComparisonType(v as typeof comparisonType)}>
        <TabsList>
          <TabsTrigger value="doctors">
            <UserCheck className="h-4 w-4 mr-2" />
            Médecins
          </TabsTrigger>
          <TabsTrigger value="nurses">
            <UserCircle className="h-4 w-4 mr-2" />
            Infirmières
          </TabsTrigger>
          <TabsTrigger value="periods">
            <Activity className="h-4 w-4 mr-2" />
            Périodes
          </TabsTrigger>
          <TabsTrigger value="diabetes_types">
            <Users className="h-4 w-4 mr-2" />
            Types diabète
          </TabsTrigger>
        </TabsList>

        <TabsContent value="doctors" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ChartCard
              title="Comparaison nombre de patients par médecin"
              type="bar"
              data={doctorsData.map((d) => ({ name: d.name, value: d.patients }))}
              config={{ xAxisKey: "name", bars: [{ key: "value", name: "Patients" }] }}
            />
            <ChartCard
              title="Comparaison nombre de mesures par médecin"
              type="bar"
              data={doctorsData.map((d) => ({ name: d.name, value: d.readings }))}
              config={{ xAxisKey: "name", bars: [{ key: "value", name: "Mesures" }] }}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Tableau comparatif des médecins</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={doctorsColumns} data={doctorsData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nurses" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ChartCard
              title="Comparaison nombre de patients par infirmière"
              type="bar"
              data={nursesData.map((n) => ({ name: n.name, value: n.patients }))}
              config={{ xAxisKey: "name", bars: [{ key: "value", name: "Patients" }] }}
            />
            <ChartCard
              title="Comparaison nombre de mesures par infirmière"
              type="bar"
              data={nursesData.map((n) => ({ name: n.name, value: n.readings }))}
              config={{ xAxisKey: "name", bars: [{ key: "value", name: "Mesures" }] }}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Tableau comparatif des infirmières</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={nursesColumns} data={nursesData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="periods" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ChartCard
              title="Évolution des mesures par période"
              type="bar"
              data={periodsData.map((p) => ({ name: p.period, value: p.readings }))}
              config={{ xAxisKey: "name", bars: [{ key: "value", name: "Mesures" }] }}
            />
            <ChartCard
              title="Évolution des cas critiques"
              type="line"
              data={periodsData.map((p) => ({ date: p.period, value: p.critical }))}
              config={{ xAxisKey: "date", lines: [{ key: "value", name: "Cas critiques" }] }}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Comparaison des périodes</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={periodsColumns} data={periodsData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diabetes_types" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ChartCard
              title="Distribution par type de diabète"
              type="pie"
              data={diabetesTypesData.map((d) => ({ name: d.type, value: d.patients }))}
            />
            <ChartCard
              title="Moyennes par type de diabète"
              type="bar"
              data={diabetesTypesData.map((d) => ({ name: d.type, value: d.avgReadings }))}
              config={{ xAxisKey: "name", bars: [{ key: "value", name: "Moy. mesures" }] }}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Comparaison des types de diabète</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={diabetesTypesColumns} data={diabetesTypesData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
