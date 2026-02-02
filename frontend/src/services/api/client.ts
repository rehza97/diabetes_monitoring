import { API_BASE_URL } from "@/utils/constants";
import { STORAGE_KEYS } from "@/utils/constants";
import type { ApiResponse, ApiError } from "@/types";

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  async get<T>(
    endpoint: string,
    options?: RequestInit & {
      params?: Record<string, string | number | undefined>;
    },
  ): Promise<ApiResponse<T>> {
    const { params, ...init } = options ?? {};
    const url =
      params && Object.keys(params).length
        ? `${endpoint}?${new URLSearchParams(
            Object.entries(params).filter(([, v]) => v != null) as [
              string,
              string,
            ][],
          ).toString()}`
        : endpoint;
    return this.request<T>(url, { ...init, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
