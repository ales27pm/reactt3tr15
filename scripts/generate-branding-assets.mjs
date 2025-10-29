#!/usr/bin/env node
/**
 * Renders the React T3TR15 branding imagery from SVG sources so the repository stays
 * binary-free. The script runs automatically via `npm run assets:generate` (postinstall)
 * and may be invoked manually any time the artwork needs to be refreshed.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import url from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const assetsDir = path.join(projectRoot, "assets");
const brandingSourcesDir = path.join(assetsDir, "branding-sources");
const iosImagesDir = path.join(projectRoot, "ios", "Netsight", "Images.xcassets", "SplashScreenLogo.imageset");

const jobs = [
  {
    description: "Expo marketing icon",
    source: path.join(brandingSourcesDir, "app-icon.svg"),
    outputPath: path.join(assetsDir, "app-icon.png"),
    fitTo: { mode: "width", value: 1024 },
    background: "#020617",
  },
  {
    description: "Expo splash artwork",
    source: path.join(brandingSourcesDir, "splash.svg"),
    outputPath: path.join(assetsDir, "splash.png"),
    fitTo: { mode: "width", value: 1284 },
    background: "#020617",
  },
  {
    description: "iOS splash logo 1x",
    source: path.join(brandingSourcesDir, "splash-logo.svg"),
    outputPath: path.join(iosImagesDir, "image.png"),
    fitTo: { mode: "width", value: 256 },
  },
  {
    description: "iOS splash logo 2x",
    source: path.join(brandingSourcesDir, "splash-logo.svg"),
    outputPath: path.join(iosImagesDir, "image@2x.png"),
    fitTo: { mode: "width", value: 512 },
  },
  {
    description: "iOS splash logo 3x",
    source: path.join(brandingSourcesDir, "splash-logo.svg"),
    outputPath: path.join(iosImagesDir, "image@3x.png"),
    fitTo: { mode: "width", value: 768 },
  },
];

async function ensureDirectory(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function renderSvgToPng({ description, source, outputPath, fitTo, background }) {
  const [svgContents] = await Promise.all([fs.readFile(source, "utf8"), ensureDirectory(path.dirname(outputPath))]);

  const resvg = new Resvg(svgContents, {
    fitTo,
    background,
  });

  const pngData = resvg.render();
  const buffer = pngData.asPng();

  await fs.writeFile(outputPath, buffer);

  return { description, outputPath };
}

async function main() {
  try {
    const results = await Promise.all(jobs.map(renderSvgToPng));
    for (const result of results) {
      console.info(`Generated ${result.description} -> ${path.relative(projectRoot, result.outputPath)}`);
    }
  } catch (error) {
    console.error("Failed to generate branding assets:", error);
    process.exitCode = 1;
  }
}

main();
