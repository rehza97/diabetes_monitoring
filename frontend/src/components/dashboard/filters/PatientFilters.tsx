import { useState } from "react";
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

interface PatientFiltersProps {
  filters: PatientFiltersState;
  onFilterChange: (filters: PatientFiltersState) => void;
  className?: string;
  doctors?: Array<{ id: string; firstName: string; lastName: string }>;
  nurses?: Array<{ id: string; firstName: string; lastName: string }>;
}

export interface PatientFiltersState {
  search: string;
  diabetesType: string;
  status: string;
  doctorId: string;
  nurseId: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export function PatientFilters({ filters, onFilterChange, className, doctors, nurses }: PatientFiltersProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleFilterChange = (key: keyof PatientFiltersState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      diabetesType: "all",
      status: "all",
      doctorId: "all",
      nurseId: "all",
    };
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters =
    filters.search !== "" ||
    filters.diabetesType !== "all" ||
    filters.status !== "all" ||
    filters.doctorId !== "all" ||
    filters.nurseId !== "all" ||
    filters.dateFrom ||
    filters.dateTo;

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="search">Recherche</Label>
            <Input
              id="search"
              placeholder="Nom, numéro fichier, téléphone..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="diabetesType">Type de diabète</Label>
            <Select
              value={filters.diabetesType}
              onValueChange={(value) => handleFilterChange("diabetesType", value)}
            >
              <SelectTrigger id="diabetesType">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="type1">Type 1</SelectItem>
                <SelectItem value="type2">Type 2</SelectItem>
                <SelectItem value="gestational">Gestationnel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">État santé</Label>
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
            <Label htmlFor="doctor">Médecin responsable</Label>
            <Select
              value={filters.doctorId}
              onValueChange={(value) => handleFilterChange("doctorId", value)}
            >
              <SelectTrigger id="doctor">
                <SelectValue placeholder="Tous les médecins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les médecins</SelectItem>
                {doctors?.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {formatFullName(doctor.firstName, doctor.lastName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nurse">Infirmière responsable</Label>
            <Select
              value={filters.nurseId}
              onValueChange={(value) => handleFilterChange("nurseId", value)}
            >
              <SelectTrigger id="nurse">
                <SelectValue placeholder="Toutes les infirmières" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les infirmières</SelectItem>
                {nurses?.map((nurse) => (
                  <SelectItem key={nurse.id} value={nurse.id}>
                    {formatFullName(nurse.firstName, nurse.lastName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date dernière mesure</Label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
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
        </div>
      </CardContent>
    </Card>
  );
}
