"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

type Labels = {
  fullName: string;
  jobTitle: string;
  phone: string;
  email: string;
  company: string;
  website: string;
  address: string;
  specialty: string;
  specialtyPlaceholder: string;
  referral: string;
  referralPlaceholder: string;
  bio: string;
  bioPlaceholder: string;
  submit: string;
  submitting: string;
  success: string;
};

export function PartnerApplicationForm({ labels }: { labels: Labels }) {
  const [busy, setBusy] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      toast.success(labels.success);
      (e.currentTarget as HTMLFormElement).reset();
      setBusy(false);
    }, 600);
  }

  return (
    <form onSubmit={onSubmit} className="mt-12 flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Field label={labels.fullName} name="fullName" required />
        <Field label={labels.jobTitle} name="jobTitle" />
        <Field label={labels.phone} name="phone" type="tel" />
        <Field label={labels.email} name="email" type="email" required />
        <Field label={labels.company} name="company" />
        <Field label={labels.website} name="website" type="url" />
      </div>
      <Field label={labels.address} name="address" />
      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label={labels.specialty}
          name="specialty"
          placeholder={labels.specialtyPlaceholder}
        />
        <Field
          label={labels.referral}
          name="referral"
          placeholder={labels.referralPlaceholder}
        />
      </div>
      <label className="flex flex-col gap-3 md:grid md:grid-cols-[197px_1fr] md:items-start md:gap-6">
        <span className="font-display text-[clamp(1.5rem,2.2vw,2.25rem)] leading-[1.1]">
          {labels.bio}
        </span>
        <textarea
          name="bio"
          rows={6}
          placeholder={labels.bioPlaceholder}
          className="rounded-[24px] border border-ink/15 bg-cream px-5 py-4 text-base text-ink outline-none focus:border-ink"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[25px] border border-ink bg-orange py-5 text-base font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-[rgb(210,68,28)] disabled:opacity-60"
      >
        {busy ? labels.submitting : labels.submit}
        <ArrowRight aria-hidden className="size-5" />
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-3 md:grid md:grid-cols-[197px_1fr] md:items-center md:gap-6">
      <span className="font-display text-[clamp(1.5rem,2.2vw,2.25rem)] leading-[1.1]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-full border border-ink/15 bg-cream px-5 py-4 text-base text-ink outline-none focus:border-ink"
      />
    </label>
  );
}
