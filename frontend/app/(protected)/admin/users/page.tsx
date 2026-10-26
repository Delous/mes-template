'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Callout,
  Card,
  Flex,
  Grid,
  Heading,
  Spinner,
  Text,
  TextField,
} from '@radix-ui/themes';
import { Save, UserPlus } from 'lucide-react';

import {
  createAdminUser,
  getAdminUsers,
  getCatalog,
  normalizeApiError,
  updateAdminUser,
} from '@/lib/api';
import type { AdminUserDto, EditableUserRole, UserRole, WorkstationDto } from '@/types/api';

const roleLabels: Record<UserRole, string> = {
  admin: 'Администратор',
  operator: 'Оператор',
  reviewer: 'ОТК',
};

const editableRoles: EditableUserRole[] = ['operator', 'reviewer'];

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [workstations, setWorkstations] = useState<WorkstationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [usersResponse, workstationResponse] = await Promise.all([
        getAdminUsers(),
        getCatalog('workstations', 1, 100),
      ]);
      setUsers(usersResponse.items);
      setWorkstations(workstationResponse.items);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const user = await createAdminUser({
        full_name: String(formData.get('full_name') ?? '').trim(),
        password: String(formData.get('password') ?? ''),
        role: String(formData.get('role') ?? 'operator') as EditableUserRole,
      });
      form.reset();
      setNotice(`Пользователь создан. Логин: ${user.username}`);
      await loadData();
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(userId: number, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') ?? '');

    try {
      await updateAdminUser(userId, {
        role: String(formData.get('role') ?? 'operator') as EditableUserRole,
        password: password || undefined,
        workstation_ids: formData.getAll('workstation_ids').map(Number),
      });
      await loadData();
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-content">
      <Heading size="7" mb="1">
        Пользователи
      </Heading>

      {error ? (
        <Callout.Root color="red" mb="4">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      ) : null}
      {notice ? (
        <Callout.Root color="green" mb="4">
          <Callout.Text>{notice}</Callout.Text>
        </Callout.Root>
      ) : null}

      <Card size="3" mb="4">
        <form onSubmit={handleCreate}>
          <Grid columns={{ initial: '1', md: '4' }} gap="3" align="end">
            <label>
              <Text size="2">ФИО</Text>
              <TextField.Root name="full_name" mt="2" required maxLength={256} />
            </label>
            <label>
              <Text size="2">Пароль</Text>
              <TextField.Root name="password" type="password" mt="2" required minLength={6} />
            </label>
            <label>
              <Text size="2">Роль</Text>
              <select name="role" required defaultValue="operator">
                {editableRoles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" disabled={submitting}>
              <UserPlus size={16} /> Создать
            </Button>
          </Grid>
        </form>
      </Card>

      {loading ? (
        <Flex className="surface empty-state" align="center" justify="center" gap="3">
          <Spinner />
          <Text color="gray">Загружаем пользователей</Text>
        </Flex>
      ) : (
        <Flex direction="column" gap="3">
          {users.map((user) => (
            <Card key={user.id} size="3" className="user-card">
              <div className="user-card-summary">
                <Flex direction="column" align="start" gap="2">
                  <Text as="p" size="4" weight="bold" className="user-card-name">
                    {user.full_name}
                  </Text>
                  <Text as="p" size="2" color="gray">
                    {user.username}
                  </Text>
                  <Badge color={user.role === 'admin' ? 'tomato' : 'gray'}>
                    {roleLabels[user.role]}
                  </Badge>
                </Flex>
                <Box>
                  <Text as="p" size="2" color="gray" mb="2">
                    Рабочие посты
                  </Text>
                  <Text as="p" size="3">
                    {user.workstations.map((workstation) => workstation.name).join(', ') ||
                      'Не назначены'}
                  </Text>
                </Box>
              </div>

              {user.role !== 'admin' ? (
                <details className="user-card-editor">
                  <summary>Редактировать</summary>
                  <form onSubmit={(event) => handleUpdate(user.id, event)}>
                    <Grid columns={{ initial: '1', sm: '2' }} gap="3" mt="3">
                      <label>
                        <Text size="2">Роль</Text>
                        <select name="role" required defaultValue={user.role}>
                          {editableRoles.map((role) => (
                            <option key={role} value={role}>
                              {roleLabels[role]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <Text size="2">Новый пароль</Text>
                        <TextField.Root name="password" type="password" mt="2" minLength={6} />
                      </label>
                    </Grid>
                    <Box mt="3" role="group" aria-label="Рабочие посты">
                      <Text size="2">Рабочие посты</Text>
                      <WorkstationCheckboxes
                        name="workstation_ids"
                        workstations={workstations}
                        selectedIds={user.workstations.map((workstation) => workstation.id)}
                      />
                    </Box>
                    <Button type="submit" size="2" variant="soft" mt="4" disabled={submitting}>
                      <Save size={15} /> Сохранить
                    </Button>
                  </form>
                </details>
              ) : null}
            </Card>
          ))}
          {users.length === 0 ? (
            <Card size="3">
              <Text color="gray">Пользователи не найдены</Text>
            </Card>
          ) : null}
        </Flex>
      )}
    </div>
  );
}

function WorkstationCheckboxes({
  name,
  workstations,
  selectedIds,
  disabled,
}: {
  name: string;
  workstations: WorkstationDto[];
  selectedIds: number[];
  disabled?: boolean;
}) {
  return (
    <Flex gap="3" wrap="wrap" mt="3">
      {workstations.map((workstation) => (
        <Text as="label" size="2" key={workstation.id} className="checkbox-label">
          <input
            type="checkbox"
            name={name}
            value={workstation.id}
            defaultChecked={selectedIds.includes(workstation.id)}
            disabled={disabled}
          />
          {workstation.name}
        </Text>
      ))}
    </Flex>
  );
}
