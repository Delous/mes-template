import type { LoginPayload } from '@/types/api';
export function getSafeNextPath(next: string | null) {
  return next?.startsWith('/') && !next.startsWith('//') ? next : '/tasks';
}
export function toLoginPayload(formData: FormData): LoginPayload {
  return {
    login: String(formData.get('username') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
  };
}
