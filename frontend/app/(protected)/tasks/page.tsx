"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Box, Button, Callout, Flex, Grid, Heading, Select, Spinner, Text, TextField } from "@radix-ui/themes";
import { Eye, Plus } from "lucide-react";

import { createTask, getTasks, normalizeApiError } from "@/lib/api";
import type { TaskDto, TaskType } from "@/types/api";
import { TaskStatusBadge, TaskTypeBadge } from "@/components/task-status";

const taskTypeOptions: { value: TaskType; label: string }[] = [
  { value: "operation", label: "Производственная операция" },
  { value: "warehouse_delivery", label: "Доставка материала" },
  { value: "quality_review", label: "Приемка ОТК" },
  { value: "transfer", label: "Перемещение" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [taskType, setTaskType] = useState<TaskType>("operation");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getTasks();
      setTasks(response.items);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      await createTask({
        task_type: taskType,
        description: String(formData.get("description") ?? "").trim() || null,
        planned_quantity: normalizeQuantity(formData.get("planned_quantity")),
      });
      event.currentTarget.reset();
      setTaskType("operation");
      await loadTasks();
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-content">
      <Flex align={{ initial: "start", sm: "center" }} justify="between" gap="4" mb="5" direction={{ initial: "column", sm: "row" }}>
        <Box>
          <Heading size="7">Задачи</Heading>
          <Text as="p" size="2" color="gray" mt="1">
            Список рабочих задач и быстрое создание.
          </Text>
        </Box>
      </Flex>

      {error ? (
        <Callout.Root color="red" mb="4">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      ) : null}

      <Box className="surface" p="4" mb="4">
        <form onSubmit={handleCreate}>
          <Grid columns={{ initial: "1", md: "4" }} gap="3" align="end">
            <label>
              <Text size="2">Тип</Text>
              <Select.Root value={taskType} onValueChange={(value) => setTaskType(value as TaskType)}>
                <Select.Trigger mt="2" />
                <Select.Content>
                  {taskTypeOptions.map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>
            <label>
              <Text size="2">Описание</Text>
              <TextField.Root name="description" mt="2" placeholder="Например, экструзия" />
            </label>
            <label>
              <Text size="2">Плановое количество</Text>
              <TextField.Root name="planned_quantity" mt="2" inputMode="decimal" defaultValue="1" required />
            </label>
            <Button type="submit" disabled={submitting}>
              <Plus size={16} />
              Создать
            </Button>
          </Grid>
        </form>
      </Box>

      {loading ? (
        <Flex className="surface empty-state" align="center" justify="center" gap="3">
          <Spinner />
          <Text color="gray">Загружаем задачи</Text>
        </Flex>
      ) : tasks.length === 0 ? (
        <Box className="surface" p="5">
          <Text color="gray">Нет задач</Text>
        </Box>
      ) : (
        <Grid columns={{ initial: "1", lg: "2" }} gap="4">
          {tasks.map((task) => (
            <Box key={task.id} className="surface" p="4">
              <Flex direction="column" gap="4">
                <Flex align="start" justify="between" gap="3">
                  <Box>
                    <Heading size="4">{task.description || task.item.name}</Heading>
                    <Text size="2" color="gray">
                      Заказ #{task.order_id} · {formatDate(task.created_at)}
                    </Text>
                  </Box>
                  <TaskStatusBadge status={task.status} />
                </Flex>

                <Grid columns={{ initial: "1", sm: "2" }} gap="3">
                  <Detail label="Тип" value={<TaskTypeBadge type={task.task_type} />} />
                  <Detail label="Номенклатура" value={task.item.name} />
                  <Detail label="План" value={formatQuantity(task.planned_quantity)} />
                  <Detail label="Рабочий центр" value={task.work_center?.name ?? "Не указан"} />
                </Grid>

                <Button asChild variant="soft" color="gray">
                  <Link href={`/tasks/${task.id}`}>
                    <Eye size={15} /> Подробнее
                  </Link>
                </Button>
              </Flex>
            </Box>
          ))}
        </Grid>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Text size="1" color="gray">
        {label}
      </Text>
      <Text as="div" weight="medium">
        {value}
      </Text>
    </Box>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatQuantity(value: string | number) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 6 }).format(numeric);
}

function normalizeQuantity(value: FormDataEntryValue | null) {
  const numeric = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(numeric) ? numeric.toFixed(6) : "0.000000";
}
