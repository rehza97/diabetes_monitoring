// Application constants

export const APP_NAME = "Système de Monitoring du Diabète";
export const APP_VERSION = "1.0.0";

// Reading ranges (mg/dL)
export const READING_RANGES = {
  normal: { min: 70, max: 140 },
  warning: { min: 140, max: 180 },
  critical_high: 250,
  critical_low: 70,
} as const;

// Reading types
export const READING_TYPES = [
  { value: "fasting", label: "À jeun" },
  { value: "post_breakfast", label: "Après le petit-déjeuner" },
  { value: "pre_lunch", label: "Avant le déjeuner" },
  { value: "post_lunch", label: "Après le déjeuner" },
  { value: "pre_dinner", label: "Avant le dîner" },
  { value: "post_dinner", label: "Après le dîner" },
  { value: "bedtime", label: "Avant de se coucher" },
  { value: "midnight", label: "Minuit" },
  { value: "random", label: "Aléatoire" },
] as const;

// User roles
export const USER_ROLES = [
  { value: "admin", label: "Administrateur" },
  { value: "doctor", label: "Médecin" },
  { value: "nurse", label: "Infirmière" },
] as const;

// Diabetes types
export const DIABETES_TYPES = [
  { value: "type1", label: "Type 1" },
  { value: "type2", label: "Type 2" },
  { value: "gestational", label: "Gestationnel" },
] as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

// Date formats
export const DATE_FORMAT = "dd/MM/yyyy";
export const TIME_FORMAT = "HH:mm";
export const DATETIME_FORMAT = "dd/MM/yyyy HH:mm";

// API endpoints (will be configured in services)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER: "user",
  THEME: "theme",
  LANGUAGE: "language",
} as const;
