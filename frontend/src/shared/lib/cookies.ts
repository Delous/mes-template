export type CookieOptions = {
  path: string;
  httpOnly: boolean;
  sameSite: "strict" | "lax" | "none";
  maxAge?: number;
  expires?: Date;
  secure?: boolean;
};

export function getSetCookies(headers: Headers) {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof withGetSetCookie.getSetCookie === "function") {
    return withGetSetCookie.getSetCookie();
  }

  const singleHeader = headers.get("set-cookie");
  return singleHeader ? singleHeader.split(/,(?=\s*[^;,\s]+=)/).map((header) => header.trim()) : [];
}

export function parseSetCookieHeader(header: string) {
  const [nameValue, ...attributes] = header.split(";").map((part) => part.trim());
  const separatorIndex = nameValue.indexOf("=");

  if (separatorIndex <= 0) return null;

  const name = nameValue.slice(0, separatorIndex);
  const value = nameValue.slice(separatorIndex + 1);
  const options: CookieOptions = {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  };

  for (const attribute of attributes) {
    const [rawKey, ...rawValue] = attribute.split("=");
    const key = rawKey.toLowerCase();
    const attrValue = rawValue.join("=");

    if (key === "path" && attrValue) options.path = attrValue;
    if (key === "max-age" && attrValue) options.maxAge = Number(attrValue);
    if (key === "expires" && attrValue) options.expires = new Date(attrValue);
    if (key === "secure") options.secure = true;
    if (key === "httponly") options.httpOnly = true;
    if (key === "samesite" && ["strict", "lax", "none"].includes(attrValue.toLowerCase())) {
      options.sameSite = attrValue.toLowerCase() as "strict" | "lax" | "none";
    }
  }

  return { name, value, options };
}

export function upsertCookieHeader(cookieHeader: string, name: string, value: string) {
  const nextCookies = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .filter((cookie) => !cookie.startsWith(`${name}=`));

  nextCookies.push(`${name}=${value}`);

  return nextCookies.join("; ");
}

export function createAuthSetCookiesFromTokenResponse(payload: unknown) {
  if (typeof payload !== "object" || payload === null) return [];

  const tokenPayload = payload as {
    access_token?: unknown;
    refresh_token?: unknown;
    expires_in?: unknown;
  };
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const accessMaxAge =
    typeof tokenPayload.expires_in === "number" && Number.isFinite(tokenPayload.expires_in)
      ? `; Max-Age=${Math.max(0, Math.floor(tokenPayload.expires_in))}`
      : "";
  const setCookies: string[] = [];

  if (typeof tokenPayload.access_token === "string" && tokenPayload.access_token) {
    setCookies.push(`access_token=${tokenPayload.access_token}; Path=/; HttpOnly; SameSite=Lax${secure}${accessMaxAge}`);
  }

  if (typeof tokenPayload.refresh_token === "string" && tokenPayload.refresh_token) {
    setCookies.push(`refresh_token=${tokenPayload.refresh_token}; Path=/; HttpOnly; SameSite=Lax${secure}`);
  }

  return setCookies;
}
