import type { ListQuery } from '../../lib/list-query';
import type { TaskDto } from '../../types/api';

const statuses = ['in_progress', 'waiting', 'to_do', 'blocked', 'done', 'cancelled'];
const priorities = { high: 0, medium: 1 };
const compareText = (a: string, b: string) =>
  a.toLocaleLowerCase('ru').localeCompare(b.toLocaleLowerCase('ru'), 'ru');

export function filterTasks<T extends TaskDto>(tasks: T[], query: ListQuery): T[] {
  const search = query.search.trim().toLocaleLowerCase('ru');
  return tasks
    .filter(
      (task) =>
        (query.status === 'all' || task.status === query.status) &&
        (query.task_type === 'all' || task.task_type === query.task_type) &&
        [task.id, task.name, task.item.name, task.description, task.order.number].some((value) =>
          String(value ?? '')
            .toLocaleLowerCase('ru')
            .includes(search),
        ),
    )
    .sort((a, b) => {
      let result = 0;
      if (query.sort === 'id_desc') return b.id - a.id;
      if (query.sort === 'name_asc') result = compareText(a.name, b.name);
      if (query.sort === 'name_desc') result = compareText(b.name, a.name);
      if (query.sort === 'status') result = statuses.indexOf(a.status) - statuses.indexOf(b.status);
      if (query.sort === 'planning') {
        result =
          (a.order.deadline ?? '9999').localeCompare(b.order.deadline ?? '9999') ||
          (a.order.priority ? priorities[a.order.priority] : 2) -
            (b.order.priority ? priorities[b.order.priority] : 2) ||
          statuses.indexOf(a.status) - statuses.indexOf(b.status) ||
          Date.parse(a.created_at) - Date.parse(b.created_at);
      }
      return result || a.id - b.id;
    });
}
