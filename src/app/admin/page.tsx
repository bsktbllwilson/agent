import Link from "next/link";
import { getCurrentUser, getRole, requireAdmin } from "@/lib/auth";
import { getListingStatusCounts } from "@/lib/admin-listings";
import { Wordmark } from "@/components/Wordmark";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const [user, role, counts] = await Promise.all([
    getCurrentUser(),
    getRole(),
    getListingStatusCounts(),
  ]);

  return (
    <main className="min-h-[100dvh] pb-24">
      <div className="container-px pt-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <Link href="/" aria-label="Pass The Plate home">
            <Wordmark tone="ink" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/listings"
              className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              Site
            </Link>
            <Link
              href="/account"
              className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              Account
            </Link>
          </div>
        </div>
      </div>

      <section className="container-px mt-12">
        <div className="mx-auto max-w-[1440px]">
          <h1 className="text-section text-ink">
            Admin <span className="italic">home</span>
          </h1>
          <p className="mt-2 text-ink/70">
            Signed in as <strong>{user?.email}</strong> — role{" "}
            <strong>{role ?? "unknown"}</strong>
          </p>

          <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminCard
              title="Listings"
              href="/admin/listings?status=pending"
              body="Review, approve, reject, feature"
              badge={
                counts.pending > 0
                  ? `${counts.pending} pending`
                  : `${counts.published} live`
              }
              badgeTone={counts.pending > 0 ? "warn" : "neutral"}
            />
            <AdminCard
              title="Inquiries"
              href="/admin/inquiries?status=new"
              body="Verify buyers, intro to sellers"
            />
            <AdminCard
              title="Users"
              href="#"
              body="Search, promote, ban"
              badge="Soon"
              badgeTone="neutral"
            />
          </section>
        </div>
      </section>
    </main>
  );
}

function AdminCard({
  title,
  body,
  href,
  badge,
  badgeTone,
}: {
  title: string;
  body: string;
  href: string;
  badge?: string;
  badgeTone?: "warn" | "neutral";
}) {
  const badgeClass =
    badgeTone === "warn"
      ? "bg-orange text-cream"
      : "bg-ink/5 text-ink/70";
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-[1.5rem] border border-ink/10 bg-white p-6 transition-colors hover:border-ink"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {badge && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
          >
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-ink/60">{body}</p>
    </Link>
  );
}
