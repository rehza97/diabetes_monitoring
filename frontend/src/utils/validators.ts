import { z } from "zod";

// Email validation
export const emailSchema = z.string().email("Email invalide");

// Phone validation (French format)
export const phoneSchema = z
  .string()
  .regex(/^(\+33|0)[1-9](\d{2}){4}$/, "Numéro de téléphone invalide");

// Password validation
export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre");

// Login form validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Le mot de passe est requis"),
});

// Reading value validation
export const readingValueSchema = z
  .number()
  .min(0, "La valeur ne peut pas être négative")
  .max(600, "La valeur est trop élevée");

// Date validation
export const dateSchema = z
  .string()
  .min(1, "La date est requise")
  .refine(
    (date) => {
      if (!date || date === "") return false;
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    },
    { message: "Date invalide" },
  );

// User form validation
export const createUserSchema = z.object({
  first_name: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: emailSchema,
  phone: phoneSchema.optional(),
  password: passwordSchema,
  role: z.enum(["admin", "doctor", "nurse"]),
  specialization: z.string().optional(),
  license_number: z.string().optional(),
  is_active: z.boolean().optional(),
});

// Patient form validation
export const createPatientSchema = z
  .object({
    first_name: z
      .string()
      .min(2, "Le prénom doit contenir au moins 2 caractères"),
    last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    date_of_birth: dateSchema,
    gender: z.enum(["male", "female"], { message: "Veuillez sélectionner un sexe" }),
    phone: phoneSchema,
    email: z.union([emailSchema, z.literal("")]).optional(),
    address: z.string().optional().or(z.literal("")),
    diabetes_type: z.enum(["type1", "type2", "gestational"], { message: "Veuillez sélectionner un type de diabète" }),
    diagnosis_date: dateSchema,
    blood_type: z.string().optional().or(z.literal("")),
    weight: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "number" && !isNaN(val)) return val;
      const num = typeof val === "string" ? parseFloat(val) : Number(val);
      return isNaN(num) ? undefined : num;
    }, z.number().positive().optional()),
    height: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "number" && !isNaN(val)) return val;
      const num = typeof val === "string" ? parseFloat(val) : Number(val);
      return isNaN(num) ? undefined : num;
    }, z.number().positive().optional()),
    doctor_id: z.string().optional().or(z.literal("")),
    nurse_id: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      // At least one of doctor_id or nurse_id must be provided (not empty and not "none")
      const hasDoctor =
        data.doctor_id && data.doctor_id !== "" && data.doctor_id !== "none";
      const hasNurse =
        data.nurse_id && data.nurse_id !== "" && data.nurse_id !== "none";
      return hasDoctor || hasNurse;
    },
    {
      message: "Au moins un médecin ou une infirmière doit être assigné",
      path: ["doctor_id"], // This will show the error on doctor_id field
    },
  );

// Reading form validation
export const createReadingSchema = z.object({
  patient_id: z.string().min(1, "Le patient est requis"),
  value: readingValueSchema,
  unit: z.enum(["mg/dL", "mmol/L"]),
  reading_type: z.enum([
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
  date: dateSchema,
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format d'heure invalide (HH:mm)"),
  notes: z.string().optional(),
});

// Medical Note form validation
export const createMedicalNoteSchema = z.object({
  noteType: z.enum(["diagnosis", "prescription", "observation", "followup"], { message: "Veuillez sélectionner un type de note" }),
  content: z.string().min(1, "Le contenu est requis"),
  isImportant: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// Medication form validation
export const createMedicationSchema = z.object({
  medicationName: z.string().min(1, "Le nom du médicament est requis"),
  dosage: z.string().min(1, "Le dosage est requis"),
  frequency: z.string().min(1, "La fréquence est requise"),
  startDate: dateSchema,
  endDate: dateSchema.optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});
