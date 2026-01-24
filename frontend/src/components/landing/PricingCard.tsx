import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  name: string;
  description: string;
  price: string;
  period?: string;
  features: string[];
  featured?: boolean;
}

export function PricingCard({
  name,
  description,
  price,
  period = "mois",
  features,
  featured = false,
}: PricingCardProps) {
  const handleCtaClick = () => {
    const ctaSection = document.getElementById("cta");
    if (ctaSection) {
      ctaSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card p-8 shadow-sm transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-1",
        featured && "border-primary shadow-lg ring-2 ring-primary/20"
      )}
    >
      {featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-warning px-4 py-1 text-sm font-semibold text-warning-foreground shadow-md">
          Populaire
        </div>
      )}
      <div className="mb-6">
        <h3 className="mb-2 text-2xl font-bold">{name}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-primary">{price}</span>
          {price !== "Sur mesure" && period && (
            <span className="text-muted-foreground">/{period}</span>
          )}
        </div>
        {price !== "Sur mesure" && (
          <p className="text-sm text-muted-foreground mt-1">Facturation mensuelle</p>
        )}
      </div>
      <ul className="mb-8 space-y-3 min-h-[200px]">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="mt-0.5 h-5 w-5 text-success flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        className={cn("w-full", featured && "bg-primary hover:bg-primary/90")}
        variant={featured ? "default" : "outline"}
        onClick={handleCtaClick}
        aria-label={`Choisir le plan ${name}`}
      >
        Choisir ce plan
      </Button>
    </div>
  );
}
