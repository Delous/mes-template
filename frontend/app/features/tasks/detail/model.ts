import type { TaskUpdateStatus } from '@/types/api';

export function asOptionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text || undefined;
}
export function toTaskPayload(status: TaskUpdateStatus, formData: FormData) {
  return {
    status,
    actual_quantity_delta: asOptionalString(formData.get('actual_quantity_delta')),
    defect_quantity_delta: asOptionalString(formData.get('defect_quantity_delta')),
    comment: asOptionalString(formData.get('comment')),
  };
}
