"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createUser, updateUser } from "@/entities/user/api";
import type { CreateUserRole, UpdateUserPayload } from "@/entities/user/types";

const usersPath = "/admin/users";
const russianFullNamePattern = /^[А-ЯЁа-яё]+(?:[ -][А-ЯЁа-яё]+){1,3}$/;
const createUserRoles: CreateUserRole[] = ["operator", "reviewer", "storekeeper"];

function parseWorkstationIds(formData: FormData) {
  return formData
    .getAll("workstation_ids")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
}

export async function createUserAction(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim().replace(/\s+/g, " ");
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "operator") as CreateUserRole;

  if (!russianFullNamePattern.test(fullName)) {
    throw new Error("Укажите ФИО на русском языке.");
  }

  if (password.length < 6 || password.length > 128) {
    throw new Error("Пароль должен быть от 6 до 128 символов.");
  }

  if (!createUserRoles.includes(role)) {
    throw new Error("Выберите роль сотрудника.");
  }

  await createUser({
    full_name: fullName,
    password,
    role,
  });

  revalidatePath(usersPath);
  redirect(usersPath);
}

export async function updateUserAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  const roleValue = formData.get("role");
  const role = roleValue ? (String(roleValue) as CreateUserRole) : undefined;
  const workstationsLoaded = formData.get("workstations_loaded") === "1";

  if (!id) {
    throw new Error("Не найден пользователь.");
  }

  if (password && (password.length < 6 || password.length > 128)) {
    throw new Error("Пароль должен быть от 6 до 128 символов.");
  }

  if (role && !createUserRoles.includes(role)) {
    throw new Error("Выберите роль сотрудника.");
  }

  const payload: UpdateUserPayload = {
    ...(role ? { role } : {}),
    ...(password ? { password } : {}),
    ...(workstationsLoaded ? { workstation_ids: parseWorkstationIds(formData) } : {}),
  };

  await updateUser(id, payload);

  revalidatePath(usersPath);
  redirect(usersPath);
}
