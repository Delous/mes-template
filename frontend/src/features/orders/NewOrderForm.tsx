"use client";

import { useMemo, useState } from "react";
import { Box, Button, Flex, Grid, Select, Text, TextField } from "@radix-ui/themes";
import { Plus, Trash2 } from "lucide-react";

import type { BomDto, ItemDto, RouteDto } from "@/entities/catalog/types";
import { labels } from "@/shared/i18n/labels";

import { createOrderAction } from "./actions";

type DraftLine = { id: string; itemId: string; routeId: string; bomId: string; quantity: string };

export function NewOrderForm({ items, routes, boms }: { items: ItemDto[]; routes: RouteDto[]; boms: BomDto[] }) {
  const [lines, setLines] = useState<DraftLine[]>([
    { id: crypto.randomUUID(), itemId: items[0]?.id ? String(items[0].id) : "", routeId: "", bomId: "", quantity: "1" },
  ]);

  const byItem = useMemo(
    () => ({
      routes: (itemId: string) => routes.filter((route) => String(route.item_id) === itemId),
      boms: (itemId: string) => boms.filter((bom) => String(bom.item_id) === itemId),
    }),
    [boms, routes],
  );

  function updateLine(id: string, patch: Partial<DraftLine>) {
    setLines((current) =>
      current.map((line) => {
        if (line.id !== id) return line;
        const next = { ...line, ...patch };
        if (patch.itemId) {
          next.routeId = byItem.routes(patch.itemId)[0]?.id ? String(byItem.routes(patch.itemId)[0].id) : "";
          next.bomId = byItem.boms(patch.itemId).find((bom) => bom.is_default)?.id
            ? String(byItem.boms(patch.itemId).find((bom) => bom.is_default)?.id)
            : "";
        }
        return next;
      }),
    );
  }

  return (
    <form action={createOrderAction}>
      <Flex direction="column" gap="4">
        <Box className="surface" p="4">
          <label>
            <Text size="2" weight="medium">
              {labels.fields.number}
            </Text>
            <TextField.Root name="number" mt="2" required placeholder="ORD-001" />
          </label>
        </Box>

        {lines.map((line, index) => {
          const routeOptions = byItem.routes(line.itemId);
          const bomOptions = byItem.boms(line.itemId);
          return (
            <Box className="surface" p="4" key={line.id}>
              <Flex justify="between" align="center" mb="3">
                <Text weight="bold">
                  {labels.entities.order} · {index + 1}
                </Text>
                {lines.length > 1 ? (
                  <Button
                    type="button"
                    size="1"
                    color="red"
                    variant="soft"
                    onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))}
                  >
                    <Trash2 size={14} /> {labels.app.removeLine}
                  </Button>
                ) : null}
              </Flex>

              <Grid columns={{ initial: "1", md: "4" }} gap="3">
                <label>
                  <Text size="2">{labels.fields.item}</Text>
                  <Select.Root value={line.itemId} onValueChange={(value) => updateLine(line.id, { itemId: value })}>
                    <Select.Trigger mt="2" />
                    <Select.Content>
                      {items.map((item) => (
                        <Select.Item key={item.id} value={String(item.id)}>
                          {item.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                  <input type="hidden" name="item_id" value={line.itemId} />
                </label>

                <label>
                  <Text size="2">{labels.fields.route}</Text>
                  <Select.Root value={line.routeId} onValueChange={(value) => updateLine(line.id, { routeId: value })}>
                    <Select.Trigger mt="2" />
                    <Select.Content>
                      {routeOptions.map((route) => (
                        <Select.Item key={route.id} value={String(route.id)}>
                          {route.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                  <input type="hidden" name="route_id" value={line.routeId} />
                </label>

                <label>
                  <Text size="2">{labels.fields.bom}</Text>
                  <Select.Root value={line.bomId || "none"} onValueChange={(value) => updateLine(line.id, { bomId: value === "none" ? "" : value })}>
                    <Select.Trigger mt="2" />
                    <Select.Content>
                      <Select.Item value="none">{labels.app.unknown}</Select.Item>
                      {bomOptions.map((bom) => (
                        <Select.Item key={bom.id} value={String(bom.id)}>
                          {bom.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                  <input type="hidden" name="bom_id" value={line.bomId} />
                </label>

                <label>
                  <Text size="2">{labels.fields.quantity}</Text>
                  <TextField.Root
                    name="quantity"
                    mt="2"
                    required
                    value={line.quantity}
                    onChange={(event) => updateLine(line.id, { quantity: event.target.value })}
                  />
                </label>
              </Grid>
            </Box>
          );
        })}

        <Flex gap="3" wrap="wrap">
          <Button
            type="button"
            variant="soft"
            onClick={() =>
              setLines((current) => [
                ...current,
                { id: crypto.randomUUID(), itemId: items[0]?.id ? String(items[0].id) : "", routeId: "", bomId: "", quantity: "1" },
              ])
            }
          >
            <Plus size={16} /> {labels.app.addLine}
          </Button>
          <Button type="submit">{labels.actions.create}</Button>
        </Flex>
      </Flex>
    </form>
  );
}
