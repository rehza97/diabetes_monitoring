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

const optionalText = () => z.string().optional().or(z.literal(""));

const optionalTextMin = (min: number, message: string) =>
  optionalText().refine(
    (value) => !value || value.trim().length >= min,
    message,
  );

const optionalEmail = () =>
  optionalText().refine(
    (value) => !value || emailSchema.safeParse(value).success,
    "Email invalide",
  );

const optionalPassword = () =>
  optionalText().refine(
    (value) => !value || passwordSchema.safeParse(value).success,
    "Mot de passe invalide",
  );

// Login form validation
export const loginSchema = z.object({
  email: optionalEmail(),
  password: optionalText(),
});

// Reading value validation
export const readingValueSchema = z
  .number()
  .min(0, "La valeur ne peut pas être négative")
  .max(600, "La valeur est trop élevée");

// Date validation
export const dateSchema = z
  .string()
  .refine(
    (date) => {
      if (!date || date === "") return true;
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    },
    { message: "Date invalide" },
  );

// User form validation
export const createUserSchema = z.object({
  first_name: optionalTextMin(
    2,
    "Le prénom doit contenir au moins 2 caractères",
  ),
  last_name: optionalTextMin(2, "Le nom doit contenir au moins 2 caractères"),
  email: optionalEmail(),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || phoneSchema.safeParse(value).success,
      "Numéro de téléphone invalide",
    ),
  password: optionalPassword(),
  role: z.enum(["admin", "doctor", "nurse"]).optional(),
  specialization: optionalText(),
  license_number: optionalText(),
  is_active: z.boolean().optional(),
});

// Patient form: optional phone (French format when non-empty)
const patientPhoneSchema = z
  .string()
  .transform((s) => s.replace(/\s/g, ""))
  .refine(
    (s) => s === "" || /^(\+33|0)[1-9](\d{2}){4}$/.test(s),
    { message: "Numéro de téléphone invalide" },
  );

// Patient form validation
export const createPatientSchema = z
  .object({
    first_name: optionalTextMin(
      2,
      "Le prénom doit contenir au moins 2 caractères",
    ),
    last_name: optionalTextMin(2, "Le nom doit contenir au moins 2 caractères"),
    age: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "number" && !isNaN(val)) return val;
      const num =
        typeof val === "string" ? parseInt(val, 10) : Number(val);
      return isNaN(num) ? undefined : num;
    }, z.number().int().min(0, "L'âge doit être au moins 0").max(120, "L'âge est trop élevé").optional()),
    gender: z
      .enum(["male", "female"], {
        message: "Veuillez sélectionner un sexe",
      })
      .optional(),
    phone: patientPhoneSchema.optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    diabetes_type: z
      .enum(["type1", "type2", "gestational"], {
        message: "Veuillez sélectionner un type de diabète",
      })
      .optional(),
    diagnosis_year: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "number" && !isNaN(val)) return val;
      const num =
        typeof val === "string" ? parseInt(val, 10) : Number(val);
      return isNaN(num) ? undefined : num;
    }, z.number().int().min(1900, "Année invalide").refine((y) => y <= new Date().getFullYear(), {
      message: "L'année ne peut pas être dans le futur",
    }).optional()),
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
  });

// Reading form validation
export const createReadingSchema = z.object({
  patient_id: optionalText(),
  value: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    readingValueSchema.optional(),
  ),
  unit: z.enum(["mg/dL", "mmol/L"]).optional(),
  reading_type: z
    .enum([
      "fasting",
      "post_breakfast",
      "pre_lunch",
      "post_lunch",
      "pre_dinner",
      "post_dinner",
      "bedtime",
      "midnight",
      "random",
    ])
    .optional(),
  date: dateSchema.optional().or(z.literal("")),
  time: optionalText().refine(
    (value) =>
      !value ||
      /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value),
    "Format d'heure invalide (HH:mm)",
  ),
  notes: z.string().optional(),
});

// Medical Note form validation
export const createMedicalNoteSchema = z.object({
  noteType: z
    .enum(["diagnosis", "prescription", "observation", "followup"], {
      message: "Veuillez sélectionner un type de note",
    })
    .optional(),
  content: optionalText(),
  isImportant: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// Medication form validation
export const createMedicationSchema = z.object({
  medicationName: optionalText(),
  dosage: optionalText(),
  frequency: optionalText(),
  startDate: dateSchema.optional().or(z.literal("")),
  endDate: dateSchema.optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});
