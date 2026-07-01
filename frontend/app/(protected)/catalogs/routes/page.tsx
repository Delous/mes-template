"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Badge, Box, Button, Checkbox, Flex, Grid, Heading, Text, TextField } from "@radix-ui/themes";
import { Plus, Save, Trash2 } from "lucide-react";

import { CatalogNav } from "@/components/catalog-nav";
import { DeleteButton, EmptyState, ErrorNotice, LoadingState, PageHeader, Pagination, toDecimal } from "@/components/page-tools";
import { createCatalogItem, deleteCatalogItem, getCatalog, normalizeApiError, updateCatalogItem } from "@/lib/api";
import type { CatalogStatus, ItemDto, RouteDto, RouteIoPayload, RouteOperationPayload, WorkstationDto } from "@/types/api";

const pageSize = 20;

type DraftIo = RouteIoPayload & { key: number };
type DraftOperation = Omit<RouteOperationPayload, "inputs" | "outputs"> & {
  key: number;
  inputs: DraftIo[];
  outputs: DraftIo[];
};

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteDto[]>([]);
  const [items, setItems] = useState<ItemDto[]>([]);
  const [workstations, setWorkstations] = useState<WorkstationDto[]>([]);
  const [newOperations, setNewOperations] = useState<DraftOperation[]>([newOperation()]);
  const [editOperations, setEditOperations] = useState<Record<number, DraftOperation[]>>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [routeResponse, itemResponse, workCenterResponse] = await Promise.all([
        getCatalog("routes", page, pageSize, includeDeleted),
        getCatalog("items", 1, 100),
        getCatalog("workstations", 1, 100),
      ]);
      setRoutes(routeResponse.items);
      setTotal(routeResponse.total);
      setItems(itemResponse.items);
      setWorkstations(workCenterResponse.items);
      setEditOperations(
        Object.fromEntries(
          routeResponse.items.map((route) => [
            route.id,
            route.operations.map((operation) => ({
              key: Date.now() + operation.id,
              operation_number: operation.operation_number,
              name: operation.name,
              workstation_id: operation.workstation_id,
              setup_time_minutes: operation.setup_time_minutes,
              run_time_minutes: operation.run_time_minutes,
              requires_quality_review: operation.requires_quality_review,
              inputs: operation.inputs.map((input, inputIndex) => ({ key: Date.now() + inputIndex, item_id: input.item_id, quantity: String(input.quantity) })),
              outputs: operation.outputs.map((output, outputIndex) => ({ key: Date.now() + outputIndex + 1000, item_id: output.item_id, quantity: String(output.quantity) })),
            })),
          ]),
        ),
      );
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [includeDeleted, page]);

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
    const formData = new FormData(event.currentTarget);
    await run(async () => {
      await createCatalogItem("routes", readRouteForm(formData, newOperations, items[0]?.id ?? 0, workstations[0]?.id ?? 0));
      event.currentTarget.reset();
      setNewOperations([newOperation()]);
    });
  }

  async function handleUpdate(route: RouteDto, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await run(() => updateCatalogItem("routes", route.id, readRouteForm(formData, editOperations[route.id] ?? [], items[0]?.id ?? 0, workstations[0]?.id ?? 0)));
  }

  return (
    <div className="page-content">
      <PageHeader title="Маршруты" description="Операции, входы и выходы производственных маршрутов." />
      <CatalogNav />
      <ErrorNotice message={error} />
      <Text as="label" size="2" className="checkbox-label" mb="4">
        <Checkbox checked={includeDeleted} onCheckedChange={(value) => setIncludeDeleted(value === true)} />
        Показать удаленные
      </Text>

      <Box className="surface" p="4" mb="4">
        <form onSubmit={handleCreate}>
          <RouteBaseFields items={items} prefix="new" />
          <OperationsEditor operations={newOperations} items={items} workstations={workstations} onChange={setNewOperations} />
          <Button type="submit" mt="4" disabled={submitting || items.length === 0 || workstations.length === 0}>
            <Plus size={16} /> Создать маршрут
          </Button>
        </form>
      </Box>

      {loading ? (
        <LoadingState />
      ) : routes.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Flex direction="column" gap="4">
            {routes.map((route) => (
              <Box key={route.id} className="surface" p="4">
                <form onSubmit={(event) => handleUpdate(route, event)}>
                  <Flex align="center" justify="between" gap="3" mb="4" wrap="wrap">
                    <Heading size="4">
                      #{route.id} {route.name}
                    </Heading>
                    <Flex gap="2" wrap="wrap">
                      <Badge color={route.deleted_at ? "gray" : "green"}>{route.deleted_at ? "Удален" : route.status}</Badge>
                      {route.is_default ? <Badge>По умолчанию</Badge> : null}
                    </Flex>
                  </Flex>
                  <RouteBaseFields items={items} prefix={`route-${route.id}`} route={route} disabled={Boolean(route.deleted_at)} />
                  <OperationsEditor
                    operations={editOperations[route.id] ?? []}
                    items={items}
                    workstations={workstations}
                    disabled={Boolean(route.deleted_at)}
                    onChange={(operations) => setEditOperations((current) => ({ ...current, [route.id]: operations }))}
                  />
                  <Flex gap="2" mt="4" wrap="wrap">
                    <Button type="submit" variant="soft" disabled={submitting || Boolean(route.deleted_at)}>
                      <Save size={15} /> Сохранить
                    </Button>
                    <DeleteButton disabled={submitting || Boolean(route.deleted_at)} onDelete={() => void run(() => deleteCatalogItem("routes", route.id))} />
                  </Flex>
                </form>
              </Box>
            ))}
          </Flex>
          <Pagination page={page} size={pageSize} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

function RouteBaseFields({ items, prefix, route, disabled }: { items: ItemDto[]; prefix: string; route?: RouteDto; disabled?: boolean }) {
  return (
    <Grid columns={{ initial: "1", md: "5" }} gap="3" mb="4">
      <label>
        <Text size="2">Изделие</Text>
        <select name={`${prefix}-item_id`} defaultValue={route?.item_id ?? items[0]?.id} required disabled={disabled}>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <Text size="2">Название</Text>
        <TextField.Root name={`${prefix}-name`} mt="2" defaultValue={route?.name} required disabled={disabled} />
      </label>
      <label>
        <Text size="2">Версия</Text>
        <TextField.Root name={`${prefix}-version`} mt="2" defaultValue={route?.version ?? "1.0"} required disabled={disabled} />
      </label>
      <label>
        <Text size="2">Статус</Text>
        <select name={`${prefix}-status`} defaultValue={route?.status ?? "active"} disabled={disabled}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </label>
      <Text as="label" size="2" className="checkbox-label form-checkbox">
        <Checkbox name={`${prefix}-is_default`} defaultChecked={route?.is_default} disabled={disabled} />
        По умолчанию
      </Text>
    </Grid>
  );
}

function OperationsEditor({
  operations,
  items,
  workstations,
  disabled,
  onChange,
}: {
  operations: DraftOperation[];
  items: ItemDto[];
  workstations: WorkstationDto[];
  disabled?: boolean;
  onChange: (operations: DraftOperation[]) => void;
}) {
  return (
    <Flex direction="column" gap="3">
      {operations.map((operation, index) => (
        <Box key={operation.key} className="nested-block" p="3">
          <Flex align="center" justify="between" mb="3" wrap="wrap" gap="2">
            <Heading size="3">Операция {index + 1}</Heading>
            <Button
              type="button"
              variant="soft"
              color="red"
              disabled={disabled || operations.length === 1}
              onClick={() => onChange(operations.filter((candidate) => candidate.key !== operation.key))}
            >
              <Trash2 size={15} /> Удалить
            </Button>
          </Flex>
          <Grid columns={{ initial: "1", md: "4" }} gap="3">
            <label>
              <Text size="2">Номер</Text>
              <TextField.Root value={String(operation.operation_number)} mt="2" disabled={disabled} onChange={(event) => patchOperation(operations, operation.key, { operation_number: Number(event.target.value) }, onChange)} />
            </label>
            <label>
              <Text size="2">Название</Text>
              <TextField.Root value={operation.name} mt="2" disabled={disabled} onChange={(event) => patchOperation(operations, operation.key, { name: event.target.value }, onChange)} />
            </label>
            <label>
              <Text size="2">Рабочий пост</Text>
              <select value={operation.workstation_id || workstations[0]?.id} disabled={disabled} onChange={(event) => patchOperation(operations, operation.key, { workstation_id: Number(event.target.value) }, onChange)}>
                {workstations.map((workCenter) => (
                  <option key={workCenter.id} value={workCenter.id}>
                    {workCenter.name}
                  </option>
                ))}
              </select>
            </label>
            <Text as="label" size="2" className="checkbox-label form-checkbox">
              <Checkbox checked={operation.requires_quality_review} disabled={disabled} onCheckedChange={(value) => patchOperation(operations, operation.key, { requires_quality_review: value === true }, onChange)} />
              Требует ОТК
            </Text>
            <label>
              <Text size="2">Подготовка, мин</Text>
              <TextField.Root value={String(operation.setup_time_minutes)} mt="2" disabled={disabled} onChange={(event) => patchOperation(operations, operation.key, { setup_time_minutes: Number(event.target.value) }, onChange)} />
            </label>
            <label>
              <Text size="2">Выполнение, мин</Text>
              <TextField.Root value={String(operation.run_time_minutes)} mt="2" disabled={disabled} onChange={(event) => patchOperation(operations, operation.key, { run_time_minutes: Number(event.target.value) }, onChange)} />
            </label>
          </Grid>
          <IoEditor title="Входы" ios={operation.inputs} items={items} disabled={disabled} onChange={(inputs) => patchOperation(operations, operation.key, { inputs }, onChange)} />
          <IoEditor title="Выходы" ios={operation.outputs} items={items} disabled={disabled} onChange={(outputs) => patchOperation(operations, operation.key, { outputs }, onChange)} />
        </Box>
      ))}
      <Button type="button" variant="soft" disabled={disabled} onClick={() => onChange([...operations, newOperation()])}>
        <Plus size={15} /> Добавить операцию
      </Button>
    </Flex>
  );
}

function IoEditor({
  title,
  ios,
  items,
  disabled,
  onChange,
}: {
  title: string;
  ios: DraftIo[];
  items: ItemDto[];
  disabled?: boolean;
  onChange: (ios: DraftIo[]) => void;
}) {
  return (
    <Box mt="3">
      <Text size="2" weight="medium">
        {title}
      </Text>
      <Flex direction="column" gap="2" mt="2">
        {ios.map((io) => (
          <Grid key={io.key} columns={{ initial: "1", md: "3" }} gap="2" align="end">
            <label>
              <Text size="1" color="gray">Номенклатура</Text>
              <select value={io.item_id || items[0]?.id} disabled={disabled} onChange={(event) => patchIo(ios, io.key, { item_id: Number(event.target.value) }, onChange)}>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <Text size="1" color="gray">Количество</Text>
              <TextField.Root value={io.quantity} mt="2" disabled={disabled} onChange={(event) => patchIo(ios, io.key, { quantity: event.target.value }, onChange)} />
            </label>
            <Button type="button" variant="soft" color="red" disabled={disabled || ios.length === 1} onClick={() => onChange(ios.filter((candidate) => candidate.key !== io.key))}>
              <Trash2 size={15} /> Удалить
            </Button>
          </Grid>
        ))}
        <Button type="button" size="2" variant="soft" disabled={disabled} onClick={() => onChange([...ios, newIo()])}>
          <Plus size={14} /> Добавить
        </Button>
      </Flex>
    </Box>
  );
}

function readRouteForm(formData: FormData, operations: DraftOperation[], fallbackItemId: number, fallbackWorkstationId: number) {
  const prefix = String([...formData.keys()].find((key) => key.endsWith("-name")) ?? "new-name").replace(/-name$/, "");
  return {
    item_id: Number(formData.get(`${prefix}-item_id`)),
    name: String(formData.get(`${prefix}-name`) ?? "").trim(),
    version: String(formData.get(`${prefix}-version`) ?? "").trim(),
    status: String(formData.get(`${prefix}-status`) ?? "active") as CatalogStatus,
    is_default: formData.get(`${prefix}-is_default`) === "on",
    operations: operations.map((operation) => ({
      operation_number: Number(operation.operation_number),
      name: operation.name.trim(),
      workstation_id: Number(operation.workstation_id) || fallbackWorkstationId,
      setup_time_minutes: Number(operation.setup_time_minutes) || 0,
      run_time_minutes: Number(operation.run_time_minutes) || 0,
      requires_quality_review: operation.requires_quality_review,
      inputs: operation.inputs.map(({ item_id, quantity }) => ({ item_id: Number(item_id) || fallbackItemId, quantity: toDecimal(quantity) })),
      outputs: operation.outputs.map(({ item_id, quantity }) => ({ item_id: Number(item_id) || fallbackItemId, quantity: toDecimal(quantity) })),
    })),
  };
}

function newOperation(): DraftOperation {
  return {
    key: Date.now() + Math.round(Math.random() * 1000),
    operation_number: 10,
    name: "",
    workstation_id: 0,
    setup_time_minutes: 0,
    run_time_minutes: 0,
    requires_quality_review: true,
    inputs: [newIo()],
    outputs: [newIo()],
  };
}

function newIo(): DraftIo {
  return { key: Date.now() + Math.round(Math.random() * 1000), item_id: 0, quantity: "1" };
}

function patchOperation(
  operations: DraftOperation[],
  key: number,
  patch: Partial<DraftOperation>,
  onChange: (operations: DraftOperation[]) => void,
) {
  onChange(operations.map((operation) => (operation.key === key ? { ...operation, ...patch } : operation)));
}

function patchIo(ios: DraftIo[], key: number, patch: Partial<DraftIo>, onChange: (ios: DraftIo[]) => void) {
  onChange(ios.map((io) => (io.key === key ? { ...io, ...patch } : io)));
}
