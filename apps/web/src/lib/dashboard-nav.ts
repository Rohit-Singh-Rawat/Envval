import {
  DashboardSquare01Icon,
  DeviceAccessIcon,
  Link01Icon,
  Settings02Icon,
} from "hugeicons-react";
import type { ComponentType } from "react";

export interface DashboardNavItem {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

export const DASHBOARD_NAV_ITEMS: readonly DashboardNavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: DashboardSquare01Icon },
  { title: "Integrations", href: "/integrations", icon: Link01Icon },
  { title: "Devices", href: "/devices", icon: DeviceAccessIcon },
  { title: "Settings", href: "/settings", icon: Settings02Icon },
] as const;
