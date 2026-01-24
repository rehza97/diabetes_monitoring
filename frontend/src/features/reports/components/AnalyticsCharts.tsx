import { ChartCard } from "@/components/dashboard/ChartCard";

export function AnalyticsCharts() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChartCard title="Tendances" type="line" />
      <ChartCard title="Comparaisons" type="bar" />
    </div>
  );
}
