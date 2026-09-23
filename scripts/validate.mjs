import fs from "node:fs";

const file = new URL("../index.html", import.meta.url);
const html = fs.readFileSync(file, "utf8");

const requiredIds = ["page-today", "page-plan", "page-lab", "page-reflect", "page-you"];
for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) {
    throw new Error(`Missing required page: ${id}`);
  }
}

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
const markupOnly = html.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi, "");
const ids = [...markupOnly.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
if (duplicates.length) {
  throw new Error(`Duplicate DOM IDs: ${[...new Set(duplicates)].join(", ")}`);
}

for (const [i, source] of scripts.entries()) {
  try {
    new Function(source);
  } catch (error) {
    throw new Error(`Inline script ${i + 1} failed to parse: ${error.message}`);
  }
}

console.log(`Blueprint validation passed: ${ids.length} markup IDs, ${scripts.length} inline scripts.`);
