"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Box, Button, Dialog, Flex, Grid, Text, TextArea, TextField } from "@radix-ui/themes";
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

type ItemDraft = {
  name: string;
  unit_id: number;
  description: string;
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
  const [editorItem, setEditorItem] = useState<ItemDto | null>(null);
  const [itemDraft, setItemDraft] = useState<ItemDraft | null>(null);
  const [specDraft, setSpecDraft] = useState<SpecDraft | null>(null);
  const [cycleConflictItemId, setCycleConflictItemId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const specInputItems = useMemo(
    () => items.filter((item) => item.id !== editorItem?.id),
    [items, editorItem?.id],
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
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function openCreateEditor() {
    setEditorItem(null);
    setItemDraft({
      name: "",
      unit_id: units[0]?.id ?? 0,
      description: "",
    });
    setSpecDraft(null);
    setCycleConflictItemId(null);
    setEditorOpen(true);
  }

  function openItemEditor(item: ItemDto) {
    const fallbackInputItemId = items.find((candidate) => candidate.id !== item.id)?.id ?? 0;
    setEditorItem(item);
    setItemDraft({
      name: item.name,
      unit_id: item.unit_id,
      description: item.description ?? "",
    });
    setSpecDraft(
      item.resource_specification
        ? toSpecDraft(
            item,
            operationTypes[0]?.id ?? 0,
            workstations[0]?.id ?? 0,
            fallbackInputItemId,
          )
        : null,
    );
    setCycleConflictItemId(null);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditorItem(null);
    setItemDraft(null);
    setSpecDraft(null);
    setCycleConflictItemId(null);
  }

  function startSpecification() {
    if (!itemDraft) return;
    const fallbackInputItemId = items.find((candidate) => candidate.id !== editorItem?.id)?.id ?? 0;
    setSpecDraft(
      editorItem
        ? toSpecDraft(
            editorItem,
            operationTypes[0]?.id ?? 0,
            workstations[0]?.id ?? 0,
            fallbackInputItemId,
          )
        : {
            name: itemDraft.name,
            operation_type_id: operationTypes[0]?.id ?? 0,
            workstation_id: workstations[0]?.id ?? 0,
            output_quantity: 1,
            inputs: [newInput(fallbackInputItemId)],
          },
    );
    setCycleConflictItemId(null);
  }

  async function saveItem() {
    if (!itemDraft) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: itemDraft.name.trim(),
        unit_id: Number(itemDraft.unit_id),
        description: itemDraft.description.trim() || null,
      };
      const savedItem = editorItem
        ? await updateCatalogItem("items", editorItem.id, payload)
        : await createCatalogItem("items", payload);
      setEditorItem(savedItem);
      setItemDraft({
        name: savedItem.name,
        unit_id: savedItem.unit_id,
        description: savedItem.description ?? "",
      });
      await loadData();
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  async function saveSpecification() {
    if (!editorItem || !specDraft) return;
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
      const savedItem = editorItem.resource_specification
        ? await updateResourceSpecification(editorItem.id, payload)
        : await createResourceSpecification(editorItem.id, payload);
      setEditorItem(savedItem);
      setSpecDraft(toSpecDraft(savedItem, operationTypes[0]?.id ?? 0, workstations[0]?.id ?? 0, specInputItems[0]?.id ?? 0));
      await loadData();
    } catch (caughtError) {
      const conflict = getCycleConflict(caughtError);
      if (conflict) setCycleConflictItemId(conflict.item_id);
      setError(normalizeApiError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  const editorTitle = editorItem ? "Номенклатура" : "Новая номенклатура";

  return (
    <div className="page-content">
      <PageHeader
        title="Номенклатура"
        action={
          <Button type="button" onClick={openCreateEditor} disabled={units.length === 0}>
            <Plus size={16} /> Создать
          </Button>
        }
      />
      <CatalogNav />
      <ErrorNotice message={error} />

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Grid className="item-card-grid" columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
            {items.map((item) => (
              <button key={item.id} type="button" className="item-card" onClick={() => openItemEditor(item)}>
                <Flex align="start" justify="between" gap="3">
                  <Box className="item-card-copy">
                    <Text size="2" weight="medium">
                      {item.name}
                    </Text>
                    <Text as="p" size="1" color="gray">
                      {item.description || "Описание не указано"}
                    </Text>
                  </Box>
                  {item.resource_specification ? (
                    <Badge color="green">
                      <Check size={13} /> Есть
                    </Badge>
                  ) : (
                    <Badge color="gray">Нет</Badge>
                  )}
                </Flex>
              </button>
            ))}
          </Grid>
          <Pagination page={page} size={pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      <Dialog.Root open={editorOpen} onOpenChange={(open) => (open ? setEditorOpen(true) : closeEditor())}>
        <Dialog.Content maxWidth="820px">
          <Dialog.Title>{editorTitle}</Dialog.Title>
          {itemDraft ? (
            <Flex direction="column" gap="4">
              <Box className="surface" p="4">
                <Grid columns={{ initial: "1", md: "2" }} gap="3">
                  <Field
                    name="name"
                    label="Название"
                    value={itemDraft.name}
                    required
                    onChange={(name) => setItemDraft({ ...itemDraft, name })}
                  />
                  <UnitSelect
                    units={units}
                    value={itemDraft.unit_id}
                    onChange={(unit_id) => setItemDraft({ ...itemDraft, unit_id })}
                  />
                  <DescriptionField
                    value={itemDraft.description}
                    onChange={(description) => setItemDraft({ ...itemDraft, description })}
                  />
                </Grid>
                <Flex mt="4" gap="3" wrap="wrap">
                  <Button
                    type="button"
                    disabled={submitting || !canSaveItem(itemDraft)}
                    onClick={saveItem}
                  >
                    <Save size={15} /> Сохранить номенклатуру
                  </Button>
                  {editorItem && !editorItem.resource_specification && !specDraft ? (
                    <Button
                      type="button"
                      variant="soft"
                      disabled={submitting || operationTypes.length === 0 || workstations.length === 0}
                      onClick={startSpecification}
                    >
                      <Plus size={15} /> Добавить ресурсную спецификацию
                    </Button>
                  ) : null}
                </Flex>
              </Box>

              {specDraft ? (
                <Box className="surface" p="4">
                  <Flex direction="column" gap="3">
                    <Grid columns={{ initial: "1", md: "2" }} gap="3">
                      <Field
                        label="Название спецификации"
                        name="spec-name"
                        value={specDraft.name}
                        onChange={(name) => setSpecDraft({ ...specDraft, name })}
                        required
                      />
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

                    <Text size="2" weight="medium">
                      Материалы
                    </Text>
                    <Flex direction="column" gap="2">
                      {specDraft.inputs.map((input) => (
                        <Grid
                          key={input.key}
                          columns={{ initial: "1", md: "1fr 160px 110px" }}
                          gap="2"
                          align="end"
                          className={cycleConflictItemId === input.item_id ? "conflict-row" : ""}
                        >
                          <SelectField
                            label="Номенклатура"
                            value={input.item_id}
                            options={specInputItems}
                            onChange={(item_id) => patchInput(specDraft, input.key, { item_id }, setSpecDraft)}
                          />
                          <Field
                            label="Количество"
                            name="quantity"
                            value={input.quantity}
                            onChange={(quantity) => patchInput(specDraft, input.key, { quantity }, setSpecDraft)}
                            required
                          />
                          <Button
                            type="button"
                            variant="soft"
                            color="red"
                            disabled={specDraft.inputs.length === 1}
                            onClick={() => setSpecDraft({ ...specDraft, inputs: specDraft.inputs.filter((candidate) => candidate.key !== input.key) })}
                          >
                            <Trash2 size={15} /> Удалить
                          </Button>
                        </Grid>
                      ))}
                    </Flex>
                    <Button
                      type="button"
                      variant="soft"
                      disabled={specInputItems.length === 0}
                      onClick={() => setSpecDraft({ ...specDraft, inputs: [...specDraft.inputs, newInput(specInputItems[0]?.id ?? 0)] })}
                    >
                      <Plus size={15} /> Добавить материал
                    </Button>
                    <Flex>
                      <Button type="button" disabled={submitting || !canSaveSpecification(specDraft)} onClick={saveSpecification}>
                        <Save size={15} /> Сохранить спецификацию
                      </Button>
                    </Flex>
                  </Flex>
                </Box>
              ) : null}

              <Flex justify="end" gap="2">
                <Dialog.Close>
                  <Button type="button" variant="soft" color="gray">
                    Закрыть
                  </Button>
                </Dialog.Close>
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
    inputs: spec?.inputs.length
      ? spec.inputs.map((input) => ({ key: input.id, item_id: input.item_id, quantity: String(input.quantity) }))
      : [newInput(fallbackInputItemId)],
  };
}

function canSaveItem(draft: ItemDraft): boolean {
  return draft.name.trim().length > 0 && draft.unit_id > 0;
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
  value,
  onChange,
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label>
      <Text size="2">{label}</Text>
      <TextField.Root name={name} mt="2" value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function DescriptionField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="form-span-full">
      <Text size="2">Описание</Text>
      <TextArea mt="2" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function UnitSelect({
  units,
  value,
  onChange,
}: {
  units: UnitDto[];
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <Text size="2">Единица</Text>
      <select value={value || units[0]?.id || ""} onChange={(event) => onChange(Number(event.target.value))} required>
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
