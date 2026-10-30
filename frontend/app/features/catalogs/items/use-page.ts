'use client';
import { useListQuery } from '@/lib/use-list-query';

import { buildTree } from './load-tree';
import { toItemPayload } from './model';

import {
  createCatalogItem,
  getAllItems,
  getAllCatalog,
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const { query, setQuery, page, setPage } = useListQuery('name_asc');
  const requestVersion = useRef(0);
  const invalidateRequests = useCallback(() => {
    requestVersion.current++;
  }, []);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setCycleId] = useState<number | null>(null);
  const inputCandidates = useMemo(
    () => allItems.filter((item) => item.id !== editorItem?.id),
    [allItems, editorItem?.id],
  );
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const listed = await getCatalog('items', page, pageSize, false, false, true, query);
      if (version !== requestVersion.current) return;
      if (page > 1 && !listed.items.length) {
        setPage(Math.max(1, Math.ceil(listed.total / pageSize)));
        return;
      }
      setItems(listed.items);
      setTotal(listed.total);
    } catch (e) {
      if (version === requestVersion.current) setError(normalizeApiError(e));
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [page, query, setPage]);
  const loadReferences = useCallback(async () => {
    try {
      const [all, us, ops, posts] = await Promise.all([
        getAllItems(false),
        getAllCatalog('units'),
        getAllCatalog('operation-types'),
        getAllCatalog('workstations'),
      ]);
      setAllItems(all);
      setUnits(us);
      setOperationTypes(ops);
      setWorkstations(posts);
    } catch (e) {
      setError(normalizeApiError(e));
    }
  }, []);
  useEffect(() => {
    void loadReferences();
  }, [loadReferences]);
  const reload = useRef(load);
  useEffect(() => {
    reload.current = load;
  }, [load]);
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      void load();
    }, 250);
    return () => {
      clearTimeout(timer);
      invalidateRequests();
    };
  }, [load, invalidateRequests]);
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
      await Promise.all([reload.current(), loadReferences()]);
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
      await Promise.all([reload.current(), loadReferences()]);
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
    query,
    setQuery,
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
