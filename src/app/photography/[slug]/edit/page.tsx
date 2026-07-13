import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllCollections,
  getCollection,
  getRawManifest,
  getUnlistedPhotos,
} from "@/lib/photos";
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
  const unlisted = await getUnlistedPhotos(slug);
  const manifest = getRawManifest(slug);

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
          Cull, reorder, pick a cover — then <strong>save</strong> (⌘S) writes
          straight to <code>src/content/photography/{slug}.json</code>. Culled
          photos stay on disk and reappear here as “out”, so you can always
          re-edit. “copy JSON” gives the full manifest file if you prefer
          pasting.
        </p>
      </div>
      <PhotoEditor
        photos={c.photos}
        excluded={unlisted}
        slug={slug}
        cover={c.cover.src.split("/").pop()}
        manifest={manifest ?? undefined}
      />
    </div>
  );
}
