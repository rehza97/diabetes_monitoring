import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";

type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card p-6 shadow-sm transition-all duration-300",
        "hover:shadow-lg hover:border-primary/50 hover:-translate-y-1",
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
      )}
    >
      <div
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300",
          "group-hover:bg-primary group-hover:scale-110"
        )}
      >
        <Icon
          className={cn(
            "h-6 w-6 text-primary transition-all duration-300",
            "group-hover:text-primary-foreground group-hover:scale-110"
          )}
        />
      </div>
      <h3 className="mb-2 text-xl font-semibold transition-colors group-hover:text-primary">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
