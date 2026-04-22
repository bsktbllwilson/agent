import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireSignedIn } from "@/lib/auth";
import {
  EVENT_TYPES,
  EVENT_LABELS,
  getOwnPreferences,
} from "@/lib/notification-preferences";
import { updatePreferences } from "@/lib/preference-actions";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = {
  title: "Notification Settings — Pass The Plate",
};
export const dynamic = "force-dynamic";

export default async function NotificationSettingsPage() {
  await requireSignedIn();
  const prefs = await getOwnPreferences();

  return (
    <main className="min-h-[100dvh] pb-24">
      <div className="container-px pt-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <Link href="/" aria-label="Pass The Plate home">
            <Wordmark tone="ink" />
          </Link>
          <Link
            href="/account"
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Back to account
          </Link>
        </div>
      </div>

      <section className="container-px mt-12">
        <div className="mx-auto max-w-[720px]">
          <h1 className="text-section text-ink">
            Notification <span className="italic">settings</span>
          </h1>
          <p className="mt-2 text-ink/70">
            Choose how you hear from us. Toasts appear in the app when
            you&apos;re signed in; email is nice if you live out of your
            inbox.
          </p>

          <form action={updatePreferences} className="mt-10 flex flex-col gap-6">
            <div className="overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white">
              <div className="hidden grid-cols-[1fr_auto_auto] items-center gap-6 border-b border-ink/10 px-6 py-3 text-xs font-medium uppercase tracking-[0.12em] text-ink/50 sm:grid">
                <span>Event</span>
                <span className="text-center">In-app</span>
                <span className="text-center">Email</span>
              </div>
              <ul className="divide-y divide-ink/10">
                {EVENT_TYPES.map((evt) => (
                  <li
                    key={evt}
                    className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6"
                  >
                    <div>
                      <div className="font-display text-lg text-ink">
                        {EVENT_LABELS[evt].title}
                      </div>
                      <div className="mt-1 text-sm text-ink/60">
                        {EVENT_LABELS[evt].body}
                      </div>
                    </div>
                    <Toggle
                      name={`${evt}_in_app`}
                      defaultChecked={prefs[`${evt}_in_app`]}
                      label={`In-app: ${EVENT_LABELS[evt].title}`}
                    />
                    <Toggle
                      name={`${evt}_email`}
                      defaultChecked={prefs[`${evt}_email`]}
                      label={`Email: ${EVENT_LABELS[evt].title}`}
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[1.5rem] border border-ink/10 bg-white p-6">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="font-display text-lg text-ink">
                    Daily digest
                  </div>
                  <div className="mt-1 text-sm text-ink/60">
                    One email per day summarizing anything you haven&apos;t
                    read yet. Skipped on days without activity.
                  </div>
                </div>
                <Toggle
                  name="digest_email"
                  defaultChecked={prefs.digest_email}
                  label="Daily digest email"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                className="rounded-full bg-orange px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
              >
                Save preferences
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function Toggle({
  name,
  defaultChecked,
  label,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3">
      <span className="sr-only">{label}</span>
      <span className="relative inline-block">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="peer absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
        />
        <span className="block h-6 w-11 rounded-full bg-ink/15 transition-colors peer-checked:bg-orange" />
        <span className="absolute left-0.5 top-0.5 block size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
