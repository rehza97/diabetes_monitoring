import { apiClient } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { Report, CreateReportDto, ReportData, QueryParams, PaginatedResponse } from "@/types";

export const reportsService = {
  async list(params?: QueryParams) {
    const response = await apiClient.get<PaginatedResponse<Report>>(
      endpoints.reports.list,
      { params }
    );
    return response.data;
  },

  async get(id: string) {
    const response = await apiClient.get<Report>(endpoints.reports.detail(id));
    return response.data;
  },

  async create(data: CreateReportDto) {
    const response = await apiClient.post<Report>(endpoints.reports.create, data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateReportDto>) {
    const response = await apiClient.put<Report>(endpoints.reports.update(id), data);
    return response.data;
  },

  async delete(id: string) {
    await apiClient.delete(endpoints.reports.delete(id));
  },

  async generate(id: string) {
    const response = await apiClient.post<ReportData>(endpoints.reports.generate(id));
    return response.data;
  },

  async export(id: string, format: "pdf" | "excel" | "csv" = "pdf") {
    const response = await fetch(endpoints.reports.export(id, format));
    return response.blob();
  },
};
