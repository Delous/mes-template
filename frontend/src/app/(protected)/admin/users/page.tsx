import { Badge, Box, Button, Flex, TextField } from "@radix-ui/themes";
import { Save } from "lucide-react";

import { getAdminWorkstationsResult, getUsersResult } from "@/entities/user/api";
import { updateUserAction } from "@/features/users/actions";
import { UserForm } from "@/features/users/UserForm";
import { WorkstationMultiSelect } from "@/features/users/WorkstationMultiSelect";
import { labels } from "@/shared/i18n/labels";
import type { UserRole } from "@/shared/navigation/navigation";
import { ErrorNotice } from "@/shared/ui/Notice";
import { PageHeader } from "@/shared/ui/PageHeader";

function getRoleLabel(role: string) {
  return role in labels.roles ? labels.roles[role as UserRole] : role;
}

export default async function UsersPage() {
  const [usersResult, workstationsResult] = await Promise.all([getUsersResult(), getAdminWorkstationsResult()]);
  const users = usersResult.ok ? usersResult.data.items : [];
  const workstations = workstationsResult.ok ? workstationsResult.data : [];

  return (
    <div className="page-content">
      <PageHeader title={labels.entities.users} description="Раздел назначения ролей и рабочих станций." />
      {!usersResult.ok ? <ErrorNotice message={usersResult.message} /> : null}
      {!workstationsResult.ok ? <ErrorNotice message={workstationsResult.message} /> : null}
      <UserForm />
      <Box className="surface table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>{labels.fields.id}</th>
              <th>{labels.fields.username}</th>
              <th>{labels.fields.fullName}</th>
              <th>{labels.fields.role}</th>
              <th>{labels.fields.password}</th>
              <th>{labels.entities.workstations}</th>
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
                  <Badge>{getRoleLabel(user.role)}</Badge>
                </td>
                <td>
                  <TextField.Root
                    form={`user-${user.id}`}
                    name="password"
                    type="password"
                    placeholder="Новый пароль"
                    minLength={6}
                    maxLength={128}
                  />
                </td>
                <td>
                  {workstationsResult.ok ? (
                    <WorkstationMultiSelect
                      formId={`user-${user.id}`}
                      selectedIds={user.workstations.map((workstation) => workstation.id)}
                      workstations={workstations}
                      username={user.username}
                    />
                  ) : user.workstations.length > 0 ? (
                    user.workstations.map((workstation) => workstation.name).join(", ")
                  ) : (
                    labels.app.unknown
                  )}
                </td>
                <td>
                  <form id={`user-${user.id}`} action={updateUserAction}>
                    <Flex gap="2" align="center" wrap="wrap">
                      <input type="hidden" name="id" value={user.id} />
                      <select
                        name="role"
                        required={user.role !== "admin"}
                        disabled={user.role === "admin"}
                        defaultValue={user.role}
                      >
                        {user.role === "admin" ? <option value="admin">{labels.roles.admin}</option> : null}
                        <option value="operator">{labels.roles.operator}</option>
                        <option value="reviewer">{labels.roles.reviewer}</option>
                        <option value="storekeeper">{labels.roles.storekeeper}</option>
                      </select>
                      <Button type="submit" size="2" variant="soft">
                        <Save size={15} /> {labels.actions.update}
                      </Button>
                    </Flex>
                  </form>
                </td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={7}>{labels.app.noUsers}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Box>
    </div>
  );
}
