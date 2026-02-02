import { useState, useMemo } from "react";
import { query, where, orderBy, limit as firestoreLimit } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditLogTable } from "@/components/dashboard/tables/AuditLogTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Download, X, Filter } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";
import { useRealtimeAuditLogs } from "@/hooks/useRealtime";
import { useUsers } from "@/hooks/useFirestore";
import { auditLogsCollection, usersCollection } from "@/lib/firestore-helpers";
import { exportAuditLogsToExcel, exportAuditLogsToCSV } from "@/utils/export";
import type { FirestoreAuditLog, FirestoreUser } from "@/types/firestore";

export function AuditLogPage() {
  const [filters, setFilters] = useState({
    userId: "all",
    action: "all",
    entityType: "all",
    search: "",
  });
  const { addNotification } = useNotification();

  // Create query based on filters (where → orderBy → limit)
  const auditLogsQuery = useMemo(() => {
    const constraints: (ReturnType<typeof where> | ReturnType<typeof orderBy> | ReturnType<typeof firestoreLimit>)[] = [];
    if (filters.userId !== "all") constraints.push(where("userId", "==", filters.userId));
    if (filters.action !== "all") constraints.push(where("action", "==", filters.action));
    if (filters.entityType !== "all") constraints.push(where("entityType", "==", filters.entityType));
    constraints.push(orderBy("createdAt", "desc"), firestoreLimit(1000));
    return query(auditLogsCollection, ...constraints);
  }, [filters.userId, filters.action, filters.entityType]);

  // Fetch audit logs and users
  const { data: auditLogs, loading, error } = useRealtimeAuditLogs(auditLogsQuery);
  const usersQuery = useMemo(
    () => query(usersCollection, where("isActive", "==", true)),
    []
  );
  const { data: users, loading: usersLoading, error: usersError } = useUsers(usersQuery);

  // Create user map
  const usersMap = useMemo(() => {
    const map = new Map<string, FirestoreUser>();
    users?.forEach(user => {
      if (user.id) map.set(user.id, user);
    });
    return map;
  }, [users]);

  // Filter and transform logs to match table format
  const filteredLogs = useMemo(() => {
    if (!auditLogs) return [];
    
    return auditLogs
      .filter((log) => {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const user = log.userId ? usersMap.get(log.userId) : undefined;
          const userName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : log.userName || "";
          if (
            !userName.toLowerCase().includes(searchLower) &&
            !log.entityId?.toLowerCase().includes(searchLower)
          ) {
            return false;
          }
        }
        return true;
      })
      .map((log) => {
        const user = log.userId ? usersMap.get(log.userId) : undefined;
        return {
          id: log.id,
          user: {
            id: log.userId || "",
            name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : log.userName || "Utilisateur inconnu",
            email: user?.email || "",
          },
          action: log.action,
          entity_type: log.entityType,
          entity_id: log.entityId || "",
          old_data: log.oldData,
          new_data: log.newData,
          ip_address: log.ipAddress || "",
          user_agent: log.userAgent || "",
          created_at: log.createdAt?.toDate().toISOString() || new Date().toISOString(),
        };
      });
  }, [auditLogs, filters.search, usersMap]);

  const handleExport = (format: "excel" | "csv" = "excel") => {
    try {
      const logsToExport = filteredLogs
        .map((log) => auditLogs?.find((l) => l.id === log.id) ?? null)
        .filter((log): log is FirestoreAuditLog => log !== null);
      if (format === "excel") {
        exportAuditLogsToExcel(logsToExport);
      } else {
        exportAuditLogsToCSV(logsToExport);
      }
      addNotification({
        type: "success",
        title: "Export réussi",
        message: `Les logs d'audit ont été exportés en format ${format.toUpperCase()}.`,
      });
    } catch (err) {
      addNotification({
        type: "error",
        title: "Erreur d'export",
        message: `Impossible d'exporter les données: ${err instanceof Error ? err.message : "Erreur inconnue"}`,
      });
    }
  };

  const hasActiveFilters =
    filters.userId !== "all" ||
    filters.action !== "all" ||
    filters.entityType !== "all" ||
    filters.search !== "";

  const clearFilters = () => {
    setFilters({
      userId: "all",
      action: "all",
      entityType: "all",
      search: "",
    });
  };

  const pageLoading = loading || usersLoading;
  const pageError = error ?? usersError;

  if (pageLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (pageError) {
    const messages = [error, usersError].filter(Boolean).map((e) => e!.message);
    return (
      <DashboardLayout>
        <ErrorMessage
          message={`Erreur lors du chargement des logs d'audit: ${messages.join("; ")}`}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Journal d'audit</h1>
            <p className="text-muted-foreground mt-1">
              Consultez l'historique complet de toutes les actions du système
            </p>
          </div>
          <Button variant="outline" onClick={() => handleExport()}>
            <Download className="mr-2 h-4 w-4" />
            Exporter pour conformité
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtres
              </CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search">Recherche</Label>
                <Input
                  id="search"
                  placeholder="Utilisateur, ID entité..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user">Utilisateur</Label>
                <Select
                  value={filters.userId}
                  onValueChange={(value) => setFilters({ ...filters, userId: value })}
                >
                  <SelectTrigger id="user">
                    <SelectValue placeholder="Tous les utilisateurs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les utilisateurs</SelectItem>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Select
                  value={filters.action}
                  onValueChange={(value) => setFilters({ ...filters, action: value })}
                >
                  <SelectTrigger id="action">
                    <SelectValue placeholder="Toutes les actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les actions</SelectItem>
                    <SelectItem value="create">Création</SelectItem>
                    <SelectItem value="update">Modification</SelectItem>
                    <SelectItem value="delete">Suppression</SelectItem>
                    <SelectItem value="view">Consultation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entityType">Type d'entité</Label>
                <Select
                  value={filters.entityType}
                  onValueChange={(value) => setFilters({ ...filters, entityType: value })}
                >
                  <SelectTrigger id="entityType">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="reading">Mesure</SelectItem>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="report">Rapport</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <AuditLogTable logs={filteredLogs} onExport={handleExport} />
      </div>
    </DashboardLayout>
  );
}
