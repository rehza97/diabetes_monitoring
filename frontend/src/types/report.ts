export type ReportType =
  | "patient_summary"
  | "period_summary"
  | "comparison"
  | "custom";

export interface ReportFilter {
  patient_ids?: string[];
  user_ids?: string[];
  date_from?: string;
  date_to?: string;
  reading_types?: string[];
  status?: string[];
  diabetes_types?: string[];
}

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  filters: ReportFilter;
  created_by_id: string;
  is_scheduled: boolean;
  schedule_config?: {
    frequency: "daily" | "weekly" | "monthly";
    day_of_week?: number;
    day_of_month?: number;
    time?: string;
    recipients?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface CreateReportDto {
  name: string;
  type: ReportType;
  filters: ReportFilter;
  is_scheduled?: boolean;
  schedule_config?: Report["schedule_config"];
}

export interface ReportData {
  report: Report;
  data: {
    summary?: Record<string, any>;
    readings?: any[];
    charts?: any[];
    statistics?: Record<string, any>;
  };
}
