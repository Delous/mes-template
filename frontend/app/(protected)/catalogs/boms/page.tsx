"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Badge, Box, Button, Checkbox, Flex, Grid, Heading, Text, TextField } from "@radix-ui/themes";
import { Plus, Save, Trash2 } from "lucide-react";

import { CatalogNav } from "@/components/catalog-nav";
import { DeleteButton, EmptyState, ErrorNotice, formatQuantity, LoadingState, PageHeader, Pagination, toDecimal } from "@/components/page-tools";
import { createCatalogItem, deleteCatalogItem, getCatalog, normalizeApiError, updateCatalogItem } from "@/lib/api";
import type { BomDto, BomLinePayload, CatalogStatus, ItemDto } from "@/types/api";

const pageSize = 20;

type DraftLine = BomLinePayload & { key: number };

export default function BomsPage() {
  const [boms, setBoms] = useState<BomDto[]>([]);
  const [items, setItems] = useState<ItemDto[]>([]);
  const [newLines, setNewLines] = useState<DraftLine[]>([newLine()]);
  const [editLines, setEditLines] = useState<Record<number, DraftLine[]>>({});
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
      const [bomResponse, itemResponse] = await Promise.all([
        getCatalog("boms", page, pageSize, includeDeleted),
        getCatalog("items", 1, 100),
      ]);
      setBoms(bomResponse.items);
      setTotal(bomResponse.total);
      setItems(itemResponse.items);
      setEditLines(
        Object.fromEntries(
          bomResponse.items.map((bom) => [
            bom.id,
            bom.lines.map((line) => ({ ...line, quantity: String(line.quantity), scrap_percent: String(line.scrap_percent), key: Date.now() + line.id })),
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
      await createCatalogItem("boms", readBomForm(formData, newLines, items[0]?.id ?? 0));
      event.currentTarget.reset();
      setNewLines([newLine()]);
    });
  }

  async function handleUpdate(bom: BomDto, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await run(() => updateCatalogItem("boms", bom.id, readBomForm(formData, editLines[bom.id] ?? [], items[0]?.id ?? 0)));
  }

  return (
    <div className="page-content">
      <PageHeader title="BOM" description="Спецификации изделий и состав материалов." />
      <CatalogNav />
      <ErrorNotice message={error} />
      <Text as="label" size="2" className="checkbox-label" mb="4">
        <Checkbox checked={includeDeleted} onCheckedChange={(value) => setIncludeDeleted(value === true)} />
        Показать удаленные
      </Text>

      <Box className="surface" p="4" mb="4">
        <form onSubmit={handleCreate}>
          <BomBaseFields items={items} prefix="new" />
          <LinesEditor lines={newLines} items={items} onChange={setNewLines} />
          <Button type="submit" mt="4" disabled={submitting || items.length === 0}>
            <Plus size={16} /> Создать BOM
          </Button>
        </form>
      </Box>

      {loading ? (
        <LoadingState />
      ) : boms.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Flex direction="column" gap="4">
            {boms.map((bom) => (
              <Box key={bom.id} className="surface" p="4">
                <form onSubmit={(event) => handleUpdate(bom, event)}>
                  <Flex align="center" justify="between" gap="3" mb="4" wrap="wrap">
                    <Heading size="4">
                      #{bom.id} {bom.name}
                    </Heading>
                    <Flex gap="2" wrap="wrap">
                      <Badge color={bom.deleted_at ? "gray" : "green"}>{bom.deleted_at ? "Удален" : bom.status}</Badge>
                      {bom.is_default ? <Badge>По умолчанию</Badge> : null}
                    </Flex>
                  </Flex>
                  <BomBaseFields items={items} prefix={`bom-${bom.id}`} bom={bom} disabled={Boolean(bom.deleted_at)} />
                  <LinesEditor
                    lines={editLines[bom.id] ?? []}
                    items={items}
                    disabled={Boolean(bom.deleted_at)}
                    onChange={(lines) => setEditLines((current) => ({ ...current, [bom.id]: lines }))}
                  />
                  <Flex gap="2" mt="4" wrap="wrap">
                    <Button type="submit" variant="soft" disabled={submitting || Boolean(bom.deleted_at)}>
                      <Save size={15} /> Сохранить
                    </Button>
                    <DeleteButton disabled={submitting || Boolean(bom.deleted_at)} onDelete={() => void run(() => deleteCatalogItem("boms", bom.id))} />
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

function BomBaseFields({ items, prefix, bom, disabled }: { items: ItemDto[]; prefix: string; bom?: BomDto; disabled?: boolean }) {
  return (
    <Grid columns={{ initial: "1", md: "5" }} gap="3" mb="4">
      <label>
        <Text size="2">Изделие</Text>
        <select name={`${prefix}-item_id`} defaultValue={bom?.item_id ?? items[0]?.id} required disabled={disabled}>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <Text size="2">Название</Text>
        <TextField.Root name={`${prefix}-name`} mt="2" defaultValue={bom?.name} required disabled={disabled} />
      </label>
      <label>
        <Text size="2">Версия</Text>
        <TextField.Root name={`${prefix}-version`} mt="2" defaultValue={bom?.version ?? "1.0"} required disabled={disabled} />
      </label>
      <label>
        <Text size="2">Статус</Text>
        <select name={`${prefix}-status`} defaultValue={bom?.status ?? "active"} disabled={disabled}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </label>
      <Text as="label" size="2" className="checkbox-label form-checkbox">
        <Checkbox name={`${prefix}-is_default`} defaultChecked={bom?.is_default} disabled={disabled} />
        По умолчанию
      </Text>
    </Grid>
  );
}

function LinesEditor({
  lines,
  items,
  disabled,
  onChange,
}: {
  lines: DraftLine[];
  items: ItemDto[];
  disabled?: boolean;
  onChange: (lines: DraftLine[]) => void;
}) {
  return (
    <Flex direction="column" gap="3">
      {lines.map((line, index) => (
        <Grid key={line.key} columns={{ initial: "1", md: "4" }} gap="3" className="nested-block" p="3" align="end">
          <label>
            <Text size="2">Компонент {index + 1}</Text>
            <select
              value={line.component_item_id || items[0]?.id}
              disabled={disabled}
              onChange={(event) => updateLine(lines, line.key, { component_item_id: Number(event.target.value) }, onChange)}
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <Text size="2">Количество</Text>
            <TextField.Root value={line.quantity} mt="2" disabled={disabled} onChange={(event) => updateLine(lines, line.key, { quantity: event.target.value }, onChange)} />
          </label>
          <label>
            <Text size="2">Scrap %</Text>
            <TextField.Root value={line.scrap_percent} mt="2" disabled={disabled} onChange={(event) => updateLine(lines, line.key, { scrap_percent: event.target.value }, onChange)} />
          </label>
          <Button
            type="button"
            variant="soft"
            color="red"
            disabled={disabled || lines.length === 1}
            onClick={() => onChange(lines.filter((candidate) => candidate.key !== line.key))}
          >
            <Trash2 size={15} /> Удалить
          </Button>
        </Grid>
      ))}
      <Button type="button" variant="soft" disabled={disabled} onClick={() => onChange([...lines, newLine()])}>
        <Plus size={15} /> Добавить компонент
      </Button>
    </Flex>
  );
}

function readBomForm(formData: FormData, lines: DraftLine[], fallbackItemId: number) {
  const prefix = String([...formData.keys()].find((key) => key.endsWith("-name")) ?? "new-name").replace(/-name$/, "");
  return {
    item_id: Number(formData.get(`${prefix}-item_id`)),
    name: String(formData.get(`${prefix}-name`) ?? "").trim(),
    version: String(formData.get(`${prefix}-version`) ?? "").trim(),
    status: String(formData.get(`${prefix}-status`) ?? "active") as CatalogStatus,
    is_default: formData.get(`${prefix}-is_default`) === "on",
    lines: lines.map(({ component_item_id, quantity, scrap_percent }) => ({
      component_item_id: Number(component_item_id) || fallbackItemId,
      quantity: toDecimal(quantity),
      scrap_percent: toDecimal(scrap_percent, 2),
    })),
  };
}

function newLine(): DraftLine {
  return { key: Date.now() + Math.round(Math.random() * 1000), component_item_id: 0, quantity: "1", scrap_percent: "0" };
}

function updateLine(lines: DraftLine[], key: number, patch: Partial<DraftLine>, onChange: (lines: DraftLine[]) => void) {
  onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));
}
