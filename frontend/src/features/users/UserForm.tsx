import { Box, Button, Grid, Text, TextField } from "@radix-ui/themes";

import { labels } from "@/shared/i18n/labels";

import { createUserAction } from "./actions";

export function UserForm() {
  return (
    <Box className="surface" p="4" mb="4">
      <form action={createUserAction}>
        <Grid columns={{ initial: "1", md: "4" }} gap="3" align="end">
          <label>
            <Text size="2">{labels.fields.fullName}</Text>
            <TextField.Root name="full_name" mt="2" required maxLength={256} placeholder="Иванов Иван Иванович" />
          </label>
          <label>
            <Text size="2">{labels.fields.password}</Text>
            <TextField.Root name="password" type="password" mt="2" required minLength={6} maxLength={128} />
          </label>
          <label>
            <Text size="2">{labels.fields.role}</Text>
            <select name="role" required defaultValue="operator">
              <option value="operator">{labels.roles.operator}</option>
              <option value="reviewer">{labels.roles.reviewer}</option>
              <option value="storekeeper">{labels.roles.storekeeper}</option>
            </select>
          </label>
          <Button type="submit">{labels.actions.create}</Button>
        </Grid>
      </form>
    </Box>
  );
}
