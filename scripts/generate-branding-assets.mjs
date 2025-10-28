#!/usr/bin/env node
/**
 * Materialises the branded splash and icon imagery from base64 sources so the repository
 * can remain binary-free. Automatically invoked via `npm run assets:generate` (postinstall),
 * but safe to rerun manually whenever assets need to be refreshed.
 */
import { promises as fs } from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const assetsDir = path.join(projectRoot, "assets");
const brandingSourcesDir = path.join(assetsDir, "branding-sources");
const iosImagesDir = path.join(projectRoot, "ios", "Netsight", "Images.xcassets", "SplashScreenLogo.imageset");

const files = [
  {
    description: "Expo marketing icon",
    outputPath: path.join(assetsDir, "app-icon.png"),
    source: path.join(brandingSourcesDir, "app-icon.base64"),
  },
  {
    description: "Expo splash artwork",
    outputPath: path.join(assetsDir, "splash.png"),
    source: path.join(brandingSourcesDir, "splash.base64"),
  },
  {
    description: "iOS splash logo 1x",
    outputPath: path.join(iosImagesDir, "image.png"),
    source: path.join(brandingSourcesDir, "splash-logo@1x.base64"),
  },
  {
    description: "iOS splash logo 2x",
    outputPath: path.join(iosImagesDir, "image@2x.png"),
    source: path.join(brandingSourcesDir, "splash-logo@2x.base64"),
  },
  {
    description: "iOS splash logo 3x",
    outputPath: path.join(iosImagesDir, "image@3x.png"),
    source: path.join(brandingSourcesDir, "splash-logo@3x.base64"),
  },
];

async function ensureDirectory(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function materializeAsset({ description, outputPath, source }) {
  const parent = path.dirname(outputPath);
  await ensureDirectory(parent);
  const contents = await fs.readFile(source, "utf8");
  const normalized = contents.replace(/\s+/g, "");
  const buffer = Buffer.from(normalized, "base64");
  await fs.writeFile(outputPath, buffer);
  return { description, outputPath };
}

async function main() {
  try {
    const results = await Promise.all(files.map(materializeAsset));
    for (const result of results) {
      console.info(`Generated ${result.description} -> ${path.relative(projectRoot, result.outputPath)}`);
    }
  } catch (error) {
    console.error("Failed to generate branding assets:", error);
    process.exitCode = 1;
  }
}

main();
