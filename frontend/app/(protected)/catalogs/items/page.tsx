'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  Flex,
  Grid,
  Select,
  Text,
  TextArea,
  TextField,
} from '@radix-ui/themes';
import { ChevronRight, GitBranch, Package, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { CatalogNav } from '@/components/catalog-nav';
import {
  EmptyState,
  ErrorNotice,
  LoadingState,
  PageHeader,
  Pagination,
  toDecimal,
} from '@/components/page-tools';
import {
  createCatalogItem,
  getCatalog,
  getCatalogItem,
  normalizeApiError,
  updateCatalogItem,
} from '@/lib/api';
import type {
  CycleConflictDetail,
  ItemDto,
  ItemPayload,
  OperationTypeDto,
  UnitDto,
  WorkstationDto,
} from '@/types/api';

const pageSize = 20;
type DraftInput = { key: number; input_item_id: number; quantity: string };
type ItemDraft = {
  name: string;
  unit_id: number;
  description: string;
  is_product: boolean;
  operation_type_id: number | null;
  workstation_id: number | null;
  output_quantity: string;
  inputs: DraftInput[];
};
type TreeNode = {
  item: ItemDto;
  quantity: string | null;
  repeated: boolean;
  children: TreeNode[];
};

export default function ItemsPage() {
  const [items, setItems] = useState<ItemDto[]>([]);
  const [allItems, setAllItems] = useState<ItemDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [operationTypes, setOperationTypes] = useState<OperationTypeDto[]>([]);
  const [workstations, setWorkstations] = useState<WorkstationDto[]>([]);
  const [editorItem, setEditorItem] = useState<ItemDto | null>(null);
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [treeVisible, setTreeVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [onlyProducts, setOnlyProducts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cycleId, setCycleId] = useState<number | null>(null);
  const inputCandidates = useMemo(
    () => allItems.filter((item) => item.id !== editorItem?.id),
    [allItems, editorItem?.id],
  );
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listed, all, us, ops, posts] = await Promise.all([
        getCatalog('items', page, pageSize, false, onlyProducts),
        getCatalog('items', 1, 100),
        getCatalog('units', 1, 100),
        getCatalog('operation-types', 1, 100),
        getCatalog('workstations', 1, 100),
      ]);
      setItems(listed.items);
      setTotal(listed.total);
      setAllItems(all.items);
      setUnits(us.items);
      setOperationTypes(ops.items);
      setWorkstations(posts.items);
    } catch (e) {
      setError(normalizeApiError(e));
    } finally {
      setLoading(false);
    }
  }, [page, onlyProducts]);
  useEffect(() => {
    void load();
  }, [load]);
  function openNew() {
    setEditorItem(null);
    setDraft(emptyDraft(units[0]?.id ?? 0));
    setTree(null);
    setTreeVisible(false);
    setOpen(true);
  }
  function openItem(item: ItemDto) {
    setEditorItem(item);
    setDraft(fromItem(item));
    setTree(null);
    setTreeVisible(false);
    setCycleId(null);
    setOpen(true);
  }
  async function openById(id: number) {
    try {
      openItem(editorItem?.id === id ? editorItem : await getCatalogItem('items', id));
    } catch (e) {
      setError(normalizeApiError(e));
    }
  }
  async function save() {
    if (!draft) return;
    setSubmitting(true);
    setError(null);
    setCycleId(null);
    const payload: ItemPayload = {
      name: draft.name.trim(),
      unit_id: draft.unit_id,
      description: draft.description.trim() || null,
      is_product: draft.is_product,
      operation_type_id: draft.operation_type_id,
      workstation_id: draft.workstation_id,
      output_quantity: draft.output_quantity ? Number(draft.output_quantity) : null,
      inputs: draft.inputs.map((input) => ({
        input_item_id: input.input_item_id,
        quantity: toDecimal(input.quantity),
      })),
    };
    try {
      const saved = editorItem
        ? await updateCatalogItem('items', editorItem.id, payload)
        : await createCatalogItem('items', payload);
      setEditorItem(saved);
      setDraft(fromItem(saved));
      await load();
    } catch (e) {
      const detail = (e as { response?: { data?: { detail?: CycleConflictDetail } } }).response
        ?.data?.detail;
      if (detail?.item_id) setCycleId(detail.item_id);
      setError(normalizeApiError(e));
    } finally {
      setSubmitting(false);
    }
  }
  async function showTree() {
    if (!editorItem) return;
    setTreeVisible(true);
    try {
      setTree(await buildTree(editorItem));
    } catch (e) {
      setError(normalizeApiError(e));
    }
  }
  return (
    <div className="page-content">
      <PageHeader
        title="Номенклатура"
        action={
          <Button onClick={openNew} disabled={!units.length}>
            <Plus size={16} />
            Создать
          </Button>
        }
      />
      <CatalogNav />
      <ErrorNotice message={error} />
      <Text as="label" size="2" className="checkbox-label" mb="4">
        <Checkbox
          checked={onlyProducts}
          onCheckedChange={(value) => {
            setOnlyProducts(value === true);
            setPage(1);
          }}
        />
        Показать только изделия
      </Text>

      {loading ? (
        <LoadingState />
      ) : !items.length ? (
        <EmptyState />
      ) : (
        <>
          <Box className="surface table-scroll">
            <table className="data-table items-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Единица</th>
                  <th>Описание</th>
                  <th>Изделие</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Text weight="medium">{item.name}</Text>
                    </td>
                    <td>{item.unit.symbol}</td>
                    <td>
                      <Text color={item.description ? undefined : 'gray'}>
                        {item.description || 'Описание не указано'}
                      </Text>
                    </td>
                    <td>{item.is_product ? 'Да' : 'Нет'}</td>
                    <td>
                      <Button size="2" variant="soft" onClick={() => openItem(item)}>
                        Открыть <ChevronRight size={15} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
          <Pagination page={page} size={pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      <Dialog.Root
        open={open}
        onOpenChange={(value) => {
          if (!value) {
            setOpen(false);
            setTreeVisible(false);
          }
        }}
      >
        <Dialog.Content maxWidth="820px">
          <Dialog.Title>{editorItem ? 'Номенклатура' : 'Новая номенклатура'}</Dialog.Title>
          {draft && (
            <Flex direction="column" gap="4">
              <Box className="surface" p="4">
                <div className="item-editor-primary-row">
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
                </div>

                <div className="item-editor-production-row">
                  <NullableSelect
                    label="Тип операции"
                    value={draft.operation_type_id}
                    options={operationTypes}
                    onChange={(value) => setDraft({ ...draft, operation_type_id: value })}
                  />
                  <NullableSelect
                    label="Рабочий пост"
                    value={draft.workstation_id}
                    options={workstations}
                    onChange={(value) => setDraft({ ...draft, workstation_id: value })}
                  />
                  <label>
                    <Text size="2">Количество</Text>
                    <TextField.Root
                      mt="2"
                      type="number"
                      min="1"
                      step="1"
                      value={draft.output_quantity}
                      onChange={(event) =>
                        setDraft({ ...draft, output_quantity: event.target.value })
                      }
                    />
                  </label>
                </div>

                <label className="item-editor-description">
                  <Text size="2">Описание</Text>
                  <TextArea
                    mt="2"
                    value={draft.description}
                    onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  />
                </label>

                <div className="item-editor-actions">
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
                  </Flex>
                  <Text as="label" size="2" className="checkbox-label">
                    <Checkbox
                      checked={draft.is_product}
                      onCheckedChange={(value) =>
                        setDraft({ ...draft, is_product: value === true })
                      }
                    />
                    Изделие
                  </Text>
                </div>
              </Box>

              <Box className="surface" p="4">
                <Text size="2" weight="medium">
                  Материалы
                </Text>
                <Flex direction="column" gap="2" mt="3">
                  {draft.inputs.map((input) => (
                    <Grid
                      key={input.key}
                      columns={{ initial: '1', md: '1fr 160px 110px' }}
                      gap="2"
                      align="end"
                      className={`material-row${cycleId === input.input_item_id ? ' conflict-row' : ''}`}
                    >
                      <SelectField
                        label="Номенклатура"
                        value={String(input.input_item_id)}
                        options={inputCandidates}
                        onChange={(value) =>
                          setDraft({
                            ...draft,
                            inputs: draft.inputs.map((current) =>
                              current.key === input.key
                                ? { ...current, input_item_id: Number(value) }
                                : current,
                            ),
                          })
                        }
                      />
                      <Field
                        label="Количество"
                        value={input.quantity}
                        onChange={(quantity) =>
                          setDraft({
                            ...draft,
                            inputs: draft.inputs.map((current) =>
                              current.key === input.key ? { ...current, quantity } : current,
                            ),
                          })
                        }
                      />
                      <Button
                        color="red"
                        variant="soft"
                        disabled={submitting}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            inputs: draft.inputs.filter((current) => current.key !== input.key),
                          })
                        }
                      >
                        <Trash2 size={15} />
                        Удалить
                      </Button>
                    </Grid>
                  ))}
                </Flex>
                <Button
                  mt="3"
                  variant="soft"
                  disabled={!inputCandidates.length}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      inputs: [
                        ...draft.inputs,
                        { key: Date.now(), input_item_id: inputCandidates[0].id, quantity: '1' },
                      ],
                    })
                  }
                >
                  <Plus size={15} />
                  Добавить материал
                </Button>
              </Box>
              {treeVisible && tree && (
                <Box className="surface specification-tree" p="4">
                  <Flex align="center" gap="2" mb="3">
                    <GitBranch size={18} />
                    <Text size="3" weight="medium">Дерево спецификации</Text>
                  </Flex>
                  <Text as="p" size="2" color="gray" mb="4">
                    Нажмите на позицию, чтобы открыть её карточку.
                  </Text>
                  <Tree node={tree} onOpen={openById} root />
                </Box>
              )}
            </Flex>
          )}
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}

function emptyDraft(unit_id: number): ItemDraft {
  return {
    name: '',
    unit_id,
    description: '',
    is_product: false,
    operation_type_id: null,
    workstation_id: null,
    output_quantity: '',
    inputs: [],
  };
}

function fromItem(item: ItemDto): ItemDraft {
  return {
    name: item.name,
    unit_id: item.unit_id,
    description: item.description ?? '',
    is_product: item.is_product,
    operation_type_id: item.operation_type_id,
    workstation_id: item.workstation_id,
    output_quantity: item.output_quantity?.toString() ?? '',
    inputs: item.inputs.map((x) => ({
      key: x.id,
      input_item_id: x.input_item_id,
      quantity: x.quantity,
    })),
  };
}

function canSave(d: ItemDraft) {
  return Boolean(
    d.name.trim() &&
    d.unit_id &&
    d.inputs.every((x) => x.input_item_id && Number(x.quantity) > 0) &&
    (!d.output_quantity || Number(d.output_quantity) >= 1),
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="form-field">
      <Text size="2">{label}</Text>
      <TextField.Root mt="2" value={value} onChange={(e) => onChange(e.target.value)} required />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: number; name: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="form-field">
      <Text size="2">{label}</Text>
      <Select.Root value={value} onValueChange={onChange}>
        <Select.Trigger className="catalog-select-trigger" mt="2" />
        <Select.Content position="popper">
          {options.map((x) => (
            <Select.Item key={x.id} value={String(x.id)}>
              {x.name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </label>
  );
}

function NullableSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number | null;
  options: { id: number; name: string }[];
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="form-field">
      <Text size="2">{label}</Text>
      <Select.Root
        value={value ? String(value) : 'none'}
        onValueChange={(v) => onChange(v === 'none' ? null : Number(v))}
      >
        <Select.Trigger className="catalog-select-trigger" mt="2" />
        <Select.Content position="popper">
          <Select.Item value="none">Не указано</Select.Item>
          {options.map((x) => (
            <Select.Item key={x.id} value={String(x.id)}>
              {x.name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </label>
  );
}
async function buildTree(
  item: ItemDto,
  visited = new Set<number>(),
  quantity: string | null = null,
): Promise<TreeNode> {
  if (visited.has(item.id)) return { item, quantity, repeated: true, children: [] };
  const next = new Set(visited);
  next.add(item.id);
  const children = await Promise.all(
    item.inputs.map(async (input) =>
      buildTree(await getCatalogItem('items', input.input_item_id), next, input.quantity),
    ),
  );
  return { item, quantity, repeated: false, children };
}
function Tree({
  node,
  onOpen,
  root = false,
}: {
  node: TreeNode;
  onOpen: (id: number) => void;
  root?: boolean;
}) {
  const details = [node.item.operation_type?.name, node.item.workstation?.name].filter(Boolean);

  return (
    <div className={`spec-tree-branch${root ? ' spec-tree-root' : ''}`}>
      <button type="button" className="spec-tree-row" onClick={() => onOpen(node.item.id)}>
        <span className="spec-tree-icon" aria-hidden="true">
          {node.repeated ? <RotateCcw size={16} /> : <Package size={16} />}
        </span>
        <span className="spec-tree-copy">
          <span className="spec-tree-title">
            <Text size="2" weight="medium">{node.item.name}</Text>
            {node.repeated && <Text size="1" className="spec-tree-badge">Повтор</Text>}
          </span>
          <Text as="span" size="1" color="gray" className="spec-tree-meta">
            {details.length ? details.join(' · ') : 'Операция и рабочий пост не указаны'}
          </Text>
        </span>
        <span className="spec-tree-quantity">
          <Text size="1" color="gray">{root ? 'Выпуск' : 'Количество'}</Text>
          <Text size="2" weight="medium">
            {root
              ? node.item.output_quantity
                ? `${node.item.output_quantity} ${node.item.unit.symbol}`
                : '—'
              : `${node.quantity} ${node.item.unit.symbol}`}
          </Text>
        </span>
        <ChevronRight className="spec-tree-open-icon" size={16} aria-hidden="true" />
      </button>
      {!!node.children.length && (
        <div className="spec-tree-children">
          {node.children.map((child, index) => (
            <Tree key={`${node.item.id}-${child.item.id}-${index}`} node={child} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}
