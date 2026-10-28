'use client';

import type { TaskDto } from '@/types/api';
import { formatQuantity } from '@/lib/format';
import { Box, Button, Card, Dialog, Flex, Heading, Table, Text } from '@radix-ui/themes';
import { Route } from 'lucide-react';

export function TaskRouteDialog({ task }: { task: TaskDto }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button variant="soft">
          <Route size={16} /> Показать маршрут
        </Button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="850px">
        <Dialog.Title>Маршрут: {task.name || task.item.name}</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          {task.description} · План: {formatQuantity(task.planned_quantity)}. Количества материалов
          рассчитаны на весь план задачи.
        </Dialog.Description>
        <Flex direction="column" gap="4">
          {task.routes.length === 0 ? <Text color="gray">Маршруты не заданы.</Text> : null}
          {task.routes.map((route) => (
            <Card key={route.key}>
              <Heading size="4" mb="1">
                {route.name}
              </Heading>
              <Text size="2" color="gray">
                План выпуска: {formatQuantity(route.planned_quantity)}
              </Text>
              {route.steps.map((step, index) => (
                <Box key={index} mt="4">
                  <Heading size="3">
                    {index + 1}. {step.operation}
                  </Heading>
                  <Text as="div" size="2" color="gray" mb="2">
                    Рабочий пост: {step.workstation}
                  </Text>
                  {step.materials.length ? (
                    <Table.Root>
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeaderCell>
                            Материал / результат маршрута
                          </Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell align="right">Количество</Table.ColumnHeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {step.materials.map((material, materialIndex) => (
                          <Table.Row key={materialIndex}>
                            <Table.Cell>
                              {material.name}
                              {material.source_route_key ? ' (результат маршрута)' : ''}
                            </Table.Cell>
                            <Table.Cell align="right">
                              {formatQuantity(material.quantity)} {material.unit}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  ) : (
                    <Text size="2" color="gray">
                      Дополнительные материалы не требуются.
                    </Text>
                  )}
                </Box>
              ))}
            </Card>
          ))}
        </Flex>
        <Flex justify="end" mt="4">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Закрыть
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
