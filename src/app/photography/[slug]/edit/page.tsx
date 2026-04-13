import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllCollections, getCollection } from "@/lib/photos";
import PhotoEditor from "@/components/PhotoEditor";

export async function generateStaticParams() {
  if (process.env.NODE_ENV === "production") return [];
  const collections = await getAllCollections();
  return collections.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { slug } = await params;
  const c = await getCollection(slug);
  if (!c) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link href={`/photography/${slug}`}>← Back to {c.title}</Link>
      </div>
      <div>
        <h1
          className="text-2xl font-medium"
          style={{ color: "var(--heading-color)" }}
        >
          Edit: {c.title}
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          Reorder and cull, then paste the JSON into{" "}
          <code>src/content/photography/{slug}.json</code> under{" "}
          <code>&quot;photos&quot;</code>.
        </p>
      </div>
      <PhotoEditor photos={c.photos} />
    </div>
  );
}
