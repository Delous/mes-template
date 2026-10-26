'use client';

import { Checkbox, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { useId, type ComponentProps, type ReactNode } from 'react';

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Flex asChild direction="column" gap="2" minWidth="0" flexGrow="1">
      <label>
        <Text size="2">{label}</Text>
        {children}
      </label>
    </Flex>
  );
}

export function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField label={label}>
      <TextField.Root value={value} onChange={(event) => onChange(event.target.value)} />
    </FormField>
  );
}

type SelectFieldProps = Omit<ComponentProps<typeof Select.Root>, 'children' | 'onChange'> & {
  label: string;
  options: { id: number | string; name: string }[];
  onChange?: (value: string) => void;
  placeholder?: string;
};

export function SelectField({ label, options, onChange, placeholder, ...props }: SelectFieldProps) {
  const id = useId();
  return (
    <Flex direction="column" gap="2" minWidth="0" flexGrow="1">
      <Text as="label" size="2" htmlFor={id}>
        {label}
      </Text>
      <Select.Root {...props} onValueChange={onChange ?? props.onValueChange}>
        <Select.Trigger id={id} placeholder={placeholder} />
        <Select.Content position="popper">
          {options.map((option) => (
            <Select.Item key={option.id} value={String(option.id)}>
              {option.name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}

export function CheckboxField({
  children,
  ...props
}: ComponentProps<typeof Checkbox> & { children: ReactNode }) {
  return (
    <Text as="label" size="2">
      <Flex as="span" align="center" gap="2">
        <Checkbox {...props} />
        {children}
      </Flex>
    </Text>
  );
}
