import { STORAGE_KEYS } from "@/utils/constants";

export const storage = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing from localStorage:", error);
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  },
};

// Convenience methods for common keys
export const authStorage = {
  getToken: () => storage.get<string>(STORAGE_KEYS.AUTH_TOKEN),
  setToken: (token: string) => storage.set(STORAGE_KEYS.AUTH_TOKEN, token),
  removeToken: () => storage.remove(STORAGE_KEYS.AUTH_TOKEN),
  getUser: () => storage.get(STORAGE_KEYS.USER),
  setUser: (user: any) => storage.set(STORAGE_KEYS.USER, user),
  removeUser: () => storage.remove(STORAGE_KEYS.USER),
};
