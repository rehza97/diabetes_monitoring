import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Save } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ReportBuilderProps {
  onGenerate?: (config: ReportConfig) => void;
  onSave?: (config: ReportConfig) => void;
}

interface ReportConfig {
  type: "patient" | "period" | "performance" | "comparison" | "critical";
  fields: string[];
  dateFrom?: Date;
  dateTo?: Date;
  patientIds?: string[];
  visualization: "table" | "chart" | "both";
  name?: string;
}

const availableFields = [
  { id: "patient_info", label: "Informations patient" },
  { id: "readings", label: "Mesures" },
  { id: "charts", label: "Graphiques" },
  { id: "statistics", label: "Statistiques" },
  { id: "medications", label: "Médicaments" },
  { id: "notes", label: "Notes médicales" },
];

export function ReportBuilder({ onGenerate, onSave }: ReportBuilderProps) {
  const [config, setConfig] = useState<ReportConfig>({
    type: "patient",
    fields: ["patient_info", "readings"],
    visualization: "both",
  });
  const [reportName, setReportName] = useState("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleFieldToggle = (fieldId: string) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.includes(fieldId)
        ? prev.fields.filter((f) => f !== fieldId)
        : [...prev.fields, fieldId],
    }));
  };

  const handleGenerate = () => {
    if (onGenerate) {
      onGenerate(config);
    }
  };

  const handleSave = () => {
    if (onSave && reportName) {
      onSave({ ...config, name: reportName });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reportType">Type de rapport</Label>
        <Select
          value={config.type}
          onValueChange={(value) =>
            setConfig((prev) => ({ ...prev, type: value as ReportConfig["type"] }))
          }
        >
          <SelectTrigger id="reportType">
            <SelectValue placeholder="Sélectionner un type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="patient">Rapport patient complet</SelectItem>
            <SelectItem value="period">Rapport période</SelectItem>
            <SelectItem value="performance">Rapport performance</SelectItem>
            <SelectItem value="comparison">Rapport comparatif</SelectItem>
            <SelectItem value="critical">Rapport cas critiques</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(config.type === "period" || config.type === "comparison") && (
        <div className="space-y-2">
          <Label>Période</Label>
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !config.dateFrom && !config.dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {config.dateFrom && config.dateTo
                  ? `${format(config.dateFrom, "dd/MM/yyyy", { locale: fr })} - ${format(config.dateTo, "dd/MM/yyyy", { locale: fr })}`
                  : "Sélectionner une période"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: config.dateFrom,
                  to: config.dateTo,
                }}
                onSelect={(range) => {
                  setConfig((prev) => ({
                    ...prev,
                    dateFrom: range?.from,
                    dateTo: range?.to,
                  }));
                }}
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="space-y-2">
        <Label>Champs à inclure</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
          {availableFields.map((field) => (
            <div key={field.id} className="flex items-center space-x-2">
              <Checkbox
                id={field.id}
                checked={config.fields.includes(field.id)}
                onCheckedChange={() => handleFieldToggle(field.id)}
              />
              <label
                htmlFor={field.id}
                className="text-sm cursor-pointer flex-1"
              >
                {field.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="visualization">Type de visualisation</Label>
        <Select
          value={config.visualization}
          onValueChange={(value) =>
            setConfig((prev) => ({ ...prev, visualization: value as ReportConfig["visualization"] }))
          }
        >
          <SelectTrigger id="visualization">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="table">Tableau uniquement</SelectItem>
            <SelectItem value="chart">Graphique uniquement</SelectItem>
            <SelectItem value="both">Tableau et graphique</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reportName">Nom du rapport (pour sauvegarde)</Label>
        <Input
          id="reportName"
          placeholder="Mon rapport personnalisé"
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleGenerate} className="flex-1">
          Générer le rapport
        </Button>
        {reportName && (
          <Button variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        )}
      </div>
    </div>
  );
}

