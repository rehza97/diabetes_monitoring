import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { getInitials } from "@/utils/helpers";
import { cn } from "@/lib/utils";
import {
  UserPlus,
  ClipboardList,
  Bell,
  LogIn,
  FileText,
  Activity as ActivityIcon,
} from "lucide-react";

interface Activity {
  id: string;
  type: "reading" | "patient_added" | "notification" | "login" | "report" | "other";
  user: {
    name: string;
    avatar?: string;
    role: string;
  };
  action: string;
  timestamp: Date | string;
  relatedEntity?: {
    type: string;
    id: string;
    name?: string;
  };
}

interface ActivityTableProps {
  activities?: Activity[];
  limit?: number;
}

const activityIcons = {
  reading: ClipboardList,
  patient_added: UserPlus,
  notification: Bell,
  login: LogIn,
  report: FileText,
  other: ActivityIcon,
};

const activityColors = {
  reading: "bg-primary/10 text-primary",
  patient_added: "bg-success/10 text-success",
  notification: "bg-warning/10 text-warning",
  login: "bg-muted text-muted-foreground",
  report: "bg-secondary/10 text-secondary",
  other: "bg-muted text-muted-foreground",
};

export function ActivityTable({ activities = [], limit = 10 }: ActivityTableProps) {
  const displayActivities = activities.slice(0, limit);

  if (displayActivities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ActivityIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucune activité récente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayActivities.map((activity) => {
        const Icon = activityIcons[activity.type] || ActivityIcon;
        const colorClass = activityColors[activity.type] || activityColors.other;
        const timestamp =
          activity.timestamp instanceof Date
            ? activity.timestamp
            : new Date(activity.timestamp);

        return (
          <div
            key={activity.id}
            className="flex items-start gap-4 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
          >
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", colorClass)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={activity.user.avatar} />
                  <AvatarFallback className="text-xs">
                    {getInitials(activity.user.name.split(" ")[0] || "", activity.user.name.split(" ")[1] || "")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{activity.user.name}</span>
                <Badge variant="outline" className="text-xs">
                  {activity.user.role}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{activity.action}</p>
              {activity.relatedEntity && (
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.relatedEntity.type}: {activity.relatedEntity.name || activity.relatedEntity.id}
                </p>
              )}
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(timestamp, { addSuffix: true, locale: fr })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
