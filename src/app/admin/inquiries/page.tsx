import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAllInquiries, type InquiryStatus } from "@/lib/inquiries";
import { updateInquiryStatus } from "@/lib/inquiry-actions";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = { title: "Admin · Inquiries — Pass The Plate" };
export const dynamic = "force-dynamic";

const TABS: { key: InquiryStatus; label: string }[] = [
  { key: "new", label: "New" },
  { key: "reviewed", label: "Reviewed" },
  { key: "introduced", label: "Introduced" },
  { key: "closed", label: "Closed" },
  { key: "spam", label: "Spam" },
];

type SearchParams = { status?: string };

function parseStatus(raw: string | undefined): InquiryStatus {
  if (
    raw === "reviewed" ||
    raw === "introduced" ||
    raw === "closed" ||
    raw === "spam"
  )
    return raw;
  return "new";
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = parseStatus(sp.status);
  const rows = await getAllInquiries(status);

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
            Buyer <span className="italic">inquiries</span>
          </h1>
          <p className="mt-2 text-ink/70">
            Verify buyers and introduce them to sellers. Move each through the
            pipeline as you go.
          </p>

          <nav
            className="mt-8 flex flex-wrap gap-2 overflow-x-auto"
            aria-label="Inquiry status tabs"
          >
            {TABS.map((t) => {
              const active = t.key === status;
              return (
                <Link
                  key={t.key}
                  href={`/admin/inquiries?status=${t.key}`}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "rounded-full bg-ink px-5 py-2 text-sm font-medium text-cream"
                      : "rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
                  }
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>

          {rows.length === 0 ? (
            <div className="mt-10 rounded-[1.5rem] border border-ink/10 bg-white p-12 text-center">
              <h2 className="font-display text-2xl text-ink">
                {status === "new"
                  ? "No new inquiries"
                  : `No ${status} inquiries`}
              </h2>
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-4">
              {rows.map((r) => (
                <article
                  key={r.id}
                  className="flex flex-col gap-4 rounded-[1.25rem] border border-ink/10 bg-white p-6 lg:flex-row lg:items-start lg:gap-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-xl text-ink">
                        {r.listing?.name ?? "Listing"}
                      </h2>
                      <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-medium text-ink/70 capitalize">
                        {r.status}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-ink/60">
                      Buyer: <code className="text-ink">{r.buyer_id.slice(0, 8)}…</code>
                      {r.listing?.neighborhood && (
                        <> · {r.listing.neighborhood}</>
                      )}{" "}
                      ·{" "}
                      {new Date(r.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                    <blockquote className="mt-3 whitespace-pre-line rounded-[0.75rem] bg-ink/[0.03] p-4 text-base text-ink/90">
                      {r.message}
                    </blockquote>
                  </div>
                  <div className="flex flex-col gap-2 lg:w-64 lg:shrink-0">
                    {r.listing?.slug && (
                      <Link
                        href={`/listings/${r.listing.slug}`}
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
                      >
                        View listing
                        <ExternalLink aria-hidden className="size-3.5" />
                      </Link>
                    )}
                    <StatusPicker id={r.id} current={r.status} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatusPicker({
  id,
  current,
}: {
  id: string;
  current: InquiryStatus;
}) {
  const options: InquiryStatus[] = [
    "new",
    "reviewed",
    "introduced",
    "closed",
    "spam",
  ];
  return (
    <form action={updateInquiryStatus} className="flex gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="flex-1">
        <span className="sr-only">Status</span>
        <select
          name="status"
          defaultValue={current}
          className="w-full appearance-none rounded-full border border-ink/15 bg-white px-4 py-2 text-sm text-ink outline-none focus:border-ink capitalize"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-ink/80"
      >
        Save
      </button>
    </form>
  );
}
