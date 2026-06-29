"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Badge, Box, Button, Checkbox, Flex, Grid, Text, TextField } from "@radix-ui/themes";
import { Plus, Save } from "lucide-react";

import { CatalogNav } from "@/components/catalog-nav";
import { DeleteButton, EmptyState, ErrorNotice, LoadingState, PageHeader, Pagination } from "@/components/page-tools";
import { createCatalogItem, deleteCatalogItem, getCatalog, normalizeApiError, updateCatalogItem } from "@/lib/api";
import type { WorkCenterDto } from "@/types/api";

const pageSize = 20;

export default function WorkCentersPage() {
  const [items, setItems] = useState<WorkCenterDto[]>([]);
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
      const response = await getCatalog("work-centers", page, pageSize, includeDeleted);
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
      await createCatalogItem("work-centers", {
        name: String(formData.get("name") ?? "").trim(),
        type: String(formData.get("type") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim() || null,
      });
      event.currentTarget.reset();
    });
  }

  async function handleUpdate(item: WorkCenterDto, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await run(() =>
      updateCatalogItem("work-centers", item.id, {
        name: String(formData.get("name") ?? "").trim(),
        type: String(formData.get("type") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim() || null,
      }),
    );
  }

  return (
    <div className="page-content">
      <PageHeader title="Рабочие центры" description="Производственные, складские и ОТК зоны." />
      <CatalogNav />
      <ErrorNotice message={error} />
      <Text as="label" size="2" className="checkbox-label" mb="4">
        <Checkbox checked={includeDeleted} onCheckedChange={(value) => setIncludeDeleted(value === true)} />
        Показать удаленные
      </Text>

      <Box className="surface" p="4" mb="4">
        <form onSubmit={handleCreate}>
          <Grid columns={{ initial: "1", md: "4" }} gap="3" align="end">
            <Field name="name" label="Название" required />
            <Field name="type" label="Тип" required placeholder="production" />
            <Field name="description" label="Описание" />
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
                  <th>Тип</th>
                  <th>Описание</th>
                  <th>Статус</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td><TextField.Root form={`wc-${item.id}`} name="name" defaultValue={item.name} disabled={Boolean(item.deleted_at)} /></td>
                    <td><TextField.Root form={`wc-${item.id}`} name="type" defaultValue={item.type} disabled={Boolean(item.deleted_at)} /></td>
                    <td><TextField.Root form={`wc-${item.id}`} name="description" defaultValue={item.description ?? ""} disabled={Boolean(item.deleted_at)} /></td>
                    <td>{item.deleted_at ? <Badge color="gray">Удален</Badge> : <Badge color="green">Активен</Badge>}</td>
                    <td>
                      <form id={`wc-${item.id}`} onSubmit={(event) => handleUpdate(item, event)}>
                        <Flex gap="2">
                          <Button size="2" variant="soft" type="submit" disabled={submitting || Boolean(item.deleted_at)}>
                            <Save size={15} /> Сохранить
                          </Button>
                          <DeleteButton disabled={submitting || Boolean(item.deleted_at)} onDelete={() => void run(() => deleteCatalogItem("work-centers", item.id))} />
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

function Field({ name, label, required, placeholder }: { name: string; label: string; required?: boolean; placeholder?: string }) {
  return (
    <label>
      <Text size="2">{label}</Text>
      <TextField.Root name={name} mt="2" required={required} placeholder={placeholder} />
    </label>
  );
}
