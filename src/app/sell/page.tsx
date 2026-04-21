import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Handshake, ShieldCheck, Users } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sell Your Business — Pass The Plate",
  description:
    "Meet buyers who respect your recipes, your team, and your legacy. Pass The Plate handles diligence, introductions, and structuring from first call to close.",
};

export const dynamic = "force-dynamic";

export default async function SellPage() {
  const user = await getCurrentUser();
  const startHref = user ? "/sell/new" : "/signin?next=/sell/new";

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
              Browse
            </Link>
            <Link
              href={user ? "/account" : "/signin"}
              className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              {user ? "Account" : "Sign In"}
            </Link>
          </div>
        </div>
      </div>

      <section className="container-px mt-16 sm:mt-24">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
          <span className="w-fit rounded-full border border-ink/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-ink/70">
            For sellers
          </span>
          <h1 className="text-hero text-ink">
            Pass <span className="italic">The Plate</span> with care.
          </h1>
          <p className="max-w-2xl text-xl text-ink/70">
            Meet buyers who respect your recipes, your team, and your legacy.
            We handle diligence, introductions, and structuring from first
            call to close — so you can focus on the handoff.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={startHref}
              className="inline-flex items-center gap-2 rounded-full bg-orange px-7 py-4 text-base font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
            >
              Start a listing
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Link
              href="/sell/listings"
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-7 py-4 text-base font-medium text-ink transition-colors hover:border-ink"
            >
              Your listings
            </Link>
          </div>
          <p className="text-sm text-ink/60">
            $0 upfront. We only earn when you sell.
          </p>
        </div>
      </section>

      <section className="container-px mt-24">
        <div className="mx-auto grid max-w-[1440px] gap-6 md:grid-cols-3">
          <FeatureCard
            Icon={ShieldCheck}
            title="Verified buyers only"
            body="Every buyer who reaches out has been pre-qualified on funds and intent. No tire-kickers, no looky-loos."
          />
          <FeatureCard
            Icon={Handshake}
            title="White-glove handoff"
            body="We coordinate NDAs, financials, lease review, staff retention, and vendor intros. You choose when to pick up the phone."
          />
          <FeatureCard
            Icon={Users}
            title="Community that gets it"
            body="Built for Asian F&B operators, by operators and attorneys who've closed these deals before. Your story stays intact."
          />
        </div>
      </section>

      <section className="container-px mt-24">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="text-section text-ink">How it works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-4">
            <Step
              n={1}
              title="Draft your listing"
              body="Save and come back as often as you want. Only you can see it."
            />
            <Step
              n={2}
              title="Submit for review"
              body="Our team reviews every listing for accuracy and presentation."
            />
            <Step
              n={3}
              title="We publish"
              body="Once approved, your listing goes live to verified buyers."
            />
            <Step
              n={4}
              title="You close"
              body="We introduce warm leads. You control every conversation."
            />
          </ol>

          <div className="mt-12 flex justify-center">
            <Link
              href={startHref}
              className="inline-flex items-center gap-2 rounded-full bg-orange px-8 py-4 text-lg font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
            >
              Start a listing
              <ArrowRight aria-hidden className="size-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  Icon,
  title,
  body,
}: {
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  body: string;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-[1.5rem] border border-ink/10 bg-white p-8">
      <Icon aria-hidden className="size-6 text-orange" />
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <p className="text-ink/70">{body}</p>
    </article>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex flex-col gap-2 rounded-[1.5rem] border border-ink/10 bg-white p-6">
      <span className="font-display text-5xl text-orange">{n}</span>
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="text-sm text-ink/70">{body}</p>
    </li>
  );
}
