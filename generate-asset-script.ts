/*
IMPORTANT NOTICE: DO NOT REMOVE
This script creates a lightweight SVG badge inspired by the React T3TR15 aesthetic.
Only run it when a user explicitly requests a fresh asset—do not generate art proactively.
use `npx tsx generate-asset-script.ts` to run this script.
*/
/* eslint-disable no-console */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const OUTPUT_FILE = "t3tr15-badge.svg";
const LOG_FILE = "assetGenerationLog";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grid" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="blocks" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#14b8a6" />
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="12" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect width="512" height="512" fill="url(#grid)" rx="32" />
  <g transform="translate(96, 96)" filter="url(#glow)">
    <rect x="0" y="0" width="96" height="96" fill="url(#blocks)" rx="18" />
    <rect x="112" y="0" width="96" height="96" fill="url(#blocks)" rx="18" />
    <rect x="112" y="112" width="96" height="96" fill="url(#blocks)" rx="18" />
    <rect x="224" y="112" width="96" height="96" fill="url(#blocks)" rx="18" />
    <rect x="224" y="224" width="96" height="96" fill="url(#blocks)" rx="18" />
  </g>
  <text x="256" y="420" font-family="'Courier New', monospace" font-size="56" fill="#f8fafc" text-anchor="middle">
    REACT T3TR15
  </text>
</svg>`;

async function logGeneration(outputPath: string): Promise<void> {
  const logDir = path.join(moduleDir, "logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logPath = path.join(logDir, LOG_FILE);
  const entry = `[${new Date().toISOString()}] Generated ${path.basename(outputPath)}\n`;
  await fs.promises.appendFile(logPath, entry, { encoding: "utf8" });
}

async function writeAsset(): Promise<string> {
  const assetsDir = path.join(moduleDir, "assets");
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  const outputPath = path.join(assetsDir, OUTPUT_FILE);
  await fs.promises.writeFile(outputPath, svgMarkup, { encoding: "utf8" });
  await logGeneration(outputPath);
  return outputPath;
}

async function main() {
  try {
    const outputPath = await writeAsset();
    console.log("Generated neon badge for React T3TR15:", outputPath);
  } catch (error) {
    console.error("Failed to generate asset", error);
    process.exitCode = 1;
  }
}

main();
