"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ComponentType, ReactNode } from "react";
import { BarChart3, Boxes, ReceiptText, ShoppingBag, Store } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavigationItem = {
  href: string;
  label: string;
  eyebrow: string;
  icon: ComponentType<{ className?: string }>;
};

const navigationItems: NavigationItem[] = [
  { href: "/shops", label: "Shops", eyebrow: "Branch network", icon: Store },
  { href: "/inventory", label: "Inventory", eyebrow: "Stock control", icon: Boxes },
  { href: "/reports", label: "Reports", eyebrow: "Insights", icon: BarChart3 },
  { href: "/bills", label: "Bills", eyebrow: "Billing desk", icon: ReceiptText },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentItem = navigationItems.find((item) => pathname.startsWith(item.href)) ?? navigationItems[0];

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border/70">
        <SidebarHeader className="gap-4 px-3 py-4">
          <Link
            href="/shops"
            className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/60 px-3 py-3"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <ShoppingBag className="size-5" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold">TuMando</p>
              <p className="truncate text-xs text-sidebar-foreground/70">Business Management</p>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2 pb-4">
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild tooltip={item.label} isActive={isActive}>
                        <Link href={item.href}>
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.14),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,1))]">
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-4 sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
              {currentItem.eyebrow}
            </p>
            <h1 className={cn("text-xl font-semibold tracking-tight sm:text-2xl")}>{currentItem.label}</h1>
          </div>
        </div>

        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
