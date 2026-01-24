import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Trash2, Check, AlertTriangle, Shield, Bug, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useNotification } from "@/context/NotificationContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtime";
import { auth } from "@/lib/firebase";
import { updateNotification, deleteNotification } from "@/lib/firestore-helpers";
import { cn } from "@/lib/utils";
import type { FirestoreNotification } from "@/types/firestore";

const notificationIcons = {
  system: Bell,
  security: Shield,
  error: AlertTriangle,
  update: Bell,
};

const notificationColors = {
  system: "bg-primary/10 text-primary",
  security: "bg-warning/10 text-warning",
  error: "bg-destructive/10 text-destructive",
  update: "bg-success/10 text-success",
};

const log = (ctx: string, msg: string, extra?: Record<string, unknown>) => {
  console.log(`[NotificationsPage] ${ctx}:`, msg, extra ?? "");
};

export function NotificationsPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const currentUserId = currentUser?.id ?? auth.currentUser?.uid ?? null;
  const [filter, setFilter] = useState<string>("all");
  const { addNotification } = useNotification();

  const { data: notifications, loading, error } = useRealtimeNotifications(currentUserId, {
    enabled: !!currentUserId,
  });

  useEffect(() => {
    log("auth", "state", {
      authLoading,
      currentUserId,
      "currentUser?.id": currentUser?.id,
      "auth.currentUser?.uid": auth.currentUser?.uid,
    });
  }, [authLoading, currentUserId, currentUser?.id]);

  useEffect(() => {
    log("fetch", "notifications", {
      enabled: !!currentUserId,
      loading,
      count: notifications?.length ?? 0,
      error: error?.message ?? null,
    });
  }, [currentUserId, loading, notifications?.length, error]);

  useEffect(() => {
    log("filter", "changed", { filter });
  }, [filter]);

  // Transform Firestore notifications to match UI format
  const transformedNotifications = useMemo(() => {
    if (!notifications) return [];
    
    return notifications.map((notif) => {
      // Map Firestore notification type to UI type
      let uiType: "system" | "security" | "error" | "update" = "system";
      if (notif.type === "security" || notif.type === "critical") {
        uiType = "security";
      } else if (notif.type === "error" || notif.type === "warning") {
        uiType = "error";
      } else if (notif.type === "update" || notif.type === "info") {
        uiType = "update";
      }
      
      return {
        id: notif.id,
        type: uiType,
        title: notif.title || "Notification",
        message: notif.message || notif.body || "",
        is_read: notif.isRead || false,
        created_at: notif.createdAt?.toDate().toISOString() || new Date().toISOString(),
        firestoreNotification: notif, // Keep reference for updates
      };
    });
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return transformedNotifications.filter((notif) => {
      if (filter === "all") return true;
      if (filter === "unread") return !notif.is_read;
      return notif.type === filter;
    });
  }, [transformedNotifications, filter]);

  const handleMarkAsRead = async (id: string) => {
    log("markAsRead", "invoked", { id, currentUserId });
    if (!currentUserId) {
      log("markAsRead", "skip: no userId");
      return;
    }
    const notification = transformedNotifications.find((n) => n.id === id);
    if (!notification?.firestoreNotification) {
      log("markAsRead", "skip: notification not found", { id });
      return;
    }
    try {
      await updateNotification(currentUserId, id, { isRead: true });
      log("markAsRead", "ok", { id });
      addNotification({
        type: "success",
        title: "Notification marquée",
        message: "La notification a été marquée comme lue.",
      });
    } catch (err) {
      log("markAsRead", "error", { id, err });
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible de marquer la notification: ${err instanceof Error ? err.message : "Erreur inconnue"}`,
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    log("markAllAsRead", "invoked", { currentUserId, notificationsCount: notifications?.length });
    if (!currentUserId || !notifications) {
      log("markAllAsRead", "skip: no userId or no notifications");
      return;
    }
    const unreadNotifications = notifications.filter((n) => !n.isRead);
    log("markAllAsRead", "updating", { count: unreadNotifications.length });
    try {
      await Promise.all(
        unreadNotifications.map((n) => updateNotification(currentUserId, n.id, { isRead: true }))
      );
      log("markAllAsRead", "ok", { count: unreadNotifications.length });
      addNotification({
        type: "success",
        title: "Notifications marquées",
        message: "Toutes les notifications ont été marquées comme lues.",
      });
    } catch (err) {
      log("markAllAsRead", "error", { err });
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible de marquer les notifications: ${err instanceof Error ? err.message : "Erreur inconnue"}`,
      });
    }
  };

  const handleDelete = async (id: string) => {
    log("delete", "invoked", { id, currentUserId });
    if (!currentUserId) {
      log("delete", "skip: no userId");
      return;
    }
    try {
      await deleteNotification(currentUserId, id);
      log("delete", "ok", { id });
      addNotification({
        type: "success",
        title: "Notification supprimée",
        message: "La notification a été supprimée.",
      });
    } catch (err) {
      log("delete", "error", { id, err });
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible de supprimer la notification: ${err instanceof Error ? err.message : "Erreur inconnue"}`,
      });
    }
  };

  const unreadCount = transformedNotifications.filter((n) => !n.is_read).length;

  if (authLoading) {
    log("render", "auth loading → spinner");
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (!authLoading && !currentUserId) {
    log("render", "unauthenticated → connectez-vous");
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos notifications système, alertes sécurité et rapports d'erreurs
            </p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bell className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">Connectez-vous pour voir vos notifications.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    log("render", "notifications loading → spinner");
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    log("render", "error", { message: error.message });
    return (
      <DashboardLayout>
        <ErrorMessage message={`Erreur lors du chargement des notifications: ${error.message}`} />
      </DashboardLayout>
    );
  }

  log("render", "success", { filteredCount: filteredNotifications.length, unreadCount });
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos notifications système, alertes sécurité et rapports d'erreurs
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="unread">Non lues ({unreadCount})</SelectItem>
                <SelectItem value="system">Système</SelectItem>
                <SelectItem value="security">Sécurité</SelectItem>
                <SelectItem value="error">Erreurs</SelectItem>
                <SelectItem value="update">Mises à jour</SelectItem>
              </SelectContent>
            </Select>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllAsRead}>
                <Check className="mr-2 h-4 w-4" />
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notifications administratives</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const Icon = notificationIcons[notification.type];
                  const colorClass = notificationColors[notification.type];
                  const timestamp = new Date(notification.created_at);

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start justify-between rounded-lg border p-4 transition-colors",
                        !notification.is_read && "bg-primary/5 border-primary/20"
                      )}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", colorClass)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{notification.title}</h3>
                            {!notification.is_read && (
                              <Badge variant="destructive" className="text-xs">
                                Non lu
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDistanceToNow(timestamp, { addSuffix: true, locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMarkAsRead(notification.id)}
                            aria-label="Marquer comme lu"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(notification.id)}
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
