import { ChartCard } from "@/components/dashboard/ChartCard";

interface ReadingChartProps {
  patientId?: string;
  type?: "line" | "bar" | "area";
}

export function ReadingChart({ patientId, type = "line" }: ReadingChartProps) {
  return (
    <ChartCard
      title={patientId ? "Historique des lectures" : "Tendances des lectures"}
      type={type}
    />
  );
}
