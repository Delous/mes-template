"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Badge, Box, Button, Checkbox, Flex, Grid, Select, Text, TextField } from "@radix-ui/themes";
import { Plus, Save } from "lucide-react";

import { CatalogNav } from "@/components/catalog-nav";
import { DeleteButton, EmptyState, ErrorNotice, formatDate, LoadingState, PageHeader, Pagination } from "@/components/page-tools";
import { createCatalogItem, deleteCatalogItem, getCatalog, normalizeApiError, updateCatalogItem } from "@/lib/api";
import type { ItemDto, UnitDto } from "@/types/api";

const pageSize = 20;

export default function ItemsPage() {
  const [items, setItems] = useState<ItemDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemResponse, unitResponse] = await Promise.all([
        getCatalog("items", page, pageSize, includeDeleted),
        getCatalog("units", 1, 100),
      ]);
      setItems(itemResponse.items);
      setTotal(itemResponse.total);
      setUnits(unitResponse.items);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [includeDeleted, page]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  async function run(action: () => Promise<unknown>) {
    setSubmitting(true);
    setError(null);
    try {
      await action();
      await loadItems();
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
      await createCatalogItem("items", {
        name: String(formData.get("name") ?? "").trim(),
        unit_id: Number(formData.get("unit_id")),
        description: String(formData.get("description") ?? "").trim() || null,
      });
      event.currentTarget.reset();
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

  return (
    <div className="page-content">
      <PageHeader title="Номенклатура" description="Материалы, сырье и готовые изделия." />
      <CatalogNav />
      <ErrorNotice message={error} />
      <IncludeDeleted checked={includeDeleted} onCheckedChange={setIncludeDeleted} />

      <Box className="surface" p="4" mb="4">
        <form onSubmit={handleCreate}>
          <Grid columns={{ initial: "1", md: "4" }} gap="3" align="end">
            <label>
              <Text size="2">Название</Text>
              <TextField.Root name="name" mt="2" required maxLength={256} />
            </label>
            <UnitSelect name="unit_id" units={units} />
            <label>
              <Text size="2">Описание</Text>
              <TextField.Root name="description" mt="2" />
            </label>
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
          <Box className="surface table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Единица</th>
                  <th>Описание</th>
                  <th>Статус</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      <TextField.Root form={`item-${item.id}`} name="name" defaultValue={item.name} disabled={Boolean(item.deleted_at)} />
                    </td>
                    <td>
                      <UnitSelect form={`item-${item.id}`} name="unit_id" units={units} defaultValue={String(item.unit_id)} disabled={Boolean(item.deleted_at)} />
                    </td>
                    <td>
                      <TextField.Root form={`item-${item.id}`} name="description" defaultValue={item.description ?? ""} disabled={Boolean(item.deleted_at)} />
                    </td>
                    <td>{item.deleted_at ? <Badge color="gray">Удалена</Badge> : <Badge color="green">Активна</Badge>}</td>
                    <td>
                      <form id={`item-${item.id}`} onSubmit={(event) => handleUpdate(item, event)}>
                        <Flex gap="2">
                          <Button size="2" variant="soft" type="submit" disabled={submitting || Boolean(item.deleted_at)}>
                            <Save size={15} /> Сохранить
                          </Button>
                          <DeleteButton disabled={submitting || Boolean(item.deleted_at)} onDelete={() => void run(() => deleteCatalogItem("items", item.id))} />
                        </Flex>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
          <Pagination page={page} size={pageSize} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

function UnitSelect({ name, units, defaultValue, form, disabled }: { name: string; units: UnitDto[]; defaultValue?: string; form?: string; disabled?: boolean }) {
  return (
    <label>
      <Text size="2">Единица</Text>
      <select name={name} form={form} defaultValue={defaultValue ?? units[0]?.id} required disabled={disabled}>
        {units.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.name} ({unit.symbol})
          </option>
        ))}
      </select>
    </label>
  );
}

function IncludeDeleted({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <Text as="label" size="2" className="checkbox-label" mb="4">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
      Показать удаленные
    </Text>
  );
}
