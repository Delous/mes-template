"""Set TASK_TEST_DATABASE_URL to PostgreSQL to include database tests."""
import asyncio
import importlib
import os
import unittest
from datetime import date
from uuid import uuid4

import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

# Model imports initialize app settings; these defaults do not open a connection.
for key, value in dict(DB_HOST='localhost', DB_NAME='unused', DB_USER='unused',
                       DB_PASSWORD='unused', JWT_SECRET_KEY='test-only').items():
    os.environ.setdefault(key, value)

from app.core.schema import UserPublic
from app.db import models
from app.orders.schema import CreateOrderRequest, OrderDetailResponse, UpdateOrderRequest
from app.orders.service import create_order, update_order
from app.tasks.schema import TaskResponse
from app.tasks.service import get_task_by_id, task_list

DATABASE_URL = os.getenv('TASK_TEST_DATABASE_URL')


class OrderValidationTests(unittest.TestCase):
    def test_defaults_and_date_without_time(self):
        default = CreateOrderRequest(number='A', lines=[dict(item_id=1, quantity='1')])
        self.assertEqual(default.priority, 'medium')
        self.assertIsNone(default.deadline)
        payload = UpdateOrderRequest(deadline='2026-11-04', priority='high')
        self.assertEqual(payload.deadline, date(2026, 11, 4))
        self.assertEqual(payload.model_dump(mode='json')['deadline'], '2026-11-04')
        self.assertEqual(UpdateOrderRequest(deadline=None).model_dump(exclude_unset=True), {'deadline': None})

    def test_invalid_values(self):
        for payload in [{}, {'priority': None}, {'priority': 'low'}, {'deadline': '2026-02-30'},
                        {'deadline': '2026-11-04T12:30:00'}, {'deadline_days': 3}]:
            with self.subTest(payload=payload), self.assertRaises(ValidationError):
                UpdateOrderRequest(**payload)


@unittest.skipUnless(DATABASE_URL, 'Set TASK_TEST_DATABASE_URL to run PostgreSQL tests')
class OrderDatabaseTests(unittest.TestCase):
    def setUp(self):
        self.engine = sa.create_engine(DATABASE_URL)
        self.schema = 'order_test_' + uuid4().hex
        with self.engine.begin() as connection:
            connection.execute(sa.text(f'CREATE SCHEMA {self.schema}'))
            connection.execute(sa.text(f'SET LOCAL search_path TO {self.schema}'))
            with Operations.context(MigrationContext.configure(connection)):
                for name in ['20261014_1250_initial_migration', '20261022_1200_remove_task_logistics_fields',
                             '20261028_1200_tasks_per_item']:
                    importlib.import_module('app.db.migrations.versions.' + name).upgrade()
                connection.execute(sa.text("INSERT INTO orders (number, status) VALUES ('Existing', 'created')"))
                importlib.import_module('app.db.migrations.versions.20261028_1400_order_priority_deadline').upgrade()

    def tearDown(self):
        with self.engine.begin() as connection:
            connection.execute(sa.text(f'DROP SCHEMA {self.schema} CASCADE'))
        self.engine.dispose()

    def test_existing_orders_and_database_constraints(self):
        with self.engine.begin() as connection:
            connection.execute(sa.text(f'SET LOCAL search_path TO {self.schema}'))
            self.assertEqual(connection.execute(sa.text('SELECT priority, deadline FROM orders')).one(), ('medium', None))
            for priority in ['low', None]:
                with self.subTest(priority=priority), self.assertRaises(sa.exc.IntegrityError):
                    with connection.begin_nested():
                        connection.execute(sa.text('UPDATE orders SET priority = :priority'), {'priority': priority})

    def test_create_edit_task_sorting_and_pagination(self):
        async def run():
            url = sa.engine.make_url(DATABASE_URL).set(drivername='postgresql+asyncpg')
            engine = create_async_engine(url, connect_args={'server_settings': {'search_path': self.schema}})
            sessions = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)
            admin = UserPublic(id=1, username='admin', full_name='Admin', role='admin', workstation_ids=[])
            try:
                async with sessions() as session:
                    unit = models.Unit(name='Pieces', symbol='pcs')
                    operation = models.OperationType(name='Cut')
                    post = models.Workstation(name='Post')
                    session.add_all([unit, operation, post])
                    await session.flush()
                    raw = models.Item(name='Raw', unit_id=unit.id, routes=[])
                    session.add(raw)
                    await session.flush()
                    product = models.Item(name='Product', unit_id=unit.id, routes=[dict(key='r', name='Route', output_quantity='1', steps=[
                        dict(operation_type_id=operation.id, workstation_id=post.id,
                             materials=[dict(input_item_id=raw.id, source_route_key=None, quantity='1')])])])
                    session.add(product)
                    await session.flush()
                    orders = {}
                    for number, priority, deadline in [
                        ('No date medium', 'medium', None), ('Same medium', 'medium', '2026-11-02'),
                        ('Later high', 'high', '2026-11-05'), ('Same high', 'high', '2026-11-02'),
                        ('Early medium', 'medium', '2026-10-20'), ('No date high', 'high', None),
                    ]:
                        order = await create_order(session, CreateOrderRequest(number=number, priority=priority,
                            deadline=deadline, lines=[dict(item_id=product.id, quantity='2')]))
                        orders[number] = order
                        response = OrderDetailResponse.model_validate(order).model_dump(mode='json')
                        self.assertEqual(response['deadline'], deadline)
                        self.assertEqual(response['tasks'][0]['order']['priority'], priority)
                        self.assertEqual(response['tasks'][0]['order']['deadline'], deadline)
                    # An in-progress task must not bypass an earlier deadline or higher priority.
                    orders['Same medium'].tasks[0].status = 'in_progress'
                    await session.flush()
                    expected = ['Early medium', 'Same high', 'Same medium', 'Later high', 'No date high', 'No date medium']
                    actual = []
                    for page in [1, 2, 3]:
                        result = await task_list(session, admin, page, 2)
                        self.assertEqual(result['total'], 6)
                        actual.extend(task.order.number for task in result['items'])
                    self.assertEqual(actual, expected)
                    edited = await update_order(session, orders['Later high'].id, UpdateOrderRequest(deadline='2026-10-19'))
                    self.assertEqual(edited.priority, 'high')
                    self.assertEqual(OrderDetailResponse.model_validate(edited).tasks[0].order.deadline, date(2026, 10, 19))
                    self.assertEqual((await task_list(session, admin, 1, 1))['items'][0].order_id, edited.id)
                    task_id = edited.tasks[0].id
                    order_id = edited.id
                    await session.commit()
                async with sessions() as session:
                    task = TaskResponse.model_validate(await get_task_by_id(session, task_id, admin))
                    self.assertEqual(task.order.deadline, date(2026, 10, 19))
                    cleared = await update_order(session, order_id, UpdateOrderRequest(deadline=None, priority='medium'))
                    self.assertIsNone(OrderDetailResponse.model_validate(cleared).tasks[0].order.deadline)
                    self.assertEqual((await task_list(session, admin, 1, 1))['items'][0].order.number, 'Early medium')
                    with self.assertRaises(HTTPException) as error:
                        await update_order(session, 999999, UpdateOrderRequest(priority='high'))
                    self.assertEqual(error.exception.status_code, 404)
            finally:
                await engine.dispose()
        asyncio.run(run())
