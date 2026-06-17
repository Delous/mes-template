import { getApiUrl } from "@/shared/api/config";
import { getSetCookies } from "@/shared/lib/cookies";

import type { MeDto } from "../user/types";

export type LoginPayload = {
  login: string;
  password: string;
};

export type LoginResponse = {
  ok: boolean;
  status: number;
  message?: string;
  setCookies: string[];
};

const defaultLoginPaths = ["/api/v1/login"];
const defaultLogoutPaths = ["/api/v1/logout"];
const refreshPath = "/api/v1/refresh";
const mePath = "/api/v1/me";

function getConfiguredPaths(envValue: string | undefined, fallback: string[]) {
  return envValue
    ? envValue
        .split(",")
        .map((path) => path.trim())
        .filter(Boolean)
    : fallback;
}

function formatValidationDetail(detail: unknown) {
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item !== "object" || item === null) return String(item);
        const issue = item as { loc?: unknown; msg?: unknown };
        const location = Array.isArray(issue.loc) ? issue.loc.join(".") : "";
        const message = typeof issue.msg === "string" ? issue.msg : "Ошибка валидации";
        return location ? `${location}: ${message}` : message;
      })
      .join("; ");
  }

  return null;
}

async function readErrorMessage(response: Response) {
  const text = await response.text().catch(() => "");

  if (!text) {
    return response.statusText || "Ошибка авторизации";
  }

  try {
    const json = JSON.parse(text) as { detail?: unknown; message?: unknown };
    const detail = formatValidationDetail(json.detail);
    if (detail) return detail;
    return typeof json.message === "string" ? json.message : text;
  } catch {
    return text;
  }
}

async function postLogin(path: string, payload: LoginPayload) {
  return fetch(`${getApiUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const paths = getConfiguredPaths(process.env.AUTH_LOGIN_PATHS ?? process.env.AUTH_LOGIN_PATH, defaultLoginPaths);

  for (const path of paths) {
    let response: Response;

    try {
      response = await postLogin(path, payload);
    } catch (error) {
      return {
        ok: false,
        status: 0,
        message: error instanceof Error ? error.message : "API недоступен",
        setCookies: [],
      };
    }

    if (response.ok) {
      const setCookies = getSetCookies(response.headers);

      if (setCookies.length === 0) {
        return {
          ok: false,
          status: response.status,
          message: "Backend не вернул cookie сессии.",
          setCookies: [],
        };
      }

      return {
        ok: true,
        status: response.status,
        setCookies,
      };
    }

    if (![404, 405].includes(response.status)) {
      return {
        ok: false,
        status: response.status,
        message: await readErrorMessage(response),
        setCookies: [],
      };
    }
  }

  return {
    ok: false,
    status: 404,
    message: "Endpoint авторизации не найден. Укажите AUTH_LOGIN_PATH.",
    setCookies: [],
  };
}

export async function logout(cookieHeader: string) {
  const paths = getConfiguredPaths(process.env.AUTH_LOGOUT_PATHS ?? process.env.AUTH_LOGOUT_PATH, defaultLogoutPaths);

  await Promise.any(
    paths.map((path) =>
      fetch(`${getApiUrl()}${path}`, {
        method: "POST",
        headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
        cache: "no-store",
      }),
    ),
  ).catch(() => undefined);
}

export async function refresh(cookieHeader: string) {
  return fetch(`${getApiUrl()}${refreshPath}`, {
    method: "POST",
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
}

export async function getMe(cookieHeader: string) {
  const response = await fetch(`${getApiUrl()}${mePath}`, {
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<MeDto>;
}
