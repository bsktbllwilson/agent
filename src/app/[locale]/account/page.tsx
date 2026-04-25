import type { Metadata } from "next";
import { Bell, Check } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireSignedIn, getCurrentUser, getRole } from "@/lib/auth";
import { getSavedListings, getSavedListingIds } from "@/lib/saved-listings";
import {
  getNotifications,
  getUnreadNotificationCount,
} from "@/lib/notifications";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notification-actions";
import { ListingPreviewCard } from "@/components/primitives/ListingPreviewCard";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { getHomepage } from "@/lib/content";
import { signOut } from "@/lib/actions";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSignedIn();
  const t = await getTranslations("account");
  const home = getHomepage(locale);
  const dateLocale = locale === "zh" ? "zh-CN" : "en-US";
  const [user, role, saved, savedIds, notifications, unread] =
    await Promise.all([
      getCurrentUser(),
      getRole(),
      getSavedListings(),
      getSavedListingIds(),
      getNotifications(10),
      getUnreadNotificationCount(),
    ]);

  const firstName =
    (user?.user_metadata?.first_name as string | undefined) ??
    (user?.email?.split("@")[0] ?? t("guestName"));

  return (
    <main className="min-h-[100dvh]">
      <SiteHeader nav={home.nav} />

      {/* Greeting card */}
      <section className="container-px py-12 sm:py-16">
        <div className="mx-auto max-w-[1440px] rounded-[40px] bg-white p-8 sm:rounded-[60px] sm:p-12 lg:p-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.95]">
                {t("greeting")} {firstName}
              </h1>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-ink/70">
                <span className="rounded-full border border-ink/15 px-3 py-1">
                  {user?.email}
                </span>
                {role && (
                  <span className="rounded-full border border-ink/15 px-3 py-1 capitalize">
                    {role}
                  </span>
                )}
              </div>
            </div>
            <nav className="flex flex-wrap gap-2">
              <NavPill href="/listings" label={t("browse")} />
              <NavPill href="/sell/listings" label={t("sell")} />
              <NavPill href="/account/settings" label={t("settings")} />
              {role === "admin" && <NavPill href="/admin" label={t("admin")} />}
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full border border-ink/15 bg-cream px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
                >
                  {t("signOut")}
                </button>
              </form>
            </nav>
          </div>
        </div>
      </section>

      {/* Activity */}
      {notifications.length > 0 && (
        <section className="container-px pb-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="flex items-end justify-between gap-4">
              <h2 className="flex items-center gap-3 font-display text-[clamp(2rem,4vw,3.25rem)] leading-none">
                <Bell aria-hidden className="size-7 text-orange sm:size-9" />
                {t("activity")}
                {unread > 0 && (
                  <span className="rounded-full bg-orange px-3 py-1 text-sm font-medium text-cream">
                    {t("newCount", { count: unread })}
                  </span>
                )}
              </h2>
              {unread > 0 && (
                <form action={markAllNotificationsRead}>
                  <button
                    type="submit"
                    className="rounded-full border border-ink/15 bg-cream px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
                  >
                    {t("markAllRead")}
                  </button>
                </form>
              )}
            </div>
            <ul className="mt-8 flex flex-col gap-3">
              {notifications.map((n) => {
                const isUnread = !n.read_at;
                async function markRead() {
                  "use server";
                  await markNotificationRead(n.id);
                }
                return (
                  <li key={n.id}>
                    <article
                      className={`flex items-start gap-4 rounded-[24px] border bg-white p-6 ${
                        isUnread ? "border-orange/30 ring-1 ring-orange/20" : "border-ink/10"
                      }`}
                    >
                      <div
                        aria-hidden
                        className={`mt-2 size-2.5 shrink-0 rounded-full ${
                          isUnread ? "bg-orange" : "bg-ink/20"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-xl text-ink sm:text-2xl">
                          {n.title}
                        </div>
                        {n.body && (
                          <p className="mt-2 text-sm text-ink/70 sm:text-base">
                            {n.body}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-3 text-xs text-ink/50">
                          <span>
                            {new Date(n.created_at).toLocaleString(dateLocale, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                          {n.href && (
                            <Link
                              href={n.href}
                              className="font-medium text-ink underline-offset-4 hover:underline"
                            >
                              {t("open")}
                            </Link>
                          )}
                        </div>
                      </div>
                      {isUnread && (
                        <form action={markRead}>
                          <button
                            type="submit"
                            aria-label={t("markRead")}
                            className="inline-flex size-9 items-center justify-center rounded-full border border-ink/15 text-ink/60 transition-colors hover:border-ink hover:text-ink"
                          >
                            <Check aria-hidden className="size-4" />
                          </button>
                        </form>
                      )}
                    </article>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* Saved listings */}
      <section className="container-px pb-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-none">
              {t("savedListings")}
            </h2>
            <span className="text-sm text-ink/60 sm:text-base">
              {t("savedCount", { count: saved.length })}
            </span>
          </div>

          {saved.length === 0 ? (
            <div className="mt-10 rounded-[40px] bg-white p-12 text-center sm:rounded-[60px] sm:p-16">
              <h3 className="font-display text-3xl text-ink sm:text-4xl">
                {t("emptySavedHeading")}
              </h3>
              <p className="mt-3 text-ink/70">{t("emptySavedBody")}</p>
              <Link
                href="/listings"
                className="mt-8 inline-flex items-center gap-2 rounded-[25px] border border-ink bg-orange px-7 py-4 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-[rgb(210,68,28)]"
              >
                {t("browseListings")}
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {saved.map((l) => (
                <ListingPreviewCard
                  key={l.id}
                  listing={l}
                  saved={savedIds.has(l.id)}
                  showSaveButton
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter data={home.footer} />
    </main>
  );
}

function NavPill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-ink/15 bg-cream px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
    >
      {label}
    </Link>
  );
}
