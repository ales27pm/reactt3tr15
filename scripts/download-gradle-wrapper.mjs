#!/usr/bin/env node
/**
 * Downloads the Gradle wrapper bootstrap jar into the repository if it is missing
 * or invalid. This keeps binary artifacts out of version control while ensuring
 * CI and local developers can assemble Android builds without manual steps.
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function getRepoRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..");
}

async function readText(filePath) {
  return fs.readFile(filePath, "utf8");
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

function isZip(buffer) {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}

function computeSha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function extractMetadata(gradlewContents) {
  const versionMatch = gradlewContents.match(/WRAPPER_VERSION=\"([^\"]+)\"/);
  const shaMatch = gradlewContents.match(/WRAPPER_SHA256=\"([^\"]+)\"/);

  if (!versionMatch || !shaMatch) {
    throw new Error("Unable to determine Gradle wrapper metadata from android/gradlew");
  }

  return {
    version: versionMatch[1],
    sha256: shaMatch[1].toLowerCase(),
  };
}

function buildDownloadUrls(version) {
  const trimmedVersion = version.replace(/\.0$/, "");
  const candidates = [
    `https://downloads.gradle.org/distributions/gradle-${version}-wrapper.jar`,
    `https://services.gradle.org/distributions/gradle-${version}-wrapper.jar`,
    `https://downloads.gradle.org/distributions/gradle-${trimmedVersion}-wrapper.jar`,
    `https://services.gradle.org/distributions/gradle-${trimmedVersion}-wrapper.jar`,
    `https://raw.githubusercontent.com/gradle/gradle/v${version}/gradle/wrapper/gradle-wrapper.jar`,
    `https://raw.githubusercontent.com/gradle/gradle/v${trimmedVersion}/gradle/wrapper/gradle-wrapper.jar`,
  ];

  const seen = new Set();
  return candidates.filter((url) => {
    if (seen.has(url)) {
      return false;
    }
    seen.add(url);
    return true;
  });
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadBuffer(url, maxRetries = 5, initialBackoffMs = 500) {
  let attempt = 0;
  let backoff = initialBackoffMs;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      attempt += 1;
      const isLastAttempt = attempt >= maxRetries;
      if (isLastAttempt) {
        throw new Error(`Failed to download ${url} after ${maxRetries} attempts: ${error.message}`);
      }

      const jitter = Math.floor(Math.random() * backoff * 0.2);
      const delay = backoff + jitter;
      console.warn(`Retrying download in ${delay}ms (attempt ${attempt + 1} of ${maxRetries})`);
      await wait(delay);
      backoff *= 2;
    }
  }

  throw new Error(`Failed to download ${url}: exceeded retry budget`);
}

async function main() {
  const repoRoot = getRepoRoot();
  const gradlewPath = path.join(repoRoot, "android", "gradlew");
  const wrapperDir = path.join(repoRoot, "android", "gradle", "wrapper");
  const wrapperPath = path.join(wrapperDir, "gradle-wrapper.jar");

  const gradlewContents = await readText(gradlewPath);
  const { version, sha256 } = extractMetadata(gradlewContents);

  if (await fileExists(wrapperPath)) {
    const currentBuffer = await fs.readFile(wrapperPath);
    const checksum = computeSha256(currentBuffer);
    if (isZip(currentBuffer) && checksum === sha256) {
      console.info(`Gradle wrapper already present at ${wrapperPath} with expected checksum.`);
      return;
    }

    console.warn(`Existing Gradle wrapper at ${wrapperPath} is invalid; redownloading.`);
  }

  const sources = buildDownloadUrls(version);
  let lastError = null;

  for (const url of sources) {
    try {
      console.info(`Attempting to download Gradle wrapper from ${url}`);
      const buffer = await downloadBuffer(url);

      if (!isZip(buffer)) {
        throw new Error("Downloaded file is not a ZIP archive");
      }

      const checksum = computeSha256(buffer);
      if (checksum !== sha256) {
        throw new Error(`Checksum mismatch: expected ${sha256}, received ${checksum}`);
      }

      await ensureDirectory(wrapperDir);
      await fs.writeFile(wrapperPath, buffer);
      console.info(`Saved Gradle wrapper to ${wrapperPath}`);
      return;
    } catch (error) {
      lastError = error;
      console.warn(`Failed to download Gradle wrapper from ${url}: ${error.message}`);
    }
  }

  const finalMessage = lastError ? `${lastError.message}` : "All download attempts skipped";
  throw new Error(
    `Unable to download Gradle wrapper jar after trying ${sources.length} sources. Last error: ${finalMessage}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
