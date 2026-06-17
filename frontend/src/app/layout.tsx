import "@radix-ui/themes/styles.css";
import "./globals.css";

import type { Metadata } from "next";
import { Theme } from "@radix-ui/themes";

export const metadata: Metadata = {
  title: "АРМ Производство",
  description: "Рабочее место для производственных задач, заказов и справочников",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <Theme accentColor="tomato" grayColor="slate" radius="small" scaling="100%">
          {children}
        </Theme>
      </body>
    </html>
  );
}
