import fs from "fs";
import path from "path";
import sharp from "sharp";

const manifestDir = path.join(process.cwd(), "src/content/photography");
const imageDir = path.join(process.cwd(), "public/photography");

export interface Photo {
  src: string;
  caption?: string;
  width: number;
  height: number;
  blurDataURL: string;
}

export interface CollectionAudio {
  src: string;
  title: string;
}

export interface CollectionMeta {
  slug: string;
  title: string;
  date: Date;
  dateEnd?: Date;
  intro: string;
  outro?: string;
  location?: string;
  camera?: string;
  audio?: CollectionAudio;
  count: number;
  cover: Photo;
}

export interface Collection extends CollectionMeta {
  photos: Photo[];
}

interface ManifestPhoto {
  file: string;
  caption?: string;
}

interface Manifest {
  title: string;
  date: string;
  dateEnd?: string;
  intro: string | string[];
  outro?: string | string[];
  location?: string;
  camera?: string;
  audio?: { file: string; title: string };
  cover: string;
  photos: ManifestPhoto[];
}

async function loadPhoto(slug: string, entry: ManifestPhoto): Promise<Photo> {
  const filePath = path.join(imageDir, slug, entry.file);
  const img = sharp(filePath);
  const { width = 0, height = 0 } = await img.metadata();
  const blur = await img
    .clone()
    .resize(10, null, { fit: "inside" })
    .webp({ quality: 30 })
    .toBuffer();
  const photo: Photo = {
    src: `/photography/${slug}/${entry.file}`,
    width,
    height,
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
  };
  if (entry.caption) photo.caption = entry.caption;
  return photo;
}

function listSlugs(): string[] {
  if (!fs.existsSync(manifestDir)) return [];
  return fs
    .readdirSync(manifestDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

function readManifest(slug: string): Manifest {
  const raw = fs.readFileSync(path.join(manifestDir, `${slug}.json`), "utf8");
  return JSON.parse(raw);
}

function asString(v: string | string[]): string {
  return Array.isArray(v) ? v.join(" ") : v;
}

export async function getAllCollections(): Promise<CollectionMeta[]> {
  const metas = await Promise.all(
    listSlugs().map(async (slug) => {
      const m = readManifest(slug);
      const cover = await loadPhoto(slug, { file: m.cover });
      const meta: CollectionMeta = {
        slug,
        title: m.title,
        date: new Date(m.date),
        intro: asString(m.intro),
        count: m.photos.length,
        cover,
      };
      if (m.dateEnd) meta.dateEnd = new Date(m.dateEnd);
      if (m.outro) meta.outro = asString(m.outro);
      if (m.location) meta.location = m.location;
      if (m.camera) meta.camera = m.camera;
      if (m.audio)
        meta.audio = {
          src: `/photography/${slug}/${m.audio.file}`,
          title: m.audio.title,
        };
      return meta;
    }),
  );
  return metas.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// Raw manifest JSON, for tooling that needs the file's full shape (edit page).
export function getRawManifest(slug: string): Record<string, unknown> | null {
  if (!listSlugs().includes(slug)) return null;
  return readManifest(slug) as unknown as Record<string, unknown>;
}

// Images present in the collection's directory but absent from its manifest —
// the cull pile, kept on disk so the edit page can resurface them.
export async function getUnlistedPhotos(slug: string): Promise<Photo[]> {
  if (!listSlugs().includes(slug)) return [];
  const m = readManifest(slug);
  const listed = new Set(m.photos.map((p) => p.file));
  const dir = path.join(imageDir, slug);
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(webp|jpe?g|png|avif)$/i.test(f))
    .filter((f) => !listed.has(f))
    .sort();
  return Promise.all(files.map((f) => loadPhoto(slug, { file: f })));
}

export async function getCollection(slug: string): Promise<Collection | null> {
  if (!listSlugs().includes(slug)) return null;
  const m = readManifest(slug);
  const photos = await Promise.all(m.photos.map((p) => loadPhoto(slug, p)));
  const cover =
    photos.find((p) => p.src.endsWith(m.cover)) ??
    (await loadPhoto(slug, { file: m.cover }));
  const collection: Collection = {
    slug,
    title: m.title,
    date: new Date(m.date),
    intro: asString(m.intro),
    count: photos.length,
    cover,
    photos,
  };
  if (m.dateEnd) collection.dateEnd = new Date(m.dateEnd);
  if (m.outro) collection.outro = asString(m.outro);
  if (m.location) collection.location = m.location;
  if (m.camera) collection.camera = m.camera;
  if (m.audio)
    collection.audio = {
      src: `/photography/${slug}/${m.audio.file}`,
      title: m.audio.title,
    };
  return collection;
}
