import { apiClient } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { User, CreateUserDto, UpdateUserDto, QueryParams, PaginatedResponse } from "@/types";

export const usersService = {
  async list(params?: QueryParams) {
    const response = await apiClient.get<PaginatedResponse<User>>(
      endpoints.users.list,
      { params }
    );
    return response.data;
  },

  async get(id: string) {
    const response = await apiClient.get<User>(endpoints.users.detail(id));
    return response.data;
  },

  async create(data: CreateUserDto) {
    const response = await apiClient.post<User>(endpoints.users.create, data);
    return response.data;
  },

  async update(data: UpdateUserDto) {
    const response = await apiClient.put<User>(endpoints.users.update(data.id), data);
    return response.data;
  },

  async delete(id: string) {
    await apiClient.delete(endpoints.users.delete(id));
  },
};
