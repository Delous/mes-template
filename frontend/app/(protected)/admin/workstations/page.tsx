"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Box, Button, Callout, Flex, Grid, Heading, Spinner, Text, TextField } from "@radix-ui/themes";
import { Plus } from "lucide-react";

import { DeleteButton } from "@/components/page-tools";
import { createAdminWorkstation, deleteAdminWorkstation, getAdminWorkstations, normalizeApiError } from "@/lib/api";
import type { WorkstationDto } from "@/types/api";

export default function WorkstationsPage() {
  const [workstations, setWorkstations] = useState<WorkstationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkstations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setWorkstations(await getAdminWorkstations());
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkstations();
  }, [loadWorkstations]);

  async function run(action: () => Promise<unknown>) {
    setSubmitting(true);
    setError(null);
    try {
      await action();
      await loadWorkstations();
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
      await createAdminWorkstation({ name: String(formData.get("name") ?? "").trim() });
      event.currentTarget.reset();
    });
  }

  return (
    <div className="page-content">
      <Heading size="7" mb="1">
        Рабочие посты
      </Heading>
      <Text as="p" color="gray" size="2" mb="5">
        Backend поддерживает создание и удаление рабочих постов. Переименование endpoint не предусмотрено.
      </Text>

      {error ? (
        <Callout.Root color="red" mb="4">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      ) : null}

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
        <Flex className="surface empty-state" align="center" justify="center" gap="3">
          <Spinner />
          <Text color="gray">Загружаем рабочие посты</Text>
        </Flex>
      ) : (
        <Grid columns={{ initial: "1", md: "2" }} gap="4">
          {workstations.map((workstation) => (
            <Box key={workstation.id} className="surface" p="4">
              <Flex align="center" justify="between" gap="3" wrap="wrap">
                <Box>
                  <Text size="1" color="gray">
                    ID {workstation.id}
                  </Text>
                  <Text as="p" weight="medium">
                    {workstation.name}
                  </Text>
                </Box>
                <DeleteButton
                  disabled={submitting}
                  confirmText={`Удалить рабочий пост "${workstation.name}"?`}
                  onDelete={() => void run(() => deleteAdminWorkstation(workstation.id))}
                />
              </Flex>
            </Box>
          ))}
          {workstations.length === 0 ? (
            <Box className="surface" p="5">
              <Text color="gray">Рабочие посты не найдены</Text>
            </Box>
          ) : null}
        </Grid>
      )}
    </div>
  );
}
