import { CheckCircle2, UserPlus, Users, ClipboardList, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const stepIcons = [UserPlus, Users, ClipboardList, BarChart3];

interface TimelineItemProps {
  index: number;
  title: string;
  items: string[];
  isLast?: boolean;
}

export function TimelineItem({ index, title, items, isLast = false }: TimelineItemProps) {
  const Icon = stepIcons[index] || CheckCircle2;

  return (
    <div className="relative">
      {/* Timeline line - visible on desktop */}
      {!isLast && (
        <div className="hidden lg:block absolute left-8 top-16 w-0.5 h-full bg-primary/20" />
      )}

      <div className="flex gap-6">
        {/* Icon/Number circle */}
        <div className="flex-shrink-0">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground",
              "shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl",
              "ring-4 ring-primary/20"
            )}
          >
            <Icon className="h-8 w-8" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 pb-12">
          <h3 className="mb-4 text-xl font-semibold text-foreground">{title}</h3>
          <ul className="space-y-2">
            {items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
