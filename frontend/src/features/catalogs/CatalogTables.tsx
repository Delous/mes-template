import { Badge, Box, Button, Flex, Text } from "@radix-ui/themes";
import { Trash2 } from "lucide-react";

import type { BomDto, ItemDto, RouteDto, UnitDto, WorkCenterDto } from "@/entities/catalog/types";
import { labels } from "@/shared/i18n/labels";
import { formatDate, formatQuantity } from "@/shared/lib/format";

import { deleteCatalogAction } from "./actions";

function DeleteButton({ resource, id }: { resource: string; id: number }) {
  return (
    <form action={deleteCatalogAction}>
      <input type="hidden" name="resource" value={resource} />
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="1" color="red" variant="soft">
        <Trash2 size={14} /> {labels.actions.delete}
      </Button>
    </form>
  );
}

export function UnitsTable({ units }: { units: UnitDto[] }) {
  return (
    <Box className="surface table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>{labels.fields.id}</th>
            <th>{labels.fields.name}</th>
            <th>{labels.fields.symbol}</th>
            <th>{labels.fields.updatedAt}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => (
            <tr key={unit.id}>
              <td>{unit.id}</td>
              <td>{unit.name}</td>
              <td>{unit.symbol}</td>
              <td>{formatDate(unit.updated_at)}</td>
              <td>
                <DeleteButton resource="units" id={unit.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

export function ItemsTable({ items }: { items: ItemDto[] }) {
  return (
    <Box className="surface table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>{labels.fields.id}</th>
            <th>{labels.fields.name}</th>
            <th>{labels.fields.unit}</th>
            <th>{labels.fields.description}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.unit?.symbol ?? item.unit_id}</td>
              <td>{item.description ?? labels.app.unknown}</td>
              <td>
                <DeleteButton resource="items" id={item.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

export function WorkCentersTable({ workCenters }: { workCenters: WorkCenterDto[] }) {
  return (
    <Box className="surface table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>{labels.fields.id}</th>
            <th>{labels.fields.name}</th>
            <th>{labels.fields.type}</th>
            <th>{labels.fields.description}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {workCenters.map((center) => (
            <tr key={center.id}>
              <td>{center.id}</td>
              <td>{center.name}</td>
              <td>{labels.workCenterTypes[center.type as keyof typeof labels.workCenterTypes] ?? center.type}</td>
              <td>{center.description ?? labels.app.unknown}</td>
              <td>
                <DeleteButton resource="work-centers" id={center.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

export function BomsTable({ boms }: { boms: BomDto[] }) {
  return (
    <Box className="surface table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>{labels.fields.name}</th>
            <th>{labels.fields.item}</th>
            <th>{labels.fields.version}</th>
            <th>{labels.fields.status}</th>
            <th>{labels.fields.default}</th>
            <th>{labels.fields.quantity}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {boms.map((bom) => (
            <tr key={bom.id}>
              <td>{bom.name}</td>
              <td>{bom.item?.name ?? bom.item_id}</td>
              <td>{bom.version}</td>
              <td>{labels.catalogStatuses[bom.status] ?? bom.status}</td>
              <td>{bom.is_default ? <Badge color="green">{labels.fields.default}</Badge> : null}</td>
              <td>
                <Flex direction="column" gap="1">
                  {(bom.lines ?? []).map((line, index) => (
                    <Text size="2" key={`${bom.id}-${index}`}>
                      {line.component_item?.name ?? line.component_item_id}: {formatQuantity(line.quantity)}
                    </Text>
                  ))}
                </Flex>
              </td>
              <td>
                <DeleteButton resource="boms" id={bom.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

export function RoutesTable({ routes }: { routes: RouteDto[] }) {
  return (
    <Box className="surface table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>{labels.fields.name}</th>
            <th>{labels.fields.item}</th>
            <th>{labels.fields.version}</th>
            <th>{labels.fields.status}</th>
            <th>{labels.fields.routeOperation}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {routes.map((route) => (
            <tr key={route.id}>
              <td>{route.name}</td>
              <td>{route.item?.name ?? route.item_id}</td>
              <td>{route.version}</td>
              <td>{labels.catalogStatuses[route.status] ?? route.status}</td>
              <td>
                <Flex direction="column" gap="1">
                  {(route.operations ?? []).map((operation) => (
                    <Text size="2" key={`${route.id}-${operation.operation_number}`}>
                      {operation.operation_number}. {operation.name}
                    </Text>
                  ))}
                </Flex>
              </td>
              <td>
                <DeleteButton resource="routes" id={route.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}
