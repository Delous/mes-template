export const pageSize = 20;
export function toNamePayload(formData: FormData) {
  return {
    name: String(formData.get('name') ?? '').trim(),
  };
}
