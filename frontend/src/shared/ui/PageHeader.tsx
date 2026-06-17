import { Flex, Heading, Text } from "@radix-ui/themes";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Flex align={{ initial: "start", sm: "center" }} justify="between" gap="4" mb="5" direction={{ initial: "column", sm: "row" }}>
      <div>
        <Heading size="7">{title}</Heading>
        {description ? (
          <Text as="p" color="gray" size="2" mt="1">
            {description}
          </Text>
        ) : null}
      </div>
      {action}
    </Flex>
  );
}
