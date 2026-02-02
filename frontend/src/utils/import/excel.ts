import * as XLSX from "xlsx";
import type { CreateFirestorePatientDto } from "@/types/firestore";
import { Timestamp } from "firebase/firestore";

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; error: string }>;
}

/**
 * Parse Excel file and extract patient data
 */
export function parsePatientExcelFile(file: File): Promise<{
  data: CreateFirestorePatientDto[];
  errors: Array<{ row: number; error: string }>;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const patients: CreateFirestorePatientDto[] = [];
        const errors: Array<{ row: number; error: string }> = [];

        jsonData.forEach((row, index) => {
          try {
            // Map Excel columns to patient fields
            const patient: CreateFirestorePatientDto = {
              firstName: row["Prénom"] || row["First Name"] || "",
              lastName: row["Nom"] || row["Last Name"] || "",
              dateOfBirth:
                row["Date de naissance"] || row["Date of Birth"]
                  ? Timestamp.fromDate(
                      new Date(
                        row["Date de naissance"] ||
                          (row["Date of Birth"] as string),
                      ),
                    )
                  : Timestamp.now(),
              gender: (row["Sexe"] || row["Gender"] || "male") as
                | "male"
                | "female",
              phone: row["Téléphone"] || row["Phone"] || "",
              email: row["Email"] || "",
              address: row["Adresse"] || row["Address"] || "",
              diabetesType: (row["Type de diabète"] ||
                row["Diabetes Type"] ||
                "type2") as "type1" | "type2" | "gestational",
              diagnosisDate:
                row["Date de diagnostic"] || row["Diagnosis Date"]
                  ? Timestamp.fromDate(
                      new Date(
                        row["Date de diagnostic"] ||
                          (row["Diagnosis Date"] as string),
                      ),
                    )
                  : Timestamp.now(),
              bloodType:
                row["Groupe sanguin"] || row["Blood Type"] || undefined,
              weight:
                row["Poids"] || row["Weight"]
                  ? Number(row["Poids"] || row["Weight"])
                  : undefined,
              height:
                row["Taille"] || row["Height"]
                  ? Number(row["Taille"] || row["Height"])
                  : undefined,
              doctorId: (row["Médecin"] || row["Doctor"] || "none") as string,
              nurseId: (row["Infirmier"] || row["Nurse"] || "none") as string,
            };

            // Validate required fields
            if (!patient.firstName || !patient.lastName) {
              errors.push({
                row: index + 2, // +2 because Excel rows start at 1 and we have header
                error: "Prénom et Nom sont requis",
              });
              return;
            }

            patients.push(patient);
          } catch (error) {
            errors.push({
              row: index + 2,
              error: error instanceof Error ? error.message : "Erreur inconnue",
            });
          }
        });

        resolve({ data: patients, errors });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Erreur lors de la lecture du fichier"));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Download Excel template for patient import
 */
export function downloadPatientImportTemplate(): void {
  const templateData = [
    {
      Prénom: "Mohamed",
      Nom: "Tounsi",
      "Date de naissance": "1980-05-15",
      Sexe: "male",
      Téléphone: "+33 6 12 34 56 78",
      Email: "mohamed@example.com",
      Adresse: "123 Rue de la Santé",
      "Type de diabète": "type2",
      "Date de diagnostic": "2020-03-10",
      "Groupe sanguin": "A+",
      Poids: 85,
      Taille: 175,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Patients");

  XLSX.writeFile(workbook, "template_import_patients.xlsx");
}
