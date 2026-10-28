'use client';

import { CheckboxField, Field, FormField, SelectField } from '@/components/form-fields';
import { Box, Button, Card, Flex, Grid, Text, TextArea, TextField } from '@radix-ui/themes';
import { GitBranch, Save } from 'lucide-react';
import { canSave } from './model';
import type { PageModel } from './use-page';
export function ItemBasics({
  model,
}: {
  model: Pick<
    PageModel,
    | 'units'
    | 'draft'
    | 'setDraft'
    | 'editorItem'
    | 'submitting'
    | 'save'
    | 'treeVisible'
    | 'setTreeVisible'
    | 'showTree'
    | 'runAction'
  >;
}) {
  const {
    units,
    draft,
    setDraft,
    editorItem,
    submitting,
    save,
    treeVisible,
    setTreeVisible,
    showTree,
    runAction,
  } = model;
  if (!draft) return null;
  return (
    <Card size="3">
      <Grid columns={{ initial: '1', md: '4fr 1fr' }} gap="3">
        <Field
          label="Название"
          value={draft.name}
          onChange={(name) => setDraft({ ...draft, name })}
        />
        <SelectField
          label="Единица измерения"
          value={draft.unit_id ? String(draft.unit_id) : ''}
          options={units}
          onChange={(value) => setDraft({ ...draft, unit_id: Number(value) })}
        />
      </Grid>

      <Text as="label" mt="3">
        <Text size="2">Описание</Text>
        <TextArea
          mt="2"
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
      </Text>

      <Box mt="3">
        <FormField label="Трудоёмкость (мин)">
          <TextField.Root
            type="number"
            min={0}
            max={2147483647}
            step={1}
            placeholder="Не указана"
            value={draft.labor_minutes}
            onChange={(event) => setDraft({ ...draft, labor_minutes: event.target.value })}
          />
        </FormField>
      </Box>

      <Flex align="center" justify="between" gap="4" mt="4" wrap="wrap">
        <Flex gap="3" wrap="wrap">
          <Button disabled={!canSave(draft) || submitting} onClick={save}>
            <Save size={15} />
            Сохранить
          </Button>
          {editorItem && (
            <Button
              variant="soft"
              onClick={() => (treeVisible ? setTreeVisible(false) : void showTree())}
            >
              <GitBranch size={15} />
              {treeVisible ? 'Скрыть дерево' : 'Просмотреть дерево'}
            </Button>
          )}
          {editorItem && (
            <>
              <Button variant="soft" disabled={submitting} onClick={() => runAction('copy')}>
                Скопировать
              </Button>
              <Button variant="soft" disabled={submitting} onClick={() => runAction('variants')}>
                Создать вариант
              </Button>
            </>
          )}
        </Flex>
        <CheckboxField
          checked={draft.is_product}
          onCheckedChange={(value) => setDraft({ ...draft, is_product: value === true })}
        >
          Изделие
        </CheckboxField>
      </Flex>
    </Card>
  );
}
