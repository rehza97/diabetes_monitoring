import { useState, useEffect, useMemo } from "react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { createPatientSchema, emailSchema } from "@/utils/validators";
import { z } from "zod";
import { Upload, X, ChevronLeft, ChevronRight } from "lucide-react";
import { getInitials, formatFullName } from "@/utils/helpers";
import { calculateBMI } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useUsers } from "@/hooks/useFirestore";
import { usersCollection } from "@/lib/firestore-helpers";
import { query, where, orderBy, limit } from "firebase/firestore";

type PatientFormData = z.infer<typeof createPatientSchema>;

interface PatientFormProps {
  patient?: {
    id: string;
    file_number?: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: "male" | "female";
    phone: string;
    email?: string;
    address?: string;
    diabetes_type: "type1" | "type2" | "gestational";
    diagnosis_date: string;
    blood_type?: string;
    weight?: number;
    height?: number;
    doctor_id?: string;
    nurse_id?: string;
    avatar?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PatientFormData) => Promise<void>;
}

const steps = [
  { id: 1, title: "Informations personnelles" },
  { id: 2, title: "Informations médicales" },
  { id: 3, title: "Assignation" },
];

export function PatientForm({
  patient,
  isOpen,
  onClose,
  onSubmit,
}: PatientFormProps) {
  const isEdit = !!patient;
  const [currentStep, setCurrentStep] = useState(1);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    patient?.avatar || null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Note: useAuth is imported but not used directly - we get admin from query instead

  // Load doctors and nurses from database
  const doctorsQuery = useMemo(
    () =>
      query(
        usersCollection,
        where("role", "==", "doctor"),
        where("isActive", "==", true),
      ),
    [],
  );
  const { data: doctorsRaw } = useUsers(doctorsQuery);

  // Sort doctors in memory to avoid Firestore index issues
  const doctors = useMemo(() => {
    if (!doctorsRaw) return [];
    return [...doctorsRaw].sort((a, b) => {
      const aName =
        `${a.lastName || ""} ${a.firstName || ""}`.trim() || a.email || "";
      const bName =
        `${b.lastName || ""} ${b.firstName || ""}`.trim() || b.email || "";
      return aName.localeCompare(bName);
    });
  }, [doctorsRaw]);

  const nursesQuery = useMemo(
    () =>
      query(
        usersCollection,
        where("role", "==", "nurse"),
        where("isActive", "==", true),
      ),
    [],
  );
  const { data: nursesRaw } = useUsers(nursesQuery);

  // Sort nurses in memory to avoid Firestore index issues
  const nurses = useMemo(() => {
    if (!nursesRaw) return [];
    return [...nursesRaw].sort((a, b) => {
      const aName =
        `${a.lastName || ""} ${a.firstName || ""}`.trim() || a.email || "";
      const bName =
        `${b.lastName || ""} ${b.firstName || ""}`.trim() || b.email || "";
      return aName.localeCompare(bName);
    });
  }, [nursesRaw]);

  // Find admin user for default doctor
  const adminQuery = useMemo(
    () =>
      query(
        usersCollection,
        where("role", "==", "admin"),
        where("isActive", "==", true),
        limit(1),
      ),
    [],
  );
  const { data: admins } = useUsers(adminQuery);
  const defaultAdminId = useMemo(() => admins?.[0]?.id, [admins]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<PatientFormData>({
    resolver: zodResolver(createPatientSchema) as Resolver<PatientFormData>,
    // Don't set defaultValues here - let useEffect handle it when form opens
    defaultValues: {
      doctor_id: "none",
      nurse_id: "none",
    },
  });

  const weight = watch("weight");
  const height = watch("height");
  const bmi = weight && height ? calculateBMI(weight, height) : 0;

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);

      // Log patient data for debugging
      if (patient) {
        console.group(
          "📝 [PatientForm] Patient data received and form initialization",
        );
        console.log("Patient prop received:", patient);
        console.log("Patient fields:", {
          first_name: patient.first_name,
          last_name: patient.last_name,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          phone: patient.phone,
          email: patient.email,
          doctor_id: patient.doctor_id,
          nurse_id: patient.nurse_id,
        });
        console.groupEnd();
      }

      const formData = patient
        ? {
            first_name: patient.first_name || "",
            last_name: patient.last_name || "",
            date_of_birth: patient.date_of_birth || "",
            gender: patient.gender,
            phone: patient.phone || "",
            email: patient.email || "",
            address: patient.address || "",
            diabetes_type: patient.diabetes_type,
            diagnosis_date: patient.diagnosis_date || "",
            blood_type: patient.blood_type || "",
            weight: patient.weight,
            height: patient.height,
            // Convert empty string to "none" for Select components (Radix UI doesn't allow empty string values)
            doctor_id:
              patient.doctor_id && patient.doctor_id !== ""
                ? patient.doctor_id
                : "none",
            nurse_id:
              patient.nurse_id && patient.nurse_id !== ""
                ? patient.nurse_id
                : "none",
          }
        : {
            // Set default doctor to admin if available
            doctor_id: defaultAdminId || "none",
            nurse_id: "none",
          };

      console.log("📝 [PatientForm] Form data being reset:", formData);
      reset(formData);
      setAvatarPreview(patient?.avatar || null);
      setCurrentStep(1);
    }
  }, [isOpen, patient, reset, defaultAdminId]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onFormSubmit = async (data: PatientFormData) => {
    setSubmitError(null);
    try {
      console.log("Form submission started with data:", data);

      // Validate that at least one assignment is selected
      let doctorId =
        data.doctor_id === "none" || !data.doctor_id || data.doctor_id === ""
          ? ""
          : data.doctor_id;
      let nurseId =
        data.nurse_id === "none" || !data.nurse_id || data.nurse_id === ""
          ? ""
          : data.nurse_id;

      console.log(
        "After conversion - doctorId:",
        doctorId,
        "nurseId:",
        nurseId,
      );

      if (!doctorId && !nurseId) {
        // If both are empty, set doctor to admin as default
        if (defaultAdminId) {
          doctorId = defaultAdminId;
          console.log("Setting default admin as doctor:", doctorId);
        } else {
          const errorMsg =
            "Veuillez sélectionner au moins un médecin ou une infirmière responsable.";
          setSubmitError(errorMsg);
          console.error("Validation error:", errorMsg);
          return;
        }
      }

      // Convert "none" back to empty string for doctor_id and nurse_id
      // Also filter out undefined values for optional fields
      const formData: any = {
        ...data,
        doctor_id: doctorId || "",
        nurse_id: nurseId || "",
      };

      // Remove undefined values for optional fields
      if (formData.weight === undefined) delete formData.weight;
      if (formData.height === undefined) delete formData.height;
      if (formData.email === undefined || formData.email === "")
        delete formData.email;
      if (formData.address === undefined || formData.address === "")
        delete formData.address;
      if (formData.blood_type === undefined || formData.blood_type === "")
        delete formData.blood_type;

      console.log("Final form data being submitted:", formData);

      await onSubmit(formData);
      console.log("Form submitted successfully");
      onClose();
      reset();
      setAvatarPreview(null);
      setCurrentStep(1);
      setSubmitError(null);
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la soumission du formulaire.";
      setSubmitError(errorMessage);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback>
                  {watch("first_name") && watch("last_name")
                    ? getInitials(watch("first_name"), watch("last_name"))
                    : "P"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatar">Photo de profil</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("avatar")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choisir une photo
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  Prénom <span className="text-destructive">*</span>
                </Label>
                <Input id="first_name" {...register("first_name")} />
                {errors.first_name && (
                  <p className="text-sm text-destructive">
                    {errors.first_name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input id="last_name" {...register("last_name")} />
                {errors.last_name && (
                  <p className="text-sm text-destructive">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">
                  Date de naissance <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...register("date_of_birth")}
                  max={new Date().toISOString().split("T")[0]}
                />
                {errors.date_of_birth && (
                  <p className="text-sm text-destructive">
                    {errors.date_of_birth.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">
                  Sexe <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("gender") || ""}
                  onValueChange={(value) =>
                    setValue("gender", value as "male" | "female")
                  }
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculin</SelectItem>
                    <SelectItem value="female">Féminin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-destructive">
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Téléphone <span className="text-destructive">*</span>
                </Label>
                <Input id="phone" {...register("phone")} />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optionnel)</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email", {
                    validate: (value) => {
                      if (!value || value === "") return true; // Empty is OK
                      return (
                        emailSchema.safeParse(value).success || "Email invalide"
                      );
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" {...register("address")} />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="diabetes_type">
                  Type de diabète <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("diabetes_type") || ""}
                  onValueChange={(value) =>
                    setValue(
                      "diabetes_type",
                      value as "type1" | "type2" | "gestational",
                    )
                  }
                >
                  <SelectTrigger id="diabetes_type">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="type1">Type 1</SelectItem>
                    <SelectItem value="type2">Type 2</SelectItem>
                    <SelectItem value="gestational">Gestationnel</SelectItem>
                  </SelectContent>
                </Select>
                {errors.diabetes_type && (
                  <p className="text-sm text-destructive">
                    {errors.diabetes_type.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosis_date">
                  Date de diagnostic <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="diagnosis_date"
                  type="date"
                  {...register("diagnosis_date")}
                />
                {errors.diagnosis_date && (
                  <p className="text-sm text-destructive">
                    {errors.diagnosis_date.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="blood_type">Groupe sanguin</Label>
                <Select
                  value={watch("blood_type") || ""}
                  onValueChange={(value) => setValue("blood_type", value)}
                >
                  <SelectTrigger id="blood_type">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Poids (kg) (optionnel)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  {...register("weight", {
                    setValueAs: (v) =>
                      v === "" || v === null || v === undefined
                        ? undefined
                        : parseFloat(v),
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Taille (cm) (optionnel)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  {...register("height", {
                    setValueAs: (v) =>
                      v === "" || v === null || v === undefined
                        ? undefined
                        : parseFloat(v),
                  })}
                />
              </div>
            </div>

            {bmi > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <Label>IMC calculé</Label>
                <div className="text-2xl font-bold text-primary">
                  {bmi.toFixed(1)}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Assignez un médecin ou une infirmière responsable. Au moins l'un
              des deux doit être sélectionné.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="doctor_id">
                  Médecin responsable{" "}
                  {watch("nurse_id") && watch("nurse_id") !== "none" ? (
                    ""
                  ) : (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
                <Select
                  value={watch("doctor_id") || "none"}
                  onValueChange={(value) => {
                    const newValue = value === "none" ? "" : value;
                    setValue("doctor_id", newValue, { shouldValidate: true });
                    // If both are "none", keep at least one
                    if (
                      value === "none" &&
                      (!watch("nurse_id") || watch("nurse_id") === "none")
                    ) {
                      // Keep doctor as default admin if available
                      if (defaultAdminId) {
                        setValue("doctor_id", defaultAdminId, {
                          shouldValidate: true,
                        });
                      }
                    }
                  }}
                >
                  <SelectTrigger id="doctor_id">
                    <SelectValue placeholder="Sélectionner un médecin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {doctors?.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {formatFullName(
                          doctor.firstName || "",
                          doctor.lastName || "",
                        ) || doctor.email}
                        {doctor.specialization && ` - ${doctor.specialization}`}
                      </SelectItem>
                    ))}
                    {/* Include admins as doctors option */}
                    {admins?.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {formatFullName(
                          admin.firstName || "",
                          admin.lastName || "",
                        ) || admin.email}{" "}
                        (Admin)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nurse_id">
                  Infirmière responsable{" "}
                  {watch("doctor_id") && watch("doctor_id") !== "none" ? (
                    ""
                  ) : (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
                <Select
                  value={watch("nurse_id") || "none"}
                  onValueChange={(value) => {
                    const newValue = value === "none" ? "" : value;
                    setValue("nurse_id", newValue, { shouldValidate: true });
                    // If both are "none", keep at least one
                    if (
                      value === "none" &&
                      (!watch("doctor_id") || watch("doctor_id") === "none")
                    ) {
                      // Keep doctor as default admin if available
                      if (defaultAdminId) {
                        setValue("doctor_id", defaultAdminId, {
                          shouldValidate: true,
                        });
                      }
                    }
                  }}
                >
                  <SelectTrigger id="nurse_id">
                    <SelectValue placeholder="Sélectionner une infirmière" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {nurses?.map((nurse) => (
                      <SelectItem key={nurse.id} value={nurse.id}>
                        {formatFullName(
                          nurse.firstName || "",
                          nurse.lastName || "",
                        ) || nurse.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(!watch("doctor_id") || watch("doctor_id") === "none") &&
              (!watch("nurse_id") || watch("nurse_id") === "none") && (
                <p className="text-sm text-destructive">
                  Veuillez sélectionner au moins un médecin ou une infirmière
                  responsable.
                </p>
              )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le patient" : "Ajouter un patient"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifiez les informations du patient."
              : "Remplissez le formulaire en plusieurs étapes pour ajouter un nouveau patient."}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    currentStep >= step.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-muted text-muted-foreground",
                  )}
                >
                  {currentStep > step.id ? "✓" : step.id}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs text-center",
                    currentStep >= step.id
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2",
                    currentStep > step.id ? "bg-primary" : "bg-muted",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit(
            onFormSubmit as SubmitHandler<PatientFormData>,
            (errors) => {
              console.error("Form validation errors:", errors);
              const errorFields = Object.keys(errors);
              const errorMessages = Object.values(errors)
                .map((err: any) => err?.message || "Erreur de validation")
                .join(", ");
              setSubmitError(`Erreurs de validation: ${errorMessages}`);
              // Scroll to first error
              if (errorFields.length > 0) {
                const firstErrorField = document.querySelector(
                  `[name="${errorFields[0]}"]`,
                );
                firstErrorField?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }
            },
          )}
          className="space-y-4"
        >
          {renderStepContent()}

          {submitError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive font-medium">
                {submitError}
              </p>
            </div>
          )}

          {/* Debug: Show all form errors */}
          {Object.keys(errors).length > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Erreurs de validation détectées:
              </p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
                {Object.entries(errors).map(([field, error]: [string, any]) => (
                  <li key={field}>
                    <strong>{field}:</strong> {error?.message || "Erreur"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? onClose : prevStep}
                disabled={isSubmitting}
              >
                {currentStep === 1 ? (
                  "Annuler"
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Précédent
                  </>
                )}
              </Button>
              <div className="flex gap-2">
                {currentStep < steps.length ? (
                  <Button type="button" onClick={nextStep}>
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={(e) => {
                      console.log("Create button clicked!", {
                        isSubmitting,
                        currentStep,
                        formErrors: Object.keys(errors),
                        formValues: watch(),
                      });
                      // Don't prevent default - let form submit normally
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        {isEdit ? "Modification..." : "Création..."}
                      </>
                    ) : isEdit ? (
                      "Modifier"
                    ) : (
                      "Créer"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
