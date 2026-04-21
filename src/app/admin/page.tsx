import Link from "next/link";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { Wordmark } from "@/components/Wordmark";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const user = await getCurrentUser();
  return (
    <main className="min-h-[100dvh] container-px py-16">
      <div className="mx-auto max-w-[960px]">
        <Link href="/" className="inline-block">
          <Wordmark tone="ink" />
        </Link>
        <h1 className="mt-10 font-display text-5xl leading-tight text-ink">
          Admin
        </h1>
        <p className="mt-3 text-ink/70">
          Signed in as <strong>{user?.email}</strong> — role{" "}
          <strong>{String(user?.app_metadata?.role ?? "unknown")}</strong>
        </p>

        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          <AdminCard title="Listings" href="#" body="Create, edit, archive" />
          <AdminCard title="Users" href="#" body="Search, promote, ban" />
          <AdminCard title="Partners" href="#" body="Manage pro partners" />
          <AdminCard title="Inquiries" href="#" body="Buyer / seller messages" />
        </section>
      </div>
    </main>
  );
}

function AdminCard({
  title,
  body,
  href,
}: {
  title: string;
  body: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block rounded-[1.5rem] border border-ink/10 bg-white p-6 transition-colors hover:border-ink"
    >
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink/60">{body}</p>
    </a>
  );
}
