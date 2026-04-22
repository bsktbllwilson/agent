"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  label: string;
  defaultUrl?: string | null;
  aspect?: "video" | "square";
  helpText?: string;
  disabled?: boolean;
  /** Extra path segment after the user-id folder (e.g. the listing id). */
  pathPrefix?: string;
};

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function extFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "bin";
}

export function ImageUpload({
  name,
  label,
  defaultUrl,
  aspect = "video",
  helpText,
  disabled = false,
  pathPrefix,
}: Props) {
  const [url, setUrl] = useState<string | null>(defaultUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    setError(null);
    if (!ACCEPT.includes(file.type)) {
      setError("JPG, PNG, WEBP, or GIF only.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Max 10 MB.");
      return;
    }

    setBusy(true);
    try {
      const sb = getBrowserSupabase();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        setError("Sign in to upload.");
        return;
      }
      const folder = pathPrefix
        ? `${user.id}/${pathPrefix}`
        : `${user.id}`;
      const path = `${folder}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)}.${extFromMime(file.type)}`;

      const { error: upErr } = await sb.storage
        .from("listings")
        .upload(path, file, {
          contentType: file.type,
          cacheControl: "3600",
        });
      if (upErr) throw upErr;

      const {
        data: { publicUrl },
      } = sb.storage.from("listings").getPublicUrl(path);
      setUrl(publicUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setUrl(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const aspectClass = aspect === "square" ? "aspect-square" : "aspect-[16/9]";

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input type="hidden" name={name} value={url ?? ""} />

      <div
        className={cn(
          "relative w-full overflow-hidden rounded-[1.25rem] border border-dashed border-ink/25 bg-ink/[0.02]",
          aspectClass,
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-ink/60 transition-colors hover:bg-ink/[0.04]">
            <ImagePlus aria-hidden className="size-6" />
            <span className="text-sm font-medium">
              {busy ? "Uploading…" : "Tap to upload"}
            </span>
            <span className="text-xs">JPG / PNG / WEBP · up to 10 MB</span>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT.join(",")}
              className="sr-only"
              disabled={disabled || busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </label>
        )}

        {url && !disabled && (
          <div className="absolute inset-x-3 bottom-3 flex justify-end gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-cream/95 px-3 py-1.5 text-xs font-medium text-ink backdrop-blur transition-colors hover:bg-cream">
              Replace
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT.join(",")}
                className="sr-only"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
              />
            </label>
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1 rounded-full bg-cream/95 px-3 py-1.5 text-xs font-medium text-ink backdrop-blur transition-colors hover:bg-cream"
            >
              <Trash2 aria-hidden className="size-3.5" />
              Remove
            </button>
          </div>
        )}

        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-cream/60 text-sm text-ink/80 backdrop-blur">
            Uploading…
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-orange" role="alert">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="text-xs text-ink/60">{helpText}</p>
      )}
    </div>
  );
}
