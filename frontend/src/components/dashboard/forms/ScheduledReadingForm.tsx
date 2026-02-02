import { useEffect, useState } from "react";
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
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";

const createScheduledReadingSchema = z.object({
  patientId: z.string().min(1, "Le patient est requis"),
  readingType: z.enum([
    "fasting",
    "post_breakfast",
    "pre_lunch",
    "post_lunch",
    "pre_dinner",
    "post_dinner",
    "bedtime",
    "midnight",
    "random",
  ]),
  scheduledDate: z.string().min(1, "La date est requise"),
  scheduledTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format d'heure invalide (HH:mm)"),
  notes: z.string().optional(),
});

type ScheduledReadingFormData = z.infer<typeof createScheduledReadingSchema>;

interface ScheduledReadingFormProps {
  scheduledReading?: {
    id: string;
    patientId: string;
    readingType: string;
    scheduledDate: Timestamp;
    scheduledTime: string;
    notes?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScheduledReadingFormData) => Promise<void>;
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

export function ScheduledReadingForm({
  scheduledReading,
  isOpen,
  onClose,
  onSubmit,
  patients,
}: ScheduledReadingFormProps) {
  const isEdit = !!scheduledReading;
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    scheduledReading ? scheduledReading.scheduledDate.toDate() : new Date()
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    scheduledReading ? scheduledReading.scheduledTime : new Date().toTimeString().slice(0, 5)
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<ScheduledReadingFormData>({
    resolver: zodResolver(createScheduledReadingSchema),
    defaultValues: scheduledReading
      ? {
          patientId: scheduledReading.patientId,
          readingType: scheduledReading.readingType as any,
          scheduledDate: scheduledReading.scheduledDate.toDate().toISOString().split("T")[0],
          scheduledTime: scheduledReading.scheduledTime,
          notes: scheduledReading.notes || "",
        }
      : {
          readingType: "random",
          scheduledDate: new Date().toISOString().split("T")[0],
          scheduledTime: new Date().toTimeString().slice(0, 5),
          notes: "",
        },
  });

  useEffect(() => {
    if (isOpen) {
      const date = scheduledReading ? scheduledReading.scheduledDate.toDate() : new Date();
      const time = scheduledReading ? scheduledReading.scheduledTime : new Date().toTimeString().slice(0, 5);
      reset(
        scheduledReading
          ? {
              patientId: scheduledReading.patientId,
              readingType: scheduledReading.readingType as any,
              scheduledDate: date.toISOString().split("T")[0],
              scheduledTime: time,
              notes: scheduledReading.notes || "",
            }
          : {
              readingType: "random",
              scheduledDate: new Date().toISOString().split("T")[0],
              scheduledTime: new Date().toTimeString().slice(0, 5),
              notes: "",
            }
      );
      setSelectedDate(date);
      setSelectedTime(time);
    }
  }, [isOpen, scheduledReading, reset]);

  const onFormSubmit = async (data: ScheduledReadingFormData) => {
    try {
      await onSubmit(data);
      onClose();
      reset();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le planning" : "Créer un planning de mesure"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifiez les informations du planning."
              : "Planifiez une mesure pour un patient."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientId">
              Patient <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch("patientId") || ""}
              onValueChange={(value) => setValue("patientId", value)}
              disabled={isEdit}
            >
              <SelectTrigger id="patientId">
                <SelectValue placeholder="Sélectionner un patient" />
              </SelectTrigger>
              <SelectContent>
                {patients && patients.length > 0 ? (
                  patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
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
            {errors.patientId && (
              <p className="text-sm text-destructive">{errors.patientId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="readingType">
              Type de mesure <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch("readingType") || "random"}
              onValueChange={(value) => setValue("readingType", value as any)}
            >
              <SelectTrigger id="readingType">
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
            {errors.readingType && (
              <p className="text-sm text-destructive">{errors.readingType.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">
                Date prévue <span className="text-destructive">*</span>
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
                        setValue("scheduledDate", date.toISOString().split("T")[0]);
                      }
                    }}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              {errors.scheduledDate && (
                <p className="text-sm text-destructive">{errors.scheduledDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledTime">
                Heure prévue <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="scheduledTime"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => {
                    setSelectedTime(e.target.value);
                    setValue("scheduledTime", e.target.value);
                  }}
                  aria-invalid={errors.scheduledTime ? "true" : "false"}
                />
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              {errors.scheduledTime && (
                <p className="text-sm text-destructive">{errors.scheduledTime.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Ajoutez des notes sur cette mesure planifiée..."
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
                  {isEdit ? "Modification..." : "Création..."}
                </>
              ) : (
                isEdit ? "Modifier" : "Créer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
