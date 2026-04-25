"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

/**
 * Wide orange CTA bar shown above the BottomCtaStrip on the Playbook page
 * and other secondary pages.
 */
export function FindYourNextBigDeal() {
  const t = useTranslations("playbook");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) {
      toast.error(t("subscribeEmail"));
      return;
    }
    setBusy(true);
    setTimeout(() => {
      toast.success(t("subscribed"));
      setEmail("");
      setBusy(false);
    }, 300);
  }

  return (
    <section className="container-px py-12 sm:py-16">
      <form
        onSubmit={onSubmit}
        className="mx-auto flex max-w-[1505px] flex-col items-stretch gap-6 rounded-[40px] bg-orange p-8 text-cream sm:rounded-[60px] sm:p-12 lg:flex-row lg:items-center lg:gap-10 lg:rounded-[80px]"
      >
        <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] leading-none lg:flex-1">
          {t("bigDealHeading")}
        </h2>
        <p className="text-base text-cream/90 sm:text-lg lg:max-w-sm">
          {t("bigDealBody")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row lg:w-[480px]">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("subscribeEmail")}
            required
            className="flex-1 rounded-full bg-white px-5 py-4 text-base text-ink outline-none placeholder:text-ink/40"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-ink px-6 py-4 text-base font-semibold text-cream transition-colors hover:bg-ink/85 disabled:opacity-60"
          >
            {t("bigDealCta")}
            <ArrowRight aria-hidden className="size-4" />
          </button>
        </div>
      </form>
    </section>
  );
}
