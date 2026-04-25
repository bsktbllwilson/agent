"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
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
      error: err instanceof Error ? err.message : "GENERIC_ERROR",
    };
  }
}

export function ContactSellerForm({ listingId, slug, listingName }: Props) {
  const t = useTranslations("contactSeller");
  const [state, action, pending] = useActionState<State, FormData>(
    handleSubmit,
    { ok: false, error: null },
  );

  if (state.ok) {
    return (
      <div className="rounded-[1.25rem] border border-ink/10 bg-white p-5 text-center">
        <div className="font-display text-xl text-ink">
          {t("successHeading")}
        </div>
        <p className="mt-1 text-sm text-ink/70">{t("successBody")}</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="slug" value={slug} />
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink">{t("label")}</span>
        <textarea
          name="message"
          rows={4}
          required
          maxLength={2000}
          placeholder={t("placeholder", { name: listingName })}
          className="rounded-[1rem] border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none focus:border-ink"
        />
      </label>
      {state.error && (
        <p className="text-sm text-orange" role="alert">
          {state.error === "GENERIC_ERROR" ? t("errorGeneric") : state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-orange px-6 py-3 text-base font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)] disabled:opacity-60"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
      <p className="text-xs text-ink/50">{t("verifyNote")}</p>
    </form>
  );
}
