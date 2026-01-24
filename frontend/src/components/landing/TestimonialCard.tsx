import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials } from "@/utils/helpers";

interface TestimonialCardProps {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
}

export function TestimonialCard({
  name,
  role,
  content,
  rating,
  avatar,
}: TestimonialCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card p-6 shadow-sm transition-all duration-300",
        "hover:shadow-lg hover:border-primary/50"
      )}
    >
      {/* Quote icon */}
      <div className="absolute top-4 right-4 text-primary/20">
        <Quote className="h-8 w-8" />
      </div>

      {/* Rating */}
      <div className="mb-4 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4 transition-colors",
              i < rating
                ? "fill-warning text-warning"
                : "fill-muted text-muted-foreground"
            )}
          />
        ))}
      </div>

      {/* Content */}
      <p className="mb-6 text-muted-foreground leading-relaxed relative z-10">
        "{content}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(name.split(" ")[0] || "", name.split(" ")[1] || "")}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold text-foreground">{name}</div>
          <div className="text-sm text-muted-foreground">{role}</div>
        </div>
      </div>
    </div>
  );
}

