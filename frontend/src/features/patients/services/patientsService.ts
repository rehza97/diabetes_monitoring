import { apiClient } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { Patient, CreatePatientDto, UpdatePatientDto, QueryParams, PaginatedResponse } from "@/types";

export const patientsService = {
  async list(params?: QueryParams) {
    const response = await apiClient.get<PaginatedResponse<Patient>>(
      endpoints.patients.list,
      { params }
    );
    return response.data;
  },

  async get(id: string) {
    const response = await apiClient.get<Patient>(endpoints.patients.detail(id));
    return response.data;
  },

  async create(data: CreatePatientDto) {
    const response = await apiClient.post<Patient>(endpoints.patients.create, data);
    return response.data;
  },

  async update(data: UpdatePatientDto) {
    const response = await apiClient.put<Patient>(endpoints.patients.update(data.id), data);
    return response.data;
  },

  async delete(id: string) {
    await apiClient.delete(endpoints.patients.delete(id));
  },

  async export(params?: QueryParams) {
    const response = await fetch(`${endpoints.patients.export}?${new URLSearchParams(params as any)}`);
    return response.blob();
  },

  async import(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post(endpoints.patients.import, formData);
    return response.data;
  },
};
