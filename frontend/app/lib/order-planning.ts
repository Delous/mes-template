import type { OrderDto, UpdateOrderPayload } from '@/types/api';

export const orderPriorityLabels = { medium: 'Средний', high: 'Высокий' };

export function formatOrderDeadline(order: Pick<OrderDto, 'deadline'>) {
  return order.deadline?.split('-').reverse().join('.') || 'Не задан';
}

export function toOrderPlanningPayload(formData: FormData): UpdateOrderPayload {
  const value = formData.get('priority') ?? 'medium';
  const priority = value === 'none' ? null : value;
  if (priority !== null && priority !== 'medium' && priority !== 'high') {
    throw new Error('Выберите приоритет заказа.');
  }
  const deadline = String(formData.get('deadline') ?? '').trim() || null;
  if (deadline !== null && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    throw new Error('Выберите дату дедлайна.');
  }
  return { priority, deadline: deadline };
}
