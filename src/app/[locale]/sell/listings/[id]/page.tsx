import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, Eye, Heart, Mail } from "lucide-react";
import { requireSignedIn } from "@/lib/auth";
import { getOwnListingById } from "@/lib/seller-listings";
import { getStatsForListing, getWeeklyViews } from "@/lib/listing-stats";
import { Sparkline } from "@/components/primitives/Sparkline";
import {
  updateListing,
  submitListingForReview,
  deleteDraftListing,
} from "@/lib/seller-actions";
import { formatStatus } from "@/lib/format";
import { Wordmark } from "@/components/Wordmark";
import { ImageUpload } from "@/components/primitives/ImageUpload";
import type { Listing } from "@/lib/types";

export const metadata: Metadata = { title: "Edit Listing — Pass The Plate" };
export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditListingPage({ params }: { params: Params }) {
  await requireSignedIn();
  const { id } = await params;
  const listing = await getOwnListingById(id);
  if (!listing) notFound();

  const s = formatStatus(listing.status);
  const isEditable =
    s.tone === "draft" || s.tone === "pending" || s.tone === "rejected";
  const canSubmit = s.tone === "draft" || s.tone === "rejected";
  const [stats, weeklyViews] =
    s.tone === "published"
      ? await Promise.all([
          getStatsForListing(listing.id),
          getWeeklyViews(listing.id),
        ])
      : [null, []];

  async function submit() {
    "use server";
    await submitListingForReview(id);
  }
  async function remove() {
    "use server";
    await deleteDraftListing(id);
  }

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
          <StatusBanner
            tone={s.tone}
            label={s.label}
            listing={listing}
            submitAction={submit}
          />

          {stats && (
            <div className="mt-4 flex flex-col gap-6 rounded-[1.5rem] border border-ink/10 bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid flex-1 grid-cols-3 gap-3 sm:gap-6">
                <StatBlock
                  icon={<Eye className="size-4 text-ink/60" />}
                  label="Views"
                  value={stats.views}
                />
                <StatBlock
                  icon={<Heart className="size-4 text-ink/60" />}
                  label="Saves"
                  value={stats.saves}
                />
                <StatBlock
                  icon={<Mail className="size-4 text-ink/60" />}
                  label="Inquiries"
                  value={stats.inquiries}
                />
              </div>
              <div className="lg:w-[260px]">
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-ink/60">
                  Last 8 weeks
                </div>
                <Sparkline data={weeklyViews} className="mt-2" />
              </div>
            </div>
          )}

          {listing.rejection_reason && s.tone === "rejected" && (
            <div className="mt-4 rounded-[1.25rem] border border-orange/40 bg-orange/10 p-5">
              <div className="text-sm font-medium uppercase tracking-[0.12em] text-ink/70">
                Reviewer feedback
              </div>
              <p className="mt-2 whitespace-pre-line text-base text-ink/90">
                {listing.rejection_reason}
              </p>
            </div>
          )}

          <form
            action={updateListing}
            className="mt-8 flex flex-col gap-10"
          >
            <input type="hidden" name="id" value={listing.id} />

            <FormSection title="Basics">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  label="Business name"
                  name="name"
                  required
                  defaultValue={listing.name ?? ""}
                  disabled={!isEditable}
                />
                <Field
                  label="Asking price (USD)"
                  name="price"
                  type="number"
                  min="0"
                  step="1000"
                  defaultValue={listing.price ?? ""}
                  disabled={!isEditable}
                />
                <Field
                  label="Cuisine"
                  name="cuisine"
                  defaultValue={listing.cuisine ?? ""}
                  disabled={!isEditable}
                />
                <Field
                  label="Type"
                  name="subtype"
                  defaultValue={listing.subtype ?? ""}
                  disabled={!isEditable}
                />
                <Field
                  label="Neighborhood"
                  name="neighborhood"
                  defaultValue={listing.neighborhood ?? ""}
                  disabled={!isEditable}
                />
                <Field
                  label="Serves (cuisines/categories)"
                  name="serves"
                  defaultValue={listing.serves ?? ""}
                  disabled={!isEditable}
                />
              </div>
            </FormSection>

            <FormSection title="Operations">
              <div className="grid gap-6 sm:grid-cols-3">
                <Field
                  label="Established (year)"
                  name="established"
                  type="number"
                  defaultValue={listing.established ?? ""}
                  disabled={!isEditable}
                />
                <Field
                  label="Square feet"
                  name="sqft"
                  type="number"
                  defaultValue={listing.sqft ?? ""}
                  disabled={!isEditable}
                />
                <Field
                  label="Staff count"
                  name="staff"
                  type="number"
                  defaultValue={listing.staff ?? ""}
                  disabled={!isEditable}
                />
                <Field
                  label="Annual revenue"
                  name="revenue"
                  type="number"
                  defaultValue={listing.revenue ?? ""}
                  disabled={!isEditable}
                />
                <Field
                  label="SDE"
                  name="sde"
                  type="number"
                  defaultValue={listing.sde ?? ""}
                  disabled={!isEditable}
                />
                <Field
                  label="Monthly rent"
                  name="rent"
                  type="number"
                  defaultValue={listing.rent ?? ""}
                  disabled={!isEditable}
                />
                <Field
                  label="Lease years remaining"
                  name="lease_years"
                  type="number"
                  defaultValue={listing.lease_years ?? ""}
                  disabled={!isEditable}
                />
              </div>
            </FormSection>

            <FormSection title="Deal mechanics">
              <Textarea
                label="Lease terms"
                name="lease_terms"
                defaultValue={listing.lease_terms ?? ""}
                disabled={!isEditable}
              />
              <Textarea
                label="Staff retention"
                name="staff_retention"
                defaultValue={listing.staff_retention ?? ""}
                disabled={!isEditable}
              />
              <Textarea
                label="Vendor contracts"
                name="vendor_contracts"
                defaultValue={listing.vendor_contracts ?? ""}
                disabled={!isEditable}
              />
              <Textarea
                label="Handoff notes"
                name="handoff_notes"
                defaultValue={listing.handoff_notes ?? ""}
                disabled={!isEditable}
              />
              <Field
                label="P&L URL"
                name="p_and_l_url"
                type="url"
                defaultValue={listing.p_and_l_url ?? ""}
                disabled={!isEditable}
              />
            </FormSection>

            <FormSection title="The story">
              <Textarea
                label="Why you're selling"
                name="reason"
                defaultValue={listing.reason ?? ""}
                disabled={!isEditable}
                required
              />
              <Textarea
                label="Owner story"
                name="owner_story"
                defaultValue={listing.owner_story ?? ""}
                disabled={!isEditable}
              />
              <Textarea
                label="Secret sauce"
                name="secret_sauce"
                defaultValue={listing.secret_sauce ?? ""}
                disabled={!isEditable}
              />
              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  label="Owner name"
                  name="owner_name"
                  defaultValue={listing.owner_name ?? ""}
                  disabled={!isEditable}
                />
                <Field
                  label="Years as owner"
                  name="owner_years"
                  type="number"
                  defaultValue={listing.owner_years ?? ""}
                  disabled={!isEditable}
                />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <ImageUpload
                  name="hero_url"
                  label="Hero image"
                  defaultUrl={listing.hero_url}
                  disabled={!isEditable}
                  pathPrefix={listing.id}
                  helpText="16:9 looks best on listing cards."
                />
                <ImageUpload
                  name="owner_photo_url"
                  label="Owner photo"
                  aspect="square"
                  defaultUrl={listing.owner_photo_url}
                  disabled={!isEditable}
                  pathPrefix={listing.id}
                  helpText="Optional — a friendly face builds trust."
                />
              </div>
            </FormSection>

            <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-full border border-ink/10 bg-white/95 px-5 py-3 backdrop-blur">
              <div className="flex items-center gap-3">
                {s.tone === "draft" && isEditable && (
                  <form action={remove}>
                    <button
                      type="submit"
                      className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink/70 transition-colors hover:border-ink hover:text-ink"
                    >
                      Delete draft
                    </button>
                  </form>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!isEditable}
                  className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink disabled:opacity-50"
                >
                  Save changes
                </button>
                {canSubmit && (
                  <SubmitForReviewButton action={submit} label={
                    s.tone === "rejected" ? "Resubmit for review" : "Submit for review"
                  } />
                )}
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function StatusBanner({
  tone,
  label,
  listing,
  submitAction,
}: {
  tone: ReturnType<typeof formatStatus>["tone"];
  label: string;
  listing: Listing;
  submitAction: () => Promise<void>;
}) {
  const body =
    tone === "draft"
      ? "Private — only you can see this. Fill in the required fields, then submit for review."
      : tone === "pending"
        ? "Submitted — our team is reviewing. We'll email you when it's live."
        : tone === "published"
          ? "Live on the marketplace. Edits are disabled while published; contact support to update."
          : tone === "rejected"
            ? "We sent feedback — update the listing and resubmit."
            : "";

  const dotClass =
    tone === "published"
      ? "bg-green-500"
      : tone === "pending"
        ? "bg-yellow"
        : tone === "rejected"
          ? "bg-orange"
          : "bg-ink/30";

  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-ink/10 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`mt-1.5 block size-2.5 shrink-0 rounded-full ${dotClass}`}
        />
        <div>
          <div className="font-display text-xl text-ink">{label}</div>
          {body && <p className="mt-1 text-sm text-ink/70">{body}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {tone === "published" && listing.slug && (
          <Link
            href={`/listings/${listing.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            View live
            <ExternalLink aria-hidden className="size-3.5" />
          </Link>
        )}
        {(tone === "draft" || tone === "rejected") && (
          <SubmitForReviewButton
            action={submitAction}
            label={tone === "rejected" ? "Resubmit for review" : "Submit for review"}
          />
        )}
      </div>
    </div>
  );
}

function SubmitForReviewButton({
  action,
  label = "Submit for review",
}: {
  action: () => Promise<void>;
  label?: string;
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="rounded-full bg-orange px-5 py-2 text-sm font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
      >
        {label}
      </button>
    </form>
  );
}

function StatBlock({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-ink/60">
        {icon}
        {label}
      </div>
      <div className="font-display text-3xl text-ink tabular-nums">
        {value.toLocaleString("en-US")}
      </div>
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-[1.5rem] border border-ink/10 bg-white p-8">
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        {...rest}
        className="rounded-full border border-ink/15 bg-white px-5 py-3 text-base text-ink outline-none focus:border-ink disabled:bg-ink/[0.03] disabled:text-ink/60"
      />
    </label>
  );
}

function Textarea({
  label,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        {...rest}
        rows={4}
        className="rounded-[1.25rem] border border-ink/15 bg-white px-5 py-3 text-base text-ink outline-none focus:border-ink disabled:bg-ink/[0.03] disabled:text-ink/60"
      />
    </label>
  );
}
