import { Fragment } from "react";
import { cn } from "@/lib/utils";

interface HeatmapChartProps {
  data: Array<{ day: string; hour: number; value: number }>;
  className?: string;
  height?: number;
}

export function HeatmapChart({
  data,
  className,
  height = 300,
}: HeatmapChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full text-muted-foreground", className)}>
        Aucune donnée disponible
      </div>
    );
  }

  // Organiser les données par jour et heure
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getValue = (day: string, hour: number) => {
    const item = data.find((d) => d.day === day && d.hour === hour);
    return item?.value || 0;
  };

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const getIntensity = (value: number) => {
    if (value === 0) return "bg-muted";
    const intensity = Math.floor((value / maxValue) * 5);
    const intensities = [
      "bg-primary/20",
      "bg-primary/40",
      "bg-primary/60",
      "bg-primary/80",
      "bg-primary",
    ];
    return intensities[Math.min(intensity, 4)];
  };

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <div className="grid grid-cols-25 gap-1 p-4">
        {/* Header avec heures */}
        <div></div>
        {hours.map((hour) => (
          <div key={hour} className="text-xs text-muted-foreground text-center">
            {hour}h
          </div>
        ))}

        {/* Lignes pour chaque jour */}
        {days.map((day) => (
          <Fragment key={day}>
            <div className="text-xs text-muted-foreground flex items-center">
              {day}
            </div>
            {hours.map((hour) => {
              const value = getValue(day, hour);
              return (
                <div
                  key={`${day}-${hour}`}
                  className={cn(
                    "aspect-square rounded-sm border border-border transition-colors hover:border-primary",
                    getIntensity(value)
                  )}
                  title={`${day} ${hour}h: ${value} mesures`}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
