import type { FirestorePatient, FirestoreReading, FirestoreUser, FirestoreAuditLog } from "@/types/firestore";

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((header) => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? "";
    })
  );

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * Download CSV file
 */
function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export patients list to CSV
 */
export function exportPatientsToCSV(patients: FirestorePatient[]): void {
  const data = patients.map((patient) => ({
    "N° Dossier": patient.fileNumber || "",
    "Prénom": patient.firstName || "",
    "Nom": patient.lastName || "",
    "Date de naissance": patient.dateOfBirth?.toDate().toLocaleDateString() || "",
    "Type de diabète": patient.diabetesType,
    "Téléphone": patient.phone || "",
    "Email": patient.email || "",
    "Statut": patient.isActive ? "Actif" : "Inactif",
  }));

  const csv = arrayToCSV(data);
  const filename = `patients_${new Date().toISOString().split("T")[0]}.csv`;
  downloadCSV(csv, filename);
}

/**
 * Export readings to CSV
 */
export function exportReadingsToCSV(
  readings: Array<FirestoreReading & { patientName?: string }>
): void {
  const data = readings.map((reading) => ({
    "Patient": reading.patientName || "Patient inconnu",
    "Date": reading.date?.toDate().toLocaleDateString() || "",
    "Heure": reading.date?.toDate().toLocaleTimeString() || "",
    "Valeur": reading.value,
    "Unité": reading.unit,
    "Type": reading.readingType,
    "État": reading.status || "normal",
  }));

  const csv = arrayToCSV(data);
  const filename = `mesures_${new Date().toISOString().split("T")[0]}.csv`;
  downloadCSV(csv, filename);
}

/**
 * Export users list to CSV
 */
export function exportUsersToCSV(users: FirestoreUser[]): void {
  const data = users.map((user) => ({
    "Prénom": user.firstName || "",
    "Nom": user.lastName || "",
    "Email": user.email || "",
    "Rôle": user.role,
    "Téléphone": user.phone || "",
    "Statut": user.isActive ? "Actif" : "Inactif",
  }));

  const csv = arrayToCSV(data);
  const filename = `utilisateurs_${new Date().toISOString().split("T")[0]}.csv`;
  downloadCSV(csv, filename);
}

/**
 * Export audit logs to CSV
 */
export function exportAuditLogsToCSV(logs: FirestoreAuditLog[]): void {
  const data = logs.map((log) => ({
    "Date/Heure": log.createdAt?.toDate().toLocaleString() || "",
    "Utilisateur": log.userName || "Utilisateur inconnu",
    "Action": log.action,
    "Type d'entité": log.entityType,
    "ID Entité": log.entityId || "",
  }));

  const csv = arrayToCSV(data);
  const filename = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
  downloadCSV(csv, filename);
}
