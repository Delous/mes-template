import { Detail } from '@/components/detail';
import { formatOrderDeadline, orderPriorityLabels } from '@/lib/order-planning';
import type { OrderDto } from '@/types/api';
import { Badge } from '@radix-ui/themes';

export function OrderPlanningSummary({
  order,
}: {
  order: Pick<OrderDto, 'priority' | 'deadline'>;
}) {
  return (
    <>
      <Detail
        label="Приоритет заказа"
        value={
          <Badge color={order.priority === 'high' ? 'red' : 'gray'}>
            {order.priority === null ? 'Не задан' : orderPriorityLabels[order.priority]}
          </Badge>
        }
      />
      <Detail label="Дедлайн заказа" value={formatOrderDeadline(order)} />
    </>
  );
}
