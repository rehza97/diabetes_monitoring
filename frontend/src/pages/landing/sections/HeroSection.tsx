import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-20 md:py-32"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-6 mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left column - Text content */}
          <div className="text-center lg:text-left space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              MVP - Développement de base - 6 semaines
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Système de Monitoring du Diabète
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              La solution intelligente pour gérer les patients diabétiques. Plateforme intégrée
              pour les médecins et infirmières pour enregistrer et suivre les mesures de glycémie
              efficacement et en toute sécurité.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Button size="lg" asChild className="group">
                <Link to="/login">
                  Commencer maintenant
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="group"
                onClick={(e) => {
                  e.preventDefault();
                  const ctaSection = document.getElementById("cta");
                  if (ctaSection) {
                    ctaSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                <a href="#cta">
                  <Play className="mr-2 h-4 w-4" />
                  Demander une démo
                </a>
              </Button>
            </div>
          </div>

          {/* Right column - Image/Illustration placeholder */}
          <div className="relative lg:block hidden animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
            <div className="relative aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-2xl" />
              <div className="relative bg-card border-2 border-primary/20 rounded-2xl p-8 shadow-2xl flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">🩺</div>
                  <p className="text-muted-foreground text-sm">
                    Illustration de l'application
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
