import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireSignedIn } from "@/lib/auth";
import { getInquiriesForSeller } from "@/lib/inquiries";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = { title: "Your Inquiries — Pass The Plate" };
export const dynamic = "force-dynamic";

export default async function SellerInquiriesPage() {
  await requireSignedIn();
  const rows = await getInquiriesForSeller();

  return (
    <main className="min-h-[100dvh] pb-24">
      <div className="container-px pt-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <Link href="/" aria-label="Pass The Plate home">
            <Wordmark tone="ink" />
          </Link>
          <Link
            href="/sell/listings"
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Your listings
          </Link>
        </div>
      </div>

      <section className="container-px mt-12">
        <div className="mx-auto max-w-[1080px]">
          <h1 className="text-section text-ink">
            Buyer <span className="italic">interest</span>
          </h1>
          <p className="mt-2 text-ink/70">
            We verify every buyer before sending an intro. You&apos;ll get an
            email when we do.
          </p>

          {rows.length === 0 ? (
            <div className="mt-10 rounded-[1.5rem] border border-ink/10 bg-white p-12 text-center">
              <h2 className="font-display text-2xl text-ink">
                No inquiries yet
              </h2>
              <p className="mt-2 text-ink/70">
                Once your listing is live, we&apos;ll collect buyer interest
                here.
              </p>
              <Link
                href="/sell/listings"
                className="mt-6 inline-flex rounded-full bg-orange px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
              >
                Your listings
              </Link>
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-4">
              {rows.map((r) => (
                <article
                  key={r.id}
                  className="rounded-[1.25rem] border border-ink/10 bg-white p-6"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-xl text-ink">
                      {r.listing?.name ?? "Listing"}
                    </h2>
                    <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-medium text-ink/70 capitalize">
                      {r.status}
                    </span>
                    <span className="text-sm text-ink/50">
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <blockquote className="mt-3 whitespace-pre-line rounded-[0.75rem] bg-ink/[0.03] p-4 text-base text-ink/90">
                    {r.message}
                  </blockquote>
                  <p className="mt-3 text-xs text-ink/50">
                    Buyer identity is hidden until our team verifies them.
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
