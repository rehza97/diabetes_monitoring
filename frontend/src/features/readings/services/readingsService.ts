import { apiClient } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { Reading, CreateReadingDto, UpdateReadingDto, QueryParams, PaginatedResponse } from "@/types";

export const readingsService = {
  async list(params?: QueryParams) {
    const response = await apiClient.get<PaginatedResponse<Reading>>(
      endpoints.readings.list,
      { params }
    );
    return response.data;
  },

  async get(id: string) {
    const response = await apiClient.get<Reading>(endpoints.readings.detail(id));
    return response.data;
  },

  async create(data: CreateReadingDto) {
    const response = await apiClient.post<Reading>(endpoints.readings.create, data);
    return response.data;
  },

  async update(data: UpdateReadingDto) {
    const response = await apiClient.put<Reading>(endpoints.readings.update(data.id), data);
    return response.data;
  },

  async delete(id: string) {
    await apiClient.delete(endpoints.readings.delete(id));
  },

  async getByPatient(patientId: string, params?: QueryParams) {
    const response = await apiClient.get<PaginatedResponse<Reading>>(
      endpoints.readings.byPatient(patientId),
      { params }
    );
    return response.data;
  },
};
