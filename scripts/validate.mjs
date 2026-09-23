import fs from "node:fs";

const file = new URL("../index.html", import.meta.url);
const html = fs.readFileSync(file, "utf8");

const requiredIds = ["page-today", "page-planhub", "page-labhub", "page-reflecthub", "page-youhub"];
for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) {
    throw new Error(`Missing required page: ${id}`);
  }
}

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
if (duplicates.length) {
  throw new Error(`Duplicate DOM IDs: ${[...new Set(duplicates)].join(", ")}`);
}

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
for (const [i, source] of scripts.entries()) {
  try {
    new Function(source);
  } catch (error) {
    throw new Error(`Inline script ${i + 1} failed to parse: ${error.message}`);
  }
}

console.log(`Blueprint validation passed: ${ids.length} DOM IDs, ${scripts.length} inline scripts.`);
