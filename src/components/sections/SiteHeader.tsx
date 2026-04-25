"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Wordmark } from "@/components/Wordmark";
import { Link } from "@/i18n/navigation";
import { useAuthState } from "@/lib/use-role";
import type { Homepage } from "../../../content/schema";

type NavItem = Homepage["nav"][number];

export function SiteHeader({ nav }: { nav: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const { role, email, loading } = useAuthState();
  const isAdmin = role === "admin";
  const signedIn = !!email;
  const t = useTranslations("header");

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Split nav symmetrically around the centered wordmark.
  const half = Math.ceil(nav.length / 2);
  const leftNav = nav.slice(0, half);
  const rightNav = nav.slice(half);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-orange text-cream">
        <div className="mx-auto grid max-w-[1589px] grid-cols-[1fr_auto_1fr] items-center px-6 py-4 sm:px-10 sm:py-5 lg:py-6">
          {/* Left nav (desktop) */}
          <nav className="hidden items-center justify-start gap-8 lg:flex">
            {leftNav.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          {/* Mobile: hamburger left to balance */}
          <div className="flex items-center justify-start lg:hidden">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-full bg-cream/10 text-cream"
              aria-label={t("openMenu")}
            >
              <Menu aria-hidden className="size-5" />
            </button>
          </div>

          {/* Centered wordmark */}
          <Link href="/" aria-label={t("ariaHome")} className="shrink-0 px-4">
            <Wordmark tone="cream" size="md" className="whitespace-nowrap" />
          </Link>

          {/* Right nav (desktop) */}
          <nav className="hidden items-center justify-end gap-8 lg:flex">
            {rightNav.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
            {(signedIn || isAdmin) && !loading && (
              <Link
                href={isAdmin ? "/admin" : "/account"}
                className="text-[0.95rem] font-medium text-cream/80 underline-offset-4 hover:underline"
              >
                {isAdmin ? t("admin") : t("account")}
              </Link>
            )}
          </nav>

          {/* Mobile: account icon right */}
          <div className="flex items-center justify-end lg:hidden">
            {!loading && (
              <Link
                href={signedIn ? "/account" : "/signin"}
                className="text-sm font-medium text-cream/90 underline-offset-4 hover:underline"
              >
                {signedIn ? t("account") : t("signIn")}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-orange text-cream lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-6 py-5">
            <Wordmark tone="cream" size="md" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex size-10 items-center justify-center rounded-full bg-cream/10"
              aria-label={t("closeMenu")}
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-4 px-6 pb-10 pt-4">
            {nav.map((item) =>
              item.href.startsWith("#") ? (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-3xl font-extrabold uppercase tracking-tight text-cream"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-3xl font-extrabold uppercase tracking-tight text-cream"
                >
                  {item.label}
                </Link>
              ),
            )}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="text-3xl font-extrabold uppercase tracking-tight text-cream"
              >
                {t("admin")}
              </Link>
            )}
            <Link
              href={signedIn ? "/account" : "/signin"}
              onClick={() => setOpen(false)}
              className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-cream py-4 font-medium text-ink"
            >
              {signedIn ? t("account") : t("signIn")}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}

function NavLink({ item }: { item: NavItem }) {
  const cls =
    "text-[0.95rem] font-medium uppercase tracking-[0.02em] text-cream/95 transition-colors hover:text-cream";
  if (item.href.startsWith("#")) {
    return (
      <a href={item.href} className={cls}>
        {item.label}
      </a>
    );
  }
  return (
    <Link href={item.href} className={cls}>
      {item.label}
    </Link>
  );
}
