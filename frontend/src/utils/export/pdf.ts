import jsPDF from "jspdf";
import type {
  FirestorePatient,
  FirestoreReading,
  FirestoreUser,
} from "@/types/firestore";

interface PDFReportOptions {
  title: string;
  logo?: string;
  header?: string;
  footer?: string;
}

/**
 * Export patient report to PDF
 */
export async function exportPatientReportToPDF(
  patient: FirestorePatient,
  readings: FirestoreReading[],
  options: PDFReportOptions = { title: "Rapport Patient" },
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Header
  if (options.header) {
    doc.setFontSize(16);
    doc.text(options.header, pageWidth / 2, yPos, { align: "center" });
    yPos += 10;
  }

  // Title
  doc.setFontSize(14);
  doc.text(options.title ?? "Rapport", pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 15;

  // Patient Information
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Informations Patient", 20, yPos);
  yPos += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const patientInfo = [
    `Nom: ${patient.firstName || ""} ${patient.lastName || ""}`,
    `Dossier: ${patient.fileNumber || ""}`,
    `Date de naissance: ${patient.dateOfBirth?.toDate().toLocaleDateString() || "N/A"}`,
    `Type de diabète: ${patient.diabetesType}`,
    `Téléphone: ${patient.phone || "N/A"}`,
  ];

  patientInfo.forEach((info) => {
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(info, 25, yPos);
    yPos += 6;
  });

  yPos += 5;

  // Readings Section
  if (readings.length > 0) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Historique des Mesures", 20, yPos);
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    // Table header
    doc.setFont("helvetica", "bold");
    doc.text("Date", 20, yPos);
    doc.text("Valeur", 60, yPos);
    doc.text("Type", 90, yPos);
    doc.text("État", 130, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");

    // Table rows
    readings.slice(0, 30).forEach((reading) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }

      const date = reading.date?.toDate().toLocaleDateString() || "N/A";
      const value = `${reading.value} ${reading.unit}`;
      const type = reading.readingType;
      const status = reading.status || "normal";

      doc.text(date, 20, yPos);
      doc.text(value, 60, yPos);
      doc.text(type, 90, yPos);
      doc.text(status, 130, yPos);
      yPos += 6;
    });
  }

  // Footer
  if (options.footer) {
    doc.setFontSize(8);
    doc.text(options.footer, pageWidth / 2, pageHeight - 10, {
      align: "center",
    });
  }

  // Generate filename
  const filename = `rapport_patient_${patient.fileNumber || patient.id}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}

/**
 * Export readings report to PDF
 */
export async function exportReadingsReportToPDF(
  readings: Array<FirestoreReading & { patientName?: string }>,
  options: PDFReportOptions = { title: "Rapport des Mesures" },
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Header
  if (options.header) {
    doc.setFontSize(16);
    doc.text(options.header, pageWidth / 2, yPos, { align: "center" });
    yPos += 10;
  }

  // Title
  doc.setFontSize(14);
  doc.text(options.title ?? "Rapport", pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 15;

  // Table header
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Patient", 20, yPos);
  doc.text("Date", 60, yPos);
  doc.text("Valeur", 100, yPos);
  doc.text("Type", 130, yPos);
  doc.text("État", 160, yPos);
  yPos += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  // Table rows
  readings.forEach((reading) => {
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    const patientName = reading.patientName || "Patient inconnu";
    const date = reading.date?.toDate().toLocaleDateString() || "N/A";
    const value = `${reading.value} ${reading.unit}`;
    const type = reading.readingType;
    const status = reading.status || "normal";

    doc.text(patientName.substring(0, 20), 20, yPos);
    doc.text(date, 60, yPos);
    doc.text(value, 100, yPos);
    doc.text(type, 130, yPos);
    doc.text(status, 160, yPos);
    yPos += 6;
  });

  // Footer
  if (options.footer) {
    doc.setFontSize(8);
    doc.text(options.footer, pageWidth / 2, pageHeight - 10, {
      align: "center",
    });
  }

  const filename = `rapport_mesures_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
