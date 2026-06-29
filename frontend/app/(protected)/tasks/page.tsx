"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Box, Button, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import { Eye } from "lucide-react";

import { TaskStatusBadge, TaskTypeBadge } from "@/components/task-status";
import { EmptyState, ErrorNotice, formatDate, formatQuantity, LoadingState, PageHeader, Pagination } from "@/components/page-tools";
import { getTasks, normalizeApiError } from "@/lib/api";
import type { TaskDto } from "@/types/api";

const pageSize = 20;

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getTasks(page, pageSize);
      setTasks(response.items);
      setTotal(response.total);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  return (
    <div className="page-content">
      <PageHeader title="Задачи" description="Задачи формируются backend автоматически при создании заказа." />
      <ErrorNotice message={error} />

      {loading ? (
        <LoadingState label="Загружаем задачи" />
      ) : tasks.length === 0 ? (
        <EmptyState label="Нет задач" />
      ) : (
        <>
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
          <Pagination page={page} size={pageSize} total={total} onPageChange={setPage} />
        </>
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
