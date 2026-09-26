import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const html = read("index.html");
const requiredPages = ["page-today", "page-plan", "page-lab", "page-reflect", "page-you"];
for (const id of requiredPages) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing required page: ${id}`);
}

const requiredAssets = [
  "assets/styles.css",
  "assets/app.js",
  "assets/week-composer.js",
  "assets/week-design.js",
  "assets/attention-connections.js",
  "assets/today.js",
  "assets/plan.js",
  "assets/day-design.js",
  "assets/rhythms.js",
  "assets/activation.js",
];
for (const asset of requiredAssets) {
  const full = path.join(root, asset);
  if (!fs.existsSync(full)) throw new Error(`Missing required asset: ${asset}`);
  if (fs.statSync(full).size === 0) throw new Error(`Empty required asset: ${asset}`);
}

if (!html.includes('href="assets/styles.css"')) throw new Error("index.html is not wired to assets/styles.css");
for (const src of ["assets/app.js", "assets/week-composer.js", "assets/week-design.js", "assets/attention-connections.js", "assets/day-design.js", "assets/rhythms.js", "assets/today.js", "assets/plan.js", "assets/activation.js"]) {
  if (!html.includes(`src="${src}"`)) throw new Error(`index.html is not wired to ${src}`);
}


for (const id of ["guideNowList","guideWarmList","guideLaterList","guideInsight","guideBridgeState","guideEditor"]) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing Life Guide surface: ${id}`);
}

for (const id of ["activationCard","activationSteps","activationNextAction","complexityToggle","complexityToggleLabel"]) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing activation surface: ${id}`);
}

for (const id of ["dayDesignCard","dayIntentPicker","daySuccess1","dayBoundary","dayMinimum","saveDayDesign"]) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing Day Design surface: ${id}`);
}

for (const id of ["rhythmList","choiceRuleList","weeklyRhythmGrid","rhythmEditor","choiceRuleEditor","newRhythmButton"]) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing Rhythms surface: ${id}`);
}

for (const id of ["weekModePicker","weekSuccess1","weekRealityGrid","weekRhythmList","weekMinimum","weekLightDay"]) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing Week Design surface: ${id}`);
}

for (const id of ["openQuickCatch","guideUnsortedList","guideUnsortedSection","quickCatchModal","quickCatchText","saveQuickCatch"]) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing Quick Catch surface: ${id}`);
}

for (const id of ["learningReviewHeadline","learningReviewCopy","learningReviewQueue","reviewProgressText","reviewProgressBar"]) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing Learning Review surface: ${id}`);
}
for (const stale of ["Weekly review · 18 minutes","Your system has three open loops worth closing."]) {
  if (html.includes(stale)) throw new Error(`Stale review language remains: ${stale}`);
}

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
if (inlineScripts.length) throw new Error(`Unexpected inline scripts remain: ${inlineScripts.length}`);

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
if (duplicates.length) throw new Error(`Duplicate DOM IDs: ${[...new Set(duplicates)].join(", ")}`);

for (const asset of requiredAssets.filter((x) => x.endsWith(".js"))) {
  const source = read(asset);
  try {
    new Function(source);
  } catch (error) {
    throw new Error(`${asset} failed to parse: ${error.message}`);
  }
}

const css = read("assets/styles.css");
if (!css.includes(":root") || !css.includes(".app")) throw new Error("Core design-system selectors are missing");

console.log(
  `Blueprint validation passed: ${ids.length} DOM IDs, ${requiredAssets.length} external assets, no inline app scripts.`
);
