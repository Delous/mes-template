import type { EditableUserRole, UserRole } from '@/types/api';

export const roleLabels: Record<UserRole, string> = {
  admin: 'Администратор',
  operator: 'Оператор',
  reviewer: 'ОТК',
};

export const editableRoles: EditableUserRole[] = ['operator', 'reviewer'];
export function toCreateUserPayload(formData: FormData) {
  return {
    full_name: String(formData.get('full_name') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
    role: String(formData.get('role') ?? 'operator') as EditableUserRole,
  };
}

export function toUpdateUserPayload(formData: FormData) {
  return {
    role: String(formData.get('role') ?? 'operator') as EditableUserRole,
    password: String(formData.get('password') ?? '') || undefined,
    workstation_ids: formData.getAll('workstation_ids').map(Number),
  };
}
