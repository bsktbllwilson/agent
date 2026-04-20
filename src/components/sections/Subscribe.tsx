"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/primitives/FadeIn";
import type { Homepage } from "../../../content/schema";

type Data = Homepage["subscribe"];

export function Subscribe({ data }: { data: Data }) {
  const [email, setEmail] = useState("");
  const parts = data.italicWord
    ? data.heading.split(data.italicWord)
    : [data.heading];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !/.+@.+\..+/.test(email)) {
      toast.error("Please enter a valid email.");
      return;
    }
    toast.success(data.success);
    setEmail("");
  }

  return (
    <section className="section-y container-px">
      <div className="mx-auto flex max-w-[960px] flex-col items-center text-center">
        <FadeIn>
          <h2 className="text-section text-ink">
            {data.italicWord ? (
              <>
                {parts[0]}
                <span className="italic">{data.italicWord}</span>
                {parts.slice(1).join(data.italicWord)}
              </>
            ) : (
              data.heading
            )}
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="mt-4 max-w-xl text-lg text-ink/70">{data.body}</p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex w-full max-w-xl flex-col gap-2 rounded-[1.5rem] bg-white p-2 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.18)] sm:flex-row sm:items-stretch sm:rounded-full"
          >
            <label className="flex-1">
              <span className="sr-only">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={data.placeholder}
                required
                className="w-full rounded-full bg-transparent px-6 py-4 text-base text-ink placeholder:text-ink-muted focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-orange px-7 py-4 text-base font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
            >
              {data.cta}
              <ArrowRight aria-hidden className="size-4" />
            </button>
          </form>
        </FadeIn>
      </div>
    </section>
  );
}
