"""Collapse route steps into one task per order and manufactured item.

Revision ID: 20261028_1200
Revises: 20261022_1200
"""
from collections import defaultdict
from decimal import Decimal

from alembic import op
import sqlalchemy as sa

from app.tasks.planning import plan_order, route_plan, snapshot_routes

revision = '20261028_1200'
down_revision = '20261022_1200'
branch_labels = None
depends_on = None

# Waiting is least advanced; blocked work has started but is not complete.
STATUS_RANK = {status: rank for rank, status in enumerate(
    ['waiting', 'to_do', 'blocked', 'in_progress', 'done', 'cancelled'])}


def upgrade():
    op.add_column('tasks', sa.Column('routes', sa.JSON(), nullable=False, server_default='[]'))
    connection = op.get_bind()
    metadata = sa.MetaData()
    tables = {name: sa.Table(name, metadata, autoload_with=connection) for name in
              ['tasks', 'task_dependencies', 'task_history', 'items', 'orders',
               'order_lines', 'operation_types', 'workstations', 'units']}
    tasks, links, history = (tables[name] for name in ['tasks', 'task_dependencies', 'task_history'])
    items = {row['id']: dict(row) for row in connection.execute(sa.select(tables['items'])).mappings()}
    names = {}
    for table, field in [('operation_types', 'name'), ('workstations', 'name'), ('units', 'symbol')]:
        names[table] = dict(connection.execute(sa.select(tables[table].c.id, tables[table].c[field])).all())
    for order in connection.execute(sa.select(tables['orders'])).mappings().all():
        old = connection.execute(sa.select(tasks).where(tasks.c.order_id == order['id'])).mappings().all()
        if not old:
            continue
        lines = connection.execute(sa.select(tables['order_lines']).where(
            tables['order_lines'].c.order_id == order['id'])).mappings().all()
        plans = plan_order(items, lines)
        groups = defaultdict(list)
        for task in old:
            groups[task['item_id']].append(task)
        mapping = {}
        for item_id, group in groups.items():
            keeper = min(group, key=lambda task: task['id'])
            least = min(group, key=lambda task: (STATUS_RANK[task['status']], task['id']))
            mapping.update({task['id']: keeper['id'] for task in group})
            plan = plans.get(item_id)
            if plan is None:
                # Preserve historical items even if their composition has since changed.
                quantity = max(task['planned_quantity'] for task in group)
                plan = dict(quantity=quantity, routes=route_plan(items[item_id]['routes'], quantity))
            routes = snapshot_routes(plan, items, names['operation_types'], names['workstations'], names['units'])
            operations = [task for task in group if task['task_type'] == 'operation'] or group
            connection.execute(tasks.update().where(tasks.c.id == keeper['id']).values(
                task_type='operation', description=order['number'], status=least['status'],
                planned_quantity=plan['quantity'],
                # Step output is not additive: retain the least completed output per line.
                actual_quantity=sum(min(t['actual_quantity'] for t in operations if t['order_line_id'] == line_id)
                                    for line_id in {t['order_line_id'] for t in operations}),
                defect_quantity=sum((t['defect_quantity'] for t in group), Decimal('0')),
                executor_id=least['executor_id'] if least['status'] in {'in_progress', 'done', 'cancelled'} else None,
                workstation_id=routes[0]['steps'][0]['workstation_id'] if routes else least['workstation_id'],
                routes=routes,
            ))
        ids = list(mapping)
        old_links = connection.execute(sa.select(links).where(
            sa.or_(links.c.task_id.in_(ids), links.c.depends_on_task_id.in_(ids)))).all()
        connection.execute(links.delete().where(
            sa.or_(links.c.task_id.in_(ids), links.c.depends_on_task_id.in_(ids))))
        new_links = {(mapping.get(a, a), mapping.get(b, b)) for a, b in old_links}
        for task_id, dependency_id in sorted(new_links):
            if task_id != dependency_id:
                connection.execute(links.insert().values(task_id=task_id, depends_on_task_id=dependency_id))
        for old_id, new_id in mapping.items():
            if old_id != new_id:
                connection.execute(history.update().where(history.c.task_id == old_id).values(task_id=new_id))
        connection.execute(tasks.delete().where(tasks.c.id.in_([i for i, k in mapping.items() if i != k])))
    # Internal step dependencies have disappeared. Make waiting items without
    # unfinished external prerequisites available, otherwise they can never start.
    prerequisite = tasks.alias('prerequisite')
    unfinished = sa.exists(sa.select(1).select_from(links.join(
        prerequisite, prerequisite.c.id == links.c.depends_on_task_id)).where(
            links.c.task_id == tasks.c.id, prerequisite.c.status != 'done'))
    connection.execute(tasks.update().where(tasks.c.status == 'waiting', ~unfinished).values(status='to_do'))
    op.create_unique_constraint('uq_tasks_order_item', 'tasks', ['order_id', 'item_id'])
    op.alter_column('tasks', 'routes', server_default=None)


def downgrade():
    raise RuntimeError('Task consolidation cannot be reversed without a database backup')
