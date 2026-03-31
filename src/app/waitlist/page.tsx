"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle } from "lucide-react";

export default function WaitlistPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      email: form.get("email") as string,
      brand_name: form.get("brand_name") as string,
      origin_country: form.get("origin_country") as string,
      target_open_date: form.get("target_open_date") as string,
    };

    try {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from("waitlist")
        .insert([data]);

      if (dbError) throw dbError;
      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-6 font-display text-3xl font-bold">
          You&apos;re on the list!
        </h1>
        <p className="mt-4 text-gray-600">
          We&apos;ll be in touch with early access to market data, guides, and
          partner introductions tailored to your brand.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">
            Early Access
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">
            Join the Waitlist
          </h1>
          <p className="mt-4 text-gray-600">
            Be among the first Asian F&B brands to get access to our NYC market
            intelligence platform. We&apos;ll send you:
          </p>
          <ul className="mt-6 space-y-3 text-gray-600">
            <li className="flex items-start gap-3">
              <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-terracotta" />
              Personalized neighborhood recommendations based on your cuisine and budget
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-terracotta" />
              Curated partner introductions matched to your needs
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-terracotta" />
              Early access to new guides and market reports
            </li>
          </ul>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email Address *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@brand.com"
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="brand_name" className="block text-sm font-medium">
                Brand Name *
              </label>
              <Input
                id="brand_name"
                name="brand_name"
                required
                placeholder="Your restaurant or brand name"
                className="mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="origin_country"
                className="block text-sm font-medium"
              >
                Country of Origin *
              </label>
              <Select
                id="origin_country"
                name="origin_country"
                required
                className="mt-1"
              >
                <option value="">Select country</option>
                <option value="Japan">Japan</option>
                <option value="South Korea">South Korea</option>
                <option value="China">China</option>
                <option value="Taiwan">Taiwan</option>
                <option value="Thailand">Thailand</option>
                <option value="Vietnam">Vietnam</option>
                <option value="Philippines">Philippines</option>
                <option value="Singapore">Singapore</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Indonesia">Indonesia</option>
                <option value="India">India</option>
                <option value="Other">Other</option>
              </Select>
            </div>

            <div>
              <label
                htmlFor="target_open_date"
                className="block text-sm font-medium"
              >
                Target Opening Timeframe *
              </label>
              <Select
                id="target_open_date"
                name="target_open_date"
                required
                className="mt-1"
              >
                <option value="">Select timeframe</option>
                <option value="Q1 2025">Q1 2025</option>
                <option value="Q2 2025">Q2 2025</option>
                <option value="Q3 2025">Q3 2025</option>
                <option value="Q4 2025">Q4 2025</option>
                <option value="2026">2026</option>
                <option value="Exploring">Just Exploring</option>
              </Select>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Join the Waitlist"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
