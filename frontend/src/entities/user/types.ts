import type { UserRole } from "@/shared/navigation/navigation";

export type CreateUserRole = Exclude<UserRole, "admin">;

export type MeDto = {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  workstation_ids: number[];
};

export type AdminUserDto = {
  id: number;
  username: string;
  full_name: string;
  role: string;
  workstations: { id: number; name: string }[];
};

export type AdminWorkstationDto = {
  id: number;
  name: string;
};

export type CreateUserPayload = {
  full_name: string;
  password: string;
  role: CreateUserRole;
};

export type UpdateUserPayload = {
  password?: string;
  role?: CreateUserRole;
  workstation_ids?: number[];
};
