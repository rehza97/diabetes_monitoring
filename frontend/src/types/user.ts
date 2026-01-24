export type UserRole = "admin" | "doctor" | "nurse";
export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password?: string; // hashed, never returned from API
  role: UserRole;
  avatar?: string;
  specialization?: string; // for doctors
  license_number?: string; // for doctors and nurses
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDto {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  specialization?: string;
  license_number?: string;
  is_active?: boolean;
}

export interface UpdateUserDto extends Partial<CreateUserDto> {
  id: string;
}
