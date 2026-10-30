'use client';

import { Button, Flex, TextField } from '@radix-ui/themes';
import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { defaultListQuery, type ListQuery } from '@/lib/list-query';
import { FormField, SelectField } from './form-fields';
import { getTaskStatusLabel, getTaskTypeLabel } from './task-status';
import type { TaskStatus, TaskType } from '@/types/api';

type Props = {
  query: ListQuery;
  onChange: (query: ListQuery) => void;
  placeholder?: string;
  defaultSort?: string;
  sortOptions?: { id: string; name: string }[];
  children?: ReactNode;
};

const catalogSortOptions = [
  { id: 'name_asc', name: 'Название: А → Я' },
  { id: 'name_desc', name: 'Название: Я → А' },
  { id: 'id_asc', name: 'Сначала старые' },
  { id: 'id_desc', name: 'Сначала новые' },
];

export function ListTools({
  query,
  onChange,
  placeholder = 'Название или ID',
  defaultSort = 'id_asc',
  sortOptions = catalogSortOptions,
  children,
}: Props) {
  return (
    <Flex gap="3" wrap="wrap" align="end" mb="4">
      <FormField label="Поиск">
        <TextField.Root
          type="search"
          placeholder={placeholder}
          value={query.search}
          maxLength={256}
          onChange={(event) => onChange({ ...query, search: event.target.value })}
        >
          <TextField.Slot>
            <Search size={16} />
          </TextField.Slot>
        </TextField.Root>
      </FormField>
      {children}
      <SelectField
        label="Сортировка"
        value={query.sort}
        options={sortOptions}
        onChange={(sort) => onChange({ ...query, sort })}
      />
      <Button
        type="button"
        variant="soft"
        color="gray"
        disabled={JSON.stringify(query) === JSON.stringify(defaultListQuery(defaultSort))}
        onClick={() => onChange(defaultListQuery(defaultSort))}
      >
        Сбросить
      </Button>
    </Flex>
  );
}

const statuses: TaskStatus[] = ['in_progress', 'waiting', 'to_do', 'blocked', 'done', 'cancelled'];
const taskTypes: TaskType[] = ['operation', 'quality_review'];

export function TaskListTools({ query, onChange }: Pick<Props, 'query' | 'onChange'>) {
  return (
    <ListTools
      query={query}
      onChange={onChange}
      defaultSort="planning"
      placeholder="Задача, номенклатура, заказ или ID"
      sortOptions={[
        { id: 'planning', name: 'Дедлайн и приоритет' },
        ...catalogSortOptions,
        { id: 'status', name: 'По статусу' },
      ]}
    >
      <SelectField
        label="Статус"
        value={query.status}
        options={[
          { id: 'all', name: 'Все статусы' },
          ...statuses.map((id) => ({ id, name: getTaskStatusLabel(id) })),
        ]}
        onChange={(status) => onChange({ ...query, status })}
      />
      <SelectField
        label="Тип задачи"
        value={query.task_type}
        options={[
          { id: 'all', name: 'Все типы' },
          ...taskTypes.map((id) => ({ id, name: getTaskTypeLabel(id) })),
        ]}
        onChange={(task_type) => onChange({ ...query, task_type })}
      />
    </ListTools>
  );
}
