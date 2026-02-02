import type { ReactNode } from "react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: "fade-in" | "slide-up" | "slide-left" | "slide-right";
  delay?: number;
}

export function AnimatedSection({
  children,
  className,
  animation = "fade-in",
  delay = 0,
}: AnimatedSectionProps) {
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  });

  const animationClasses = {
    "fade-in": isIntersecting
      ? "opacity-100 transition-opacity duration-700"
      : "opacity-0",
    "slide-up": isIntersecting
      ? "opacity-100 translate-y-0 transition-all duration-700"
      : "opacity-0 translate-y-4",
    "slide-left": isIntersecting
      ? "opacity-100 translate-x-0 transition-all duration-700"
      : "opacity-0 translate-x-4",
    "slide-right": isIntersecting
      ? "opacity-100 translate-x-0 transition-all duration-700"
      : "opacity-0 -translate-x-4",
  };

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(animationClasses[animation], className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
