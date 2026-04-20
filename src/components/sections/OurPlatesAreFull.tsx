import { FadeIn } from "@/components/primitives/FadeIn";
import { CategoryTile } from "@/components/primitives/CategoryTile";
import type { Homepage } from "../../../content/schema";

type Data = Homepage["categories"];

export function OurPlatesAreFull({ data }: { data: Data }) {
  const parts = data.italicWord
    ? data.heading.split(data.italicWord)
    : [data.heading];
  return (
    <section className="section-y container-px">
      <div className="mx-auto max-w-[1440px]">
        <FadeIn>
          <div className="flex flex-col gap-4 md:max-w-[840px]">
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
            <p className="max-w-[640px] text-lg text-ink/70">{data.subhead}</p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((c) => (
              <CategoryTile key={c.slug} category={c} />
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
