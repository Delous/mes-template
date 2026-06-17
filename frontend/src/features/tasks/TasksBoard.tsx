import Link from "next/link";
import { Badge, Box, Button, Flex, Grid, Heading, Text, TextArea, TextField } from "@radix-ui/themes";
import { Check, Eye, Pause, Play, RotateCcw, XCircle } from "lucide-react";

import type { TaskView } from "@/entities/task/mappers";
import { labels } from "@/shared/i18n/labels";
import { formatDate, formatQuantity } from "@/shared/lib/format";

import { updateTaskAction } from "./actions";

function statusColor(status: TaskView["status"]) {
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

export function TaskActionForm({ task }: { task: TaskView }) {
  if (task.status === "to_do") {
    return (
      <form action={updateTaskAction}>
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="command" value="in_progress" />
        <Button size="2" type="submit">
          <Play size={15} /> {labels.actions.start}
        </Button>
      </form>
    );
  }

  if (task.status === "blocked") {
    return (
      <form action={updateTaskAction}>
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="command" value="in_progress" />
        <Button size="2" variant="soft" type="submit">
          <RotateCcw size={15} /> {labels.app.resume}
        </Button>
      </form>
    );
  }

  if (task.task_type === "quality_review" && task.status === "in_progress") {
    return (
      <Flex gap="2" wrap="wrap">
        <form action={updateTaskAction}>
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="command" value="done" />
          <Button size="2" color="green" type="submit">
            <Check size={15} /> {labels.actions.approve}
          </Button>
        </form>
        <form action={updateTaskAction}>
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="command" value="rejected" />
          <Flex gap="2" wrap="wrap" align="center">
            <TextField.Root name="defect_quantity_delta" placeholder={labels.app.defectQuantityDelta} size="2" required />
            <TextArea name="comment" placeholder={labels.app.comment} rows={1} required />
            <Button size="2" color="red" type="submit">
              <XCircle size={15} /> {labels.actions.reject}
            </Button>
          </Flex>
        </form>
      </Flex>
    );
  }

  if (task.status === "in_progress") {
    return (
      <Flex gap="2" wrap="wrap">
        <form action={updateTaskAction}>
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="command" value="done" />
          <Flex gap="2" wrap="wrap" align="center">
            {task.task_type === "operation" ? (
              <TextField.Root name="actual_quantity_delta" placeholder={labels.app.actualQuantityDelta} size="2" required />
            ) : null}
            <Button size="2" color="green" type="submit">
              <Check size={15} /> {labels.actions.complete}
            </Button>
          </Flex>
        </form>
        <form action={updateTaskAction}>
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="command" value="blocked" />
          <Button size="2" variant="soft" color="red" type="submit">
            <Pause size={15} /> {labels.actions.block}
          </Button>
        </form>
      </Flex>
    );
  }

  return null;
}

export function TasksBoard({ tasks }: { tasks: TaskView[] }) {
  if (!tasks.length) {
    return (
      <Box className="surface" p="5">
        <Text color="gray">{labels.app.empty}</Text>
      </Box>
    );
  }

  return (
    <Grid columns={{ initial: "1", lg: "2" }} gap="4">
      {tasks.map((task) => (
        <Box key={task.id} className="surface" p="4">
          <Flex direction="column" gap="4">
            <Flex align="start" justify="between" gap="3">
              <div>
                <Heading size="4">{task.description || task.taskTypeLabel}</Heading>
                <Text size="2" color="gray">
                  {labels.entities.order} #{task.order_id} · {formatDate(task.created_at)}
                </Text>
              </div>
              <Badge color={statusColor(task.status)}>{task.statusLabel}</Badge>
            </Flex>

            <Grid columns={{ initial: "1", sm: "2" }} gap="3">
              <Box>
                <Text size="1" color="gray">
                  {labels.entities.task}
                </Text>
                <Text as="p" weight="medium">
                  {task.taskTypeLabel}
                </Text>
              </Box>
              <Box>
                <Text size="1" color="gray">
                  {labels.fields.item}
                </Text>
                <Text as="p" weight="medium">
                  {task.item.name}
                </Text>
              </Box>
              <Box>
                <Text size="1" color="gray">
                  {labels.fields.plannedQuantity}
                </Text>
                <Text as="p" weight="medium">
                  {formatQuantity(task.planned_quantity)}
                </Text>
              </Box>
              <Box>
                <Text size="1" color="gray">
                  {labels.fields.workCenter}
                </Text>
                <Text as="p" weight="medium">
                  {task.work_center?.name ?? labels.app.unknown}
                </Text>
              </Box>
              {task.task_type === "transfer" || task.task_type === "warehouse_delivery" ? (
                <>
                  <Box>
                    <Text size="1" color="gray">
                      {labels.fields.sourceWorkCenter}
                    </Text>
                    <Text as="p" weight="medium">
                      {task.source_work_center?.name ?? labels.app.unknown}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="1" color="gray">
                      {labels.fields.targetWorkCenter}
                    </Text>
                    <Text as="p" weight="medium">
                      {task.target_work_center?.name ?? labels.app.unknown}
                    </Text>
                  </Box>
                </>
              ) : null}
            </Grid>

            <TaskActionForm task={task} />

            <Button asChild variant="soft" color="gray">
              <Link href={`/tasks/${task.id}`}>
                <Eye size={15} /> {labels.app.details}
              </Link>
            </Button>
          </Flex>
        </Box>
      ))}
    </Grid>
  );
}
