import Link from "next/link";
import { Badge, Box, Button, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { getTask } from "@/entities/task/api";
import { mapTaskForView } from "@/entities/task/mappers";
import { TaskActionForm } from "@/features/tasks/TasksBoard";
import { ApiError } from "@/shared/api/fetcher";
import { labels } from "@/shared/i18n/labels";
import { formatDate, formatQuantity } from "@/shared/lib/format";
import { ErrorNotice } from "@/shared/ui/Notice";
import { PageHeader } from "@/shared/ui/PageHeader";

function statusColor(status: ReturnType<typeof mapTaskForView>["status"]) {
  const colors = {
    waiting: "gray",
    to_do: "blue",
    in_progress: "amber",
    blocked: "red",
    done: "green",
    cancelled: "gray",
    rejected: "red",
  } as const;
  return colors[status];
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
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

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taskId = Number(id);

  try {
    const task = mapTaskForView(await getTask(taskId));

    return (
      <div className="page-content">
        <PageHeader
          title={`${labels.entities.task} #${task.id}`}
          description={task.description ?? task.taskTypeLabel}
          action={
            <Button asChild variant="soft">
              <Link href="/tasks">
                <ArrowLeft size={16} /> {labels.app.back}
              </Link>
            </Button>
          }
        />

        <Box className="surface" p="4" mb="4">
          <Flex align="center" justify="between" gap="3" wrap="wrap">
            <Flex gap="3" wrap="wrap">
              <Badge>{task.taskTypeLabel}</Badge>
              <Badge color={statusColor(task.status)}>{task.statusLabel}</Badge>
            </Flex>
            <TaskActionForm task={task} />
          </Flex>
        </Box>

        <Grid columns={{ initial: "1", md: "2" }} gap="4">
          <Box className="surface" p="4">
            <Heading size="4" mb="3">
              {labels.entities.task}
            </Heading>
            <Grid columns={{ initial: "1", sm: "2" }} gap="3">
              <DetailField label={labels.entities.order} value={`#${task.order_id}`} />
              <DetailField label={labels.fields.item} value={task.item.name} />
              <DetailField label={labels.fields.plannedQuantity} value={formatQuantity(task.planned_quantity)} />
              <DetailField label={labels.fields.actualQuantity} value={formatQuantity(task.actual_quantity)} />
              <DetailField label={labels.fields.defectQuantity} value={formatQuantity(task.defect_quantity)} />
              <DetailField label={labels.fields.routeOperation} value={task.route_operation_id ?? labels.app.unknown} />
            </Grid>
          </Box>

          <Box className="surface" p="4">
            <Heading size="4" mb="3">
              {labels.entities.workCenters}
            </Heading>
            <Grid columns={{ initial: "1", sm: "2" }} gap="3">
              <DetailField label={labels.fields.workCenter} value={task.work_center?.name ?? labels.app.unknown} />
              <DetailField label={labels.fields.sourceWorkCenter} value={task.source_work_center?.name ?? labels.app.unknown} />
              <DetailField label={labels.fields.targetWorkCenter} value={task.target_work_center?.name ?? labels.app.unknown} />
              <DetailField label={labels.fields.updatedAt} value={formatDate(task.updated_at)} />
            </Grid>
          </Box>
        </Grid>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    return (
      <div className="page-content">
        <PageHeader
          title={labels.entities.task}
          action={
            <Button asChild variant="soft">
              <Link href="/tasks">
                <ArrowLeft size={16} /> {labels.app.back}
              </Link>
            </Button>
          }
        />
        <ErrorNotice message={error instanceof Error ? error.message : labels.app.error} />
      </div>
    );
  }
}
