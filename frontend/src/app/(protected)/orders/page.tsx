import Link from "next/link";
import { Badge, Box, Button, Flex, Text } from "@radix-ui/themes";
import { Plus } from "lucide-react";

import { getOrdersResult } from "@/entities/order/api";
import { labels } from "@/shared/i18n/labels";
import { formatDate, formatQuantity } from "@/shared/lib/format";
import { ErrorNotice } from "@/shared/ui/Notice";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function OrdersPage() {
  const result = await getOrdersResult();
  const orders = result.ok ? result.data.items : [];

  return (
    <div className="page-content">
      <PageHeader
        title={labels.entities.orders}
        description="Создание заказа запускает построение графа задач на backend."
        action={
          <Button asChild>
            <Link href="/orders/new">
              <Plus size={16} /> {labels.actions.create}
            </Link>
          </Button>
        }
      />
      {!result.ok ? <ErrorNotice message={result.message} /> : null}
      <Box className="surface table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>{labels.fields.number}</th>
              <th>{labels.fields.status}</th>
              <th>{labels.fields.quantity}</th>
              <th>{labels.fields.createdAt}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/orders/${order.id}`}>
                    <Text weight="medium">{order.number}</Text>
                  </Link>
                </td>
                <td>
                  <Badge>{labels.orderStatuses[order.status as keyof typeof labels.orderStatuses] ?? order.status}</Badge>
                </td>
                <td>
                  <Flex direction="column" gap="1">
                    {order.lines.map((line) => (
                      <Text size="2" key={line.id}>
                        {line.item?.name ?? line.item_id}: {formatQuantity(line.quantity)}
                      </Text>
                    ))}
                  </Flex>
                </td>
                <td>{formatDate(order.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </div>
  );
}
