import Link from "next/link";
import type { Metadata } from "next";
import { requireSignedIn } from "@/lib/auth";
import { createDraftListing } from "@/lib/seller-actions";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = { title: "New Listing — Pass The Plate" };
export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  await requireSignedIn();

  return (
    <main className="min-h-[100dvh] pb-24">
      <div className="container-px pt-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <Link href="/" aria-label="Pass The Plate home">
            <Wordmark tone="ink" />
          </Link>
          <Link
            href="/sell/listings"
            className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            Your listings
          </Link>
        </div>
      </div>

      <section className="container-px mt-12">
        <div className="mx-auto max-w-[720px]">
          <h1 className="text-section text-ink">
            Start your <span className="italic">listing</span>
          </h1>
          <p className="mt-3 text-lg text-ink/70">
            Just the essentials to get moving — you can fill in financials and
            the story on the next step.
          </p>

          <form
            action={createDraftListing}
            className="mt-10 flex flex-col gap-6 rounded-[1.5rem] border border-ink/10 bg-white p-8"
          >
            <Field label="Business name" name="name" required autoFocus />
            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label="Cuisine"
                name="cuisine"
                placeholder="e.g. Cantonese, Sichuan, Vietnamese"
              />
              <Field
                label="Type"
                name="subtype"
                placeholder="e.g. Restaurant, Grocery, Bakery"
              />
            </div>
            <Field
              label="Neighborhood"
              name="neighborhood"
              placeholder="e.g. Chinatown, Manhattan"
            />
            <Field
              label="Asking price (USD)"
              name="price"
              type="number"
              min="0"
              step="1000"
              placeholder="1200000"
            />
            <Field
              label="Hero image URL"
              name="hero_url"
              type="url"
              placeholder="https://…"
              hint="Paste a direct image URL. We'll add in-app uploads soon."
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              <Link
                href="/sell"
                className="text-sm text-ink/60 underline-offset-4 hover:underline"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-orange px-7 py-3 text-base font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
              >
                Create draft
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-ink/60">
            Drafts are private — only you can see them.
          </p>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  hint,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        {...rest}
        className="rounded-full border border-ink/15 bg-white px-5 py-3 text-base text-ink outline-none focus:border-ink"
      />
      {hint && <span className="text-xs text-ink/60">{hint}</span>}
    </label>
  );
}
