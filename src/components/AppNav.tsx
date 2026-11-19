"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "Tableau" },
  { href: "/goals", label: "Objectifs" },
  { href: "/share", label: "Partage" },
  { href: "/settings", label: "Réglages" },
];

export function AppNav({ displayName }: { displayName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Airoma"
            width={120}
            height={36}
            className="h-8 w-auto"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-navy text-white"
                    : "text-muted hover:bg-brand-navy/5 hover:text-brand-navy"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {displayName ? (
            <span className="hidden text-sm text-muted md:inline">
              {displayName}
            </span>
          ) : null}
          <button type="button" onClick={signOut} className="btn-secondary !px-3 !py-1.5">
            Sortir
          </button>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-border/50 px-2 py-2 sm:hidden">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                active
                  ? "bg-brand-navy text-white"
                  : "bg-brand-navy/5 text-brand-navy"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}