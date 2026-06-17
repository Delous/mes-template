import { labels } from "@/shared/i18n/labels";

export function formatDate(value: string | null | undefined) {
  if (!value) return labels.app.unknown;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatQuantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return labels.app.unknown;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 6 }).format(numeric);
}

export function toDecimalString(value: FormDataEntryValue | null, fallback = "0.000000") {
  const raw = String(value ?? "").trim().replace(",", ".");
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return fallback;
  return numeric.toFixed(6);
}
