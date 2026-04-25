import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const BUY_IMG =
  "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1400&q=80";
const SELL_IMG =
  "https://images.unsplash.com/photo-1607301406259-dfb186e15de8?auto=format&fit=crop&w=1400&q=80";

/**
 * Two-card image strip used at the foot of every page (above the footer).
 * Buy on the left, Sell on the right. Each card has a giant title and a
 * pill button overlaying a darkened photo.
 */
export function BottomCtaStrip() {
  const t = useTranslations("bottomCta");
  return (
    <section className="grid w-full grid-cols-1 md:grid-cols-2">
      <CtaCard
        href="/listings"
        title={t("buyTitle")}
        cta={t("buyCta")}
        image={BUY_IMG}
        imageAlt=""
      />
      <CtaCard
        href="/sell"
        title={t("sellTitle")}
        cta={t("sellCta")}
        image={SELL_IMG}
        imageAlt=""
      />
    </section>
  );
}

function CtaCard({
  href,
  title,
  cta,
  image,
  imageAlt,
}: {
  href: string;
  title: string;
  cta: string;
  image: string;
  imageAlt: string;
}) {
  return (
    <article className="relative isolate aspect-[4/5] w-full overflow-hidden md:aspect-[7/5]">
      <Image
        src={image}
        alt={imageAlt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/30 to-transparent" />
      <div className="relative flex h-full flex-col justify-end gap-5 p-8 sm:p-12">
        <h3 className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-[0.95] text-cream">
          {title}
        </h3>
        <Link
          href={href}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-orange px-7 py-3 text-base font-semibold text-cream transition-colors hover:bg-[rgb(210,68,28)]"
        >
          {cta}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </article>
  );
}
