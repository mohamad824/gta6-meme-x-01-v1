import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const botDir = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const sourcePath = join(botDir, "POST.json");
const destPath = join(outputDir, "POST.json");

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

if (!existsSync(sourcePath)) {
  fail(`POST.json not found at ${sourcePath}`);
}

let raw: string;
try {
  raw = readFileSync(sourcePath, "utf8");
} catch (error) {
  fail(`could not read ${sourcePath}: ${(error as Error).message}`);
}

let data: unknown;
try {
  data = JSON.parse(raw!);
} catch (error) {
  fail(`POST.json is not valid JSON: ${(error as Error).message}`);
}

if (typeof data !== "object" || data === null || Array.isArray(data)) {
  fail("POST.json must contain a JSON object");
}

const url = (data as Record<string, unknown>).url;
if (typeof url !== "string" || url.length === 0) {
  fail('POST.json must contain a string "url" field');
}

const postPattern = /^https:\/\/(x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/\d+$/;
if (!postPattern.test(url)) {
  fail(`"url" is not an X post address: ${url}`);
}

try {
  mkdirSync(outputDir, { recursive: true });
  copyFileSync(sourcePath, destPath);
} catch (error) {
  fail(`could not copy POST.json to ${destPath}: ${(error as Error).message}`);
}

// Verify the copy landed byte-identical before reporting success.
let copied: string;
try {
  copied = readFileSync(destPath, "utf8");
} catch (error) {
  fail(`could not re-read copied file at ${destPath}: ${(error as Error).message}`);
}
if (copied! !== raw) {
  fail(`copied POST.json at ${destPath} does not match ${sourcePath}`);
}

console.log(`copied ${sourcePath} -> ${destPath} (${raw.length} bytes)`);
console.log(`post url: ${url}`);
