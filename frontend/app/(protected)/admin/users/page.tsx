"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Badge, Box, Button, Callout, Flex, Grid, Heading, Spinner, Text, TextField } from "@radix-ui/themes";
import { Save, UserPlus } from "lucide-react";

import { createAdminUser, getAdminUsers, getAdminWorkstations, normalizeApiError, updateAdminUser } from "@/lib/api";
import type { AdminUserDto, EditableUserRole, UserRole, WorkstationDto } from "@/types/api";

const roleLabels: Record<UserRole, string> = {
  admin: "Администратор",
  operator: "Оператор",
  reviewer: "ОТК",
  storekeeper: "Кладовщик",
};

const editableRoles: EditableUserRole[] = ["operator", "reviewer", "storekeeper"];

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
      const [usersResponse, workstationResponse] = await Promise.all([getAdminUsers(), getAdminWorkstations()]);
      setUsers(usersResponse.items);
      setWorkstations(workstationResponse);
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
    setSubmitting(true);
    setError(null);
    setNotice(null);

    const formData = new FormData(event.currentTarget);

    try {
      const user = await createAdminUser({
        full_name: String(formData.get("full_name") ?? "").trim(),
        password: String(formData.get("password") ?? ""),
        role: String(formData.get("role") ?? "operator") as EditableUserRole,
      });
      event.currentTarget.reset();
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
    const password = String(formData.get("password") ?? "");

    try {
      await updateAdminUser(userId, {
        role: String(formData.get("role") ?? "operator") as EditableUserRole,
        password: password || undefined,
        workstation_ids: formData.getAll("workstation_ids").map(Number),
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
      <Text as="p" color="gray" size="2" mb="5">
        Backend генерирует логин автоматически из ФИО.
      </Text>

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

      <Box className="surface" p="4" mb="4">
        <form onSubmit={handleCreate}>
          <Grid columns={{ initial: "1", md: "4" }} gap="3" align="end">
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
      </Box>

      {loading ? (
        <Flex className="surface empty-state" align="center" justify="center" gap="3">
          <Spinner />
          <Text color="gray">Загружаем пользователей</Text>
        </Flex>
      ) : (
        <Box className="surface table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Логин</th>
                <th>ФИО</th>
                <th>Роль</th>
                <th>Рабочие посты</th>
                <th>Пароль</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.full_name}</td>
                  <td>
                    <Badge color={user.role === "admin" ? "tomato" : "gray"}>{roleLabels[user.role]}</Badge>
                  </td>
                  <td>
                    <form id={`user-${user.id}`} onSubmit={(event) => handleUpdate(user.id, event)}>
                      <WorkstationCheckboxes
                        name="workstation_ids"
                        workstations={workstations}
                        selectedIds={user.workstations.map((workstation) => workstation.id)}
                        disabled={user.role === "admin"}
                      />
                    </form>
                  </td>
                  <td>
                    <TextField.Root
                      form={`user-${user.id}`}
                      name="password"
                      type="password"
                      placeholder="Новый пароль"
                      minLength={6}
                      disabled={user.role === "admin"}
                    />
                  </td>
                  <td>
                    <Flex gap="2" align="center" wrap="wrap">
                      <select
                        form={`user-${user.id}`}
                        name="role"
                        required={user.role !== "admin"}
                        disabled={user.role === "admin"}
                        defaultValue={user.role === "admin" ? "operator" : user.role}
                      >
                        {editableRoles.map((role) => (
                          <option key={role} value={role}>
                            {roleLabels[role]}
                          </option>
                        ))}
                      </select>
                      <Button form={`user-${user.id}`} type="submit" size="2" variant="soft" disabled={submitting || user.role === "admin"}>
                        <Save size={15} /> Сохранить
                      </Button>
                    </Flex>
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7}>Пользователи не найдены</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Box>
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
          <input type="checkbox" name={name} value={workstation.id} defaultChecked={selectedIds.includes(workstation.id)} disabled={disabled} />
          {workstation.name}
        </Text>
      ))}
    </Flex>
  );
}
