'use client';

import { Card } from '@radix-ui/themes';

import { AlertDialog, Box, Button, Callout, Flex, Heading, Spinner, Text } from '@radix-ui/themes';
import { AlertTriangle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

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
    <Flex
      align={{ initial: 'start', sm: 'center' }}
      justify="between"
      gap="4"
      mb="5"
      direction={{ initial: 'column', sm: 'row' }}
    >
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

export function LoadingState({ label = 'Загрузка' }: { label?: string }) {
  return (
    <Flex minHeight="180px" align="center" justify="center" gap="3">
      <Spinner />
      <Text color="gray">{label}</Text>
    </Flex>
  );
}

export function EmptyState({ label = 'Нет данных' }: { label?: string }) {
  return (
    <Card size="4">
      <Text color="gray">{label}</Text>
    </Card>
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
        <Button
          type="button"
          variant="soft"
          color="gray"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={15} /> Назад
        </Button>
        <Button
          type="button"
          variant="soft"
          color="gray"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Далее <ChevronRight size={15} />
        </Button>
      </Flex>
    </Flex>
  );
}

export function DeleteButton({
  label = 'Удалить',
  confirmText = 'Удалить запись?',
  disabled,
  onDelete,
}: {
  label?: string;
  confirmText?: string;
  disabled?: boolean;
  onDelete: () => void;
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <Button type="button" size="2" variant="soft" color="red" disabled={disabled}>
          <Trash2 size={15} />
          {label}
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title>{label}</AlertDialog.Title>
        <AlertDialog.Description>{confirmText}</AlertDialog.Description>
        <Flex gap="3" justify="end" mt="4">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              Отмена
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button color="red" disabled={disabled} onClick={onDelete}>
              {label}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
