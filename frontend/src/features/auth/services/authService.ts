import { apiClient } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { User, LoginInput } from "@/types";

export const authService = {
  async login(credentials: LoginInput) {
    const response = await apiClient.post<{ user: User; token: string }>(
      endpoints.auth.login,
      credentials
    );
    return response.data;
  },

  async logout() {
    await apiClient.post(endpoints.auth.logout);
  },

  async refreshToken() {
    const response = await apiClient.post<{ token: string }>(endpoints.auth.refresh);
    return response.data;
  },

  async forgotPassword(email: string) {
    await apiClient.post(endpoints.auth.forgotPassword, { email });
  },

  async resetPassword(token: string, password: string) {
    await apiClient.post(endpoints.auth.resetPassword, { token, password });
  },
};
