"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Box, Button, Flex, Heading, IconButton } from "@radix-ui/themes";
import { LogOut, X } from "lucide-react";

import { logoutAction } from "@/features/auth/actions";
import { labels } from "@/shared/i18n/labels";

import { NavigationList } from "./AppShell";

export function MobileNavigationDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="mobile-drawer-overlay" />
        <Dialog.Content className="mobile-drawer-content" aria-describedby={undefined}>
          <Flex direction="column" gap="5">
            <Flex align="center" justify="between">
              <Dialog.Title asChild>
                <Heading size="4">{labels.app.name}</Heading>
              </Dialog.Title>
              <Dialog.Close asChild>
                <IconButton variant="ghost" color="gray" aria-label="Закрыть меню">
                  <X size={18} />
                </IconButton>
              </Dialog.Close>
            </Flex>
            <Box>
              <NavigationList onNavigate={() => onOpenChange(false)} />
            </Box>
            <form action={logoutAction} className="logout-form">
              <Button type="submit" variant="soft" color="gray" className="logout-button">
                <LogOut size={16} />
                {labels.auth.signedOut}
              </Button>
            </form>
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
