"use client";

import { Box, Button, Callout, Flex, Heading, Spinner, Text } from "@radix-ui/themes";
import { AlertTriangle, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Flex align={{ initial: "start", sm: "center" }} justify="between" gap="4" mb="5" direction={{ initial: "column", sm: "row" }}>
      <Box>
        <Heading size="7">{title}</Heading>
        {description ? (
          <Text as="p" size="2" color="gray" mt="1">
            {description}
          </Text>
        ) : null}
      </Box>
      {action}
    </Flex>
  );
}

export function ErrorNotice({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <Callout.Root color="red" mb="4">
      <Callout.Icon>
        <AlertTriangle size={16} />
      </Callout.Icon>
      <Callout.Text>{message}</Callout.Text>
    </Callout.Root>
  );
}

export function LoadingState({ label = "Загрузка" }: { label?: string }) {
  return (
    <Flex className="surface empty-state" align="center" justify="center" gap="3">
      <Spinner />
      <Text color="gray">{label}</Text>
    </Flex>
  );
}

export function EmptyState({ label = "Нет данных" }: { label?: string }) {
  return (
    <Box className="surface" p="5">
      <Text color="gray">{label}</Text>
    </Box>
  );
}

export function Pagination({
  page,
  size,
  total,
  onPageChange,
}: {
  page: number;
  size: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / size));

  return (
    <Flex align="center" justify="between" gap="3" mt="4" wrap="wrap">
      <Text size="2" color="gray">
        Страница {page} из {pages} · Всего {total}
      </Text>
      <Flex gap="2">
        <Button type="button" variant="soft" color="gray" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft size={15} /> Назад
        </Button>
        <Button type="button" variant="soft" color="gray" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          Далее <ChevronRight size={15} />
        </Button>
      </Flex>
    </Flex>
  );
}

export function DeleteButton({
  label = "Удалить",
  confirmText = "Удалить запись?",
  disabled,
  onDelete,
}: {
  label?: string;
  confirmText?: string;
  disabled?: boolean;
  onDelete: () => void;
}) {
  return (
    <Button
      type="button"
      size="2"
      variant="soft"
      color="red"
      disabled={disabled}
      onClick={() => {
        if (window.confirm(confirmText)) onDelete();
      }}
    >
      <Trash2 size={15} /> {label}
    </Button>
  );
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Не указано";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatQuantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "Не указано";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 6 }).format(numeric);
}

export function toDecimal(value: FormDataEntryValue | null, digits = 6) {
  const numeric = Number(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(numeric) ? numeric.toFixed(digits) : (0).toFixed(digits);
}
