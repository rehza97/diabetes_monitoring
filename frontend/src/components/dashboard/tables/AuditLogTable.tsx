import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Eye, Download } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Inbox } from "lucide-react";
import { formatDateTime } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuditLog {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  action: string;
  entity_type: string;
  entity_id: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface AuditLogTableProps {
  logs: AuditLog[];
  onViewDetail?: (log: AuditLog) => void;
  onExport?: () => void;
}

const actionLabels: Record<string, string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  view: "Consultation",
  export: "Export",
  login: "Connexion",
  logout: "Déconnexion",
};

const actionColors: Record<string, string> = {
  create: "bg-success/10 text-success",
  update: "bg-primary/10 text-primary",
  delete: "bg-destructive/10 text-destructive",
  view: "bg-muted text-muted-foreground",
  export: "bg-muted text-muted-foreground",
  login: "bg-muted text-muted-foreground",
  logout: "bg-muted text-muted-foreground",
};

const entityTypeLabels: Record<string, string> = {
  patient: "Patient",
  reading: "Mesure",
  user: "Utilisateur",
  report: "Rapport",
  medication: "Médicament",
  note: "Note",
  settings: "Paramètres",
};

export function AuditLogTable({
  logs,
  onViewDetail,
  onExport,
}: AuditLogTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Aucun log d'audit"
        description="Il n'y a pas encore de logs d'audit dans le système."
      />
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => handleSort("created_at")}
              >
                Date/Heure
                {sortColumn === "created_at" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => handleSort("action")}
              >
                Action
                {sortColumn === "action" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead>Type d'entité</TableHead>
              <TableHead>ID Entité</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm">
                  {formatDateTime(log.created_at)}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{log.user.name}</div>
                    <div className="text-xs text-muted-foreground">{log.user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={actionColors[log.action]}>
                    {actionLabels[log.action]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {entityTypeLabels[log.entity_type]}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{log.entity_id.slice(0, 8)}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {log.ip_address}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSelectedLog(log)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir détails
                      </DropdownMenuItem>
                      {onExport && (
                        <DropdownMenuItem onClick={onExport}>
                          <Download className="mr-2 h-4 w-4" />
                          Exporter
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails du log d'audit</DialogTitle>
              <DialogDescription>
                Informations complètes sur l'action enregistrée
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Utilisateur</Label>
                  <p className="text-sm">{selectedLog.user.name} ({selectedLog.user.email})</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date/Heure</Label>
                  <p className="text-sm">{formatDateTime(selectedLog.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Action</Label>
                  <Badge className={actionColors[selectedLog.action]}>
                    {actionLabels[selectedLog.action]}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type d'entité</Label>
                  <Badge variant="outline">{entityTypeLabels[selectedLog.entity_type]}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">ID Entité</Label>
                  <p className="text-sm font-mono">{selectedLog.entity_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">IP Address</Label>
                  <p className="text-sm font-mono">{selectedLog.ip_address}</p>
                </div>
              </div>

              {(selectedLog.old_data || selectedLog.new_data) && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Différence des données</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedLog.old_data && (
                      <div className="p-3 bg-muted rounded-lg">
                        <Label className="text-xs text-muted-foreground">Anciennes données</Label>
                        <pre className="text-xs mt-2 overflow-auto">
                          {JSON.stringify(selectedLog.old_data, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.new_data && (
                      <div className="p-3 bg-muted rounded-lg">
                        <Label className="text-xs text-muted-foreground">Nouvelles données</Label>
                        <pre className="text-xs mt-2 overflow-auto">
                          {JSON.stringify(selectedLog.new_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">User Agent</Label>
                <p className="text-xs text-muted-foreground break-all">{selectedLog.user_agent}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
