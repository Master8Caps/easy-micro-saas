// One-off: generate the two static placeholder images for the swiping educative
// section (the "bin it" spam card + the "approve it" on-brand card).
//
//   node scripts/gen-swipe-images.mjs
//
// Writes PNGs to public/magic/. Re-run only if you want to regenerate (each run
// costs a gpt-image-1 "high" generation per image). Safe to delete this script
// afterwards — the committed PNGs are what the app ships.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

// --- Load OPENAI_API_KEY from .env.local (no dotenv dependency) -------------
const envPath = path.join(appRoot, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY (looked in apps/marketing/.env.local).");
  process.exit(1);
}

// Marketing Machine's own brand accent (matches journey-cards good gradient).
const BRAND = "indigo #6366f1 and violet #a855f7";

// The on-brand "approve it" card — minimal 3D render, the house default for
// SaaS/tech. Beautiful, calm, premium. This is the "this is your voice" post.
const GOOD_PROMPT = [
  "Minimal soft 3D render. Smooth matte geometric shapes, studio softbox lighting,",
  "gentle long shadows, abundant negative space, modern and clean — premium tech brand visual.",
  `Subject: a single calm, elegant abstract form suggesting effortless momentum and quiet confidence.`,
  `Use the brand palette as the dominant colour story: ${BRAND}, on a soft off-white studio backdrop.`,
  "Professional, polished, high production value. Tasteful, minimal and intentional. Crisp and well-composed.",
  "No text, no words, no letters, no captions, no logos, no watermarks, no UI or app screenshots,",
  "no charts or graphs. No human faces. Not oversaturated, not cluttered, no cheesy stock-photo look.",
].join(" ");

// The "bin it" card — deliberately bad. A garish, cluttered, oversaturated
// late-2000s spam-ad aesthetic so it reads instantly as slop you should reject.
// (We intentionally DON'T use the house quality/negative constraints here.)
const BAD_PROMPT = [
  "A deliberately tacky, garish discount-spam advertisement aesthetic.",
  "Loud clashing neon colours, harsh red and yellow, cheap radial sunburst background,",
  "cluttered busy composition, ugly drop shadows and gradients, low-effort cheesy stock-ad look,",
  "the visual equivalent of an annoying BUY NOW pop-up. Oversaturated and chaotic.",
  "No real readable text or letters, no logos, no watermarks, no human faces.",
].join(" ");

const TARGETS = [
  { name: "swipe-good.png", prompt: GOOD_PROMPT },
  { name: "swipe-bad.png", prompt: BAD_PROMPT },
];

const client = new OpenAI();
const outDir = path.join(appRoot, "public", "magic");
fs.mkdirSync(outDir, { recursive: true });

for (const { name, prompt } of TARGETS) {
  console.log(`Generating ${name}…`);
  const res = await client.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1536x1024", // landscape — matches the card's image well
    quality: "high",
  });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) {
    console.error(`  ✗ no image returned for ${name}`);
    process.exit(1);
  }
  const outPath = path.join(outDir, name);
  fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
  console.log(`  ✓ wrote ${path.relative(appRoot, outPath)}`);
}

console.log("Done.");
