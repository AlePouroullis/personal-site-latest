import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllCollections, getCollection } from "@/lib/photos";
import PhotoColumn from "@/components/PhotoColumn";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    description: c.intro,
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

  const date = c.date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

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
        </div>
        <p
          className="leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {c.intro}
        </p>
      </header>

      <PhotoColumn photos={c.photos} />

      <div className="pt-8">
        <Link href="/photography">← Back to photography</Link>
      </div>
    </div>
  );
}
