#!/usr/bin/env node
// Generates the demo imagery shipped with the project.
//
// Real photography is expected in production: every image path below is stored
// in the database and can be replaced from the admin panel (Menu, Gallery and
// Content screens) without touching code. Run `npm run images:generate` to
// rebuild these placeholders.

import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { dishSvg, sceneSvg, heroSvg } from "./lib-art.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const menu = JSON.parse(readFileSync(path.join(root, "data/menu.json"), "utf8"));
const out = (...p) => path.join(root, "public", ...p);

async function write(svg, file, { width, height } = {}) {
  await sharp(Buffer.from(svg))
    .resize(width, height, { fit: "cover" })
    .webp({ quality: 80, effort: 5 })
    .toFile(file);
}

async function run() {
  for (const dir of ["images/dishes", "images/categories", "images/gallery", "images"]) {
    await mkdir(out(dir), { recursive: true });
  }

  const artFor = Object.fromEntries(menu.categories.map((c) => [c.slug, c.art]));

  let count = 0;
  for (const dish of menu.dishes) {
    await write(dishSvg(dish.slug, artFor[dish.category] ?? "main", 1200, 900), out("images/dishes", `${dish.slug}.webp`));
    count++;
  }

  for (const cat of menu.categories) {
    await write(dishSvg(`cat-${cat.slug}`, cat.art, 1000, 700), out("images/categories", `${cat.slug}.webp`));
    count++;
  }

  for (const g of menu.gallery) {
    const svg =
      g.variant === "dish"
        ? dishSvg(g.seed, g.art ?? "main", 1000, 1000)
        : sceneSvg(g.seed, g.variant, 1200, 900);
    await write(svg, out("images/gallery", `${g.seed}.webp`));
    count++;
  }

  await write(heroSvg(2000, 1200), out("images", "hero.webp"));
  await write(heroSvg(1200, 630), out("images", "og.webp"), { width: 1200, height: 630 });
  await write(sceneSvg("about-dining", "interior", 1400, 1000), out("images", "about-dining.webp"));
  await write(sceneSvg("about-kitchen", "kitchen", 1400, 1000), out("images", "about-kitchen.webp"));
  await write(sceneSvg("about-street", "exterior", 1400, 1000), out("images", "about-street.webp"));
  await write(dishSvg("placeholder-dish", "main", 1200, 900), out("images", "placeholder.webp"));
  count += 6;

  // Brand mark: "muchhad" is Punjabi for moustache — so the logo is one.
  const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="Muchhad logo">
  <circle cx="60" cy="60" r="58" fill="#14110f"/>
  <circle cx="60" cy="60" r="52" fill="none" stroke="#c9a24a" stroke-width="2"/>
  <path d="M60 66 c -6 -12 -18 -20 -30 -16 c -12 4 -14 20 -4 26 c 12 7 26 -2 34 -10 z" fill="#f2a71b"/>
  <path d="M60 66 c 6 -12 18 -20 30 -16 c 12 4 14 20 4 26 c -12 7 -26 -2 -34 -10 z" fill="#f2a71b"/>
  <path d="M60 60 c -3 0 -5 2 -5 5 c 0 4 3 7 5 9 c 2 -2 5 -5 5 -9 c 0 -3 -2 -5 -5 -5 z" fill="#e08c07"/>
  <circle cx="44" cy="44" r="3.5" fill="#fbf7f0"/>
  <circle cx="76" cy="44" r="3.5" fill="#fbf7f0"/>
  <path d="M38 92 q 22 12 44 0" stroke="#c9a24a" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>`;
  await writeFile(out("logo.svg"), logo);
  await sharp(Buffer.from(logo)).resize(512, 512).png().toFile(out("icon.png"));
  await sharp(Buffer.from(logo)).resize(180, 180).png().toFile(out("apple-icon.png"));
  await sharp(Buffer.from(logo)).resize(32, 32).png().toFile(out("favicon.png"));

  console.log(`Generated ${count} images + brand marks.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
