'use client';

import { buildTree } from './load-tree';
import { toItemPayload } from './model';

import {
  createCatalogItem,
  getAllItems,
  getCatalog,
  getCatalogItem,
  itemAction,
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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ItemDraft, TreeNode, emptyDraft, fromItem, pageSize } from './model';

export function useItemsPage() {
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
    const payload: ItemPayload = toItemPayload(draft);
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

  return {
    items,
    units,
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
    page,
    setPage,
    total,
    onlyProducts,
    setOnlyProducts,
    loading,
    submitting,
    error,
    inputCandidates,
    openNew,
    openItem,
    openById,
    save,
    runAction,
    showTree,
  };
}
export type PageModel = ReturnType<typeof useItemsPage>;
