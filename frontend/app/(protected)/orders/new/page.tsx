"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Button, Flex, Grid, Heading, Select, Text, TextField } from "@radix-ui/themes";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { ErrorNotice, LoadingState, PageHeader, toDecimal } from "@/components/page-tools";
import { createOrder, getCatalog, normalizeApiError } from "@/lib/api";
import type { BomDto, ItemDto, OrderLinePayload, RouteDto } from "@/types/api";

type DraftLine = {
  id: number;
  item_id: string;
  route_id: string;
  bom_id: string;
  quantity: string;
};

export default function NewOrderPage() {
  const router = useRouter();
  const [items, setItems] = useState<ItemDto[]>([]);
  const [routes, setRoutes] = useState<RouteDto[]>([]);
  const [boms, setBoms] = useState<BomDto[]>([]);
  const [lines, setLines] = useState<DraftLine[]>([newLine()]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRefs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemResponse, routeResponse, bomResponse] = await Promise.all([
        getCatalog("items", 1, 100),
        getCatalog("routes", 1, 100),
        getCatalog("boms", 1, 100),
      ]);
      setItems(itemResponse.items);
      setRoutes(routeResponse.items.filter((route) => route.status === "active"));
      setBoms(bomResponse.items.filter((bom) => bom.status === "active"));
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payloadLines: OrderLinePayload[] = lines.map((line) => ({
      item_id: Number(line.item_id),
      route_id: Number(line.route_id),
      bom_id: line.bom_id ? Number(line.bom_id) : null,
      quantity: toDecimal(formData.get(`quantity-${line.id}`)),
    }));

    try {
      const order = await createOrder({
        number: String(formData.get("number") ?? "").trim(),
        lines: payloadLines,
      });
      router.replace(`/orders/${order.id}`);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Новый заказ"
        description="После создания backend построит связанные задачи."
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
        <LoadingState label="Загружаем справочники" />
      ) : (
        <Box className="surface" p="4">
          <form onSubmit={handleSubmit}>
            <Grid columns={{ initial: "1", md: "3" }} gap="3" mb="5">
              <label>
                <Text size="2">Номер заказа</Text>
                <TextField.Root name="number" mt="2" required maxLength={128} placeholder="ORD-002" />
              </label>
            </Grid>

            <Flex direction="column" gap="4">
              {lines.map((line, index) => (
                <Box key={line.id} className="nested-block" p="3">
                  <Flex align="center" justify="between" mb="3">
                    <Heading size="3">Строка {index + 1}</Heading>
                    <Button
                      type="button"
                      size="2"
                      variant="soft"
                      color="red"
                      disabled={lines.length === 1}
                      onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))}
                    >
                      <Trash2 size={15} /> Удалить
                    </Button>
                  </Flex>
                  <Grid columns={{ initial: "1", md: "4" }} gap="3">
                    <label>
                      <Text size="2">Номенклатура</Text>
                      <Select.Root value={line.item_id} onValueChange={(value) => updateLine(line.id, { item_id: value, route_id: "", bom_id: "" }, setLines)}>
                        <Select.Trigger mt="2" />
                        <Select.Content>
                          {items.map((item) => (
                            <Select.Item key={item.id} value={String(item.id)}>
                              {item.name}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </label>
                    <label>
                      <Text size="2">Маршрут</Text>
                      <Select.Root value={line.route_id} onValueChange={(value) => updateLine(line.id, { route_id: value }, setLines)}>
                        <Select.Trigger mt="2" />
                        <Select.Content>
                          {routes
                            .filter((route) => !line.item_id || route.item_id === Number(line.item_id))
                            .map((route) => (
                              <Select.Item key={route.id} value={String(route.id)}>
                                {route.name} · {route.version}
                              </Select.Item>
                            ))}
                        </Select.Content>
                      </Select.Root>
                    </label>
                    <label>
                      <Text size="2">BOM</Text>
                      <Select.Root value={line.bom_id || "default"} onValueChange={(value) => updateLine(line.id, { bom_id: value === "default" ? "" : value }, setLines)}>
                        <Select.Trigger mt="2" />
                        <Select.Content>
                          <Select.Item value="default">По умолчанию</Select.Item>
                          {boms
                            .filter((bom) => !line.item_id || bom.item_id === Number(line.item_id))
                            .map((bom) => (
                              <Select.Item key={bom.id} value={String(bom.id)}>
                                {bom.name} · {bom.version}
                              </Select.Item>
                            ))}
                        </Select.Content>
                      </Select.Root>
                    </label>
                    <label>
                      <Text size="2">Количество</Text>
                      <TextField.Root name={`quantity-${line.id}`} mt="2" inputMode="decimal" defaultValue={line.quantity} required />
                    </label>
                  </Grid>
                </Box>
              ))}
            </Flex>

            <Flex gap="3" mt="4" wrap="wrap">
              <Button type="button" variant="soft" onClick={() => setLines((current) => [...current, newLine()])}>
                <Plus size={16} /> Добавить строку
              </Button>
              <Button type="submit" disabled={submitting || lines.some((line) => !line.item_id || !line.route_id)}>
                Создать заказ
              </Button>
            </Flex>
          </form>
        </Box>
      )}
    </div>
  );
}

function newLine(): DraftLine {
  return { id: Date.now() + Math.round(Math.random() * 1000), item_id: "", route_id: "", bom_id: "", quantity: "1" };
}

function updateLine(
  id: number,
  patch: Partial<DraftLine>,
  setLines: React.Dispatch<React.SetStateAction<DraftLine[]>>,
) {
  setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
}
