"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Badge, Box, Button, Checkbox, Flex, Grid, Text, TextField } from "@radix-ui/themes";
import { Plus, Save } from "lucide-react";

import { CatalogNav } from "@/components/catalog-nav";
import { DeleteButton, EmptyState, ErrorNotice, formatDate, LoadingState, PageHeader, Pagination } from "@/components/page-tools";
import { createCatalogItem, deleteCatalogItem, getCatalog, normalizeApiError, updateCatalogItem } from "@/lib/api";
import type { UnitDto } from "@/types/api";

const pageSize = 20;

export default function UnitsPage() {
  const [items, setItems] = useState<UnitDto[]>([]);
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
      const response = await getCatalog("units", page, pageSize, includeDeleted);
      setItems(response.items);
      setTotal(response.total);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [includeDeleted, page]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await run(async () => {
      await createCatalogItem("units", {
        name: String(formData.get("name") ?? "").trim(),
        symbol: String(formData.get("symbol") ?? "").trim(),
      });
      event.currentTarget.reset();
    });
  }

  async function handleUpdate(unit: UnitDto, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await run(() =>
      updateCatalogItem("units", unit.id, {
        name: String(formData.get("name") ?? "").trim(),
        symbol: String(formData.get("symbol") ?? "").trim(),
      }),
    );
  }

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

  return (
    <div className="page-content">
      <PageHeader title="Единицы измерения" description="Справочник единиц для номенклатуры." />
      <CatalogNav />
      <ErrorNotice message={error} />
      <IncludeDeleted checked={includeDeleted} onCheckedChange={setIncludeDeleted} />

      <Box className="surface" p="4" mb="4">
        <form onSubmit={handleCreate}>
          <Grid columns={{ initial: "1", md: "3" }} gap="3" align="end">
            <label>
              <Text size="2">Название</Text>
              <TextField.Root name="name" mt="2" required maxLength={256} />
            </label>
            <label>
              <Text size="2">Обозначение</Text>
              <TextField.Root name="symbol" mt="2" required maxLength={32} />
            </label>
            <Button type="submit" disabled={submitting}>
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
                  <th>Символ</th>
                  <th>Статус</th>
                  <th>Обновлено</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((unit) => (
                  <tr key={unit.id}>
                    <td>{unit.id}</td>
                    <td>
                      <TextField.Root form={`unit-${unit.id}`} name="name" defaultValue={unit.name} disabled={Boolean(unit.deleted_at)} />
                    </td>
                    <td>
                      <TextField.Root form={`unit-${unit.id}`} name="symbol" defaultValue={unit.symbol} disabled={Boolean(unit.deleted_at)} />
                    </td>
                    <td>{unit.deleted_at ? <Badge color="gray">Удалена</Badge> : <Badge color="green">Активна</Badge>}</td>
                    <td>{formatDate(unit.updated_at)}</td>
                    <td>
                      <form id={`unit-${unit.id}`} onSubmit={(event) => handleUpdate(unit, event)}>
                        <Flex gap="2">
                          <Button size="2" variant="soft" type="submit" disabled={submitting || Boolean(unit.deleted_at)}>
                            <Save size={15} /> Сохранить
                          </Button>
                          <DeleteButton disabled={submitting || Boolean(unit.deleted_at)} onDelete={() => void run(() => deleteCatalogItem("units", unit.id))} />
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

function IncludeDeleted({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <Text as="label" size="2" className="checkbox-label" mb="4">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
      Показать удаленные
    </Text>
  );
}
