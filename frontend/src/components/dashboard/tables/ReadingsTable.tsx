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
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Inbox } from "lucide-react";
import { getReadingStatus } from "@/utils/helpers";
import { formatDateTime, formatReading } from "@/utils/formatters";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Reading {
  id: string;
  patient: {
    id: string;
    name: string;
    file_number: string;
  };
  value: number;
  unit: "mg/dL" | "mmol/L";
  reading_type: string;
  date: string;
  time: string;
  recorded_by: {
    id: string;
    name: string;
    role: string;
  };
  status: "normal" | "warning" | "critical";
  notes?: string;
}

interface ReadingsTableProps {
  readings: Reading[];
  onEdit?: (reading: Reading) => void;
  onDelete?: (reading: Reading) => void;
  onView?: (reading: Reading) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const readingTypeLabels: Record<string, string> = {
  fasting: "À jeun",
  post_breakfast: "Après petit-déjeuner",
  pre_lunch: "Avant déjeuner",
  post_lunch: "Après déjeuner",
  pre_dinner: "Avant dîner",
  post_dinner: "Après dîner",
  bedtime: "Au coucher",
  midnight: "Minuit",
  random: "Aléatoire",
};

const statusColors = {
  normal: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

export function ReadingsTable({
  readings,
  onEdit,
  onDelete,
  onView,
  selectedIds = [],
  onSelectionChange,
}: ReadingsTableProps) {
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
      onSelectionChange(checked ? readings.map((r) => r.id) : []);
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

  if (readings.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Aucune mesure"
        description="Il n'y a pas encore de mesures enregistrées dans le système."
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
                  checked={selectedIds.length === readings.length && readings.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Sélectionner tout"
                />
              </TableHead>
            )}
            <TableHead>ID</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-accent/50"
              onClick={() => handleSort("patient")}
            >
              Patient
              {sortColumn === "patient" && (
                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-accent/50"
              onClick={() => handleSort("value")}
            >
              Valeur
              {sortColumn === "value" && (
                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead>Type</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-accent/50"
              onClick={() => handleSort("date")}
            >
              Date/Heure
              {sortColumn === "date" && (
                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead>Enregistré par</TableHead>
            <TableHead>État</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {readings.map((reading) => {
            const status = reading.status || getReadingStatus(reading.value);
            const datetime = `${reading.date}T${reading.time}`;

            return (
              <TableRow key={reading.id}>
                {onSelectionChange && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(reading.id)}
                      onCheckedChange={(checked) => handleSelectOne(reading.id, checked as boolean)}
                      aria-label={`Sélectionner la mesure ${reading.id}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-mono text-sm">{reading.id.slice(0, 8)}</TableCell>
                <TableCell>
                  <Link
                    to={`/dashboard/patients/${reading.patient.id}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {reading.patient.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">{reading.patient.file_number}</div>
                </TableCell>
                <TableCell>
                  <div className={cn(
                    "font-bold text-lg",
                    status === "critical" && "text-destructive",
                    status === "warning" && "text-warning",
                    status === "normal" && "text-success"
                  )}>
                    {formatReading(reading.value, reading.unit)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {readingTypeLabels[reading.reading_type] || reading.reading_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{formatDateTime(datetime)}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{reading.recorded_by.name}</div>
                    <div className="text-xs text-muted-foreground">{reading.recorded_by.role}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn("border", statusColors[status])}>
                    {status === "normal" ? "Normal" : status === "warning" ? "Avertissement" : "Critique"}
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
                        <DropdownMenuItem onClick={() => onView(reading)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(reading)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(reading)}
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
