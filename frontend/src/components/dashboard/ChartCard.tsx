import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { LineChart } from "./charts/LineChart";
import { BarChart } from "./charts/BarChart";
import { PieChart } from "./charts/PieChart";
import { DoughnutChart } from "./charts/DoughnutChart";
import { AreaChart } from "./charts/AreaChart";
import { HeatmapChart } from "./charts/HeatmapChart";

interface ChartCardProps {
  title: string;
  type: "line" | "bar" | "pie" | "doughnut" | "area" | "heatmap";
  data?: Array<Record<string, any>>;
  config?: Record<string, any>;
  onExport?: () => void;
  className?: string;
}

export function ChartCard({ title, type, data, config, onExport, className }: ChartCardProps) {
  const chartData = data || [];

  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <LineChart
            data={chartData}
            dataKey="value"
            lines={config?.lines || [{ key: "value", name: "Valeur" }]}
            xAxisKey={config?.xAxisKey || "date"}
          />
        );
      case "bar":
        return (
          <BarChart
            data={chartData as { name: string; value: number }[]}
            bars={config?.bars || [{ key: "value", name: "Valeur" }]}
            xAxisKey={config?.xAxisKey || "name"}
          />
        );
      case "pie":
        return <PieChart data={chartData as { name: string; value: number }[]} colors={config?.colors} />;
      case "doughnut":
        return <DoughnutChart data={chartData as { name: string; value: number }[]} colors={config?.colors} />;
      case "area":
        return (
          <AreaChart
            data={chartData as { name: string; value: number }[]}
            areas={config?.areas || [{ key: "patients", name: "Patients" }]}
            xAxisKey={config?.xAxisKey || "month"}
          />
        );
      case "heatmap":
        return <HeatmapChart data={chartData as { day: string; hour: number; value: number }[]} />;
      default:
        return <div className="text-muted-foreground">Type de graphique non supporté</div>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {onExport && (
          <Button variant="ghost" size="icon" onClick={onExport} aria-label="Exporter le graphique">
            <Download className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-64">{renderChart()}</div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Aucune donnée disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
}

