import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

interface SaveBody {
  cover: string;
  photos: { file: string; caption?: string }[];
}

function isSafeFileName(name: unknown): name is string {
  return (
    typeof name === "string" &&
    name.length > 0 &&
    !name.includes("/") &&
    !name.includes("\\") &&
    !name.includes("..")
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "bad slug" }, { status: 400 });
  }
  const manifestPath = path.join(
    process.cwd(),
    "src/content/photography",
    `${slug}.json`,
  );
  if (!fs.existsSync(manifestPath)) {
    return NextResponse.json({ error: "unknown collection" }, { status: 404 });
  }

  const body = (await req.json()) as SaveBody;
  const valid =
    isSafeFileName(body.cover) &&
    Array.isArray(body.photos) &&
    body.photos.length > 0 &&
    body.photos.every(
      (p) =>
        p &&
        isSafeFileName(p.file) &&
        (p.caption === undefined || typeof p.caption === "string"),
    );
  if (!valid) {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.cover = body.cover;
  manifest.photos = body.photos.map((p) =>
    p.caption ? { file: p.file, caption: p.caption } : { file: p.file },
  );
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  return NextResponse.json({ ok: true });
}
