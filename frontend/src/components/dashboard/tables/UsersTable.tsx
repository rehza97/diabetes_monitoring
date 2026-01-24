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
import { Checkbox } from "@/components/ui/checkbox";
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
import { MoreHorizontal, Edit, Trash2, Eye, UserCheck, UserX } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Inbox } from "lucide-react";
import { getInitials, formatFullName } from "@/utils/helpers";
import { formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "admin" | "doctor" | "nurse";
  is_active: boolean;
  avatar?: string;
  created_at: string;
  last_login?: string;
}

interface UsersTableProps {
  users: User[];
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onView?: (user: User) => void;
  onToggleActive?: (user: User) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const roleLabels = {
  admin: "Administrateur",
  doctor: "Médecin",
  nurse: "Infirmière",
};

const roleColors = {
  admin: "bg-destructive/10 text-destructive",
  doctor: "bg-primary/10 text-primary",
  nurse: "bg-success/10 text-success",
};

export function UsersTable({
  users,
  onEdit,
  onDelete,
  onView,
  onToggleActive,
  selectedIds = [],
  onSelectionChange,
}: UsersTableProps) {
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

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? users.map((u) => u.id) : []);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedIds, id]);
      } else {
        onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
      }
    }
  };

  if (users.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Aucun utilisateur"
        description="Il n'y a pas encore d'utilisateurs dans le système."
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {onSelectionChange && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === users.length && users.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Sélectionner tout"
                />
              </TableHead>
            )}
            <TableHead>Utilisateur</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-accent/50"
              onClick={() => handleSort("email")}
            >
              Email
              {sortColumn === "email" && (
                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-accent/50"
              onClick={() => handleSort("role")}
            >
              Rôle
              {sortColumn === "role" && (
                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead>Statut</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-accent/50"
              onClick={() => handleSort("created_at")}
            >
              Date création
              {sortColumn === "created_at" && (
                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead>Dernière connexion</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className={cn(!user.is_active && "opacity-60")}>
              {onSelectionChange && (
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(user.id)}
                    onCheckedChange={(checked) => handleSelectOne(user.id, checked as boolean)}
                    aria-label={`Sélectionner ${formatFullName(user.first_name, user.last_name)}`}
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {getInitials(user.first_name, user.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {formatFullName(user.first_name, user.last_name)}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge className={roleColors[user.role]}>{roleLabels[user.role]}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.is_active ? "default" : "secondary"}>
                  {user.is_active ? "Actif" : "Inactif"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(user.created_at)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {user.last_login ? formatDate(user.last_login) : "Jamais"}
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
                    {onView && (
                      <DropdownMenuItem onClick={() => onView(user)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir détails
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                    )}
                    {onToggleActive && (
                      <DropdownMenuItem onClick={() => onToggleActive(user)}>
                        {user.is_active ? (
                          <>
                            <UserX className="mr-2 h-4 w-4" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Activer
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(user)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
