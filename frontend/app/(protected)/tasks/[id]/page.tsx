"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Box, Button, Flex, Grid, Text, TextArea, TextField } from "@radix-ui/themes";
import { ArrowLeft, Check, Pause, Play, RotateCcw, XCircle } from "lucide-react";

import { useAuth } from "@/components/auth-context";
import { TaskStatusBadge, TaskTypeBadge } from "@/components/task-status";
import { ErrorNotice, formatDate, formatQuantity, LoadingState, PageHeader } from "@/components/page-tools";
import { getTask, normalizeApiError, updateTask } from "@/lib/api";
import type { TaskDto, TaskUpdateStatus, UserRole } from "@/types/api";

export default function TaskPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
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

  async function handleTransition(status: TaskUpdateStatus, event?: FormEvent<HTMLFormElement>) {
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
      <PageHeader
        title={task ? `Задача #${task.id}` : "Задача"}
        description={task ? task.description || task.item.name : undefined}
        action={
          <Button asChild variant="soft" color="gray">
            <Link href="/tasks">
              <ArrowLeft size={16} /> Назад
            </Link>
          </Button>
        }
      />
      <ErrorNotice message={error} />

      {loading ? (
        <LoadingState label="Загружаем задачу" />
      ) : task ? (
        <>
          <Box className="surface" p="4" mb="4">
            <Flex align="center" justify="between" gap="3" wrap="wrap">
              <Flex gap="3" wrap="wrap">
                <TaskTypeBadge type={task.task_type} />
                <TaskStatusBadge status={task.status} />
              </Flex>
              <TaskActions task={task} role={user?.role} submitting={submitting} onTransition={handleTransition} />
            </Flex>
          </Box>

          <Grid columns={{ initial: "1", md: "2" }} gap="4">
            <Box className="surface" p="4">
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
              <Grid columns={{ initial: "1", sm: "2" }} gap="3">
                <Detail label="Рабочий центр" value={task.work_center?.name ?? "Не указан"} />
                <Detail label="Откуда" value={task.source_work_center?.name ?? "Не указано"} />
                <Detail label="Куда" value={task.target_work_center?.name ?? "Не указано"} />
                <Detail label="Обновлено" value={formatDate(task.updated_at)} />
              </Grid>
            </Box>
          </Grid>
        </>
      ) : null}
    </div>
  );
}

function TaskActions({
  task,
  role,
  submitting,
  onTransition,
}: {
  task: TaskDto;
  role?: UserRole;
  submitting: boolean;
  onTransition: (status: TaskUpdateStatus, event?: FormEvent<HTMLFormElement>) => void;
}) {
  const canStart = task.status === "to_do" && ["operator", "reviewer", "storekeeper"].includes(role ?? "");
  const canResume = task.status === "blocked" && ["admin", "operator", "storekeeper"].includes(role ?? "");
  const canBlock = task.status === "in_progress" && ["admin", "operator", "storekeeper"].includes(role ?? "");
  const canCompleteOperation = task.status === "in_progress" && task.task_type === "operation" && role === "operator";
  const canCompleteSimple =
    task.status === "in_progress" &&
    task.task_type !== "operation" &&
    (role === "reviewer" || role === "storekeeper" || role === "admin");
  const canReject = ["to_do", "in_progress"].includes(task.status) && task.task_type === "quality_review" && role === "reviewer";

  return (
    <Flex gap="2" wrap="wrap" align="center">
      {canStart ? (
        <Button size="2" disabled={submitting} onClick={() => onTransition("in_progress")}>
          <Play size={15} /> Взять в работу
        </Button>
      ) : null}
      {canResume ? (
        <Button size="2" variant="soft" disabled={submitting} onClick={() => onTransition("in_progress")}>
          <RotateCcw size={15} /> Возобновить
        </Button>
      ) : null}
      {canCompleteOperation ? (
        <form onSubmit={(event) => onTransition("done", event)}>
          <Flex gap="2" wrap="wrap" align="center">
            <TextField.Root name="actual_quantity_delta" placeholder="Выпущено" size="2" required />
            <Button size="2" color="green" type="submit" disabled={submitting}>
              <Check size={15} /> Завершить
            </Button>
          </Flex>
        </form>
      ) : null}
      {canCompleteSimple ? (
        <Button size="2" color="green" disabled={submitting} onClick={() => onTransition("done")}>
          <Check size={15} /> Завершить
        </Button>
      ) : null}
      {canReject ? (
        <form onSubmit={(event) => onTransition("rejected", event)}>
          <Flex gap="2" wrap="wrap" align="center">
            <TextField.Root name="defect_quantity_delta" placeholder="Брак" size="2" required />
            <TextArea name="comment" placeholder="Комментарий" rows={1} required />
            <Button size="2" color="red" type="submit" disabled={submitting}>
              <XCircle size={15} /> Отклонить
            </Button>
          </Flex>
        </form>
      ) : null}
      {canBlock ? (
        <Button size="2" variant="soft" color="red" disabled={submitting} onClick={() => onTransition("blocked")}>
          <Pause size={15} /> Заблокировать
        </Button>
      ) : null}
    </Flex>
  );
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

function asOptionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}
