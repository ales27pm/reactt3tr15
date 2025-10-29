#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = execSync("git rev-parse --show-toplevel", {
  encoding: "utf8",
}).trim();

const files = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

function isBinaryBuffer(buffer) {
  if (buffer.length === 0) {
    return false;
  }

  const sliceLength = Math.min(buffer.length, 8192);
  const slice = buffer.subarray(0, sliceLength);

  let suspicious = 0;
  for (let i = 0; i < slice.length; i += 1) {
    const byte = slice[i];
    if (byte === 0) {
      return true;
    }

    const isCommonWhitespace = byte === 9 || byte === 10 || byte === 13;
    const isPrintable = byte >= 32 && byte <= 126;
    if (!isPrintable && !isCommonWhitespace) {
      suspicious += 1;
      if (suspicious / slice.length > 0.3) {
        return true;
      }
    }
  }

  return false;
}

const binaryFiles = [];

for (const file of files) {
  const absolute = path.join(repoRoot, file);
  let stats;
  try {
    stats = fs.statSync(absolute);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      // The file was removed locally but not yet committed. Skip it so
      // contributors can delete old binaries without tripping the guard.
      continue;
    }
    throw error;
  }
  if (!stats.isFile()) {
    continue;
  }

  const buffer = fs.readFileSync(absolute);
  if (isBinaryBuffer(buffer)) {
    binaryFiles.push(file);
  }
}

const attrOutput = execSync("git check-attr --stdin diff", {
  encoding: "utf8",
  input: `${files.join("\n")}\n`,
});

const gitBinaryFiles = attrOutput
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((line) => line.endsWith("diff: binary"))
  .map((line) => line.split(":")[0]);

let numstatOutput = "";
let nameStatusOutput = "";
try {
  numstatOutput = execSync("git diff --cached --numstat", { encoding: "utf8" });
  nameStatusOutput = execSync("git diff --cached --name-status", { encoding: "utf8" });
} catch (error) {
  // If diff fails (e.g. no staged changes), just keep going with an empty string.
  numstatOutput = "";
  nameStatusOutput = "";
}

const deletedInIndex = new Set(
  nameStatusOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split("\t"))
    .filter(([status]) => status === "D")
    .map(([, file]) => file)
    .filter(Boolean),
);

const stagedBinaryFiles = numstatOutput
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.startsWith("-\t-\t"))
  .map((line) => line.split("\t")[2] ?? "")
  .filter((file) => file && !deletedInIndex.has(file));

const allBinaryFindings = new Set([...binaryFiles, ...gitBinaryFiles, ...stagedBinaryFiles]);

if (allBinaryFindings.size > 0) {
  console.error("Binary files detected in repository:\n");
  [...allBinaryFindings].sort((a, b) => a.localeCompare(b)).forEach((file) => console.error(` - ${file}`));
  console.error("\nRemove these files or replace them with text-based equivalents before pushing.");
  process.exit(1);
}

console.log("No binary files detected.");
