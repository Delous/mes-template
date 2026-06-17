"use server";

import { redirect } from "next/navigation";

import { createOrder } from "@/entities/order/api";
import { toDecimalString } from "@/shared/lib/format";

export async function createOrderAction(formData: FormData) {
  const number = String(formData.get("number") ?? "").trim();
  const itemIds = formData.getAll("item_id");
  const routeIds = formData.getAll("route_id");
  const bomIds = formData.getAll("bom_id");
  const quantities = formData.getAll("quantity");

  const lines = itemIds
    .map((itemId, index) => ({
      item_id: Number(itemId),
      route_id: Number(routeIds[index]),
      bom_id: bomIds[index] ? Number(bomIds[index]) : null,
      quantity: toDecimalString(quantities[index]),
    }))
    .filter((line) => line.item_id && line.route_id);

  const order = await createOrder({ number, lines });
  redirect(`/orders/${order.id}`);
}
