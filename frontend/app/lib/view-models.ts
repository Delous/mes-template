import type {
  AdminUserDto,
  ItemDto,
  OrderDetailDto,
  OrderDto,
  TaskDto,
  UnitDto,
} from '@/types/api';
import { formatDate, formatQuantity } from './format';

export function toTaskView(task: TaskDto) {
  const route = task.routes.find((route) => route.key === task.route_key);
  const step = task.step_number ? route?.steps[task.step_number - 1] : undefined;
  const steps = step ? [step] : task.routes.flatMap((route) => route.steps);
  return {
    ...task,
    title: task.name || task.item.name,
    workstationLabel: [...new Set(steps.map((step) => step.workstation))].join(', ') || 'Не указан',
    operationLabel: [...new Set(steps.map((step) => step.operation))].join(', ') || 'Не указана',
    materials: steps.flatMap((step) => step.materials),
    orderLabel: task.description || `Заказ №${task.order_id}`,
    createdLabel: formatDate(task.created_at),
    updatedLabel: formatDate(task.updated_at),
    plannedLabel: formatQuantity(task.planned_quantity),
    actualLabel: formatQuantity(task.actual_quantity),
    defectLabel: formatQuantity(task.defect_quantity),
    pendingDependencies: task.dependencies.filter((dependency) => dependency.status !== 'done'),
  };
}
export type TaskView = ReturnType<typeof toTaskView>;

export function toOrderView(order: OrderDto) {
  return {
    ...order,
    createdLabel: formatDate(order.created_at),
    quantityLabel: formatQuantity(
      order.lines.reduce((sum, line) => sum + Number(line.quantity), 0),
    ),
  };
}
export type OrderView = ReturnType<typeof toOrderView>;

export function toOrderDetailView(order: OrderDetailDto, items: ItemDto[]) {
  const names = new Map(items.map((item) => [item.id, item.name]));
  return {
    ...toOrderView(order),
    lines: order.lines.map((line) => ({
      ...line,
      itemName: names.get(line.item_id) ?? `${line.item_id}`,
      quantityLabel: formatQuantity(line.quantity),
    })),
    tasks: order.tasks.map(toTaskView),
  };
}
export type OrderDetailView = ReturnType<typeof toOrderDetailView>;

export const roleLabels = { admin: 'Администратор', operator: 'Оператор', reviewer: 'ОТК' };
export function toUserView(user: AdminUserDto) {
  return {
    ...user,
    roleLabel: roleLabels[user.role],
    workstationNames:
      user.workstations.map((workstation) => workstation.name).join(', ') || 'Не назначены',
    workstationIds: user.workstations.map((workstation) => workstation.id),
  };
}
export type UserView = ReturnType<typeof toUserView>;

export function toUnitView(unit: UnitDto) {
  return { ...unit, updatedLabel: formatDate(unit.updated_at) };
}
export type UnitView = ReturnType<typeof toUnitView>;
