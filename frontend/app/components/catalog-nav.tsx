"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flex } from "@radix-ui/themes";

const links = [
  { href: "/catalogs/units", label: "Единицы" },
  { href: "/catalogs/items", label: "Номенклатура" },
  { href: "/catalogs/work-centers", label: "Рабочие центры" },
  { href: "/catalogs/boms", label: "BOM" },
  { href: "/catalogs/routes", label: "Маршруты" },
];

export function CatalogNav() {
  const pathname = usePathname();

  return (
    <Flex gap="2" wrap="wrap" mb="4" className="tabs-row">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className={`tab-link ${pathname === link.href ? "active" : ""}`}>
          {link.label}
        </Link>
      ))}
    </Flex>
  );
}
