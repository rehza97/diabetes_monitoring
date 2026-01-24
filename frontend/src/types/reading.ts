export type ReadingType =
  | "fasting"
  | "post_breakfast"
  | "pre_lunch"
  | "post_lunch"
  | "pre_dinner"
  | "post_dinner"
  | "bedtime"
  | "midnight"
  | "random";

export type ReadingStatus = "normal" | "warning" | "critical";
export type ReadingUnit = "mg/dL" | "mmol/L";

export interface Reading {
  id: string;
  patient_id: string;
  value: number;
  unit: ReadingUnit;
  reading_type: ReadingType;
  date: string;
  time: string;
  notes?: string;
  symptoms?: string[]; // JSON array
  condition_during_reading?: string;
  recorded_by_id: string; // user id
  status: ReadingStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateReadingDto {
  patient_id: string;
  value: number;
  unit: ReadingUnit;
  reading_type: ReadingType;
  date: string;
  time: string;
  notes?: string;
  symptoms?: string[];
  condition_during_reading?: string;
}

export interface UpdateReadingDto extends Partial<CreateReadingDto> {
  id: string;
}
