import { READING_RANGES } from "./constants";
import type { ReadingStatus } from "@/types";

/**
 * Determine reading status based on value
 */
export function getReadingStatus(value: number): ReadingStatus {
  if (value < READING_RANGES.critical_low || value > READING_RANGES.critical_high) {
    return "critical";
  }
  if (value >= READING_RANGES.warning.min && value <= READING_RANGES.warning.max) {
    return "warning";
  }
  return "normal";
}

/**
 * Get status color class
 */
export function getStatusColor(status: ReadingStatus | string): string {
  switch (status) {
    case "normal":
    case "active":
      return "text-green-600 bg-green-50";
    case "warning":
    case "needs_followup":
      return "text-yellow-600 bg-yellow-50";
    case "critical":
      return "text-red-600 bg-red-50";
    case "inactive":
      return "text-gray-600 bg-gray-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Truncate text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Generate initials from name
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Format full name
 */
export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
