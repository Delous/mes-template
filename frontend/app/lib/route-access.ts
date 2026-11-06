import type { UserRole } from '../types/api';

export function canAccessRoute(role: UserRole | undefined, pathname: string): boolean {
  if (role === 'admin') return true;
  if (role !== 'operator' && role !== 'reviewer') return false;

  return /^\/tasks(?:\/[1-9]\d*)?\/?$/.test(pathname);
}
