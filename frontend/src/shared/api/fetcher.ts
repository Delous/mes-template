import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { ApiResult } from "./types";
import { getApiUrl } from "./config";
import {
  createAuthSetCookiesFromTokenResponse,
  getSetCookies,
  parseSetCookieHeader,
  upsertCookieHeader,
} from "../lib/cookies";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function refreshSession(cookieHeader: string) {
  if (!cookieHeader) return null;

  try {
    const response = await fetch(`${getApiUrl()}/api/v1/refresh`, {
      method: "POST",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const setCookies = getSetCookies(response.headers);
    if (setCookies.length > 0) return setCookies;

    const tokenPayload = await response.json().catch(() => null);
    const fallbackSetCookies = createAuthSetCookiesFromTokenResponse(tokenPayload);

    return fallbackSetCookies.length > 0 ? fallbackSetCookies : null;
  } catch {
    return null;
  }
}

function applySetCookiesToHeader(cookieHeader: string, setCookies: string[]) {
  return setCookies.reduce((nextCookieHeader, setCookieHeader) => {
    const parsed = parseSetCookieHeader(setCookieHeader);
    return parsed ? upsertCookieHeader(nextCookieHeader, parsed.name, parsed.value) : nextCookieHeader;
  }, cookieHeader);
}

function tryPersistSetCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  setCookies: string[],
) {
  for (const setCookieHeader of setCookies) {
    const parsed = parseSetCookieHeader(setCookieHeader);
    if (!parsed) continue;

    try {
      cookieStore.set(parsed.name, parsed.value, parsed.options);
    } catch {
      // Server Components cannot mutate response cookies; middleware keeps browser cookies fresh there.
    }
  }
}

function formatErrorDetail(detail: unknown) {
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

function parseErrorMessage(text: string, fallback: string) {
  if (!text) return fallback;

  try {
    const json = JSON.parse(text) as { detail?: unknown; message?: unknown };
    return formatErrorDetail(json.detail) ?? (typeof json.message === "string" ? json.message : text);
  } catch {
    return text;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  const cookieHeader = cookieStore.toString();
  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  let response: Response;

  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      ...init,
      headers,
      cache: init?.cache ?? "no-store",
    });
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : "API request failed", 0);
  }

  if (!response.ok && response.status === 401) {
    const setCookies = await refreshSession(cookieHeader);

    if (setCookies) {
      const refreshedCookieHeader = applySetCookiesToHeader(cookieHeader, setCookies);
      headers.set("Cookie", refreshedCookieHeader);
      tryPersistSetCookies(cookieStore, setCookies);

      response = await fetch(`${getApiUrl()}${path}`, {
        ...init,
        headers,
        cache: init?.cache ?? "no-store",
      });
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      redirect("/");
    }

    const text = await response.text().catch(() => "");
    throw new ApiError(parseErrorMessage(text, response.statusText), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function isNextRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function apiResult<T>(request: Promise<T>): Promise<ApiResult<T>> {
  try {
    return { ok: true, data: await request };
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof ApiError) {
      return { ok: false, status: error.status, message: error.message };
    }

    return { ok: false, status: 0, message: error instanceof Error ? error.message : "Unknown error" };
  }
}
