"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/SignOutButton";

const iconProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const links: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/dashboard",
    label: "Accueil",
    icon: (
      <svg {...iconProps}>
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    href: "/goals",
    label: "Objectifs",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </svg>
    ),
  },
  {
    href: "/share",
    label: "Partage",
    icon: (
      <svg {...iconProps}>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Réglages",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
      </svg>
    ),
  },
];

export function AppNav({ displayName }: { displayName?: string }) {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-surface/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Aimora"
              width={120}
              height={36}
              className="h-8 w-auto"
              priority
            />
          </Link>

          <nav
            aria-label="Navigation principale"
            className="hidden items-center gap-1 sm:flex"
          >
            {links.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition ${
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

          <div className="hidden items-center gap-3 sm:flex">
            {displayName ? (
              <span className="hidden text-sm text-muted md:inline">
                {displayName}
              </span>
            ) : null}
            <SignOutButton className="btn-secondary !px-3" />
          </div>
        </div>
      </header>

      {/* Barre d'onglets mobile (PWA) : zones tactiles >= 44px, zone sûre iOS */}
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition ${
                    active ? "text-brand-navy" : "text-muted"
                  }`}
                >
                  <span
                    className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
                      active ? "bg-brand-orange" : ""
                    }`}
                  >
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
