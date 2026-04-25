import { useTranslations } from "next-intl";
import { Wordmark } from "@/components/Wordmark";
import type { Homepage } from "../../../content/schema";

type Data = Homepage["footer"];

export function SiteFooter({ data }: { data: Data }) {
  const t = useTranslations("footer");
  return (
    <footer className="border-t border-ink/10 pt-16 pb-10 container-px">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div className="flex flex-col gap-4">
            <Wordmark tone="ink" className="text-[1.625rem]" />
            <p className="max-w-sm text-base text-ink/70">{data.tagline}</p>
          </div>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {data.columns.map((col) => (
              <div key={col.heading}>
                <h4 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/60">
                  {col.heading}
                </h4>
                <ul className="mt-4 flex flex-col gap-3">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        className="text-base text-ink transition-colors hover:text-orange"
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
        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-ink/10 pt-6 text-sm text-ink/60 sm:flex-row">
          <span>{data.legal}</span>
          <div className="flex gap-5">
            <a href="#privacy" className="hover:text-ink">
              {t("privacy")}
            </a>
            <a href="#terms" className="hover:text-ink">
              {t("terms")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
