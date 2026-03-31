import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { guides } from "@/lib/seed-data";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: Props) {
  const guide = guides.find((g) => g.slug === params.slug);
  if (!guide) return { title: "Guide Not Found" };
  return {
    title: `${guide.title} — BridgeEast`,
    description: guide.content.slice(0, 160),
  };
}

function renderContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<br key={i} />);
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="mt-8 font-display text-3xl font-bold">
          {trimmed.slice(2)}
        </h1>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="mt-8 font-display text-2xl font-semibold">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="mt-6 font-display text-xl font-semibold">
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith("- **")) {
      const match = trimmed.match(/^- \*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
      if (match) {
        elements.push(
          <li key={i} className="ml-6 list-disc text-gray-700">
            <strong>{match[1]}</strong> — {match[2]}
          </li>
        );
      } else {
        const boldMatch = trimmed.match(/^- \*\*(.+?)\*\*(.*)$/);
        if (boldMatch) {
          elements.push(
            <li key={i} className="ml-6 list-disc text-gray-700">
              <strong>{boldMatch[1]}</strong>{boldMatch[2]}
            </li>
          );
        } else {
          elements.push(
            <li key={i} className="ml-6 list-disc text-gray-700">
              {trimmed.slice(2)}
            </li>
          );
        }
      }
    } else if (trimmed.startsWith("- ")) {
      elements.push(
        <li key={i} className="ml-6 list-disc text-gray-700">
          {trimmed.slice(2)}
        </li>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      elements.push(
        <li key={i} className="ml-6 list-decimal text-gray-700">
          {trimmed.replace(/^\d+\.\s/, "")}
        </li>
      );
    } else {
      elements.push(
        <p key={i} className="mt-3 text-gray-700 leading-relaxed">
          {trimmed}
        </p>
      );
    }
  });

  return elements;
}

export default function GuidePage({ params }: Props) {
  const guide = guides.find((g) => g.slug === params.slug);
  if (!guide) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/guides">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Guides
        </Button>
      </Link>

      <Badge>{guide.category}</Badge>
      <p className="mt-2 text-sm text-gray-500">
        Phase {guide.phase} &middot; {Math.ceil(guide.content.length / 1000)} min read
      </p>

      <article className="prose-bridgeeast mt-6">
        {renderContent(guide.content)}
      </article>
    </div>
  );
}
