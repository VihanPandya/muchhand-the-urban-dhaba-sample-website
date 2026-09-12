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
  const half = `M60 58 C 48 53 33 53 25 60 C 16 68 19 79 30 77 C 39 75 38 66 47 63 C 53 61 57 62 60 66 Z`;
  const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="Muchhad logo">
  <circle cx="60" cy="60" r="58" fill="#14110f"/>
  <circle cx="60" cy="60" r="51" fill="none" stroke="#c9a24a" stroke-width="1.5" opacity="0.9"/>
  <g fill="#f2a71b">
    <path d="${half}"/>
    <path d="${half}" transform="translate(120,0) scale(-1,1)"/>
  </g>
  <circle cx="60" cy="54" r="4.5" fill="#bd6d05"/>
  <path d="M34 92 q 26 10 52 0" stroke="#c9a24a" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.85"/>
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
