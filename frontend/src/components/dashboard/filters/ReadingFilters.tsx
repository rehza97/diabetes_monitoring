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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { X, Filter, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatFullName } from "@/utils/helpers";

interface ReadingFiltersProps {
  filters: ReadingFiltersState;
  onFilterChange: (filters: ReadingFiltersState) => void;
  className?: string;
  patients?: Array<{ id: string; firstName: string; lastName: string; fileNumber?: string }>;
  users?: Array<{ id: string; firstName: string; lastName: string; role?: string }>;
}

export interface ReadingFiltersState {
  patientId: string;
  userId: string;
  readingType: string;
  status: string;
  dateFrom?: Date;
  dateTo?: Date;
  valueMin?: number;
  valueMax?: number;
}

export function ReadingFilters({ filters, onFilterChange, className, patients, users }: ReadingFiltersProps) {
  const handleFilterChange = (key: keyof ReadingFiltersState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      patientId: "all",
      userId: "all",
      readingType: "all",
      status: "all",
    };
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters =
    filters.patientId !== "all" ||
    filters.userId !== "all" ||
    filters.readingType !== "all" ||
    filters.status !== "all" ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.valueMin ||
    filters.valueMax;

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres avancés
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="patient">Patient</Label>
            <Select
              value={filters.patientId}
              onValueChange={(value) => handleFilterChange("patientId", value)}
            >
              <SelectTrigger id="patient">
                <SelectValue placeholder="Tous les patients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les patients</SelectItem>
                {patients?.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {formatFullName(patient.firstName, patient.lastName)}
                    {patient.fileNumber && ` (${patient.fileNumber})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="user">Enregistré par</Label>
            <Select
              value={filters.userId}
              onValueChange={(value) => handleFilterChange("userId", value)}
            >
              <SelectTrigger id="user">
                <SelectValue placeholder="Tous les utilisateurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les utilisateurs</SelectItem>
                {users?.map((user) => {
                  const rolePrefix = user.role === "doctor" ? "Dr. " : user.role === "nurse" ? "Inf. " : "";
                  return (
                    <SelectItem key={user.id} value={user.id}>
                      {rolePrefix}{formatFullName(user.firstName, user.lastName)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="readingType">Type de mesure</Label>
            <Select
              value={filters.readingType}
              onValueChange={(value) => handleFilterChange("readingType", value)}
            >
              <SelectTrigger id="readingType">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="fasting">À jeun</SelectItem>
                <SelectItem value="post_breakfast">Après petit-déjeuner</SelectItem>
                <SelectItem value="pre_lunch">Avant déjeuner</SelectItem>
                <SelectItem value="post_lunch">Après déjeuner</SelectItem>
                <SelectItem value="pre_dinner">Avant dîner</SelectItem>
                <SelectItem value="post_dinner">Après dîner</SelectItem>
                <SelectItem value="bedtime">Au coucher</SelectItem>
                <SelectItem value="random">Aléatoire</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">État</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Tous les états" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les états</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="warning">Avertissement</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Période</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateFrom && !filters.dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom && filters.dateTo
                    ? `${format(filters.dateFrom, "dd/MM/yyyy", { locale: fr })} - ${format(filters.dateTo, "dd/MM/yyyy", { locale: fr })}`
                    : "Sélectionner une période"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: filters.dateFrom,
                    to: filters.dateTo,
                  }}
                  onSelect={(range) => {
                    handleFilterChange("dateFrom", range?.from);
                    handleFilterChange("dateTo", range?.to);
                  }}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="valueMin">Valeur min (mg/dL)</Label>
            <Input
              id="valueMin"
              type="number"
              placeholder="0"
              value={filters.valueMin || ""}
              onChange={(e) =>
                handleFilterChange("valueMin", e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valueMax">Valeur max (mg/dL)</Label>
            <Input
              id="valueMax"
              type="number"
              placeholder="600"
              value={filters.valueMax || ""}
              onChange={(e) =>
                handleFilterChange("valueMax", e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
