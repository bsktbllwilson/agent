import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { requireSignedIn } from "@/lib/auth";
import { getOwnListings } from "@/lib/seller-listings";
import { formatPrice, formatStatus } from "@/lib/format";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = { title: "Your Listings — Pass The Plate" };
export const dynamic = "force-dynamic";

export default async function SellerListingsPage() {
  await requireSignedIn();
  const listings = await getOwnListings();

  return (
    <main className="min-h-[100dvh] pb-24">
      <div className="container-px pt-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <Link href="/" aria-label="Pass The Plate home">
            <Wordmark tone="ink" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/sell/inquiries"
              className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              Inquiries
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
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-section text-ink">Your listings</h1>
              <p className="mt-2 text-ink/70">
                Drafts, in-review, and live listings — all in one place.
              </p>
            </div>
            <Link
              href="/sell/new"
              className="inline-flex items-center gap-2 rounded-full bg-orange px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
            >
              <Plus aria-hidden className="size-4" />
              New listing
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="mt-10 rounded-[1.5rem] border border-ink/10 bg-white p-12 text-center">
              <h2 className="font-display text-3xl text-ink">
                No listings yet
              </h2>
              <p className="mt-2 text-ink/70">
                Start your first listing in about 90 seconds.
              </p>
              <Link
                href="/sell/new"
                className="mt-6 inline-flex rounded-full bg-orange px-7 py-3 text-sm font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
              >
                Start a listing
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-4">
              {listings.map((l) => {
                const s = formatStatus(l.status);
                return (
                  <Link
                    key={l.id}
                    href={`/sell/listings/${l.id}`}
                    className="flex items-center justify-between gap-6 rounded-[1.25rem] border border-ink/10 bg-white px-6 py-5 transition-colors hover:border-ink"
                  >
                    <div className="flex items-center gap-5 min-w-0">
                      <StatusDot tone={s.tone} />
                      <div className="min-w-0">
                        <div className="truncate font-display text-xl text-ink">
                          {l.name || "Untitled"}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/60">
                          <span>{s.label}</span>
                          {l.neighborhood && <span>· {l.neighborhood}</span>}
                          {l.cuisine && <span>· {l.cuisine}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="hidden text-right sm:block">
                      <div className="font-medium text-ink">
                        {formatPrice(l.price)}
                      </div>
                      <div className="mt-0.5 text-xs text-ink/50">
                        Updated{" "}
                        {new Date(l.updated_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatusDot({
  tone,
}: {
  tone: ReturnType<typeof formatStatus>["tone"];
}) {
  const color =
    tone === "published"
      ? "bg-green-500"
      : tone === "pending"
        ? "bg-yellow text-ink"
        : tone === "rejected"
          ? "bg-orange"
          : tone === "draft"
            ? "bg-ink/30"
            : "bg-ink/30";
  return <span className={`size-2.5 rounded-full ${color}`} aria-hidden />;
}
