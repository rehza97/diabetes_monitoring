import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  description?: string;
  trend?: "up" | "down";
  icon?: LucideIcon;
  iconColor?: string;
  tooltip?: string;
}

export function StatsCard({
  title,
  value,
  change,
  description,
  trend,
  icon: Icon,
  iconColor = "text-primary",
  tooltip,
}: StatsCardProps) {
  const isPositive = trend === "up" || (change && !change.startsWith("-"));

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10", iconColor)}>
              <Icon className={cn("h-4 w-4", iconColor)} />
            </div>
          )}
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
        {change && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {trend === "down" ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <TrendingUp className="h-3 w-3" />
            )}
            <span>{change}</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
