"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { login, logout } from "@/entities/auth/api";
import { parseSetCookieHeader } from "@/shared/lib/cookies";

export type LoginState = {
  error?: string;
};

const authMarkerCookie = "arm_auth";

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const loginName = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/tasks");

  if (!loginName || !password) {
    return { error: "Введите логин и пароль." };
  }

  const result = await login({ login: loginName, password });

  if (!result.ok) {
    return { error: result.message ?? "Не удалось войти. Проверьте логин и пароль." };
  }

  const cookieStore = await cookies();

  for (const setCookieHeader of result.setCookies) {
    const parsed = parseSetCookieHeader(setCookieHeader);
    if (parsed) {
      cookieStore.set(parsed.name, parsed.value, parsed.options);
    }
  }

  cookieStore.set(authMarkerCookie, "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/", "layout");
  redirect(nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/tasks");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  await logout(cookieHeader);

  for (const cookie of cookieStore.getAll()) {
    cookieStore.delete(cookie.name);
  }

  for (const cookieName of ["access_token", "refresh_token", authMarkerCookie]) {
    cookieStore.set(cookieName, "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });
  }

  revalidatePath("/", "layout");
  redirect("/");
}
