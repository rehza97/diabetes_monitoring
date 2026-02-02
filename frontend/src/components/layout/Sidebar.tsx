import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  FileText,
  BarChart3,
  Settings,
  Bell,
  HelpCircle,
  ClipboardList,
  Activity,
  Stethoscope,
  Menu,
  X,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Utilisateurs", href: "/dashboard/users", icon: Users },
  { name: "Patients", href: "/dashboard/patients", icon: UserCircle },
  { name: "Lectures", href: "/dashboard/readings", icon: ClipboardList },
  { name: "Planning des mesures", href: "/dashboard/scheduled-readings", icon: Calendar },
  { name: "Rapports", href: "/dashboard/reports", icon: FileText },
  { name: "Statistiques", href: "/dashboard/statistics", icon: BarChart3 },
  { name: "Journal d'audit", href: "/dashboard/audit-log", icon: Activity },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
  { name: "Support", href: "/dashboard/support", icon: HelpCircle },
];

export function Sidebar() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavContent = () => (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-border flex-col h-screen sticky top-0">
        <div className="flex h-16 items-center border-b border-border px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              Monitoring Diabète
            </h1>
          </div>
        </div>
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-16 items-center border-b border-border px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-lg font-semibold text-foreground">
                Monitoring Diabète
              </h1>
            </div>
          </div>
          <NavContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
