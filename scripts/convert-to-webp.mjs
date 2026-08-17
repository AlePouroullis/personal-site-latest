#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const args = process.argv.slice(2);
  const firstPath = args.find((a) => !a.startsWith("--"));
  const targetDir = path.resolve(
    process.cwd(),
    firstPath || "public/essays/ambition",
  );
  const qualityArg = args.find((a) => a.startsWith("--quality="));
  const maxEdgeArg = args.find(
    (a) => a.startsWith("--maxEdge=") || a.startsWith("--maxWidth="),
  );
  const quality = qualityArg
    ? Math.max(1, Math.min(100, parseInt(qualityArg.split("=")[1], 10)))
    : 85;
  // The lightbox serves images at 100vw, so a retina viewport asks for far
  // more than 1600px and anything smaller visibly upscales.
  const maxEdge = maxEdgeArg
    ? Math.max(1, parseInt(maxEdgeArg.split("=")[1], 10))
    : 2400;
  const force = args.includes("--force");
  return { targetDir, quality, maxEdge, force };
}

function listImages(dirPath) {
  const allowed = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".heic",
    ".heif",
    ".JPG",
    ".JPEG",
    ".PNG",
    ".HEIC",
    ".HEIF",
    ".tiff",
  ]);
  return fs
    .readdirSync(dirPath)
    .filter((name) => allowed.has(path.extname(name)))
    .sort();
}

async function convertOne(inputPath, outputPath, quality, maxEdge, turn = 0) {
  // rotate() with no argument applies the EXIF orientation, so portrait
  // originals don't come out on their side.
  const image = sharp(inputPath, { failOnError: false }).rotate(
    turn || undefined,
  );
  const { hasAlpha } = await image.metadata();

  // Bounding both dimensions caps the long edge; passing width alone leaves
  // portrait images taller than intended.
  const resized = image.resize({
    width: maxEdge,
    height: maxEdge,
    withoutEnlargement: true,
    fit: "inside",
  });

  const webpOptions = hasAlpha
    ? { lossless: true, effort: 5 }
    : { quality, effort: 5 };

  await resized.webp(webpOptions).toFile(outputPath);
}

// sips writes the pixels in their stored order and drops the orientation tag,
// so a portrait HEIC lands on its side. Spotlight reports the *displayed*
// dimensions, so disagreement over which side is longer means a quarter turn.
function heicNeedsQuarterTurn(inputPath) {
  try {
    const meta = execSync(
      `mdls -raw -name kMDItemPixelWidth -name kMDItemPixelHeight ${JSON.stringify(inputPath)}`,
    ).toString();
    const [shownW, shownH] = meta.trim().split(/\s+/).map(Number);
    const raw = execSync(
      `sips -g pixelWidth -g pixelHeight ${JSON.stringify(inputPath)}`,
    ).toString();
    const rawW = Number(raw.match(/pixelWidth:\s*(\d+)/)?.[1]);
    const rawH = Number(raw.match(/pixelHeight:\s*(\d+)/)?.[1]);
    if (![shownW, shownH, rawW, rawH].every(Number.isFinite)) return false;
    return shownW > shownH !== rawW > rawH;
  } catch {
    return false;
  }
}

async function convertWithHeicFallback(
  inputPath,
  outputPath,
  quality,
  maxEdge,
) {
  try {
    await convertOne(inputPath, outputPath, quality, maxEdge);
    return "sharp";
  } catch (err) {
    if (!/\.heic$|\.heif$/i.test(inputPath)) throw err;
    const tmpJpg = `${inputPath}.tmp.jpg`;
    // Use macOS sips as a fallback to transcode HEIC/HEIF to JPEG
    execSync(
      `sips -s format jpeg ${JSON.stringify(
        inputPath,
      )} --out ${JSON.stringify(tmpJpg)}`,
    );
    try {
      const turn = heicNeedsQuarterTurn(inputPath) ? 90 : 0;
      await convertOne(tmpJpg, outputPath, quality, maxEdge, turn);
      return "sips";
    } finally {
      fs.unlinkSync(tmpJpg);
    }
  }
}

async function main() {
  const { targetDir, quality, maxEdge, force } = parseArgs();
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    console.error(
      `Target directory does not exist or is not a directory: ${targetDir}`,
    );
    process.exit(1);
  }

  const images = listImages(targetDir);
  if (images.length === 0) {
    console.log("No images found to convert.");
    return;
  }

  console.log(`Converting ${images.length} image(s) in ${targetDir}`);
  console.log(
    `Settings: quality=${quality}, maxEdge=${maxEdge}${force ? ", force" : ""}`,
  );

  const results = await Promise.all(
    images.map(async (fileName) => {
      const inputPath = path.join(targetDir, fileName);
      const ext = path.extname(fileName);
      const outName = `${path.basename(fileName, ext)}.webp`;
      const outputPath = path.join(targetDir, outName);

      if (fs.existsSync(outputPath) && !force) {
        return { fileName, status: "skipped", reason: "exists", via: null };
      }

      try {
        const via = await convertWithHeicFallback(
          inputPath,
          outputPath,
          quality,
          maxEdge,
        );
        return { fileName, status: "ok", via };
      } catch (err) {
        return {
          fileName,
          status: "error",
          reason: err?.message || String(err),
          via: null,
        };
      }
    }),
  );

  for (const r of results) {
    if (r.status === "ok") {
      console.log(
        `✓ ${r.fileName} -> ${path.basename(
          r.fileName,
          path.extname(r.fileName),
        )}.webp (${r.via})`,
      );
    } else if (r.status === "skipped") {
      console.log(`• ${r.fileName} skipped (${r.reason})`);
    } else {
      console.error(`✗ ${r.fileName} failed: ${r.reason}`);
    }
  }

  const okCount = results.filter((r) => r.status === "ok").length;
  const skipCount = results.filter((r) => r.status === "skipped").length;
  const errCount = results.filter((r) => r.status === "error").length;
  console.log(`Done. ok=${okCount}, skipped=${skipCount}, errors=${errCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
