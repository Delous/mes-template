'use client';

import { ItemBasics } from './item-basics';

import { ErrorNotice } from '@/components/page-tools';
import { Button, Card, Dialog, Flex, Text } from '@radix-ui/themes';
import { GitBranch } from 'lucide-react';
import { RoutesEditor } from './routes-editor';
import { Tree } from './specification-tree';
import type { PageModel } from './use-page';
export function ItemDialog({
  model,
}: {
  model: Pick<
    PageModel,
    | 'units'
    | 'operationTypes'
    | 'workstations'
    | 'editorItem'
    | 'draft'
    | 'setDraft'
    | 'tree'
    | 'treeVisible'
    | 'setTreeVisible'
    | 'open'
    | 'setOpen'
    | 'submitting'
    | 'error'
    | 'inputCandidates'
    | 'openById'
    | 'save'
    | 'runAction'
    | 'showTree'
  >;
}) {
  const {
    operationTypes,
    workstations,
    editorItem,
    draft,
    setDraft,
    tree,
    treeVisible,
    setTreeVisible,
    open,
    setOpen,
    submitting,
    error,
    inputCandidates,
    openById,
    runAction,
  } = model;
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          setOpen(false);
          setTreeVisible(false);
        }
      }}
    >
      <Dialog.Content maxWidth="1000px">
        <Dialog.Title>{editorItem ? 'Номенклатура' : 'Новая номенклатура'}</Dialog.Title>
        <ErrorNotice message={error} />
        {draft && (
          <Flex direction="column" gap="4">
            <ItemBasics model={model} />

            {editorItem &&
              (editorItem.is_main ? (
                <Text size="2">✓ Главная номенклатура</Text>
              ) : (
                <Button variant="soft" disabled={submitting} onClick={() => runAction('make-main')}>
                  Сделать главной номенклатурой
                </Button>
              ))}
            <RoutesEditor
              routes={draft.routes}
              onChange={(routes) => setDraft({ ...draft, routes })}
              items={inputCandidates}
              operations={operationTypes}
              posts={workstations}
            />
            {treeVisible && tree && (
              <Card size="3">
                <Flex align="center" gap="2" mb="3">
                  <GitBranch size={18} />
                  <Text size="3" weight="medium">
                    Дерево спецификации
                  </Text>
                </Flex>
                <Text as="p" size="2" color="gray" mb="4">
                  Нажмите на позицию, чтобы открыть её карточку.
                </Text>
                <Tree node={tree} onOpen={openById} root />
              </Card>
            )}
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
