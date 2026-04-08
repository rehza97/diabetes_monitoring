import { useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { createMedicalNoteSchema } from "@/utils/validators";
import { z } from "zod";
import type { MedicalNoteType } from "@/types/firestore";

type MedicalNoteFormData = z.infer<typeof createMedicalNoteSchema>;

interface MedicalNoteFormProps {
  note?: {
    id: string;
    noteType: MedicalNoteType;
    content: string;
    isImportant: boolean;
    tags?: string[];
  };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MedicalNoteFormData) => Promise<void>;
}

const noteTypeLabels: Record<MedicalNoteType, string> = {
  diagnosis: "Diagnostic",
  prescription: "Ordonnance",
  observation: "Observation",
  followup: "Suivi",
};

export function MedicalNoteForm({ note, isOpen, onClose, onSubmit }: MedicalNoteFormProps) {
  const isEdit = !!note;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<MedicalNoteFormData>({
    resolver: zodResolver(createMedicalNoteSchema),
    defaultValues: note
      ? {
          noteType: note.noteType,
          content: note.content,
          isImportant: note.isImportant,
          tags: note.tags || [],
        }
      : {
          noteType: "observation",
          content: "",
          isImportant: false,
          tags: [],
        },
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        note
          ? {
              noteType: note.noteType,
              content: note.content,
              isImportant: note.isImportant,
              tags: note.tags || [],
            }
          : {
              noteType: "observation",
              content: "",
              isImportant: false,
              tags: [],
            }
      );
    }
  }, [isOpen, note, reset]);

  const onFormSubmit = async (data: MedicalNoteFormData) => {
    try {
      await onSubmit(data);
      onClose();
      reset();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const isImportant = watch("isImportant");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier la note médicale" : "Ajouter une note médicale"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifiez les informations de la note médicale."
              : "Remplissez le formulaire pour ajouter une nouvelle note médicale."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="noteType">
              Type de note
            </Label>
            <Select
              value={watch("noteType") || "observation"}
              onValueChange={(value) => setValue("noteType", value as MedicalNoteType)}
            >
              <SelectTrigger id="noteType">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(noteTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.noteType && (
              <p className="text-sm text-destructive">{errors.noteType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              Contenu
            </Label>
            <Textarea
              id="content"
              rows={6}
              placeholder="Saisissez le contenu de la note médicale..."
              {...register("content")}
              aria-invalid={errors.content ? "true" : "false"}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isImportant"
              checked={isImportant}
              onCheckedChange={(checked) => setValue("isImportant", checked === true)}
            />
            <Label
              htmlFor="isImportant"
              className="text-sm font-normal cursor-pointer"
            >
              Note importante
            </Label>
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
