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
import { Wordmark } from "@/components/Wordmark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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
  const tHeader = await getTranslations("header");
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
    <main className="min-h-[100dvh] pb-24">
      <div className="container-px pt-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <Link href="/" aria-label={tHeader("ariaHome")}>
            <Wordmark tone="ink" />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/listings"
              className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              {t("browse")}
            </Link>
            <Link
              href="/sell/listings"
              className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              {t("sell")}
            </Link>
            <Link
              href="/account/settings"
              className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              {t("settings")}
            </Link>
            {role === "admin" && (
              <Link
                href="/admin"
                className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                {t("admin")}
              </Link>
            )}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                {t("signOut")}
              </button>
            </form>
          </div>
        </div>
      </div>

      <section className="container-px mt-12">
        <div className="mx-auto max-w-[1440px]">
          <h1 className="text-hero text-ink">
            {t("greeting")} <span className="italic">{firstName}</span>
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
      </section>

      {notifications.length > 0 && (
        <section className="container-px mt-14">
          <div className="mx-auto max-w-[1440px]">
            <div className="flex items-end justify-between gap-4">
              <h2 className="flex items-center gap-3 font-display text-3xl text-ink sm:text-4xl">
                <Bell aria-hidden className="size-7 text-orange" />
                {t("activity")}
                {unread > 0 && (
                  <span className="rounded-full bg-orange px-2.5 py-1 text-xs font-medium text-cream">
                    {t("newCount", { count: unread })}
                  </span>
                )}
              </h2>
              {unread > 0 && (
                <form action={markAllNotificationsRead}>
                  <button
                    type="submit"
                    className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
                  >
                    {t("markAllRead")}
                  </button>
                </form>
              )}
            </div>
            <ul className="mt-6 flex flex-col gap-3">
              {notifications.map((n) => {
                const isUnread = !n.read_at;
                async function markRead() {
                  "use server";
                  await markNotificationRead(n.id);
                }
                return (
                  <li key={n.id}>
                    <article
                      className={`flex items-start gap-4 rounded-[1.25rem] border border-ink/10 bg-white p-5 ${
                        isUnread ? "ring-1 ring-orange/30" : ""
                      }`}
                    >
                      <div
                        aria-hidden
                        className={`mt-2 size-2.5 shrink-0 rounded-full ${
                          isUnread ? "bg-orange" : "bg-ink/15"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-lg text-ink">
                          {n.title}
                        </div>
                        {n.body && (
                          <p className="mt-1 text-sm text-ink/70">{n.body}</p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-xs text-ink/50">
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
                            className="inline-flex size-8 items-center justify-center rounded-full border border-ink/15 text-ink/60 transition-colors hover:border-ink hover:text-ink"
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

      <section className="container-px mt-14">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl text-ink sm:text-4xl">
              {t("savedListings")}
            </h2>
            <span className="text-sm text-ink/60">
              {t("savedCount", { count: saved.length })}
            </span>
          </div>

          {saved.length === 0 ? (
            <div className="mt-8 rounded-[1.5rem] border border-ink/10 bg-white p-12 text-center">
              <h3 className="font-display text-2xl text-ink">
                {t("emptySavedHeading")}
              </h3>
              <p className="mt-2 text-ink/70">{t("emptySavedBody")}</p>
              <Link
                href="/listings"
                className="mt-6 inline-flex rounded-full bg-orange px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
              >
                {t("browseListings")}
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
    </main>
  );
}
