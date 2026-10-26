'use client';

import { Disclosure } from '@/components/disclosure';
import { CheckboxField, FormField, SelectField } from '@/components/form-fields';
import type { WorkstationDto } from '@/types/api';
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
import { editableRoles, roleLabels } from './model';
import type { PageModel } from './use-page';
export function PageHeading() {
  return (
    <Heading size="7" mb="1">
      Пользователи
    </Heading>
  );
}

export function PageError({ model }: { model: Pick<PageModel, 'error'> }) {
  const { error } = model;
  return error ? (
    <Callout.Root color="red" mb="4">
      <Callout.Text>{error}</Callout.Text>
    </Callout.Root>
  ) : null;
}

export function CreationNotice({ model }: { model: Pick<PageModel, 'notice'> }) {
  const { notice } = model;
  return notice ? (
    <Callout.Root color="green" mb="4">
      <Callout.Text>{notice}</Callout.Text>
    </Callout.Root>
  ) : null;
}

export function CreateUserForm({
  model,
}: {
  model: Pick<PageModel, 'submitting' | 'handleCreate' | 'createFormKey'>;
}) {
  const { submitting, handleCreate, createFormKey } = model;
  return (
    <Card size="3" mb="4">
      <form key={createFormKey} onSubmit={handleCreate}>
        <Grid columns={{ initial: '1', md: '4' }} gap="3" align="end">
          <FormField label={'ФИО'}>
            <TextField.Root name="full_name" mt="2" required maxLength={256} />
          </FormField>
          <FormField label={'Пароль'}>
            <TextField.Root name="password" type="password" mt="2" required minLength={6} />
          </FormField>
          <SelectField
            label="Роль"
            name="role"
            required
            defaultValue="operator"
            options={editableRoles.map((role) => ({ id: role, name: roleLabels[role] }))}
          />
          <Button type="submit" disabled={submitting}>
            <UserPlus size={16} /> Создать
          </Button>
        </Grid>
      </form>
    </Card>
  );
}

export function UsersList({
  model,
}: {
  model: Pick<PageModel, 'users' | 'workstations' | 'loading' | 'submitting' | 'handleUpdate'>;
}) {
  const { users, workstations, loading, submitting, handleUpdate } = model;
  return loading ? (
    <Flex minHeight="180px" align="center" justify="center" gap="3">
      <Spinner />
      <Text color="gray">Загружаем пользователей</Text>
    </Flex>
  ) : (
    <Flex direction="column" gap="3">
      {users.map((user) => (
        <Card key={user.id} size="3">
          <Grid columns={{ initial: '1', md: '1fr 2fr' }} gap="5">
            <Flex direction="column" align="start" gap="2">
              <Text as="p" size="4" weight="bold">
                {user.full_name}
              </Text>
              <Text as="p" size="2" color="gray">
                {user.username}
              </Text>
              <Badge color={user.role === 'admin' ? 'tomato' : 'gray'}>{user.roleLabel}</Badge>
            </Flex>
            <Box>
              <Text as="p" size="2" color="gray" mb="2">
                Рабочие посты
              </Text>
              <Text as="p" size="3">
                {user.workstationNames}
              </Text>
            </Box>
          </Grid>

          {user.role !== 'admin' ? (
            <Disclosure title={'Редактировать'}>
              <form onSubmit={(event) => handleUpdate(user.id, event)}>
                <Grid columns={{ initial: '1', sm: '2' }} gap="3" mt="3">
                  <SelectField
                    label="Роль"
                    name="role"
                    required
                    defaultValue={user.role}
                    options={editableRoles.map((role) => ({
                      id: role,
                      name: roleLabels[role],
                    }))}
                  />
                  <FormField label={'Новый пароль'}>
                    <TextField.Root name="password" type="password" mt="2" minLength={6} />
                  </FormField>
                </Grid>
                <Box mt="3" role="group" aria-label="Рабочие посты">
                  <Text size="2">Рабочие посты</Text>
                  <WorkstationCheckboxes
                    name="workstation_ids"
                    workstations={workstations}
                    selectedIds={user.workstationIds}
                  />
                </Box>
                <Button type="submit" size="2" variant="soft" mt="4" disabled={submitting}>
                  <Save size={15} /> Сохранить
                </Button>
              </form>
            </Disclosure>
          ) : null}
        </Card>
      ))}
      {users.length === 0 ? (
        <Card size="3">
          <Text color="gray">Пользователи не найдены</Text>
        </Card>
      ) : null}
    </Flex>
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
        <CheckboxField
          key={workstation.id}
          name={name}
          value={workstation.id}
          defaultChecked={selectedIds.includes(workstation.id)}
          disabled={disabled}
        >
          {workstation.name}
        </CheckboxField>
      ))}
    </Flex>
  );
}
