"use client";

import { useState } from "react";
import { toast } from "sonner";

export function PlaybookSubscribeCard({
  title,
  body,
  emailPlaceholder,
  cta,
  successMsg,
}: {
  title: string;
  body: string;
  emailPlaceholder: string;
  cta: string;
  successMsg: string;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) {
      toast.error(emailPlaceholder);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      toast.success(successMsg);
      setEmail("");
      setBusy(false);
    }, 300);
  }

  return (
    <article className="flex flex-col items-center justify-center gap-5 rounded-[40px] border-[3px] border-ink bg-yellow p-8 text-center sm:p-10">
      <h3 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.05]">
        {title}
      </h3>
      <p className="max-w-xs text-base text-ink/80">{body}</p>
      <form onSubmit={onSubmit} className="flex w-full flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={emailPlaceholder}
          required
          className="rounded-full border border-ink/15 bg-white px-5 py-4 text-base text-ink outline-none placeholder:text-ink/40"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-ink px-6 py-4 text-base font-semibold text-cream transition-colors hover:bg-ink/85 disabled:opacity-60"
        >
          {cta}
        </button>
      </form>
    </article>
  );
}
