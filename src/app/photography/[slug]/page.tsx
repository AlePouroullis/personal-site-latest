import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllCollections, getCollection } from "@/lib/photos";
import PhotoColumn from "@/components/PhotoColumn";
import CollectionAudio from "@/components/CollectionAudio";
import { ThemeToggle } from "@/components/ThemeToggle";
import InlineMarkdown, { stripMarkdown } from "@/components/InlineMarkdown";

export async function generateStaticParams() {
  const collections = await getAllCollections();
  return collections.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await getCollection(slug);
  if (!c) return {};
  return {
    title: c.title,
    description: stripMarkdown(c.intro),
    openGraph: { images: [c.cover.src] },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await getCollection(slug);
  if (!c) notFound();

  const fmtDay = (d: Date) => d.getUTCDate();
  const fmtMonthYear = (d: Date) =>
    d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      timeZone: "UTC",
    });
  const sameMonth =
    c.dateEnd &&
    c.date.getUTCFullYear() === c.dateEnd.getUTCFullYear() &&
    c.date.getUTCMonth() === c.dateEnd.getUTCMonth();
  const date = c.dateEnd
    ? sameMonth
      ? `${fmtDay(c.date)}\u2013${fmtDay(c.dateEnd)} ${fmtMonthYear(c.date)}`
      : `${fmtDay(c.date)} ${fmtMonthYear(c.date)} \u2013 ${fmtDay(c.dateEnd)} ${fmtMonthYear(c.dateEnd)}`
    : fmtMonthYear(c.date);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <Link href="/photography">← Photography</Link>
        <ThemeToggle />
      </div>

      <header className="space-y-4">
        <h1
          className="text-3xl font-medium"
          style={{ color: "var(--heading-color)" }}
        >
          {c.title}
        </h1>
        <div
          className="text-sm space-x-2"
          style={{ color: "var(--text-muted)" }}
        >
          <span>{date}</span>
          {c.location && (
            <>
              <span>·</span>
              <span>{c.location}</span>
            </>
          )}
          {c.camera && (
            <>
              <span>·</span>
              <span>{c.camera}</span>
            </>
          )}
          {c.audio && (
            <>
              <span>·</span>
              <CollectionAudio audio={c.audio} />
            </>
          )}
        </div>
        <p
          className="leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          <InlineMarkdown text={c.intro} />
        </p>
      </header>

      <PhotoColumn photos={c.photos} />

      {c.outro && (
        <div
          className="leading-relaxed pt-4 space-y-4"
          style={{ color: "var(--text-secondary)" }}
        >
          {c.outro.split(/\n\s*\n/).map((para, i) => (
            <p key={i}>
              <InlineMarkdown text={para.trim()} />
            </p>
          ))}
        </div>
      )}

      <div className="pt-8">
        <Link href="/photography">← Back to photography</Link>
      </div>
    </div>
  );
}
