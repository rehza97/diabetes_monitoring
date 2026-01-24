import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { DATE_FORMAT, TIME_FORMAT, DATETIME_FORMAT } from "./constants";

/**
 * Format a date string to French format
 */
export function formatDate(date: string | Date, formatStr: string = DATE_FORMAT): string {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: fr });
  } catch {
    return "";
  }
}

/**
 * Format time
 */
export function formatTime(time: string | Date, formatStr: string = TIME_FORMAT): string {
  try {
    const timeObj = typeof time === "string" ? parseISO(time) : time;
    return format(timeObj, formatStr, { locale: fr });
  } catch {
    return "";
  }
}

/**
 * Format date and time
 */
export function formatDateTime(
  dateTime: string | Date,
  formatStr: string = DATETIME_FORMAT
): string {
  try {
    const dateObj = typeof dateTime === "string" ? parseISO(dateTime) : dateTime;
    return format(dateObj, formatStr, { locale: fr });
  } catch {
    return "";
  }
}

/**
 * Format a number with French locale
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format reading value with unit
 */
export function formatReading(value: number, unit: "mg/dL" | "mmol/L"): string {
  return `${formatNumber(value, 1)} ${unit}`;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string | Date): number {
  try {
    const birthDate = typeof dateOfBirth === "string" ? parseISO(dateOfBirth) : dateOfBirth;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch {
    return 0;
  }
}

/**
 * Calculate BMI
 */
export function calculateBMI(weight: number, height: number): number {
  if (!weight || !height || height === 0) return 0;
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
