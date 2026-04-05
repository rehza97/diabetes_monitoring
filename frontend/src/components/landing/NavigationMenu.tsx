import type React from "react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationMenuProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
  dashboardPath?: string;
}

const navigationItems = [
  { label: "Accueil", href: "#hero", id: "hero" },
  { label: "Fonctionnalités", href: "#features", id: "features" },
  { label: "Comment ça marche", href: "#how-it-works", id: "how-it-works" },
  { label: "Aperçu", href: "#screenshots", id: "screenshots" },
  { label: "Tarification", href: "#pricing", id: "pricing" },
  { label: "Témoignages", href: "#testimonials", id: "testimonials" },
  { label: "FAQ", href: "#faq", id: "faq" },
];

export function NavigationMenu({
  isAuthenticated = false,
  onLogout,
  dashboardPath = "/dashboard",
}: NavigationMenuProps) {
  const [activeSection, setActiveSection] = useState("hero");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Détecter la section active en fonction du milieu de la fenêtre
      const viewportMiddle = window.scrollY + window.innerHeight / 2;
      const sections = navigationItems.map((item) => item.id);

      let closestId = sections[0];
      let smallestDistance = Number.POSITIVE_INFINITY;

      for (const id of sections) {
        const section = document.getElementById(id);
        if (!section) continue;
        const sectionTop = section.offsetTop;
        const distance = Math.abs(sectionTop - viewportMiddle);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestId = id;
        }
      }

      if (closestId) {
        setActiveSection(closestId);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(targetId);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 transition-shadow",
        isScrolled && "shadow-sm"
      )}
    >
      <div className="container px-6 lg:px-12 mx-auto max-w-7xl flex h-20 lg:h-24 items-center justify-between gap-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
          aria-label="Retour à l'accueil"
        >
          <span className="text-2xl">🩺</span>
          <span className="hidden sm:inline">SMDiabète</span>
          <span className="sm:hidden">Monitoring Diabète</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-5">
          {navigationItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => handleSmoothScroll(e, item.href)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                activeSection === item.id
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              aria-current={activeSection === item.id ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-5 ml-6">
          {isAuthenticated ? (
            <>
              <Button asChild variant="outline" className="hidden sm:flex">
                <Link to={dashboardPath}>Tableau de bord</Link>
              </Button>
              <Button
                className="hidden sm:flex"
                variant="default"
                onClick={() => {
                  onLogout?.();
                }}
              >
                Déconnexion
              </Button>
            </>
          ) : (
            <Button asChild className="hidden sm:flex">
              <Link to="/login">Connexion</Link>
            </Button>
          )}
          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                {navigationItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => handleSmoothScroll(e, item.href)}
                    className={cn(
                      "px-4 py-3 text-base font-medium rounded-md transition-colors",
                      activeSection === item.id
                        ? "text-primary bg-primary/10"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="pt-4 border-t">
                  {isAuthenticated ? (
                    <div className="flex flex-col gap-2">
                      <Button asChild className="w-full" variant="outline">
                        <Link to={dashboardPath}>Tableau de bord</Link>
                      </Button>
                      <Button
                        className="w-full"
                        variant="default"
                        onClick={() => {
                          onLogout?.();
                        }}
                      >
                        Déconnexion
                      </Button>
                    </div>
                  ) : (
                    <Button asChild className="w-full">
                      <Link to="/login">Connexion</Link>
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
