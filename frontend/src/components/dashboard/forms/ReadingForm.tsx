import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { createReadingSchema } from "@/utils/validators";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFullName } from "@/utils/helpers";

type ReadingFormData = z.infer<typeof createReadingSchema>;

interface ReadingFormProps {
  reading?: {
    id: string;
    patient_id: string;
    value: number;
    unit: "mg/dL" | "mmol/L";
    reading_type: string;
    date: string;
    time: string;
    notes?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReadingFormData) => Promise<void>;
  patients?: Array<{ id: string; firstName: string; lastName: string; fileNumber?: string }>;
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

export function ReadingForm({ reading, isOpen, onClose, onSubmit, patients }: ReadingFormProps) {
  const isEdit = !!reading;
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    reading ? new Date(reading.date) : new Date()
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<ReadingFormData>({
    resolver: zodResolver(createReadingSchema),
    defaultValues: reading
      ? {
          patient_id: reading.patient_id,
          value: reading.value,
          unit: reading.unit,
          reading_type: reading.reading_type as any,
          date: reading.date,
          time: reading.time,
          notes: reading.notes || "",
        }
      : {
          unit: "mg/dL",
          date: new Date().toISOString().split("T")[0],
          time: new Date().toTimeString().slice(0, 5),
        },
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        reading
          ? {
              patient_id: reading.patient_id,
              value: reading.value,
              unit: reading.unit,
              reading_type: reading.reading_type as any,
              date: reading.date,
              time: reading.time,
              notes: reading.notes || "",
            }
          : {
              unit: "mg/dL",
              date: new Date().toISOString().split("T")[0],
              time: new Date().toTimeString().slice(0, 5),
            }
      );
      setSelectedDate(reading ? new Date(reading.date) : new Date());
    }
  }, [isOpen, reading, reset]);

  const onFormSubmit = async (data: ReadingFormData) => {
    try {
      await onSubmit(data);
      onClose();
      reset();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const value = watch("value");
  const unit = watch("unit");
  const readingType = watch("reading_type");

  // Calculer l'état selon la valeur
  const getStatus = (val: number) => {
    if (val < 70 || val > 180) return "critique";
    if (val >= 140 && val <= 180) return "avertissement";
    return "normal";
  };

  const status = value ? getStatus(value) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier la mesure" : "Enregistrer une nouvelle mesure"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifiez les informations de la mesure."
              : "Remplissez le formulaire pour enregistrer une nouvelle mesure de glycémie."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient_id">
              Patient <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch("patient_id") || ""}
              onValueChange={(value) => setValue("patient_id", value)}
              disabled={isEdit}
            >
              <SelectTrigger id="patient_id">
                <SelectValue placeholder="Sélectionner un patient" />
              </SelectTrigger>
              <SelectContent>
                {patients && patients.length > 0 ? (
                  patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {formatFullName(patient.firstName, patient.lastName)}
                      {patient.fileNumber && ` (${patient.fileNumber})`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    Aucun patient disponible
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.patient_id && (
              <p className="text-sm text-destructive">{errors.patient_id.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="value">
                Valeur (mg/dL) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="value"
                type="number"
                step="0.1"
                {...register("value", { valueAsNumber: true })}
                aria-invalid={errors.value ? "true" : "false"}
              />
              {errors.value && (
                <p className="text-sm text-destructive">{errors.value.message}</p>
              )}
              {value && status && (
                <p
                  className={cn(
                    "text-sm font-medium",
                    status === "critique" && "text-destructive",
                    status === "avertissement" && "text-warning",
                    status === "normal" && "text-success"
                  )}
                >
                  État: {status === "critique" ? "Critique" : status === "avertissement" ? "Avertissement" : "Normal"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">
                Unité <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch("unit") || "mg/dL"}
                onValueChange={(value) => setValue("unit", value as "mg/dL" | "mmol/L")}
              >
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mg/dL">mg/dL</SelectItem>
                  <SelectItem value="mmol/L">mmol/L</SelectItem>
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-destructive">{errors.unit.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reading_type">
              Type de mesure <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch("reading_type") || ""}
              onValueChange={(value) => setValue("reading_type", value as any)}
            >
              <SelectTrigger id="reading_type">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(readingTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reading_type && (
              <p className="text-sm text-destructive">{errors.reading_type.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "dd/MM/yyyy", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      if (date) {
                        setValue("date", date.toISOString().split("T")[0]);
                      }
                    }}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">
                Heure <span className="text-destructive">*</span>
              </Label>
              <Input
                id="time"
                type="time"
                {...register("time")}
                aria-invalid={errors.time ? "true" : "false"}
              />
              {errors.time && (
                <p className="text-sm text-destructive">{errors.time.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Ajoutez des notes sur cette mesure..."
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {isEdit ? "Modification..." : "Enregistrement..."}
                </>
              ) : (
                isEdit ? "Modifier" : "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
