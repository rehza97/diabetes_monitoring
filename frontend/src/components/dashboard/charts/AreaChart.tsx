import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface AreaChartProps {
  data: Array<Record<string, any>>;
  areas: Array<{ key: string; name: string; color?: string }>;
  xAxisKey?: string;
  className?: string;
  height?: number;
}

export function AreaChart({
  data,
  areas,
  xAxisKey = "date",
  className,
  height = 300,
}: AreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full text-muted-foreground", className)}>
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <RechartsAreaChart data={data}>
        <defs>
          {areas.map((area, index) => (
            <linearGradient key={area.key} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={area.color || "hsl(var(--primary))"} stopOpacity={0.8} />
              <stop offset="95%" stopColor={area.color || "hsl(var(--primary))"} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey={xAxisKey}
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Legend />
        {areas.map((area, index) => (
          <Area
            key={area.key}
            type="monotone"
            dataKey={area.key}
            name={area.name}
            stroke={area.color || "hsl(var(--primary))"}
            fill={`url(#color${index})`}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
