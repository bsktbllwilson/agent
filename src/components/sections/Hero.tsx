"use client";

import { ChevronDown, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Homepage } from "../../../content/schema";

type HeroData = Homepage["hero"];

export function Hero({ hero }: { hero: HeroData }) {
  const [city, setCity] = useState("");
  const [industry, setIndustry] = useState("");
  const t = useTranslations("hero");

  const parts = hero.headline.split(hero.italicWord);

  function handleFind() {
    console.log("Find", { city, industry });
  }

  return (
    <section id="top" className="container-px pb-16 pt-16 sm:pt-24 lg:pt-28">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-hero text-ink"
        >
          {parts[0]}
          <span className="italic">{hero.italicWord}</span>
          {parts.slice(1).join(hero.italicWord)}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-subhead mt-6 max-w-3xl text-ink/80"
        >
          {hero.subhead}
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onSubmit={(e) => {
            e.preventDefault();
            handleFind();
          }}
          className="mt-10 w-full max-w-[860px]"
        >
          <div className="flex flex-col gap-2 rounded-[1.75rem] bg-white p-2 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.18)] sm:flex-row sm:items-stretch sm:rounded-full">
            <SearchField
              label={hero.searchPlaceholders.location}
              options={hero.locationOptions}
              value={city}
              onChange={setCity}
            />
            <div className="hidden w-px bg-ink/10 sm:block" />
            <SearchField
              label={hero.searchPlaceholders.industry}
              options={hero.industryOptions}
              value={industry}
              onChange={setIndustry}
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-orange px-8 py-4 text-lg font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
            >
              {t("find")}
              <ArrowRight aria-hidden className="size-5" />
            </button>
          </div>
        </motion.form>
      </div>
    </section>
  );
}

function SearchField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="relative flex flex-1 items-center gap-2 rounded-full px-5 py-3 text-left sm:py-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none bg-transparent pr-8 text-base outline-none ${
          value ? "text-ink" : "text-ink-muted"
        }`}
      >
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-5 size-4 text-ink/60"
      />
    </label>
  );
}
