import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Calendar, Clock, Mail, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportName?: string;
  onSchedule?: (schedule: ReportSchedule) => void;
}

export interface ReportSchedule {
  frequency: "daily" | "weekly" | "monthly";
  time: string;
  recipients: string[];
  format: "pdf" | "excel" | "csv";
  startDate?: Date;
  endDate?: Date;
  enabled: boolean;
}

export function ScheduleReportDialog({
  open,
  onOpenChange,
  reportName = "Rapport",
  onSchedule,
}: ScheduleReportDialogProps) {
  const [schedule, setSchedule] = useState<ReportSchedule>({
    frequency: "weekly",
    time: "09:00",
    recipients: [],
    format: "pdf",
    enabled: true,
  });
  const [newRecipient, setNewRecipient] = useState("");
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  const handleAddRecipient = () => {
    if (newRecipient && !schedule.recipients.includes(newRecipient)) {
      setSchedule((prev) => ({
        ...prev,
        recipients: [...prev.recipients, newRecipient],
      }));
      setNewRecipient("");
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setSchedule((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((r) => r !== email),
    }));
  };

  const handleSchedule = () => {
    if (onSchedule) {
      onSchedule(schedule);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Planifier l'envoi du rapport
          </DialogTitle>
          <DialogDescription>
            Configurez l'envoi automatique du rapport "{reportName}" par email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Fréquence */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Fréquence d'envoi</Label>
            <Select
              value={schedule.frequency}
              onValueChange={(value) =>
                setSchedule((prev) => ({ ...prev, frequency: value as ReportSchedule["frequency"] }))
              }
            >
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Heure */}
          <div className="space-y-2">
            <Label htmlFor="time">Heure d'envoi</Label>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                id="time"
                type="time"
                value={schedule.time}
                onChange={(e) => setSchedule((prev) => ({ ...prev, time: e.target.value }))}
                className="w-32"
              />
            </div>
          </div>

          {/* Dates (optionnel) */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Date de début (optionnel)</Label>
              <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !schedule.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {schedule.startDate
                      ? format(schedule.startDate, "dd/MM/yyyy", { locale: fr })
                      : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={schedule.startDate}
                    onSelect={(date) => {
                      setSchedule((prev) => ({ ...prev, startDate: date }));
                      setIsStartDateOpen(false);
                    }}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Date de fin (optionnel)</Label>
              <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !schedule.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {schedule.endDate
                      ? format(schedule.endDate, "dd/MM/yyyy", { locale: fr })
                      : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={schedule.endDate}
                    onSelect={(date) => {
                      setSchedule((prev) => ({ ...prev, endDate: date }));
                      setIsEndDateOpen(false);
                    }}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Destinataires */}
          <div className="space-y-2">
            <Label htmlFor="recipients">Destinataires</Label>
            <div className="flex gap-2">
              <Input
                id="recipients"
                type="email"
                placeholder="email@example.com"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRecipient();
                  }
                }}
              />
              <Button type="button" onClick={handleAddRecipient} variant="outline">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
            {schedule.recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {schedule.recipients.map((email) => (
                  <div
                    key={email}
                    className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md text-sm"
                  >
                    <Mail className="h-3 w-3" />
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label htmlFor="format">Format du rapport</Label>
            <Select
              value={schedule.format}
              onValueChange={(value) =>
                setSchedule((prev) => ({ ...prev, format: value as ReportSchedule["format"] }))
              }
            >
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF
                  </div>
                </SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activer/Désactiver */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enabled"
              checked={schedule.enabled}
              onCheckedChange={(checked) =>
                setSchedule((prev) => ({ ...prev, enabled: checked as boolean }))
              }
            />
            <Label htmlFor="enabled" className="cursor-pointer">
              Activer la planification
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSchedule} disabled={schedule.recipients.length === 0}>
            Planifier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
