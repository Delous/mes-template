"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { createCatalogEntity, deleteCatalogEntity } from "@/entities/catalog/api";
import { ApiError } from "@/shared/api/fetcher";
import type { CatalogResource } from "@/entities/catalog/types";
import { toDecimalString } from "@/shared/lib/format";

export type CatalogActionState = {
  error?: string;
};

function catalogPath(resource: CatalogResource) {
  return `/catalogs/${resource}`;
}

function positiveNumber(value: FormDataEntryValue | null | undefined) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function nonNegativeNumber(value: FormDataEntryValue | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function apiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return "Не удалось создать запись: проверьте уникальность версии/номеров операций и выбранные связанные справочники.";
    }

    return error.message;
  }

  return fallback;
}

export async function createUnitAction(formData: FormData) {
  await createCatalogEntity("units", {
    name: String(formData.get("name") ?? ""),
    symbol: String(formData.get("symbol") ?? ""),
  });
  revalidateTag("catalog-units");
  revalidatePath(catalogPath("units"));
  redirect(catalogPath("units"));
}

export async function createItemAction(formData: FormData) {
  await createCatalogEntity("items", {
    name: String(formData.get("name") ?? ""),
    unit_id: Number(formData.get("unit_id")),
    description: String(formData.get("description") ?? ""),
  });
  revalidateTag("catalog-items");
  revalidatePath(catalogPath("items"));
  redirect(catalogPath("items"));
}

export async function createWorkCenterAction(formData: FormData) {
  await createCatalogEntity("work-centers", {
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? "production"),
    description: String(formData.get("description") ?? ""),
  });
  revalidateTag("catalog-work-centers");
  revalidatePath(catalogPath("work-centers"));
  redirect(catalogPath("work-centers"));
}

export async function createBomAction(formData: FormData) {
  const componentIds = formData.getAll("component_item_id");
  const quantities = formData.getAll("line_quantity");
  const scrapPercents = formData.getAll("scrap_percent");

  await createCatalogEntity("boms", {
    item_id: Number(formData.get("item_id")),
    name: String(formData.get("name") ?? ""),
    version: String(formData.get("version") ?? "1.0"),
    status: String(formData.get("status") ?? "active"),
    is_default: formData.get("is_default") === "on",
    lines: componentIds
      .map((componentId, index) => ({
        component_item_id: Number(componentId),
        quantity: toDecimalString(quantities[index]),
        scrap_percent: String(scrapPercents[index] ?? "0").replace(",", "."),
      }))
      .filter((line) => line.component_item_id),
  });
  revalidateTag("catalog-boms");
  revalidatePath(catalogPath("boms"));
  redirect(catalogPath("boms"));
}

export async function createRouteAction(_state: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  const operationNumbers = formData.getAll("operation_number");
  const operationNames = formData.getAll("operation_name");
  const workCenterIds = formData.getAll("work_center_id");
  const setupTimes = formData.getAll("setup_time_minutes");
  const runTimes = formData.getAll("run_time_minutes");
  const inputItemIds = formData.getAll("input_item_id");
  const inputQuantities = formData.getAll("input_quantity");
  const outputItemIds = formData.getAll("output_item_id");
  const outputQuantities = formData.getAll("output_quantity");
  const reviewFlags = new Set(formData.getAll("requires_quality_review").map(String));
  const itemId = positiveNumber(formData.get("item_id"));

  if (!itemId) {
    return { error: "Выберите изделие для маршрутного листа." };
  }

  const operations = operationNumbers
    .map((operationNumber, index) => {
      const parsedOperationNumber = positiveNumber(operationNumber);
      const workCenterId = positiveNumber(workCenterIds[index]);
      const inputItemId = positiveNumber(inputItemIds[index]);
      const outputItemId = positiveNumber(outputItemIds[index]);
      const name = String(operationNames[index] ?? "").trim();

      if (!parsedOperationNumber || !name || !workCenterId || !inputItemId || !outputItemId) {
        return null;
      }

      return {
        operation_number: parsedOperationNumber,
        name,
        work_center_id: workCenterId,
        setup_time_minutes: nonNegativeNumber(setupTimes[index]),
        run_time_minutes: nonNegativeNumber(runTimes[index]),
        requires_quality_review: reviewFlags.has(String(index)),
        inputs: [{ item_id: inputItemId, quantity: toDecimalString(inputQuantities[index]) }],
        outputs: [{ item_id: outputItemId, quantity: toDecimalString(outputQuantities[index]) }],
      };
    })
    .filter((operation): operation is NonNullable<typeof operation> => Boolean(operation));

  if (operations.length === 0) {
    return { error: "Добавьте хотя бы одну корректную операцию с входом, выходом и рабочим центром." };
  }

  try {
    await createCatalogEntity("routes", {
      item_id: itemId,
      name: String(formData.get("name") ?? "").trim(),
      version: String(formData.get("version") ?? "1.0").trim(),
      status: String(formData.get("status") ?? "active"),
      is_default: formData.get("is_default") === "on",
      operations,
    });
  } catch (error) {
    return { error: apiErrorMessage(error, "Не удалось создать маршрутный лист.") };
  }

  revalidateTag("catalog-routes");
  revalidatePath(catalogPath("routes"));
  redirect(catalogPath("routes"));
}

export async function deleteCatalogAction(formData: FormData) {
  const resource = String(formData.get("resource")) as CatalogResource;
  const id = Number(formData.get("id"));
  await deleteCatalogEntity(resource, id);
  revalidateTag(`catalog-${resource}`);
  revalidatePath(catalogPath(resource));
  redirect(catalogPath(resource));
}
