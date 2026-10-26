import { getCatalogItem } from '@/lib/api';
import type { ItemDto } from '@/types/api';
import type { TreeNode } from './model';
export async function buildTree(
  item: ItemDto,
  visited = new Set<number>(),
  quantity: string | null = null,
): Promise<TreeNode> {
  if (visited.has(item.id)) return { item, quantity, repeated: true, children: [] };
  const next = new Set(visited);
  next.add(item.id);
  const materials = item.routes
    .flatMap((route) => route.steps.flatMap((step) => step.materials))
    .filter((m) => m.input_item_id !== null);
  const totals = new Map<number, number>();
  for (const material of materials) {
    if (material.input_item_id)
      totals.set(
        material.input_item_id,
        (totals.get(material.input_item_id) ?? 0) + Number(material.quantity),
      );
  }
  const children = await Promise.all(
    [...totals].map(async ([id, amount]) =>
      buildTree(await getCatalogItem('items', id), next, String(amount)),
    ),
  );
  return { item, quantity, repeated: false, children };
}
