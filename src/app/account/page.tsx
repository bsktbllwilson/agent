import Link from "next/link";
import type { Metadata } from "next";
import { requireSignedIn, getCurrentUser, getRole } from "@/lib/auth";
import { getSavedListings, getSavedListingIds } from "@/lib/saved-listings";
import { ListingPreviewCard } from "@/components/primitives/ListingPreviewCard";
import { Wordmark } from "@/components/Wordmark";
import { signOut } from "@/lib/actions";

export const metadata: Metadata = { title: "Your Account — Pass The Plate" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  await requireSignedIn();
  const [user, role, saved, savedIds] = await Promise.all([
    getCurrentUser(),
    getRole(),
    getSavedListings(),
    getSavedListingIds(),
  ]);

  const firstName =
    (user?.user_metadata?.first_name as string | undefined) ??
    (user?.email?.split("@")[0] ?? "there");

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
              href="/sell/listings"
              className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              Sell
            </Link>
            {role === "admin" && (
              <Link
                href="/admin"
                className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                Admin
              </Link>
            )}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      <section className="container-px mt-12">
        <div className="mx-auto max-w-[1440px]">
          <h1 className="text-hero text-ink">
            Hey, <span className="italic">{firstName}</span>
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

      <section className="container-px mt-14">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl text-ink sm:text-4xl">
              Saved listings
            </h2>
            <span className="text-sm text-ink/60">
              {saved.length} {saved.length === 1 ? "saved" : "saved"}
            </span>
          </div>

          {saved.length === 0 ? (
            <div className="mt-8 rounded-[1.5rem] border border-ink/10 bg-white p-12 text-center">
              <h3 className="font-display text-2xl text-ink">
                Nothing saved yet
              </h3>
              <p className="mt-2 text-ink/70">
                Tap the heart on any listing to save it for later.
              </p>
              <Link
                href="/listings"
                className="mt-6 inline-flex rounded-full bg-orange px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
              >
                Browse listings
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
