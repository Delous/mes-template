'use client';

import { OrderLine } from './order-line';

import { FormField } from '@/components/form-fields';
import { OrderPlanningFields } from '@/components/order-planning-fields';
import { ErrorNotice, LoadingState, PageHeader } from '@/components/page-tools';
import { Button, Card, Flex, Grid, TextField } from '@radix-ui/themes';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';

import type { PageModel } from './use-page';
export function PageHeading() {
  return (
    <PageHeader
      title="Новый заказ"
      description="После создания заказа появятся задачи на производство номенклатур."
      action={
        <Button asChild variant="soft" color="gray">
          <Link href="/orders">
            <ArrowLeft size={16} /> Назад
          </Link>
        </Button>
      }
    />
  );
}

export function PageError({ model }: { model: Pick<PageModel, 'error'> }) {
  const { error } = model;
  return <ErrorNotice message={error} />;
}

export function CreateOrderForm({
  model,
}: {
  model: Pick<
    PageModel,
    | 'items'
    | 'lines'
    | 'updateLine'
    | 'removeLine'
    | 'addLine'
    | 'loading'
    | 'submitting'
    | 'handleSubmit'
  >;
}) {
  const { items, lines, updateLine, removeLine, addLine, loading, submitting, handleSubmit } =
    model;
  return loading ? (
    <LoadingState label="Загружаем справочники" />
  ) : (
    <Card size="3">
      <form onSubmit={handleSubmit}>
        <Grid columns={{ initial: '1', md: '3' }} gap="3" mb="5">
          <FormField label={'Название заказа'}>
            <TextField.Root name="number" required maxLength={128} placeholder="ORD-01" />
          </FormField>
          <OrderPlanningFields disabled={submitting} />
        </Grid>

        <Flex direction="column" gap="4">
          {lines.map((line, index) => (
            <OrderLine
              key={line.id}
              line={line}
              index={index}
              items={items}
              canDelete={lines.length > 1}
              onChange={(patch) => updateLine(line.id, patch)}
              onDelete={() => removeLine(line.id)}
            />
          ))}
        </Flex>

        <Flex gap="3" mt="4" wrap="wrap">
          <Button type="button" variant="soft" onClick={addLine}>
            <Plus size={16} /> Добавить строку
          </Button>
          <Button type="submit" disabled={submitting || lines.some((line) => !line.item_id)}>
            Создать заказ
          </Button>
        </Flex>
      </form>
    </Card>
  );
}
