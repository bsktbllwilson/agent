import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/primitives/FadeIn";
import type { BuySellPanel, Homepage } from "../../../content/schema";

type Data = Homepage["buySell"];

export function BuySellSplit({ data }: { data: Data }) {
  return (
    <section className="section-y container-px">
      <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-2">
        <Panel panel={data.buy} id="buy" />
        <Panel panel={data.sell} id="sell" />
      </div>
    </section>
  );
}

function Panel({ panel, id }: { panel: BuySellPanel; id: string }) {
  const parts = panel.italicWord
    ? panel.headline.split(panel.italicWord)
    : [panel.headline];
  return (
    <FadeIn>
      <article
        id={id}
        className="relative flex min-h-[520px] flex-col overflow-hidden rounded-[1.75rem] bg-ink text-cream"
      >
        <Image
          src={panel.image}
          alt={panel.headline}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="absolute inset-0 object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent" />
        <div className="relative mt-auto flex flex-col gap-5 p-8 sm:p-10">
          <span className="w-fit rounded-full bg-cream/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-cream">
            {panel.eyebrow}
          </span>
          <h3 className="font-display text-4xl leading-[1.05] sm:text-5xl">
            {panel.italicWord ? (
              <>
                {parts[0]}
                <span className="italic">{panel.italicWord}</span>
                {parts.slice(1).join(panel.italicWord)}
              </>
            ) : (
              panel.headline
            )}
          </h3>
          <p className="max-w-[440px] text-base text-cream/85">{panel.body}</p>
          <a
            href={panel.cta.href}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-orange px-6 py-3 text-base font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
          >
            {panel.cta.label}
            <ArrowRight aria-hidden className="size-4" />
          </a>
        </div>
      </article>
    </FadeIn>
  );
}
