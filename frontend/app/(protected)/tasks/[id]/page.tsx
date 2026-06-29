"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Box, Button, Callout, Flex, Grid, Heading, Spinner, Text, TextArea, TextField } from "@radix-ui/themes";
import { ArrowLeft, Check, Pause, Play, RotateCcw, XCircle } from "lucide-react";

import { getTask, normalizeApiError, updateTask } from "@/lib/api";
import type { TaskDto, TaskStatus } from "@/types/api";
import { TaskStatusBadge, TaskTypeBadge } from "@/components/task-status";

export default function TaskPage() {
  const params = useParams<{ id: string }>();
  const taskId = Number(params.id);
  const [task, setTask] = useState<TaskDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTask = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setTask(await getTask(taskId));
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  const title = useMemo(() => (task ? `Задача #${task.id}` : "Задача"), [task]);

  async function handleTransition(status: TaskStatus, event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!task) return;

    const formData = event ? new FormData(event.currentTarget) : new FormData();
    setSubmitting(true);
    setError(null);

    try {
      const updatedTask = await updateTask(task.id, {
        status,
        actual_quantity_delta: asOptionalString(formData.get("actual_quantity_delta")),
        defect_quantity_delta: asOptionalString(formData.get("defect_quantity_delta")),
        comment: asOptionalString(formData.get("comment")),
      });
      setTask(updatedTask);
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
          <Heading size="7">{title}</Heading>
          {task ? (
            <Text as="p" size="2" color="gray" mt="1">
              {task.description || task.item.name}
            </Text>
          ) : null}
        </Box>
        <Button asChild variant="soft" color="gray">
          <Link href="/tasks">
            <ArrowLeft size={16} /> Назад
          </Link>
        </Button>
      </Flex>

      {error ? (
        <Callout.Root color="red" mb="4">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      ) : null}

      {loading ? (
        <Flex className="surface empty-state" align="center" justify="center" gap="3">
          <Spinner />
          <Text color="gray">Загружаем задачу</Text>
        </Flex>
      ) : task ? (
        <>
          <Box className="surface" p="4" mb="4">
            <Flex align="center" justify="between" gap="3" wrap="wrap">
              <Flex gap="3" wrap="wrap">
                <TaskTypeBadge type={task.task_type} />
                <TaskStatusBadge status={task.status} />
              </Flex>
              <TaskActions task={task} submitting={submitting} onTransition={handleTransition} />
            </Flex>
          </Box>

          <Grid columns={{ initial: "1", md: "2" }} gap="4">
            <Box className="surface" p="4">
              <Heading size="4" mb="3">
                Производство
              </Heading>
              <Grid columns={{ initial: "1", sm: "2" }} gap="3">
                <Detail label="Заказ" value={`#${task.order_id}`} />
                <Detail label="Номенклатура" value={task.item.name} />
                <Detail label="План" value={formatQuantity(task.planned_quantity)} />
                <Detail label="Факт" value={formatQuantity(task.actual_quantity)} />
                <Detail label="Брак" value={formatQuantity(task.defect_quantity)} />
                <Detail label="Операция" value={task.route_operation_id ?? "Не указана"} />
              </Grid>
            </Box>

            <Box className="surface" p="4">
              <Heading size="4" mb="3">
                Рабочие посты
              </Heading>
              <Grid columns={{ initial: "1", sm: "2" }} gap="3">
                <Detail label="Рабочий центр" value={task.work_center?.name ?? "Не указан"} />
                <Detail label="Откуда" value={task.source_work_center?.name ?? "Не указано"} />
                <Detail label="Куда" value={task.target_work_center?.name ?? "Не указано"} />
                <Detail label="Обновлено" value={formatDate(task.updated_at)} />
              </Grid>
            </Box>
          </Grid>
        </>
      ) : (
        <Box className="surface" p="5">
          <Text color="gray">Задача не найдена</Text>
        </Box>
      )}
    </div>
  );
}

function TaskActions({
  task,
  submitting,
  onTransition,
}: {
  task: TaskDto;
  submitting: boolean;
  onTransition: (status: TaskStatus, event?: FormEvent<HTMLFormElement>) => void;
}) {
  if (task.status === "to_do") {
    return (
      <Button size="2" disabled={submitting} onClick={() => onTransition("in_progress")}>
        <Play size={15} /> Взять в работу
      </Button>
    );
  }

  if (task.status === "blocked") {
    return (
      <Button size="2" variant="soft" disabled={submitting} onClick={() => onTransition("in_progress")}>
        <RotateCcw size={15} /> Возобновить
      </Button>
    );
  }

  if (task.task_type === "quality_review" && task.status === "in_progress") {
    return (
      <Flex gap="2" wrap="wrap">
        <Button size="2" color="green" disabled={submitting} onClick={() => onTransition("done")}>
          <Check size={15} /> Принять
        </Button>
        <form onSubmit={(event) => onTransition("rejected", event)}>
          <Flex gap="2" wrap="wrap" align="center">
            <TextField.Root name="defect_quantity_delta" placeholder="Брак" size="2" required />
            <TextArea name="comment" placeholder="Комментарий" rows={1} required />
            <Button size="2" color="red" type="submit" disabled={submitting}>
              <XCircle size={15} /> Отклонить
            </Button>
          </Flex>
        </form>
      </Flex>
    );
  }

  if (task.status === "in_progress") {
    return (
      <Flex gap="2" wrap="wrap">
        <form onSubmit={(event) => onTransition("done", event)}>
          <Flex gap="2" wrap="wrap" align="center">
            {task.task_type === "operation" ? (
              <TextField.Root name="actual_quantity_delta" placeholder="Выпущено" size="2" required />
            ) : null}
            <Button size="2" color="green" type="submit" disabled={submitting}>
              <Check size={15} /> Завершить
            </Button>
          </Flex>
        </form>
        <Button size="2" variant="soft" color="red" disabled={submitting} onClick={() => onTransition("blocked")}>
          <Pause size={15} /> Заблокировать
        </Button>
      </Flex>
    );
  }

  return null;
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Text size="1" color="gray">
        {label}
      </Text>
      <Text as="p" weight="medium">
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

function asOptionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}
