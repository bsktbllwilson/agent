import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, Star, StarOff } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import {
  getListingsByStatus,
  getListingStatusCounts,
  type AdminStatus,
} from "@/lib/admin-listings";
import {
  approveListing,
  rejectListing,
  reopenListing,
  toggleFeatured,
} from "@/lib/admin-actions";
import { formatPrice, formatStatus } from "@/lib/format";
import { Wordmark } from "@/components/Wordmark";
import type { Listing } from "@/lib/types";

export const metadata: Metadata = { title: "Admin · Listings — Pass The Plate" };
export const dynamic = "force-dynamic";

const TABS: { key: AdminStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "published", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "draft", label: "Drafts" },
];

type SearchParams = { status?: string };

function parseStatus(raw: string | undefined): AdminStatus {
  if (raw === "published" || raw === "rejected" || raw === "draft") return raw;
  return "pending";
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = parseStatus(sp.status);

  const [rows, counts] = await Promise.all([
    getListingsByStatus(status),
    getListingStatusCounts(),
  ]);

  return (
    <main className="min-h-[100dvh] pb-24">
      <div className="container-px pt-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <Link href="/" aria-label="Pass The Plate home">
            <Wordmark tone="ink" />
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Admin home
          </Link>
        </div>
      </div>

      <section className="container-px mt-12">
        <div className="mx-auto max-w-[1440px]">
          <h1 className="text-section text-ink">
            Listing <span className="italic">queue</span>
          </h1>
          <p className="mt-2 text-ink/70">
            Review incoming submissions. Approvals go live on{" "}
            <code>/listings</code> immediately.
          </p>

          <nav
            className="mt-8 flex flex-wrap gap-2 overflow-x-auto"
            aria-label="Listing status tabs"
          >
            {TABS.map((t) => {
              const active = t.key === status;
              return (
                <Link
                  key={t.key}
                  href={`/admin/listings?status=${t.key}`}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-sm font-medium text-cream"
                      : "inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
                  }
                >
                  {t.label}
                  <span
                    className={
                      active
                        ? "rounded-full bg-cream/20 px-2 py-0.5 text-xs text-cream"
                        : "rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/60"
                    }
                  >
                    {counts[t.key]}
                  </span>
                </Link>
              );
            })}
          </nav>

          {rows.length === 0 ? (
            <EmptyState status={status} />
          ) : (
            <div className="mt-8 flex flex-col gap-4">
              {rows.map((l) => (
                <ListingRow key={l.id} listing={l} status={status} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function EmptyState({ status }: { status: AdminStatus }) {
  const copy =
    status === "pending"
      ? "No listings waiting for review. Go eat."
      : status === "published"
        ? "No published listings yet."
        : status === "rejected"
          ? "No rejected listings."
          : "No drafts in flight.";
  return (
    <div className="mt-10 rounded-[1.5rem] border border-ink/10 bg-white p-12 text-center">
      <h2 className="font-display text-2xl text-ink">{copy}</h2>
    </div>
  );
}

function ListingRow({
  listing,
  status,
}: {
  listing: Listing;
  status: AdminStatus;
}) {
  const s = formatStatus(listing.status);

  return (
    <article className="flex flex-col gap-4 rounded-[1.25rem] border border-ink/10 bg-white p-6 lg:flex-row lg:items-start lg:gap-6">
      <div className="flex min-w-0 flex-1 gap-4">
        <div className="hidden size-24 shrink-0 overflow-hidden rounded-[1rem] bg-ink/5 sm:block">
          {listing.hero_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.hero_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center font-display text-3xl text-ink/40">
              {listing.name?.slice(0, 1) ?? "?"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="truncate font-display text-xl text-ink">
              {listing.name || "Untitled"}
            </h2>
            <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-medium text-ink/70">
              {s.label}
            </span>
            {listing.featured && (
              <span className="rounded-full bg-orange px-2.5 py-1 text-xs font-medium text-cream">
                Featured
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/60">
            {listing.neighborhood && <span>{listing.neighborhood}</span>}
            {listing.cuisine && <span>· {listing.cuisine}</span>}
            {listing.subtype && <span>· {listing.subtype}</span>}
            <span>· {formatPrice(listing.price)}</span>
          </div>
          <div className="mt-1 text-xs text-ink/50">
            Updated{" "}
            {new Date(listing.updated_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>

          {status === "rejected" && listing.rejection_reason && (
            <p className="mt-3 rounded-[0.75rem] bg-orange/10 p-3 text-sm text-ink/80">
              <span className="font-medium">Feedback:</span>{" "}
              {listing.rejection_reason}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 lg:w-64 lg:shrink-0">
        {listing.slug && (
          <Link
            href={`/listings/${listing.slug}`}
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            Preview
            <ExternalLink aria-hidden className="size-3.5" />
          </Link>
        )}

        {status === "pending" && <ApproveRejectBlock id={listing.id} />}
        {status === "published" && (
          <>
            <form action={toggleFeatured}>
              <input type="hidden" name="id" value={listing.id} />
              <input
                type="hidden"
                name="next"
                value={listing.featured ? "false" : "true"}
              />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                {listing.featured ? (
                  <>
                    <StarOff aria-hidden className="size-4" />
                    Unfeature
                  </>
                ) : (
                  <>
                    <Star aria-hidden className="size-4" />
                    Feature
                  </>
                )}
              </button>
            </form>
            <form action={reopenListing}>
              <input type="hidden" name="id" value={listing.id} />
              <button
                type="submit"
                className="w-full rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink/70 transition-colors hover:border-ink hover:text-ink"
              >
                Un-publish
              </button>
            </form>
          </>
        )}
        {status === "rejected" && (
          <form action={reopenListing}>
            <input type="hidden" name="id" value={listing.id} />
            <button
              type="submit"
              className="w-full rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              Reopen for review
            </button>
          </form>
        )}
      </div>
    </article>
  );
}

function ApproveRejectBlock({ id }: { id: string }) {
  return (
    <>
      <form action={approveListing}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="w-full rounded-full bg-orange px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
        >
          Approve &amp; publish
        </button>
      </form>
      <details className="group rounded-[1rem] border border-ink/10 bg-ink/[0.02]">
        <summary className="cursor-pointer list-none rounded-[1rem] px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink/[0.04]">
          Reject with feedback
        </summary>
        <form action={rejectListing} className="flex flex-col gap-3 p-3">
          <input type="hidden" name="id" value={id} />
          <textarea
            name="reason"
            required
            rows={3}
            placeholder="What needs to change? This message is shown to the seller."
            className="rounded-[0.75rem] border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          />
          <button
            type="submit"
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-ink/80"
          >
            Send rejection
          </button>
        </form>
      </details>
    </>
  );
}
