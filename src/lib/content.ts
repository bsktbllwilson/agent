import raw from "../../content/homepage.json";
import { HomepageSchema, type Homepage } from "../../content/schema";

let cached: Homepage | null = null;

export function getHomepage(): Homepage {
  if (cached) return cached;
  const parsed = HomepageSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `homepage.json failed schema validation:\n${parsed.error.toString()}`,
    );
  }
  cached = parsed.data;
  return cached;
}
