export type DiabetesType = "type1" | "type2" | "gestational";
export type PatientStatus = "active" | "inactive" | "critical" | "needs_followup";

export interface Patient {
  id: string;
  file_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  age?: number; // computed
  gender: "male" | "female";
  phone: string;
  email?: string;
  address?: string;
  diabetes_type: DiabetesType;
  diagnosis_date: string;
  blood_type?: string;
  weight?: number;
  height?: number;
  bmi?: number; // computed
  doctor_id?: string;
  nurse_id?: string;
  avatar?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePatientDto {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: "male" | "female";
  phone: string;
  email?: string;
  address?: string;
  diabetes_type: DiabetesType;
  diagnosis_date: string;
  blood_type?: string;
  weight?: number;
  height?: number;
  doctor_id?: string;
  nurse_id?: string;
  avatar?: string;
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {
  id: string;
}
