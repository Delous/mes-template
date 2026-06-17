"use client";

import { useActionState, useState } from "react";
import { Box, Button, Callout, Checkbox, Flex, Grid, Select, Text, TextArea, TextField } from "@radix-ui/themes";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";

import type { ItemDto, UnitDto, WorkCenterDto } from "@/entities/catalog/types";
import { labels } from "@/shared/i18n/labels";

import {
  createBomAction,
  createItemAction,
  createRouteAction,
  createUnitAction,
  createWorkCenterAction,
  type CatalogActionState,
} from "./actions";

const initialCatalogActionState: CatalogActionState = {};

export function UnitForm() {
  return (
    <Box className="surface" p="4" mb="4">
      <form action={createUnitAction}>
        <Grid columns={{ initial: "1", sm: "3" }} gap="3" align="end">
          <label>
            <Text size="2">{labels.fields.name}</Text>
            <TextField.Root name="name" mt="2" required />
          </label>
          <label>
            <Text size="2">{labels.fields.symbol}</Text>
            <TextField.Root name="symbol" mt="2" required />
          </label>
          <Button type="submit">{labels.actions.create}</Button>
        </Grid>
      </form>
    </Box>
  );
}

export function ItemForm({ units }: { units: UnitDto[] }) {
  return (
    <Box className="surface" p="4" mb="4">
      <form action={createItemAction}>
        <Grid columns={{ initial: "1", md: "4" }} gap="3" align="end">
          <label>
            <Text size="2">{labels.fields.name}</Text>
            <TextField.Root name="name" mt="2" required />
          </label>
          <label>
            <Text size="2">{labels.fields.unit}</Text>
            <select name="unit_id" required>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.symbol})
                </option>
              ))}
            </select>
          </label>
          <label>
            <Text size="2">{labels.fields.description}</Text>
            <TextField.Root name="description" mt="2" />
          </label>
          <Button type="submit">{labels.actions.create}</Button>
        </Grid>
      </form>
    </Box>
  );
}

export function WorkCenterForm() {
  return (
    <Box className="surface" p="4" mb="4">
      <form action={createWorkCenterAction}>
        <Grid columns={{ initial: "1", md: "4" }} gap="3" align="end">
          <label>
            <Text size="2">{labels.fields.name}</Text>
            <TextField.Root name="name" mt="2" required />
          </label>
          <label>
            <Text size="2">{labels.fields.type}</Text>
            <select name="type" required defaultValue="production">
              <option value="production">{labels.workCenterTypes.production}</option>
              <option value="warehouse">{labels.workCenterTypes.warehouse}</option>
              <option value="quality">{labels.workCenterTypes.quality}</option>
            </select>
          </label>
          <label>
            <Text size="2">{labels.fields.description}</Text>
            <TextField.Root name="description" mt="2" />
          </label>
          <Button type="submit">{labels.actions.create}</Button>
        </Grid>
      </form>
    </Box>
  );
}

export function BomForm({ items }: { items: ItemDto[] }) {
  const [lines, setLines] = useState([crypto.randomUUID()]);

  return (
    <Box className="surface" p="4" mb="4">
      <form action={createBomAction}>
        <Flex direction="column" gap="4">
          <Grid columns={{ initial: "1", md: "5" }} gap="3" align="end">
            <label>
              <Text size="2">{labels.fields.item}</Text>
              <select name="item_id" required>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <Text size="2">{labels.fields.name}</Text>
              <TextField.Root name="name" mt="2" required />
            </label>
            <label>
              <Text size="2">{labels.fields.version}</Text>
              <TextField.Root name="version" mt="2" defaultValue="1.0" required />
            </label>
            <label>
              <Text size="2">{labels.fields.status}</Text>
              <select name="status" defaultValue="active">
                <option value="active">{labels.catalogStatuses.active}</option>
                <option value="inactive">{labels.catalogStatuses.inactive}</option>
              </select>
            </label>
            <label>
              <Flex gap="2" align="center">
                <Checkbox name="is_default" /> <Text size="2">{labels.fields.default}</Text>
              </Flex>
            </label>
          </Grid>

          {lines.map((line) => (
            <Grid key={line} columns={{ initial: "1", md: "4" }} gap="3" align="end">
              <label>
                <Text size="2">{labels.fields.item}</Text>
                <select name="component_item_id" required>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <Text size="2">{labels.fields.quantity}</Text>
                <TextField.Root name="line_quantity" mt="2" defaultValue="1" required />
              </label>
              <label>
                <Text size="2">Излишки %</Text>
                <TextField.Root name="scrap_percent" mt="2" defaultValue="0" required />
              </label>
              <Button type="button" color="red" variant="soft" onClick={() => setLines((current) => current.filter((id) => id !== line))}>
                <Trash2 size={15} /> {labels.app.removeLine}
              </Button>
            </Grid>
          ))}

          <Flex gap="3">
            <Button type="button" variant="soft" onClick={() => setLines((current) => [...current, crypto.randomUUID()])}>
              <Plus size={15} /> {labels.app.addLine}
            </Button>
            <Button type="submit">{labels.actions.create}</Button>
          </Flex>
        </Flex>
      </form>
    </Box>
  );
}

export function RouteForm({ items, workCenters }: { items: ItemDto[]; workCenters: WorkCenterDto[] }) {
  const [operations, setOperations] = useState([crypto.randomUUID()]);
  const [state, formAction, pending] = useActionState(createRouteAction, initialCatalogActionState);
  const canSubmit = items.length > 0 && workCenters.length > 0;

  return (
    <Box className="surface" p="4" mb="4">
      <form action={formAction}>
        <Flex direction="column" gap="4">
          {!canSubmit ? (
            <Callout.Root color="amber" size="2">
              <Callout.Icon>
                <AlertTriangle size={16} />
              </Callout.Icon>
              <Callout.Text>Для маршрутного листа нужны номенклатура и рабочие центры.</Callout.Text>
            </Callout.Root>
          ) : null}

          {state.error ? (
            <Callout.Root color="red" size="2">
              <Callout.Icon>
                <AlertTriangle size={16} />
              </Callout.Icon>
              <Callout.Text>{state.error}</Callout.Text>
            </Callout.Root>
          ) : null}

          <Grid columns={{ initial: "1", md: "5" }} gap="3" align="end">
            <label>
              <Text size="2">{labels.fields.item}</Text>
              <select name="item_id" required disabled={!items.length}>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <Text size="2">{labels.fields.name}</Text>
              <TextField.Root name="name" mt="2" required />
            </label>
            <label>
              <Text size="2">{labels.fields.version}</Text>
              <TextField.Root name="version" mt="2" defaultValue="1.0" required />
            </label>
            <label>
              <Text size="2">{labels.fields.status}</Text>
              <select name="status" defaultValue="active">
                <option value="active">{labels.catalogStatuses.active}</option>
                <option value="inactive">{labels.catalogStatuses.inactive}</option>
              </select>
            </label>
            <label>
              <Flex gap="2" align="center">
                <Checkbox name="is_default" /> <Text size="2">{labels.fields.default}</Text>
              </Flex>
            </label>
          </Grid>

          {operations.map((operation, index) => (
            <Box key={operation} p="3" style={{ border: "1px solid var(--gray-5)", borderRadius: 8 }}>
              <Grid columns={{ initial: "1", md: "6" }} gap="3" align="end">
                <label>
                  <Text size="2">№ операции</Text>
                  <TextField.Root name="operation_number" mt="2" defaultValue={String((index + 1))} required />
                </label>
                <label>
                  <Text size="2">{labels.fields.name}</Text>
                  <TextField.Root name="operation_name" mt="2" required />
                </label>
                <label>
                  <Text size="2">{labels.fields.workCenter}</Text>
                  <select name="work_center_id" required disabled={!workCenters.length}>
                    {workCenters.map((center) => (
                      <option key={center.id} value={center.id}>
                        {center.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <Text size="2">Наладка, мин</Text>
                  <TextField.Root name="setup_time_minutes" mt="2" defaultValue="0" required />
                </label>
                <label>
                  <Text size="2">Время работы, мин</Text>
                  <TextField.Root name="run_time_minutes" mt="2" defaultValue="0" required />
                </label>
                <label>
                  <Flex gap="2" align="center">
                    <Checkbox name="requires_quality_review" value={String(index)} /> <Text size="2">ОТК</Text>
                  </Flex>
                </label>
              </Grid>
              <Grid columns={{ initial: "1", md: "4" }} gap="3" mt="3" align="end">
                <label>
                  <Text size="2">Вход</Text>
                  <select name="input_item_id" required disabled={!items.length}>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <TextField.Root name="input_quantity" defaultValue="1" required />
                <label>
                  <Text size="2">Выход</Text>
                  <select name="output_item_id" required disabled={!items.length}>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <TextField.Root name="output_quantity" defaultValue="1" required />
              </Grid>
            </Box>
          ))}

          <Flex gap="3">
            <Button type="button" variant="soft" onClick={() => setOperations((current) => [...current, crypto.randomUUID()])}>
              <Plus size={15} /> {labels.app.addLine}
            </Button>
            <Button type="submit" disabled={!canSubmit || pending}>
              {labels.actions.create}
            </Button>
          </Flex>
        </Flex>
      </form>
    </Box>
  );
}
