'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  Flex,
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
  getAllItems,
  itemAction,
  getCatalog,
  getCatalogItem,
  normalizeApiError,
  updateCatalogItem,
} from '@/lib/api';
import type {
  CycleConflictDetail,
  ItemDto,
  ItemRoute,
  ItemPayload,
  OperationTypeDto,
  UnitDto,
  WorkstationDto,
} from '@/types/api';

const pageSize = 20;
type ItemDraft = {
  name: string;
  unit_id: number;
  description: string;
  is_product: boolean;
  routes: ItemRoute[];
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
  const [, setCycleId] = useState<number | null>(null);
  const inputCandidates = useMemo(
    () => allItems.filter((item) => item.id !== editorItem?.id),
    [allItems, editorItem?.id],
  );
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listed, all, us, ops, posts] = await Promise.all([
        getCatalog('items', page, pageSize, false, onlyProducts),
        getAllItems(false),
        getCatalog('units', 1, 100),
        getCatalog('operation-types', 1, 100),
        getCatalog('workstations', 1, 100),
      ]);
      setItems(listed.items);
      setTotal(listed.total);
      setAllItems(all);
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
  async function runAction(action: 'copy' | 'variants' | 'make-main') {
    if (!editorItem) return;
    setSubmitting(true);
    setError(null);
    try {
      openItem(await itemAction(editorItem.id, action));
      await load();
    } catch (e) {
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
                  <Fragment key={item.id}>
                    <tr>
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
                    {!!item.variants.length && (
                      <tr>
                        <td colSpan={5}>
                          <details>
                            <summary style={{ cursor: 'pointer' }}>
                              Варианты ({item.variants.length})
                            </summary>
                            <table className="data-table" aria-label={`Варианты ${item.name}`}>
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
                                {item.variants.map((variant) => (
                                  <tr key={variant.id}>
                                    <td>{variant.name}</td>
                                    <td>{variant.unit.symbol}</td>
                                    <td>{variant.description || 'Описание не указано'}</td>
                                    <td>{variant.is_product ? 'Да' : 'Нет'}</td>
                                    <td>
                                      <Button
                                        size="2"
                                        variant="soft"
                                        onClick={() => openItem(variant)}
                                      >
                                        Открыть <ChevronRight size={15} />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </details>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
        <Dialog.Content maxWidth="1000px">
          <Dialog.Title>{editorItem ? 'Номенклатура' : 'Новая номенклатура'}</Dialog.Title>
          <ErrorNotice message={error} />
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
                    {editorItem && (
                      <>
                        <Button
                          variant="soft"
                          disabled={submitting}
                          onClick={() => runAction('copy')}
                        >
                          Скопировать
                        </Button>
                        <Button
                          variant="soft"
                          disabled={submitting}
                          onClick={() => runAction('variants')}
                        >
                          Создать вариант
                        </Button>
                      </>
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

              {editorItem &&
                (editorItem.is_main ? (
                  <Text size="2">✓ Главная номенклатура</Text>
                ) : (
                  <Button
                    variant="soft"
                    disabled={submitting}
                    onClick={() => runAction('make-main')}
                  >
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
                <Box className="surface specification-tree" p="4">
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
    routes: [],
  };
}

function fromItem(item: ItemDto): ItemDraft {
  return {
    name: item.name,
    unit_id: item.unit_id,
    description: item.description ?? '',
    is_product: item.is_product,
    routes: structuredClone(item.routes),
  };
}

function canSave(d: ItemDraft) {
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

async function buildTree(
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
function Tree({
  node,
  onOpen,
  root = false,
}: {
  node: TreeNode;
  onOpen: (id: number) => void;
  root?: boolean;
}) {
  return (
    <div className={`spec-tree-branch${root ? ' spec-tree-root' : ''}`}>
      <button type="button" className="spec-tree-row" onClick={() => onOpen(node.item.id)}>
        <span className="spec-tree-icon" aria-hidden="true">
          {node.repeated ? <RotateCcw size={16} /> : <Package size={16} />}
        </span>
        <span className="spec-tree-copy">
          <span className="spec-tree-title">
            <Text size="2" weight="medium">
              {node.item.name}
            </Text>
            {node.repeated && (
              <Text size="1" className="spec-tree-badge">
                Повтор
              </Text>
            )}
          </span>
        </span>
        <span className="spec-tree-quantity">
          <Text size="1" color="gray">
            {root ? 'Единица' : 'Количество'}
          </Text>
          <Text size="2" weight="medium">
            {root ? node.item.unit.symbol : `${node.quantity} ${node.item.unit.symbol}`}
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

function RoutesEditor({
  routes,
  onChange,
  items,
  operations,
  posts,
}: {
  routes: ItemRoute[];
  onChange: (routes: ItemRoute[]) => void;
  items: ItemDto[];
  operations: OperationTypeDto[];
  posts: WorkstationDto[];
}) {
  function edit(index: number, action: (route: ItemRoute) => void) {
    const next = structuredClone(routes);
    action(next[index]);
    onChange(next);
  }
  const newStep = () => ({
    operation_type_id: operations[0]?.id ?? 0,
    workstation_id: posts[0]?.id ?? 0,
    materials: [],
  });
  return (
    <Box className="surface" p="4">
      <Text weight="medium">Маршруты</Text>
      <Text as="p" size="2" color="gray" mt="2">
        Результат каждого шага целиком передаётся следующему. Первый шаг должен содержать материалы.
        Ссылка на результат маршрута означает ожидание его завершения перед началом этого маршрута.
      </Text>
      {routes.map((route, ri) => (
        <Box key={route.key} className="surface" p="3" mt="3">
          <Flex gap="3" align="end" wrap="wrap">
            <Field
              label="Название маршрута"
              value={route.name}
              onChange={(name) =>
                edit(ri, (r) => {
                  r.name = name;
                })
              }
            />
            <Field
              label="Количество результата"
              value={String(route.output_quantity)}
              onChange={(quantity) =>
                edit(ri, (r) => {
                  r.output_quantity = quantity;
                })
              }
            />
            <Button
              color="red"
              variant="soft"
              onClick={() => onChange(routes.filter((_, i) => i !== ri))}
            >
              Удалить маршрут
            </Button>
          </Flex>
          {route.steps.map((step, si) => (
            <Box key={si} p="3" mt="3" className="surface">
              <Flex justify="between" align="center" mb="3">
                <Text weight="medium">Шаг {si + 1}</Text>
                <Flex gap="2">
                  <Button
                    variant="soft"
                    disabled={!si}
                    onClick={() =>
                      edit(ri, (r) => {
                        [r.steps[si - 1], r.steps[si]] = [r.steps[si], r.steps[si - 1]];
                      })
                    }
                  >
                    Выше
                  </Button>
                  <Button
                    variant="soft"
                    disabled={si === route.steps.length - 1}
                    onClick={() =>
                      edit(ri, (r) => {
                        [r.steps[si + 1], r.steps[si]] = [r.steps[si], r.steps[si + 1]];
                      })
                    }
                  >
                    Ниже
                  </Button>
                  <Button
                    color="red"
                    variant="soft"
                    onClick={() =>
                      edit(ri, (r) => {
                        r.steps.splice(si, 1);
                      })
                    }
                  >
                    Удалить шаг
                  </Button>
                </Flex>
              </Flex>
              <Flex gap="3" wrap="wrap">
                <SelectField
                  label="Операция"
                  value={step.operation_type_id ? String(step.operation_type_id) : ''}
                  options={operations}
                  onChange={(value) =>
                    edit(ri, (r) => {
                      r.steps[si].operation_type_id = Number(value);
                    })
                  }
                />
                <SelectField
                  label="Рабочий пост"
                  value={step.workstation_id ? String(step.workstation_id) : ''}
                  options={posts}
                  onChange={(value) =>
                    edit(ri, (r) => {
                      r.steps[si].workstation_id = Number(value);
                    })
                  }
                />
              </Flex>
              <Text as="p" size="2" mt="3">
                Материалы{si === 0 ? ' (обязательны)' : ' + результат предыдущего шага'}
              </Text>
              {step.materials.map((material, mi) => (
                <Flex key={mi} gap="3" align="end" wrap="wrap" mt="2">
                  <label className="form-field">
                    <Text size="2">Источник материала</Text>
                    <Select.Root
                      value={
                        material.source_route_key
                          ? `route:${material.source_route_key}`
                          : material.input_item_id
                            ? `item:${material.input_item_id}`
                            : ''
                      }
                      onValueChange={(value) =>
                        edit(ri, (r) => {
                          r.steps[si].materials[mi] = {
                            ...material,
                            input_item_id: value.startsWith('item:')
                              ? Number(value.slice(5))
                              : null,
                            source_route_key: value.startsWith('route:') ? value.slice(6) : null,
                          };
                        })
                      }
                    >
                      <Select.Trigger mt="2" placeholder="Выберите источник" />
                      <Select.Content>
                        <Select.Group>
                          <Select.Label>Номенклатура</Select.Label>
                          {items.map((item) => (
                            <Select.Item key={item.id} value={`item:${item.id}`}>
                              {item.name}
                            </Select.Item>
                          ))}
                        </Select.Group>
                        <Select.Group>
                          <Select.Label>Результат маршрута</Select.Label>
                          {routes
                            .filter((r) => r.key !== route.key)
                            .map((r) => (
                              <Select.Item key={r.key} value={`route:${r.key}`}>
                                {r.name || 'Без названия'}
                              </Select.Item>
                            ))}
                        </Select.Group>
                      </Select.Content>
                    </Select.Root>
                  </label>
                  <Field
                    label="Количество"
                    value={String(material.quantity)}
                    onChange={(quantity) =>
                      edit(ri, (r) => {
                        r.steps[si].materials[mi].quantity = quantity;
                      })
                    }
                  />
                  <Button
                    color="red"
                    variant="soft"
                    onClick={() =>
                      edit(ri, (r) => {
                        r.steps[si].materials.splice(mi, 1);
                      })
                    }
                  >
                    <Trash2 size={15} />
                    Удалить
                  </Button>
                </Flex>
              ))}
              <Button
                mt="3"
                variant="soft"
                onClick={() =>
                  edit(ri, (r) => {
                    r.steps[si].materials.push({
                      input_item_id: items[0]?.id ?? null,
                      source_route_key: null,
                      quantity: '1',
                    });
                  })
                }
              >
                Добавить материал
              </Button>
            </Box>
          ))}
          <Button
            mt="3"
            variant="soft"
            onClick={() =>
              edit(ri, (r) => {
                r.steps.push(newStep());
              })
            }
          >
            Добавить шаг
          </Button>
        </Box>
      ))}
      <Button
        mt="3"
        variant="soft"
        onClick={() =>
          onChange([
            ...routes,
            {
              key: crypto.randomUUID(),
              name: `Маршрут ${routes.length + 1}`,
              output_quantity: '1',
              steps: [newStep()],
            },
          ])
        }
      >
        <Plus size={15} />
        Добавить маршрут
      </Button>
    </Box>
  );
}
