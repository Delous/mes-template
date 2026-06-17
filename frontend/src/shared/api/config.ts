const defaultApiUrl = "https://arm.delous.ru";

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

export function getApiUrl() {
  if (process.env.API_URL) {
    return trimTrailingSlash(process.env.API_URL);
  }

  return defaultApiUrl;
}
