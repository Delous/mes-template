import "@radix-ui/themes/styles.css";
import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Theme } from "@radix-ui/themes";

import {
  APP_DESCRIPTION,
  APP_ICON_180,
  APP_ICON_512,
  APP_THEME_COLOR,
  getAppName,
} from "@/shared/lib/app-config";

export const viewport: Viewport = {
  themeColor: APP_THEME_COLOR,
};
export function generateMetadata(): Metadata {
  const appName = getAppName();

  return {
    title: "DevIT",
    description: "MES-система от DevIT",
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: APP_ICON_180, sizes: "180x180", type: "image/png" },
        { url: APP_ICON_512, sizes: "512x512", type: "image/png" },
      ],
      shortcut: APP_ICON_180,
      apple: [{ url: APP_ICON_180, sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      title: appName,
      description: APP_DESCRIPTION,
      siteName: appName,
      images: [
        {
          url: APP_ICON_512,
          width: 512,
          height: 512,
          alt: `${appName} logo`,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: appName,
      description: APP_DESCRIPTION,
      images: [APP_ICON_512],
    },
    appleWebApp: {
      capable: true,
      title: getAppName(),
    },
  };
}

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
