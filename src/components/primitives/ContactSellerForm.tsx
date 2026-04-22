"use client";

import { useActionState } from "react";
import { submitInquiry } from "@/lib/inquiry-actions";

type Props = {
  listingId: string;
  slug: string;
  listingName: string;
};

type State = { ok: boolean; error: string | null };

async function handleSubmit(
  _prev: State,
  formData: FormData,
): Promise<State> {
  try {
    await submitInquiry(formData);
    return { ok: true, error: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not send.",
    };
  }
}

export function ContactSellerForm({ listingId, slug, listingName }: Props) {
  const [state, action, pending] = useActionState<State, FormData>(
    handleSubmit,
    { ok: false, error: null },
  );

  if (state.ok) {
    return (
      <div className="rounded-[1.25rem] border border-ink/10 bg-white p-5 text-center">
        <div className="font-display text-xl text-ink">Message sent</div>
        <p className="mt-1 text-sm text-ink/70">
          We&apos;ll verify and intro you. Keep an eye on your inbox.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="slug" value={slug} />
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink">Message to seller</span>
        <textarea
          name="message"
          rows={4}
          required
          maxLength={2000}
          placeholder={`Hi — I'm interested in ${listingName}. A bit about me: …`}
          className="rounded-[1rem] border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none focus:border-ink"
        />
      </label>
      {state.error && (
        <p className="text-sm text-orange" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-orange px-6 py-3 text-base font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send inquiry"}
      </button>
      <p className="text-xs text-ink/50">
        We verify every buyer before sending them to the seller.
      </p>
    </form>
  );
}
