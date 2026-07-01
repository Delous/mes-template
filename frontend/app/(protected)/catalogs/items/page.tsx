"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Box, Button, Dialog, Flex, Grid, Text, TextField } from "@radix-ui/themes";
import { Check, Plus, Save, Trash2 } from "lucide-react";

import { CatalogNav } from "@/components/catalog-nav";
import { EmptyState, ErrorNotice, LoadingState, PageHeader, Pagination, toDecimal } from "@/components/page-tools";
import {
  createCatalogItem,
  createResourceSpecification,
  getCatalog,
  normalizeApiError,
  updateCatalogItem,
  updateResourceSpecification,
} from "@/lib/api";
import type {
  CycleConflictDetail,
  ItemDto,
  OperationTypeDto,
  ResourceSpecificationDto,
  ResourceSpecificationPayload,
  UnitDto,
  WorkstationDto,
} from "@/types/api";

const pageSize = 20;

type DraftInput = {
  key: number;
  item_id: number;
  quantity: string;
};

type SpecDraft = {
  name: string;
  operation_type_id: number;
  workstation_id: number;
  output_quantity: number;
  inputs: DraftInput[];
};

export default function ItemsPage() {
  const [items, setItems] = useState<ItemDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [operationTypes, setOperationTypes] = useState<OperationTypeDto[]>([]);
  const [workstations, setWorkstations] = useState<WorkstationDto[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [specItem, setSpecItem] = useState<ItemDto | null>(null);
  const [specDraft, setSpecDraft] = useState<SpecDraft | null>(null);
  const [cycleConflictItemId, setCycleConflictItemId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? items[0] ?? null,
    [items, selectedItemId],
  );
  const specInputItems = useMemo(
    () => items.filter((item) => item.id !== specItem?.id),
    [items, specItem?.id],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemResponse, unitResponse, operationTypeResponse, workstationResponse] = await Promise.all([
        getCatalog("items", page, pageSize),
        getCatalog("units", 1, 100),
        getCatalog("operation-types", 1, 100),
        getCatalog("workstations", 1, 100),
      ]);
      setItems(itemResponse.items);
      setTotal(itemResponse.total);
      setUnits(unitResponse.items);
      setOperationTypes(operationTypeResponse.items);
      setWorkstations(workstationResponse.items);
      setSelectedItemId((current) => current ?? itemResponse.items[0]?.id ?? null);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function run(action: () => Promise<unknown>) {
    setSubmitting(true);
    setError(null);
    try {
      await action();
      await loadData();
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    await run(async () => {
      const item = await createCatalogItem("items", {
        name: String(formData.get("name") ?? "").trim(),
        unit_id: Number(formData.get("unit_id")),
        description: String(formData.get("description") ?? "").trim() || null,
      });
      setSelectedItemId(item.id);
      form.reset();
    });
  }

  async function handleUpdate(item: ItemDto, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await run(() =>
      updateCatalogItem("items", item.id, {
        name: String(formData.get("name") ?? "").trim(),
        unit_id: Number(formData.get("unit_id")),
        description: String(formData.get("description") ?? "").trim() || null,
      }),
    );
  }

  function openSpecification(item: ItemDto) {
    const fallbackInputItemId = items.find((candidate) => candidate.id !== item.id)?.id ?? 0;
    setSpecItem(item);
    setSpecDraft(
      toSpecDraft(
        item,
        operationTypes[0]?.id ?? 0,
        workstations[0]?.id ?? 0,
        fallbackInputItemId,
      ),
    );
    setCycleConflictItemId(null);
  }

  async function saveSpecification() {
    if (!specItem || !specDraft) return;
    setSubmitting(true);
    setError(null);
    setCycleConflictItemId(null);

    const payload: ResourceSpecificationPayload = {
      name: specDraft.name.trim(),
      operation_type_id: Number(specDraft.operation_type_id),
      workstation_id: Number(specDraft.workstation_id),
      output_quantity: Number(specDraft.output_quantity),
      inputs: specDraft.inputs.map((input) => ({
        item_id: Number(input.item_id),
        quantity: toDecimal(input.quantity),
      })),
    };

    try {
      if (specItem.resource_specification) {
        await updateResourceSpecification(specItem.id, payload);
      } else {
        await createResourceSpecification(specItem.id, payload);
      }
      setSpecItem(null);
      setSpecDraft(null);
      await loadData();
    } catch (caughtError) {
      const conflict = getCycleConflict(caughtError);
      if (conflict) setCycleConflictItemId(conflict.item_id);
      setError(normalizeApiError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-content">
      <PageHeader title="Номенклатура" description="Материалы, сырье и готовые изделия." />
      <CatalogNav />
      <ErrorNotice message={error} />

      <Box className="surface" p="4" mb="4">
        <form onSubmit={handleCreate}>
          <Grid columns={{ initial: "1", md: "4" }} gap="3" align="end">
            <Field name="name" label="Название" required />
            <UnitSelect name="unit_id" units={units} />
            <Field name="description" label="Описание" />
            <Button type="submit" disabled={submitting || units.length === 0}>
              <Plus size={16} /> Создать
            </Button>
          </Grid>
        </form>
      </Box>

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Grid columns={{ initial: "1", md: "260px 1fr" }} gap="4" align="start">
            <Flex direction="column" gap="2">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`thin-card ${selectedItem?.id === item.id ? "active" : ""}`}
                  onClick={() => setSelectedItemId(item.id)}
                >
                  <Flex align="center" justify="between" gap="3">
                    <Text size="2" weight="medium">
                      {item.name}
                    </Text>
                    {item.resource_specification ? <Check size={16} /> : <Badge color="gray">Нет</Badge>}
                  </Flex>
                </button>
              ))}
            </Flex>

            {selectedItem ? (
              <Box className="surface" p="4">
                <form onSubmit={(event) => handleUpdate(selectedItem, event)}>
                  <Grid columns={{ initial: "1", md: "3" }} gap="3" align="end">
                    <Field name="name" label="Название" required defaultValue={selectedItem.name} />
                    <UnitSelect name="unit_id" units={units} defaultValue={String(selectedItem.unit_id)} />
                    <Field name="description" label="Описание" defaultValue={selectedItem.description ?? ""} />
                  </Grid>
                  <Flex mt="4" gap="3" wrap="wrap">
                    <Button type="submit" variant="soft" disabled={submitting}>
                      <Save size={15} /> Сохранить
                    </Button>
                    <Button type="button" onClick={() => openSpecification(selectedItem)}>
                      <Plus size={15} /> {selectedItem.resource_specification ? "Редактировать ресурсную спецификацию" : "Добавить ресурсную спецификацию"}
                    </Button>
                  </Flex>
                </form>
              </Box>
            ) : null}
          </Grid>
          <Pagination page={page} size={pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      <Dialog.Root open={Boolean(specItem && specDraft)} onOpenChange={(open) => (!open ? setSpecItem(null) : undefined)}>
        <Dialog.Content maxWidth="720px">
          <Dialog.Title>Ресурсная спецификация</Dialog.Title>
          {specDraft ? (
            <Flex direction="column" gap="3">
              <Grid columns={{ initial: "1", md: "2" }} gap="3">
                <Field label="Название" name="spec-name" value={specDraft.name} onChange={(value) => setSpecDraft({ ...specDraft, name: value })} required />
                <label>
                  <Text size="2">Итоговое количество</Text>
                  <TextField.Root
                    mt="2"
                    type="number"
                    min="1"
                    step="1"
                    value={String(specDraft.output_quantity)}
                    onChange={(event) => setSpecDraft({ ...specDraft, output_quantity: Number(event.target.value) || 1 })}
                  />
                </label>
                <SelectField
                  label="Тип операции"
                  value={specDraft.operation_type_id}
                  options={operationTypes}
                  onChange={(operation_type_id) => setSpecDraft({ ...specDraft, operation_type_id })}
                />
                <SelectField
                  label="Рабочий пост"
                  value={specDraft.workstation_id}
                  options={workstations}
                  onChange={(workstation_id) => setSpecDraft({ ...specDraft, workstation_id })}
                />
              </Grid>

              <Text size="2" weight="medium">Материалы</Text>
              <Flex direction="column" gap="2">
                {specDraft.inputs.map((input) => (
                  <Grid key={input.key} columns={{ initial: "1", md: "1fr 160px 110px" }} gap="2" align="end" className={cycleConflictItemId === input.item_id ? "conflict-row" : ""}>
                    <SelectField
                      label="Номенклатура"
                      value={input.item_id}
                      options={specInputItems}
                      onChange={(item_id) => patchInput(specDraft, input.key, { item_id }, setSpecDraft)}
                    />
                    <Field label="Количество" name="quantity" value={input.quantity} onChange={(quantity) => patchInput(specDraft, input.key, { quantity }, setSpecDraft)} required />
                    <Button type="button" variant="soft" color="red" disabled={specDraft.inputs.length === 1} onClick={() => setSpecDraft({ ...specDraft, inputs: specDraft.inputs.filter((candidate) => candidate.key !== input.key) })}>
                      <Trash2 size={15} /> Удалить
                    </Button>
                  </Grid>
                ))}
              </Flex>
              <Button type="button" variant="soft" disabled={specInputItems.length === 0} onClick={() => setSpecDraft({ ...specDraft, inputs: [...specDraft.inputs, newInput(specInputItems[0]?.id ?? 0)] })}>
                <Plus size={15} /> Добавить материал
              </Button>

              <Flex justify="end" gap="2" mt="4">
                <Dialog.Close>
                  <Button type="button" variant="soft" color="gray">Отмена</Button>
                </Dialog.Close>
                <Button type="button" disabled={submitting || !canSaveSpecification(specDraft)} onClick={saveSpecification}>
                  Сохранить
                </Button>
              </Flex>
            </Flex>
          ) : null}
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}

function toSpecDraft(
  item: ItemDto,
  fallbackOperationTypeId: number,
  fallbackWorkstationId: number,
  fallbackInputItemId: number,
): SpecDraft {
  const spec = item.resource_specification;
  return {
    name: spec?.name ?? item.name,
    operation_type_id: spec?.operation_type_id ?? fallbackOperationTypeId,
    workstation_id: spec?.workstation_id ?? fallbackWorkstationId,
    output_quantity: spec?.output_quantity ?? 1,
    inputs: spec?.inputs.length ? spec.inputs.map((input) => ({ key: input.id, item_id: input.item_id, quantity: String(input.quantity) })) : [newInput(fallbackInputItemId)],
  };
}

function canSaveSpecification(draft: SpecDraft): boolean {
  return (
    draft.name.trim().length > 0 &&
    draft.operation_type_id > 0 &&
    draft.workstation_id > 0 &&
    Number.isInteger(draft.output_quantity) &&
    draft.output_quantity >= 1 &&
    draft.inputs.length > 0 &&
    draft.inputs.every((input) => input.item_id > 0 && Number(input.quantity) > 0)
  );
}

function newInput(itemId: number): DraftInput {
  return { key: Date.now() + Math.round(Math.random() * 1000), item_id: itemId, quantity: "1" };
}

function patchInput(
  draft: SpecDraft,
  key: number,
  patch: Partial<DraftInput>,
  setDraft: (draft: SpecDraft) => void,
) {
  setDraft({
    ...draft,
    inputs: draft.inputs.map((input) => (input.key === key ? { ...input, ...patch } : input)),
  });
}

function getCycleConflict(error: unknown): CycleConflictDetail | null {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail !== "object" || detail === null) return null;
  const candidate = detail as Partial<CycleConflictDetail>;
  return typeof candidate.item_id === "number" && typeof candidate.item_name === "string" && typeof candidate.message === "string"
    ? (candidate as CycleConflictDetail)
    : null;
}

function Field({
  label,
  name,
  defaultValue,
  value,
  onChange,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}) {
  const inputProps = value === undefined ? { defaultValue } : { value };

  return (
    <label>
      <Text size="2">{label}</Text>
      <TextField.Root name={name} mt="2" required={required} onChange={(event) => onChange?.(event.target.value)} {...inputProps} />
    </label>
  );
}

function UnitSelect({ name, units, defaultValue }: { name: string; units: UnitDto[]; defaultValue?: string }) {
  return (
    <label>
      <Text size="2">Единица</Text>
      <select name={name} defaultValue={defaultValue ?? units[0]?.id} required>
        {units.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.name} ({unit.symbol})
          </option>
        ))}
      </select>
    </label>
  );
}

function SelectField<T extends { id: number; name: string }>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: T[];
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <Text size="2">{label}</Text>
      <select value={value || options[0]?.id || ""} onChange={(event) => onChange(Number(event.target.value))}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
