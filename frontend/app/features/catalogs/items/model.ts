import { toDecimal } from '../../../lib/format';
import type { ItemDto, ItemPayload, ItemRoute } from '@/types/api';

export const pageSize = 20;

export type ItemDraft = {
  name: string;
  unit_id: number;
  description: string;
  is_product: boolean;
  routes: ItemRoute[];
};

export type TreeNode = {
  item: ItemDto;
  quantity: string | null;
  repeated: boolean;
  children: TreeNode[];
};

export function emptyDraft(unit_id: number): ItemDraft {
  return {
    name: '',
    unit_id,
    description: '',
    is_product: false,
    routes: [],
  };
}

export function fromItem(item: ItemDto): ItemDraft {
  return {
    name: item.name,
    unit_id: item.unit_id,
    description: item.description ?? '',
    is_product: item.is_product,
    routes: structuredClone(item.routes),
  };
}

export function canSave(d: ItemDraft) {
  return Boolean(
    d.name.trim() &&
    d.unit_id &&
    d.routes.every(
      (r) =>
        r.name.trim() &&
        Number(r.output_quantity) > 0 &&
        r.steps.length &&
        r.steps[0].materials.length &&
        r.steps.every(
          (step) =>
            step.operation_type_id &&
            step.workstation_id &&
            step.materials.every(
              (m) => (m.input_item_id || m.source_route_key) && Number(m.quantity) > 0,
            ),
        ),
    ),
  );
}

export function toItemPayload(draft: ItemDraft): ItemPayload {
  return {
    name: draft.name.trim(),
    unit_id: draft.unit_id,
    description: draft.description.trim() || null,
    is_product: draft.is_product,
    routes: draft.routes.map((route) => ({
      ...route,
      output_quantity: toDecimal(String(route.output_quantity)),
      steps: route.steps.map((step) => ({
        ...step,
        materials: step.materials.map((material) => ({
          ...material,
          quantity: toDecimal(String(material.quantity)),
        })),
      })),
    })),
  };
}
