import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { TrendingUp, TrendingDown, Calendar, Activity } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

type ReadingLike = { value?: number; date?: { toDate?: () => Date }; status?: string };

interface TrendsDashboardProps {
  patients: Array<{ id: string }>;
  users: Array<{ id: string }>;
  readings: ReadingLike[];
  loading: boolean;
}

export function TrendsDashboard({ readings, loading }: TrendsDashboardProps) {
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">("month");
  const [compareWithPrevious, setCompareWithPrevious] = useState(true);

  const periodDays = useMemo(() => {
    switch (period) {
      case "week": return 7;
      case "month": return 30;
      case "quarter": return 90;
      case "year": return 365;
      default: return 30;
    }
  }, [period]);

  const { currentAvg, previousAvg, improvementRate, deteriorationRate, trendData } = useMemo(() => {
    const now = new Date();
    const currentEnd = endOfDay(now);
    const currentStart = startOfDay(subDays(now, periodDays));
    const previousEnd = startOfDay(subDays(now, periodDays));
    const previousStart = startOfDay(subDays(now, periodDays * 2));

    const toMs = (r: ReadingLike) => {
      const d = r.date?.toDate?.();
      return d ? d.getTime() : 0;
    };
    const current = readings.filter((r) => {
      const ms = toMs(r);
      return ms >= currentStart.getTime() && ms <= currentEnd.getTime() && typeof r.value === "number";
    });
    const previous = readings.filter((r) => {
      const ms = toMs(r);
      return ms >= previousStart.getTime() && ms <= previousEnd.getTime() && typeof r.value === "number";
    });

    const sum = (arr: ReadingLike[]) => arr.reduce((a, r) => a + (r.value ?? 0), 0);
    const avg = (arr: ReadingLike[]) => (arr.length ? sum(arr) / arr.length : 0);
    const curr = avg(current);
    const prev = avg(previous);

    let improvementRate = 0;
    let deteriorationRate = 0;
    if (prev > 0 && curr !== prev) {
      const pct = Math.abs(((curr - prev) / prev) * 100);
      if (curr < prev) improvementRate = Math.round(pct * 10) / 10;
      else deteriorationRate = Math.round(pct * 10) / 10;
    }

    const byDate: Record<string, { sum: number; count: number }> = {};
    for (const r of readings) {
      const d = r.date?.toDate?.();
      const key = d ? format(d, "yyyy-MM-dd") : "";
      if (!key || typeof r.value !== "number") continue;
      if (!byDate[key]) byDate[key] = { sum: 0, count: 0 };
      byDate[key].sum += r.value;
      byDate[key].count++;
    }
    const trendData = Object.entries(byDate)
      .map(([date, s]) => ({ date, value: s.count ? Math.round((s.sum / s.count) * 10) / 10 : 0 }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-60);

    return {
      currentAvg: Math.round(curr * 10) / 10,
      previousAvg: Math.round(prev * 10) / 10,
      improvementRate,
      deteriorationRate,
      trendData,
    };
  }, [readings, periodDays]);

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
          <h2 className="text-2xl font-bold text-foreground">Dashboard des tendances</h2>
          <p className="text-muted-foreground mt-1">
            Analyse des tendances des mesures sur le temps avec détection des patterns
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <Label htmlFor="period">Période:</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <SelectTrigger id="period" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semaine</SelectItem>
                <SelectItem value="month">Mois</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Année</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant={compareWithPrevious ? "default" : "outline"}
            size="sm"
            onClick={() => setCompareWithPrevious(!compareWithPrevious)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Comparer avec période précédente
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Taux d'amélioration"
          value={improvementRate > 0 ? `+${improvementRate}%` : "—"}
          description="Amélioration moyenne des mesures"
          trend="up"
          icon={TrendingUp}
          iconColor="text-success"
        />
        <StatsCard
          title="Taux de détérioration"
          value={deteriorationRate > 0 ? `+${deteriorationRate}%` : "—"}
          description="Détérioration moyenne des mesures"
          trend="down"
          icon={TrendingDown}
          iconColor="text-destructive"
        />
        <StatsCard
          title="Moyenne actuelle"
          value={readings.length ? currentAvg.toString() : "—"}
          description="Moyenne des mesures (mg/dL)"
          icon={Activity}
          iconColor="text-primary"
        />
        <StatsCard
          title="Moyenne précédente"
          value={compareWithPrevious && readings.length ? previousAvg.toString() : "—"}
          description="Moyenne période précédente"
          icon={Activity}
          iconColor="text-muted-foreground"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard
          title="Tendance des mesures"
          type="line"
          data={trendData}
          config={{ xAxisKey: "date", lines: [{ key: "value", name: "Moyenne (mg/dL)" }] }}
        />
        <ChartCard
          title="Comparaison périodes"
          type="line"
          data={trendData}
          config={{ xAxisKey: "date", lines: [{ key: "value", name: "Valeur" }], showLegend: true }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribution mensuelle des mesures</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartCard
            title="Moyenne par jour"
            type="bar"
            data={trendData}
            config={{ xAxisKey: "date", bars: [{ key: "value", name: "Moyenne mg/dL" }] }}
          />
          {!readings.length && (
            <p className="mt-4 text-sm text-muted-foreground">
              Aucune donnée disponible. Les tendances s’afficheront lorsque des mesures seront enregistrées.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
