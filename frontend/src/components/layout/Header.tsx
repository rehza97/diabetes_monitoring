import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, LogOut, Settings, User, CheckCheck, Moon, Sun, Search } from "lucide-react";
import { getInitials, formatFullName } from "@/utils/helpers";
import { NavigationMenu } from "@/components/landing/NavigationMenu";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { notifications, markAsRead, markAllAsRead } = useNotification();
  const { setTheme, resolvedTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isLandingPage = location.pathname === "/";
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  // Keyboard shortcut for global search (Ctrl+K or Cmd+K)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
      if (e.key === "Escape" && globalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthenticated, globalSearchOpen]);

  // Pour la landing page, toujours utiliser NavigationMenu (même connecté)
  if (isLandingPage) {
    const handleLogout = async () => {
      try {
        await logout();
      } finally {
        navigate("/");
      }
    };

    return (
      <NavigationMenu
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        dashboardPath="/dashboard"
      />
    );
  }

  // Header simple pour pages publiques non-landing
  if (!isAuthenticated) {
    return (
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <Link
            to="/"
            className="text-xl font-bold text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
            aria-label="Retour à l'accueil"
          >
            SMD - Diabète
          </Link>
          <Link to="/login">
            <Button>Connexion</Button>
          </Link>
        </div>
      </header>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground">Tableau de bord</h2>
        </div>
        <div className="flex items-center gap-4">
          {/* Global Search */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGlobalSearchOpen(true)}
                aria-label="Recherche globale"
              >
                <Search className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Recherche globale (Ctrl+K)</p>
            </TooltipContent>
          </Tooltip>

          {/* Dark Mode Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                aria-label="Basculer le thème"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {resolvedTheme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Notifications Dropdown */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between p-2">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => markAllAsRead()}
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Tout marquer comme lu
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <ScrollArea className="h-96">
                {recentNotifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Aucune notification
                  </div>
                ) : (
                  <div className="p-1">
                    {recentNotifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={cn(
                          "flex flex-col items-start gap-1 p-3 cursor-pointer",
                          !notification.read && "bg-primary/5"
                        )}
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                          if (notification.link) {
                            navigate(notification.link);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between w-full">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.timestamp && formatDistanceToNow(new Date(notification.timestamp), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary ml-2 mt-1" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/notifications" className="w-full text-center">
                  Voir toutes les notifications
                </Link>
              </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {unreadCount > 0
                  ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                  : "Notifications"}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* User Profile Dropdown */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar>
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback>
                          {user ? getInitials(user.first_name, user.last_name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      {user ? formatFullName(user.first_name, user.last_name) : "Utilisateur"}
                    </DropdownMenuLabel>
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                      {user?.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={`/dashboard/users/${user?.id}`} className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Mon profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Paramètres
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={async () => {
                        try {
                          await logout();
                          navigate("/login");
                        } catch (error) {
                          console.error("Error logging out:", error);
                        }
                      }} 
                      className="text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Menu utilisateur</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <GlobalSearch open={globalSearchOpen} onOpenChange={setGlobalSearchOpen} />
    </header>
  );
}
