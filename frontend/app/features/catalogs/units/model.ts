export const pageSize = 20;
export function toUnitPayload(formData: FormData) {
  return {
    name: String(formData.get('name') ?? '').trim(),
    symbol: String(formData.get('symbol') ?? '').trim(),
  };
}
