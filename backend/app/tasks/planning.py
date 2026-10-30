"""Plan manufacturing quantities and route steps, sharing demand across an order."""
from collections import defaultdict
from decimal import Decimal, ROUND_CEILING


def rounded(value):
    return Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_CEILING)


def dependency_order(graph):
    visiting, visited, result = set(), set(), []

    def visit(key):
        if key in visiting:
            raise ValueError('Циклическая зависимость состава или маршрутов')
        if key not in graph:
            raise ValueError('Не найдена номенклатура или маршрут')
        if key in visited:
            return
        visiting.add(key)
        for child in sorted(graph[key]):
            visit(child)
        visiting.remove(key)
        visited.add(key)
        result.append(key)

    for key in graph:
        visit(key)
    return result


def route_plan(routes, quantity):
    by_key = {route['key']: route for route in routes}
    if len(by_key) != len(routes):
        raise ValueError('Ключи маршрутов должны быть уникальны')
    graph = {key: {m['source_route_key'] for step in route['steps']
                  for m in step['materials'] if m.get('source_route_key')}
             for key, route in by_key.items()}
    sequence = dependency_order(graph)
    referenced = {child for children in graph.values() for child in children}
    amounts = defaultdict(Decimal)
    for key in graph.keys() - referenced:
        amounts[key] = rounded(quantity)
    for key in reversed(sequence):
        amounts[key] = rounded(amounts[key])
        route = by_key[key]
        if not route['steps'] or Decimal(str(route['output_quantity'])) <= 0:
            raise ValueError('Маршрут должен содержать шаги и положительный выход')
        multiplier = amounts[key] / Decimal(str(route['output_quantity']))
        for step in route['steps']:
            for material in step['materials']:
                if material.get('source_route_key'):
                    amounts[material['source_route_key']] += rounded(Decimal(str(material['quantity'])) * multiplier)
    return [(by_key[key], amounts[key]) for key in sequence]


def plan_order(items, lines):
    """Items and lines are plain mappings so migrations can use the same planner."""
    graph = {}

    def collect(item_id):
        if item_id in graph:
            return
        if item_id not in items:
            raise ValueError(f'Номенклатура не найдена: {item_id}')
        graph[item_id] = {m['input_item_id'] for r in items[item_id]['routes']
                          for step in r['steps'] for m in step['materials']
                          if m.get('input_item_id')}
        for child in graph[item_id]:
            collect(child)

    for line in lines:
        collect(line['item_id'])
    sequence = dependency_order(graph)
    quantities, owners, plans = defaultdict(Decimal), {}, {}
    for line in lines:
        quantities[line['item_id']] += Decimal(str(line['quantity']))
        owners.setdefault(line['item_id'], line['id'])
    for item_id in reversed(sequence):
        quantity = rounded(quantities[item_id])
        routes = route_plan(items[item_id]['routes'], quantity)
        if routes:
            plans[item_id] = dict(quantity=quantity, line_id=owners[item_id], routes=routes,
                                  dependencies={i for i in graph[item_id] if items[i]['routes']})
        for route, amount in routes:
            multiplier = amount / Decimal(str(route['output_quantity']))
            for step in route['steps']:
                for material in step['materials']:
                    child = material.get('input_item_id')
                    if child:
                        quantities[child] += rounded(Decimal(str(material['quantity'])) * multiplier)
                        owners.setdefault(child, owners[item_id])
    return plans


def snapshot_routes(plan, items, operations, workstations, units):
    routes = []
    names = {route['key']: route['name'] for route, _ in plan['routes']}
    for route, quantity in plan['routes']:
        multiplier = quantity / Decimal(str(route['output_quantity']))
        steps = []
        for step in route['steps']:
            materials = []
            for material in step['materials']:
                item = items.get(material.get('input_item_id'))
                materials.append({**material,
                    'name': item['name'] if item else names[material['source_route_key']],
                    'unit': units.get(item['unit_id'], '') if item else '',
                    'quantity': str(rounded(Decimal(str(material['quantity'])) * multiplier))})
            steps.append({**step, 'materials': materials,
                'operation': operations.get(step['operation_type_id'], 'Не указана'),
                'workstation': workstations.get(step['workstation_id'], 'Не указан')})
        routes.append(dict(key=route['key'], name=route['name'],
                           planned_quantity=str(quantity), steps=steps))
    return routes


def plan_step_tasks(snapshots):
    """Key tasks by (item, route, step); link only the steps needing each input."""
    terminal_steps = {}
    for item_id, routes in snapshots.items():
        referenced = {m['source_route_key'] for route in routes for step in route['steps']
                      for m in step['materials'] if m.get('source_route_key')}
        terminal_steps[item_id] = {
            (item_id, route['key'], len(route['steps']))
            for route in routes if route['key'] not in referenced
        }

    tasks = {}
    for item_id, routes in snapshots.items():
        by_key = {route['key']: route for route in routes}
        for route in routes:
            for number, step in enumerate(route['steps'], start=1):
                dependencies = set()
                if number > 1:
                    dependencies.add((item_id, route['key'], number - 1))
                for material in step['materials']:
                    source = material.get('source_route_key')
                    if source:
                        dependencies.add((item_id, source, len(by_key[source]['steps'])))
                    else:
                        dependencies.update(terminal_steps.get(material.get('input_item_id'), set()))
                tasks[item_id, route['key'], number] = dict(
                    planned_quantity=Decimal(route['planned_quantity']),
                    workstation_id=step['workstation_id'], dependencies=dependencies)
    return tasks
