"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Wordmark } from "@/components/Wordmark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import { useAuthState } from "@/lib/use-role";
import { cn } from "@/lib/utils";
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

  return (
    <>
      <div className="sticky top-3 z-40 w-full container-px sm:top-5">
        <header
          className={cn(
            "mx-auto flex max-w-[1440px] items-center justify-between rounded-[50px] bg-orange px-5 py-3 text-cream shadow-[0_14px_40px_-16px_rgba(230,78,33,0.55)] sm:px-8 sm:py-4",
          )}
        >
          <a href="#top" aria-label={t("ariaHome")} className="shrink-0">
            <Wordmark tone="cream" />
          </a>
          <nav className="hidden items-center gap-6 lg:flex">
            {nav.map((item) =>
              item.href.startsWith("#") ? (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-[0.95rem] font-medium text-cream/90 transition-colors hover:text-cream"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[0.95rem] font-medium text-cream/90 transition-colors hover:text-cream"
                >
                  {item.label}
                </Link>
              ),
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="text-[0.95rem] font-medium text-cream underline underline-offset-4"
              >
                {t("admin")}
              </Link>
            )}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher tone="cream" />
            <Link
              href={signedIn ? "/account" : "/signin"}
              className="rounded-full bg-cream px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream/90"
            >
              {loading ? " " : signedIn ? t("account") : t("signIn")}
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex size-10 items-center justify-center rounded-full bg-cream/10 text-cream lg:hidden"
            aria-label={t("openMenu")}
          >
            <Menu aria-hidden className="size-5" />
          </button>
        </header>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-orange text-cream lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-6 py-5">
            <Wordmark tone="cream" />
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
                  className="font-display text-4xl text-cream"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-4xl text-cream"
                >
                  {item.label}
                </Link>
              ),
            )}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="font-display text-4xl text-cream"
              >
                {t("admin")}
              </Link>
            )}
            <div className="mt-auto flex flex-col gap-3">
              <LanguageSwitcher tone="cream" />
              <Link
                href={signedIn ? "/account" : "/signin"}
                onClick={() => setOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-full bg-cream py-4 font-medium text-ink"
              >
                {signedIn ? t("account") : t("signIn")}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
