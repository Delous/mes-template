export function formatDate(value: string | null | undefined) {
  if (!value) return 'Не указано';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatQuantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return 'Не указано';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(numeric);
}

export function toDecimal(value: FormDataEntryValue | null, digits = 2) {
  const numeric = Number(
    String(value ?? '')
      .trim()
      .replace(',', '.'),
  );
  return Number.isFinite(numeric) ? numeric.toFixed(digits) : (0).toFixed(digits);
}
