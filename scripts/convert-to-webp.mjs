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
    firstPath || "public/essays/ambition"
  );
  const qualityArg = args.find((a) => a.startsWith("--quality="));
  const maxWidthArg = args.find((a) => a.startsWith("--maxWidth="));
  const quality = qualityArg
    ? Math.max(1, Math.min(100, parseInt(qualityArg.split("=")[1], 10)))
    : 78;
  const maxWidth = maxWidthArg
    ? Math.max(1, parseInt(maxWidthArg.split("=")[1], 10))
    : 1600;
  return { targetDir, quality, maxWidth };
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
    ".tiff"
  ]);
  return fs
    .readdirSync(dirPath)
    .filter((name) => allowed.has(path.extname(name)))
    .sort();
}

async function convertOne(inputPath, outputPath, quality, maxWidth) {
  let image = sharp(inputPath, { failOnError: false });
  const metadata = await image.metadata();
  const hasAlpha = Boolean(metadata.hasAlpha);
  const width = metadata.width ?? 0;

  if (width > maxWidth) {
    image = image.resize({
      width: maxWidth,
      withoutEnlargement: true,
      fit: "inside",
    });
  }

  const webpOptions = hasAlpha
    ? { lossless: true, effort: 5 }
    : { quality, effort: 5 };

  await image.webp(webpOptions).toFile(outputPath);
}

async function convertWithHeicFallback(
  inputPath,
  outputPath,
  quality,
  maxWidth
) {
  try {
    await convertOne(inputPath, outputPath, quality, maxWidth);
    return "sharp";
  } catch (err) {
    if (!/\.heic$|\.heif$/i.test(inputPath)) throw err;
    try {
      const tmpJpg = `${inputPath}.tmp.jpg`;
      // Use macOS sips as a fallback to transcode HEIC/HEIF to JPEG
      execSync(
        `sips -s format jpeg ${JSON.stringify(
          inputPath
        )} --out ${JSON.stringify(tmpJpg)}`
      );
      await convertOne(tmpJpg, outputPath, quality, maxWidth);
      fs.unlinkSync(tmpJpg);
      return "sips";
    } catch (e2) {
      throw e2;
    }
  }
}

async function main() {
  const { targetDir, quality, maxWidth } = parseArgs();
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    console.error(
      `Target directory does not exist or is not a directory: ${targetDir}`
    );
    process.exit(1);
  }

  const images = listImages(targetDir);
  if (images.length === 0) {
    console.log("No images found to convert.");
    return;
  }

  console.log(`Converting ${images.length} image(s) in ${targetDir}`);
  console.log(`Settings: quality=${quality}, maxWidth=${maxWidth}`);

  const results = await Promise.all(
    images.map(async (fileName) => {
      const inputPath = path.join(targetDir, fileName);
      const ext = path.extname(fileName);
      const outName = `${path.basename(fileName, ext)}.webp`;
      const outputPath = path.join(targetDir, outName);

      if (fs.existsSync(outputPath)) {
        return { fileName, status: "skipped", reason: "exists", via: null };
      }

      try {
        const via = await convertWithHeicFallback(
          inputPath,
          outputPath,
          quality,
          maxWidth
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
    })
  );

  for (const r of results) {
    if (r.status === "ok") {
      console.log(
        `✓ ${r.fileName} -> ${path.basename(
          r.fileName,
          path.extname(r.fileName)
        )}.webp (${r.via})`
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
