export type ListQuery = {
  search: string;
  sort: string;
  status: string;
  task_type: string;
  is_product: string;
  unit_id: string;
};

export function defaultListQuery(sort: string): ListQuery {
  return { search: '', sort, status: 'all', task_type: 'all', is_product: 'all', unit_id: 'all' };
}

export function listQueryParams(query: ListQuery) {
  return Object.fromEntries(
    Object.entries({ ...query, search: query.search.trim() }).filter(
      ([, value]) => value !== 'all' && value !== '',
    ),
  );
}
