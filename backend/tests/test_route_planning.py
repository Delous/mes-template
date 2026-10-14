"""Exercise route planning without a database; run with unittest discovery."""
import ast
import unittest
from decimal import Decimal
from pathlib import Path
from types import SimpleNamespace as NS

ROOT = Path(__file__).resolve().parents[1] / "app"


def load_function(path, name, namespace):
    tree = ast.parse((ROOT / path).read_text())
    node = next(node for node in tree.body if getattr(node, "name", None) == name)
    exec(compile(ast.Module(body=[node], type_ignores=[]), str(path), "exec"), namespace)
    return namespace[name]


class Task:
    def __init__(self, **fields):
        self.__dict__.update(fields)


class Session:
    def __init__(self):
        self.tasks = []
        self.dependencies = []

    def add(self, task):
        task.id = len(self.tasks) + 1
        self.tasks.append(task)

    async def flush(self):
        pass

    async def get(self, model, identifier):
        return NS(name=f"Operation {identifier}")


def material(item=None, route=None, quantity="1"):
    return dict(input_item_id=item, source_route_key=route, quantity=quantity)


def route(key, steps, output="1"):
    return dict(key=key, name=key, output_quantity=output, steps=steps)


def step(materials, post=1):
    return dict(operation_type_id=1, workstation_id=post, materials=materials)


class RoutePlanningTests(unittest.IsolatedAsyncioTestCase):
    async def plan(self, routes):
        session = Session()

        async def dependency(session, task, upstream):
            session.dependencies.append((task.id, upstream.id))

        async def raw_material(*args):
            return None, None

        namespace = dict(Decimal=Decimal, Task=Task, OperationType=object, HTTPException=RuntimeError,
                         add_dependency=dependency, create_tasks_for_item=raw_material)
        planner = load_function(Path("orders/service.py"), "create_tasks_for_routes", namespace)
        result = await planner(session, NS(id=1), NS(id=1), NS(id=1, name="Product", routes=routes), Decimal("2"), {1})
        return session, result

    async def test_previous_step_and_route_gate(self):
        session, _ = await self.plan([
            route("upstream", [step([material(item=2)])]),
            route("final", [step([material(item=3)]), step([material(route="upstream")], post=2)]),
        ])
        operations = [t for t in session.tasks if t.task_type == "operation"]
        upstream, first, second = operations
        self.assertIn((first.id, upstream.id), session.dependencies)
        transfer = next(t for t in session.tasks if t.task_type == "transfer" and (t.id, first.id) in session.dependencies)
        self.assertIn((second.id, transfer.id), session.dependencies)
        self.assertEqual(first.planned_quantity, second.planned_quantity)

    async def test_shared_route_is_built_once_with_total_demand(self):
        session, terminal = await self.plan([
            route("shared", [step([material(item=2)])]),
            route("a", [step([material(route="shared", quantity="3")])]),
            route("b", [step([material(route="shared", quantity="4")])]),
        ])
        shared = [t for t in session.tasks if t.description.startswith("shared: шаг")]
        self.assertEqual(len(shared), 1)
        self.assertEqual(shared[0].planned_quantity, Decimal("14"))
        self.assertEqual(terminal[1], None)
        self.assertEqual(len([d for d in session.dependencies if d[0] == terminal[0].id]), 2)

    async def test_later_steps_can_have_no_materials(self):
        session, _ = await self.plan([route("a", [step([material(item=2)]), step([])])])
        operations = [t for t in session.tasks if t.task_type == "operation"]
        self.assertIn((operations[1].id, operations[0].id), session.dependencies)


class RouteGraphTests(unittest.TestCase):
    def test_invalid_graphs(self):
        validate = load_function(Path("catalogs/item/schema.py"), "validate_routes", {})
        def node(key, source):
            return NS(key=key, steps=[NS(materials=[NS(source_route_key=source)])])
        for nodes in ([node("a", "a")], [node("a", "b"), node("b", "a")], [node("a", "missing")], [node("a", None), node("a", None)]):
            with self.subTest(nodes=nodes), self.assertRaises(ValueError):
                validate(nodes)
        self.assertEqual(len(validate([node("a", None), node("b", "a")])), 2)


if __name__ == "__main__":
    unittest.main()
