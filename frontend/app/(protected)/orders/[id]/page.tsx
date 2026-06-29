"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge, Box, Button, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import { ArrowLeft } from "lucide-react";

import { ErrorNotice, formatDate, formatQuantity, LoadingState, PageHeader } from "@/components/page-tools";
import { getCatalog, getOrder, normalizeApiError } from "@/lib/api";
import type { ItemDto, OrderDto, RouteDto, BomDto } from "@/types/api";

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [items, setItems] = useState<ItemDto[]>([]);
  const [routes, setRoutes] = useState<RouteDto[]>([]);
  const [boms, setBoms] = useState<BomDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [orderResponse, itemResponse, routeResponse, bomResponse] = await Promise.all([
        getOrder(orderId),
        getCatalog("items", 1, 100),
        getCatalog("routes", 1, 100),
        getCatalog("boms", 1, 100),
      ]);
      setOrder(orderResponse);
      setItems(itemResponse.items);
      setRoutes(routeResponse.items);
      setBoms(bomResponse.items);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  return (
    <div className="page-content">
      <PageHeader
        title={order ? `Заказ ${order.number}` : "Заказ"}
        description={order ? `Создан ${formatDate(order.created_at)}` : undefined}
        action={
          <Button asChild variant="soft" color="gray">
            <Link href="/orders">
              <ArrowLeft size={16} /> Назад
            </Link>
          </Button>
        }
      />
      <ErrorNotice message={error} />

      {loading ? (
        <LoadingState label="Загружаем заказ" />
      ) : order ? (
        <Grid columns={{ initial: "1", md: "3" }} gap="4">
          <Box className="surface" p="4">
            <Text size="1" color="gray">
              Статус
            </Text>
            <Text as="p" weight="medium">
              <Badge>{order.status}</Badge>
            </Text>
          </Box>
          <Box className="surface" p="4">
            <Text size="1" color="gray">
              Обновлен
            </Text>
            <Text as="p" weight="medium">
              {formatDate(order.updated_at)}
            </Text>
          </Box>
          <Box className="surface" p="4">
            <Text size="1" color="gray">
              Строк
            </Text>
            <Text as="p" weight="medium">
              {order.lines.length}
            </Text>
          </Box>

          <Box className="surface table-scroll order-lines-panel">
            <Box p="4" pb="0">
              <Heading size="4">Строки заказа</Heading>
            </Box>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Номенклатура</th>
                  <th>Маршрут</th>
                  <th>BOM</th>
                  <th>Количество</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line) => (
                  <tr key={line.id}>
                    <td>{line.id}</td>
                    <td>{items.find((item) => item.id === line.item_id)?.name ?? `#${line.item_id}`}</td>
                    <td>{routes.find((route) => route.id === line.route_id)?.name ?? (line.route_id ? `#${line.route_id}` : "Не указан")}</td>
                    <td>{boms.find((bom) => bom.id === line.bom_id)?.name ?? (line.bom_id ? `#${line.bom_id}` : "По умолчанию")}</td>
                    <td>{formatQuantity(line.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Grid>
      ) : null}
    </div>
  );
}
