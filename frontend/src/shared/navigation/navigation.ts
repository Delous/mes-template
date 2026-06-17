import { labels } from "@/shared/i18n/labels";

export type NavigationKey = "tasks" | "orders" | "catalogs" | "users";
export type UserRole = "admin" | "operator" | "reviewer" | "storekeeper";

export type NavigationItem = {
  key: string;
  label: string;
  href?: string;
  children?: NavigationItem[];
};

export const navigation: NavigationItem[] = [
  { key: "tasks", label: labels.entities.tasks, href: "/tasks" },
  { key: "orders", label: labels.entities.orders, href: "/orders" },
  {
    key: "catalogs",
    label: labels.entities.catalogs,
    children: [
      { key: "units", label: labels.entities.units, href: "/catalogs/units" },
      { key: "items", label: labels.entities.items, href: "/catalogs/items" },
      { key: "workCenters", label: labels.entities.workCenters, href: "/catalogs/work-centers" },
      { key: "boms", label: labels.entities.boms, href: "/catalogs/boms" },
      { key: "routes", label: labels.entities.routes, href: "/catalogs/routes" },
    ],
  },
  { key: "users", label: labels.entities.users, href: "/admin/users" },
];

export const navigationByRole: Record<UserRole, NavigationKey[]> = {
  admin: ["tasks", "orders", "catalogs", "users"],
  operator: ["tasks"],
  reviewer: ["tasks"],
  storekeeper: ["tasks"],
};
