import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, CheckCircle2, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info" | "success";
  title: string;
  message: string;
  timestamp: Date | string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

interface AlertCardProps {
  alert: Alert;
  onDismiss?: () => void;
  className?: string;
}

const alertConfig = {
  critical: {
    icon: AlertTriangle,
    color: "bg-destructive/10 text-destructive border-destructive/20",
    iconColor: "text-destructive",
  },
  warning: {
    icon: AlertCircle,
    color: "bg-warning/10 text-warning border-warning/20",
    iconColor: "text-warning",
  },
  info: {
    icon: Info,
    color: "bg-primary/10 text-primary border-primary/20",
    iconColor: "text-primary",
  },
  success: {
    icon: CheckCircle2,
    color: "bg-success/10 text-success border-success/20",
    iconColor: "text-success",
  },
};

export function AlertCard({ alert, onDismiss, className }: AlertCardProps) {
  const config = alertConfig[alert.type];
  const Icon = config.icon;
  const timestamp =
    alert.timestamp instanceof Date ? alert.timestamp : new Date(alert.timestamp);
  const handleDismiss = onDismiss ?? alert.onDismiss;

  return (
    <Card className={cn("border-2", config.color, className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Icon className={cn("h-5 w-5 mt-0.5", config.iconColor)} />
            <div className="flex-1">
              <CardTitle className="text-base font-semibold">{alert.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
            </div>
          </div>
          {handleDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
              aria-label="Fermer l'alerte"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(timestamp, { addSuffix: true, locale: fr })}
          </span>
          {alert.actionLabel && alert.onAction && (
            <Button size="sm" variant="outline" onClick={alert.onAction}>
              {alert.actionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface AlertListProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
  className?: string;
}

export function AlertList({ alerts, onDismiss, className }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-success" />
        <p>Aucune alerte</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onDismiss={onDismiss ? () => onDismiss(alert.id) : undefined}
        />
      ))}
    </div>
  );
}
