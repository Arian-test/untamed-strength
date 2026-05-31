"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Dumbbell,
  Hammer,
  LayoutDashboard,
  Lightbulb,
  MoreHorizontal,
  Settings,
  TableProperties,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/builder", label: "Program Builder", icon: Hammer },
  { href: "/train", label: "Training", icon: Dumbbell },
  { href: "/progress", label: "Progressie", icon: BarChart3 },
  { href: "/volume", label: "Volume", icon: TableProperties },
  { href: "/insights", label: "Inzichten", icon: Lightbulb },
  { href: "/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/settings", label: "Instellingen", icon: Settings },
];

// Items shown directly in the mobile bottom bar; the rest live under "Meer".
const MOBILE_PRIMARY = ["/", "/train", "/builder", "/progress"];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrated = useAppStore((s) => s._hydrated);
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = NAV.filter((n) => MOBILE_PRIMARY.includes(n.href));
  const secondary = NAV.filter((n) => !MOBILE_PRIMARY.includes(n.href));

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card/40 p-4 md:flex">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Dumbbell className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Untamed</p>
            <p className="text-xs text-muted-foreground">Strength Log</p>
          </div>
        </div>
        <nav className="mt-4 flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto px-3 text-[11px] text-muted-foreground">Lokaal opgeslagen · persoonlijk gebruik</p>
      </aside>

      <main className="flex-1">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-background px-4 py-3 md:hidden">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Dumbbell className="size-4" />
          </div>
          <span className="text-sm font-semibold">Untamed Strength</span>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-5 md:pb-6">
          {hydrated ? children : <LoadingState />}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card md:hidden">
        {primary.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-6" />
              {label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={cn(
            "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
            moreOpen ? "text-primary" : "text-muted-foreground",
          )}
        >
          <MoreHorizontal className="size-6" />
          Meer
        </button>
      </nav>

      {/* Mobile "more" sheet */}
      {moreOpen ? (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-border bg-card p-4 pb-24"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Meer</p>
              <button onClick={() => setMoreOpen(false)} className="rounded-md p-1 text-muted-foreground">
                <X className="size-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {secondary.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-border p-4 text-sm font-medium",
                    isActive(pathname, href) ? "bg-primary/10 text-primary" : "text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">Gegevens laden…</div>
  );
}
