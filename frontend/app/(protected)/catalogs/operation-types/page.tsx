"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Box, Button, Flex, Grid, Text, TextField } from "@radix-ui/themes";
import { Plus, Save } from "lucide-react";

import { CatalogNav } from "@/components/catalog-nav";
import { EmptyState, ErrorNotice, LoadingState, PageHeader, Pagination } from "@/components/page-tools";
import { createCatalogItem, getCatalog, normalizeApiError, updateCatalogItem } from "@/lib/api";
import type { OperationTypeDto } from "@/types/api";

const pageSize = 20;

export default function OperationTypesPage() {
  const [items, setItems] = useState<OperationTypeDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCatalog("operation-types", page, pageSize);
      setItems(response.items);
      setTotal(response.total);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [page]);

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
    const form = event.currentTarget;
    const formData = new FormData(form);
    await run(async () => {
      await createCatalogItem("operation-types", {
        name: String(formData.get("name") ?? "").trim(),
      });
      form.reset();
    });
  }

  async function handleUpdate(item: OperationTypeDto, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await run(() =>
      updateCatalogItem("operation-types", item.id, {
        name: String(formData.get("name") ?? "").trim(),
      }),
    );
  }

  return (
    <div className="page-content">
      <PageHeader title="Типы операций" description="Отдельный справочник названий операций." />
      <CatalogNav />
      <ErrorNotice message={error} />

      <Box className="surface" p="4" mb="4">
        <form onSubmit={handleCreate}>
          <Grid columns={{ initial: "1", md: "3" }} gap="3" align="end">
            <label>
              <Text size="2">Название</Text>
              <TextField.Root name="name" mt="2" required maxLength={256} />
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
                  <th>Название</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <TextField.Root form={`operation-type-${item.id}`} name="name" defaultValue={item.name} />
                    </td>
                    <td>
                      <form id={`operation-type-${item.id}`} onSubmit={(event) => handleUpdate(item, event)}>
                        <Flex gap="2">
                          <Button size="2" variant="soft" type="submit" disabled={submitting}>
                            <Save size={15} /> Сохранить
                          </Button>
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
