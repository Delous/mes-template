'use client';

import { Badge, Box, Card, Flex, Text } from '@radix-ui/themes';
import { ChevronRight, Package, RotateCcw } from 'lucide-react';
import type { TreeNode } from './model';
function flatten(node: TreeNode, depth = 0): { node: TreeNode; depth: number }[] {
  return [{ node, depth }, ...node.children.flatMap((child) => flatten(child, depth + 1))];
}
export function Tree({
  node,
  onOpen,
}: {
  node: TreeNode;
  onOpen: (id: number) => void;
  root?: boolean;
}) {
  return (
    <Flex direction="column" gap="2">
      {flatten(node).map(({ node: entry, depth }, index) => (
        <Box key={index} pl={String(Math.min(depth * 4, 64)) + 'px'}>
          <Card asChild>
            <button type="button" onClick={() => onOpen(entry.item.id)}>
              <Flex align="center" gap="3">
                {entry.repeated ? <RotateCcw size={16} /> : <Package size={16} />}
                <Flex flexGrow="1" gap="2" align="center">
                  <Text size="2" weight="medium">
                    {entry.item.name}
                  </Text>
                  {entry.repeated && <Badge color="orange">Повтор</Badge>}
                </Flex>
                <Flex direction="column" align="end">
                  <Text size="1" color="gray">
                    {depth === 0 ? 'Единица' : 'Количество'}
                  </Text>
                  <Text size="2" weight="medium">
                    {depth === 0
                      ? entry.item.unit.symbol
                      : entry.quantity + ' ' + entry.item.unit.symbol}
                  </Text>
                </Flex>
                <ChevronRight size={16} />
              </Flex>
            </button>
          </Card>
        </Box>
      ))}
    </Flex>
  );
}
