import Link from "next/link";
import { Badge, Box, Button, Flex, Heading, Text } from "@radix-ui/themes";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { getOrder } from "@/entities/order/api";
import { ApiError } from "@/shared/api/fetcher";
import { labels } from "@/shared/i18n/labels";
import { formatDate, formatQuantity } from "@/shared/lib/format";
import { ErrorNotice } from "@/shared/ui/Notice";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);

  try {
    const order = await getOrder(orderId);

    return (
      <div className="page-content">
        <PageHeader
          title={`${labels.entities.order} ${order.number}`}
          action={
            <Button asChild variant="soft">
              <Link href="/orders">
                <ArrowLeft size={16} /> {labels.app.back}
              </Link>
            </Button>
          }
        />
        <Box className="surface" p="4" mb="4">
          <Flex gap="4" wrap="wrap">
            <Text>
              {labels.fields.status}:{" "}
              <Badge>{labels.orderStatuses[order.status as keyof typeof labels.orderStatuses] ?? order.status}</Badge>
            </Text>
            <Text>
              {labels.fields.createdAt}: {formatDate(order.created_at)}
            </Text>
          </Flex>
        </Box>
        <Box className="surface" p="4">
          <Heading size="4" mb="3">
            {labels.fields.quantity}
          </Heading>
          <Flex direction="column" gap="3">
            {order.lines.map((line) => (
              <Flex key={line.id} justify="between" gap="4" wrap="wrap">
                <Text weight="medium">{line.item?.name ?? line.item_id}</Text>
                <Text color="gray">
                  {labels.fields.route}: {line.route?.name ?? line.route_id}
                </Text>
                <Text>{formatQuantity(line.quantity)}</Text>
              </Flex>
            ))}
          </Flex>
        </Box>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    return (
      <div className="page-content">
        <PageHeader
          title={labels.entities.order}
          action={
            <Button asChild variant="soft">
              <Link href="/orders">
                <ArrowLeft size={16} /> {labels.app.back}
              </Link>
            </Button>
          }
        />
        <ErrorNotice message={error instanceof Error ? error.message : labels.app.error} />
      </div>
    );
  }
}
