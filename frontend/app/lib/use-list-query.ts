'use client';

import { useCallback, useState } from 'react';
import { defaultListQuery, type ListQuery } from './list-query';

export function useListQuery(defaultSort: string) {
  const [state, setState] = useState(() => ({ query: defaultListQuery(defaultSort), page: 1 }));
  const setPage = useCallback((page: number) => setState((current) => ({ ...current, page })), []);
  const setQuery = useCallback((query: ListQuery) => setState({ query, page: 1 }), []);
  return {
    ...state,
    setPage,
    setQuery,
  };
}
