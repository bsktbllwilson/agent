import { getHomepage } from "@/lib/content";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { Hero } from "@/components/sections/Hero";
import { TrendingHotspots } from "@/components/sections/TrendingHotspots";
import { OurPlatesAreFull } from "@/components/sections/OurPlatesAreFull";
import { BuySellSplit } from "@/components/sections/BuySellSplit";
import { StatsBand } from "@/components/sections/StatsBand";
import { PartnerLogos } from "@/components/sections/PartnerLogos";
import { Subscribe } from "@/components/sections/Subscribe";
import { SiteFooter } from "@/components/sections/SiteFooter";

// Revalidate homepage every 60s so featured listings stay fresh.
export const revalidate = 60;

export default async function HomePage() {
  const content = getHomepage();
  return (
    <main className="bg-cream">
      <SiteHeader nav={content.nav} />
      <Hero hero={content.hero} />
      <TrendingHotspots data={content.trendingHotspots} />
      <OurPlatesAreFull data={content.categories} />
      <BuySellSplit data={content.buySell} />
      <StatsBand data={content.stats} />
      <PartnerLogos data={content.partners} />
      <Subscribe data={content.subscribe} />
      <SiteFooter data={content.footer} />
    </main>
  );
}
