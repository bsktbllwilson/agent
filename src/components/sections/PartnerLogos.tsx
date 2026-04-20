import { FadeIn } from "@/components/primitives/FadeIn";
import type { Homepage } from "../../../content/schema";

type Data = Homepage["partners"];

export function PartnerLogos({ data }: { data: Data }) {
  const parts = data.italicWord
    ? data.heading.split(data.italicWord)
    : [data.heading];
  return (
    <section id="partners" className="section-y container-px">
      <div className="mx-auto max-w-[1440px]">
        <FadeIn>
          <h2 className="text-section text-center text-ink">
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
          <ul className="mt-10 grid grid-cols-2 items-center gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {data.items.map((p) => (
              <li key={p.name} className="flex items-center justify-center">
                <a
                  href={p.href}
                  aria-label={p.name}
                  className="grayscale transition-[filter,opacity] duration-300 hover:grayscale-0"
                >
                  <span className="block rounded-full border border-ink/25 px-5 py-3 font-display text-lg text-ink/80 transition-colors hover:border-ink hover:text-ink">
                    {p.name}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}
