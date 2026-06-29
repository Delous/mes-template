export const DEFAULT_APP_NAME = "DevIT";
export const APP_DESCRIPTION = "MES-система от DevIT";
export const APP_THEME_COLOR = "#e54d2e";
export const APP_ICON_180 = "/icons/icon-180.png";
export const APP_ICON_512 = "/icons/icon-512.png";

export function getAppName() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim();

  return appName || DEFAULT_APP_NAME;
}
