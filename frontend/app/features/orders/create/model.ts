import { toDecimal } from '../../../lib/format';
import type { OrderLinePayload } from '@/types/api';
import { toOrderPlanningPayload } from '../../../lib/order-planning';

export type DraftLine = {
  id: number;
  item_id: string;
  main_id: string;
  quantity: string;
};

export function newLine(): DraftLine {
  return {
    id: Date.now() + Math.round(Math.random() * 1000),
    item_id: '',
    main_id: '',
    quantity: '1',
  };
}

export function toOrderPayload(formData: FormData, lines: DraftLine[]) {
  const payloadLines: OrderLinePayload[] = lines.map((line) => ({
    item_id: Number(line.item_id),
    quantity: toDecimal(formData.get(`quantity-${line.id}`)),
  }));
  return {
    ...toOrderPlanningPayload(formData),
    number: String(formData.get('number') ?? '').trim(),
    lines: payloadLines,
  };
}
