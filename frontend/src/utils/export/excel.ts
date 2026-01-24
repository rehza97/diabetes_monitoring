import * as XLSX from "xlsx";
import type { FirestorePatient, FirestoreReading, FirestoreUser, FirestoreAuditLog } from "@/types/firestore";

/**
 * Export patients list to Excel
 */
export function exportPatientsToExcel(patients: FirestorePatient[]): void {
  const data = patients.map((patient) => ({
    "N° Dossier": patient.fileNumber || "",
    "Prénom": patient.firstName || "",
    "Nom": patient.lastName || "",
    "Date de naissance": patient.dateOfBirth?.toDate().toLocaleDateString() || "",
    "Type de diabète": patient.diabetesType,
    "Téléphone": patient.phone || "",
    "Email": patient.email || "",
    "Statut": patient.isActive ? "Actif" : "Inactif",
    "Dernière mesure": patient.lastReadingDate?.toDate().toLocaleDateString() || "Aucune",
    "Valeur dernière mesure": patient.lastReadingValue || "",
    "État": patient.lastReadingStatus || "normal",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Patients");

  const filename = `patients_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Export readings to Excel
 */
export function exportReadingsToExcel(
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
    "Notes": reading.notes || "",
    "Enregistré par": reading.recordedByName || "Utilisateur inconnu",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Mesures");

  const filename = `mesures_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Export users list to Excel
 */
export function exportUsersToExcel(users: FirestoreUser[]): void {
  const data = users.map((user) => ({
    "Prénom": user.firstName || "",
    "Nom": user.lastName || "",
    "Email": user.email || "",
    "Rôle": user.role,
    "Téléphone": user.phone || "",
    "Spécialisation": user.specialization || "",
    "Numéro de licence": user.licenseNumber || "",
    "Statut": user.isActive ? "Actif" : "Inactif",
    "Date de création": user.createdAt?.toDate().toLocaleDateString() || "",
    "Dernière connexion": user.lastLogin?.toDate().toLocaleDateString() || "Jamais",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Utilisateurs");

  const filename = `utilisateurs_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Export audit logs to Excel
 */
export function exportAuditLogsToExcel(logs: FirestoreAuditLog[]): void {
  const data = logs.map((log) => ({
    "Date/Heure": log.createdAt?.toDate().toLocaleString() || "",
    "Utilisateur": log.userName || "Utilisateur inconnu",
    "Action": log.action,
    "Type d'entité": log.entityType,
    "ID Entité": log.entityId || "",
    "Adresse IP": log.ipAddress || "",
    "User Agent": log.userAgent || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");

  const filename = `audit_logs_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
