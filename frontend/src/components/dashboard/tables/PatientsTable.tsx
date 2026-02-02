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
import { MoreHorizontal, Edit, Trash2, Eye, FileText } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Inbox } from "lucide-react";
import { getInitials, formatFullName, getReadingStatus } from "@/utils/helpers";
import { formatDate, calculateAge } from "@/utils/formatters";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  file_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  diabetes_type: "type1" | "type2" | "gestational";
  doctor_name?: string;
  nurse_name?: string;
  last_reading?: {
    value: number;
    date: string;
  };
  status?: "normal" | "warning" | "critical";
  avatar?: string;
}

interface PatientsTableProps {
  patients: Patient[];
  onView?: (patient: Patient) => void;
  onEdit?: (patient: Patient) => void;
  onDelete?: (patient: Patient) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const diabetesTypeLabels = {
  type1: "Type 1",
  type2: "Type 2",
  gestational: "Gestationnel",
};

const statusColors = {
  normal: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

export function PatientsTable({
  patients,
  onEdit,
  onDelete,
  onView,
  selectedIds = [],
  onSelectionChange,
}: PatientsTableProps) {
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
      onSelectionChange(checked ? patients.map((p) => p.id) : []);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedIds, id]);
      } else {
        onSelectionChange(
          selectedIds.filter((selectedId) => selectedId !== id),
        );
      }
    }
  };

  if (patients.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Aucun patient"
        description="Il n'y a pas encore de patients dans le système."
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
                  checked={
                    selectedIds.length === patients.length &&
                    patients.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Sélectionner tout"
                />
              </TableHead>
            )}
            <TableHead>Numéro fichier</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Âge</TableHead>
            <TableHead>Type diabète</TableHead>
            <TableHead>Médecin</TableHead>
            <TableHead>Infirmière</TableHead>
            <TableHead>Dernière mesure</TableHead>
            <TableHead>État</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => {
            const age = calculateAge(patient.date_of_birth);
            const status =
              patient.status ||
              (patient.last_reading
                ? getReadingStatus(patient.last_reading.value)
                : "normal");

            return (
              <TableRow key={patient.id}>
                {onSelectionChange && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(patient.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(patient.id, checked as boolean)
                      }
                      aria-label={`Sélectionner ${formatFullName(patient.first_name, patient.last_name)}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-mono text-sm">
                  {patient.file_number}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={patient.avatar} />
                      <AvatarFallback>
                        {getInitials(patient.first_name, patient.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {formatFullName(patient.first_name, patient.last_name)}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{age} ans</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {diabetesTypeLabels[patient.diabetes_type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {patient.doctor_name || "-"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {patient.nurse_name || "-"}
                </TableCell>
                <TableCell>
                  {patient.last_reading ? (
                    <div>
                      <div className="font-medium">
                        {patient.last_reading.value} mg/dL
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(patient.last_reading.date)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Aucune</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[status]}>
                    {status === "normal"
                      ? "Normal"
                      : status === "warning"
                        ? "Avertissement"
                        : "Critique"}
                  </Badge>
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
                        <DropdownMenuItem asChild>
                          <Link to={`/dashboard/patients/${patient.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(patient)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        Générer rapport
                      </DropdownMenuItem>
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(patient)}
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
