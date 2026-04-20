import { FadeIn } from "@/components/primitives/FadeIn";
import { StatCounter } from "@/components/primitives/StatCounter";
import type { Homepage } from "../../../content/schema";

type Data = Homepage["stats"];

export function StatsBand({ data }: { data: Data }) {
  const parts = data.italicWord
    ? data.heading.split(data.italicWord)
    : [data.heading];
  return (
    <section className="bg-yellow py-20 sm:py-28">
      <div className="container-px">
        <div className="mx-auto max-w-[1440px]">
          <FadeIn>
            <h2 className="text-section max-w-3xl text-ink">
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
          <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-6">
            {data.items.map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.05}>
                <div className="flex flex-col gap-2">
                  <div className="font-display text-5xl leading-none text-ink sm:text-6xl">
                    <StatCounter
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                    />
                  </div>
                  <div className="max-w-[220px] text-sm text-ink/80 sm:text-base">
                    {stat.label}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
