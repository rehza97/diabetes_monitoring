import { StatsCard } from "./StatsCard";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  description?: string;
  trend?: "up" | "down";
  icon?: LucideIcon;
  iconColor?: string;
  tooltip?: string;
  target?: string | number;
}

export function KPICard(props: KPICardProps) {
  return (
    <div className="relative">
      <StatsCard {...props} />
      {props.target && (
        <div className="absolute top-2 right-2 text-xs text-muted-foreground">
          Cible: {props.target}
        </div>
      )}
    </div>
  );
}
