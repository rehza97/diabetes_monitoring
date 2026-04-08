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
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { createMedicationSchema } from "@/utils/validators";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";

type MedicationFormData = z.infer<typeof createMedicationSchema>;

interface MedicationFormProps {
  medication?: {
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    startDate: Timestamp;
    endDate?: Timestamp;
    notes?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MedicationFormData) => Promise<void>;
}

export function MedicationForm({ medication, isOpen, onClose, onSubmit }: MedicationFormProps) {
  const isEdit = !!medication;
  const [startDate, setStartDate] = useState<Date | undefined>(
    medication ? medication.startDate.toDate() : new Date()
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    medication && medication.endDate ? medication.endDate.toDate() : undefined
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<MedicationFormData>({
    resolver: zodResolver(createMedicationSchema),
    defaultValues: medication
      ? {
          medicationName: medication.medicationName,
          dosage: medication.dosage,
          frequency: medication.frequency,
          startDate: medication.startDate.toDate().toISOString().split("T")[0],
          endDate: medication.endDate ? medication.endDate.toDate().toISOString().split("T")[0] : "",
          notes: medication.notes || "",
        }
      : {
          medicationName: "",
          dosage: "",
          frequency: "daily",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          notes: "",
        },
  });

  useEffect(() => {
    if (isOpen) {
      const start = medication ? medication.startDate.toDate() : new Date();
      const end = medication && medication.endDate ? medication.endDate.toDate() : undefined;
      reset(
        medication
          ? {
              medicationName: medication.medicationName,
              dosage: medication.dosage,
              frequency: medication.frequency,
              startDate: start.toISOString().split("T")[0],
              endDate: end ? end.toISOString().split("T")[0] : "",
              notes: medication.notes || "",
            }
          : {
              medicationName: "",
              dosage: "",
              frequency: "daily",
              startDate: new Date().toISOString().split("T")[0],
              endDate: "",
              notes: "",
            }
      );
      setStartDate(start);
      setEndDate(end);
    }
  }, [isOpen, medication, reset]);

  const onFormSubmit = async (data: MedicationFormData) => {
    try {
      await onSubmit(data);
      onClose();
      reset();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const frequencyOptions = [
    { value: "daily", label: "Quotidien" },
    { value: "twice_daily", label: "Deux fois par jour" },
    { value: "three_times_daily", label: "Trois fois par jour" },
    { value: "before_meals", label: "Avant les repas" },
    { value: "after_meals", label: "Après les repas" },
    { value: "as_needed", label: "Selon les besoins" },
    { value: "weekly", label: "Hebdomadaire" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le médicament" : "Prescrire un médicament"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifiez les informations du médicament."
              : "Remplissez le formulaire pour prescrire un nouveau médicament."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medicationName">
              Nom du médicament
            </Label>
            <Input
              id="medicationName"
              placeholder="Ex: Metformine"
              {...register("medicationName")}
              aria-invalid={errors.medicationName ? "true" : "false"}
            />
            {errors.medicationName && (
              <p className="text-sm text-destructive">{errors.medicationName.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dosage">
                Dosage
              </Label>
              <Input
                id="dosage"
                placeholder="Ex: 500mg"
                {...register("dosage")}
                aria-invalid={errors.dosage ? "true" : "false"}
              />
              {errors.dosage && (
                <p className="text-sm text-destructive">{errors.dosage.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">
                Fréquence
              </Label>
              <select
                id="frequency"
                {...register("frequency")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {frequencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.frequency && (
                <p className="text-sm text-destructive">{errors.frequency.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Date de début
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "dd/MM/yyyy", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      if (date) {
                        setValue("startDate", date.toISOString().split("T")[0]);
                      }
                    }}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin (optionnel)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, "dd/MM/yyyy", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      if (date) {
                        setValue("endDate", date.toISOString().split("T")[0]);
                      } else {
                        setValue("endDate", "");
                      }
                    }}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Ajoutez des notes sur ce médicament..."
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
                  {isEdit ? "Modification..." : "Prescrire"}
                </>
              ) : (
                isEdit ? "Modifier" : "Prescrire"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
