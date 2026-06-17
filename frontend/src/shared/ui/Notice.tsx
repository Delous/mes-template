import { Callout } from "@radix-ui/themes";
import { AlertTriangle, Info } from "lucide-react";

import { labels } from "@/shared/i18n/labels";

export function DemoNotice() {
  return (
    <Callout.Root color="amber" mb="4">
      <Callout.Icon>
        <Info size={16} />
      </Callout.Icon>
      <Callout.Text>{labels.app.demoNotice}</Callout.Text>
    </Callout.Root>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <Callout.Root color="red" mb="4">
      <Callout.Icon>
        <AlertTriangle size={16} />
      </Callout.Icon>
      <Callout.Text>{message}</Callout.Text>
    </Callout.Root>
  );
}
