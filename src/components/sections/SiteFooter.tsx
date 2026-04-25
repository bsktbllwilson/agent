import { useTranslations } from "next-intl";
import { Wordmark } from "@/components/Wordmark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Homepage } from "../../../content/schema";

type Data = Homepage["footer"];

export function SiteFooter({ data }: { data: Data }) {
  const t = useTranslations("footer");
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto max-w-[1589px] px-6 sm:px-10">
        <div className="grid gap-10 pt-16 pb-10 md:grid-cols-[1fr_auto] md:gap-16 lg:gap-20">
          {/* Language + utility (left) */}
          <div className="flex flex-col items-start gap-6">
            <LanguageSwitcher tone="cream" />
            <p className="max-w-sm text-sm text-cream/60">{data.tagline}</p>
            <div className="flex gap-5 text-sm text-cream/60">
              <a href="#privacy" className="hover:text-cream">
                {t("privacy")}
              </a>
              <a href="#terms" className="hover:text-cream">
                {t("terms")}
              </a>
              <span>{data.legal}</span>
            </div>
          </div>

          {/* Columns (right) */}
          <div className="grid gap-10 sm:grid-cols-3">
            {data.columns.map((col) => (
              <div key={col.heading}>
                <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-cream/50">
                  {col.heading}
                </h4>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {col.links.map((l) => (
                    <li key={`${col.heading}-${l.href}-${l.label}`}>
                      <a
                        href={l.href}
                        className="text-base text-cream transition-colors hover:text-orange"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Giant wordmark spanning full width */}
        <div className="overflow-hidden pb-6 pt-4">
          <Wordmark
            tone="cream"
            size="giant"
            className="block w-full select-none"
          />
        </div>
      </div>
    </footer>
  );
}
