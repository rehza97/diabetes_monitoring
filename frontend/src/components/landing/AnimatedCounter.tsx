import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";
import type { ComponentType, SVGProps } from "react";

type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  icon?: LucideIcon;
  className?: string;
  duration?: number;
}

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  label,
  icon: Icon,
  className,
  duration = 2000,
}: AnimatedCounterProps) {
  const { count, elementRef } = useCountUp(value, { duration, startOnView: true });

  return (
    <div
      ref={elementRef}
      className={cn("text-center space-y-2", className)}
      aria-label={`${label}: ${value}${suffix}`}
    >
      {Icon && (
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>
        </div>
      )}
      <div className="text-4xl md:text-5xl font-bold text-primary">
        {prefix}
        {count.toLocaleString("fr-FR")}
        {suffix}
      </div>
      <div className="text-muted-foreground font-medium">{label}</div>
    </div>
  );
}
