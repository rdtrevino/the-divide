#!/usr/bin/env node
// The design-craft screenshot matrix: every route × width × theme × scripts on/off, full page, motion reduced,
// fonts loaded. Writes PNGs and report.json (sideways overflow, h1, console errors). Needs `playwright` installed in
// the project (or globally) with Chromium.
//
//   node shoot.mjs --base http://localhost:3000 --routes /,/about --out shots
//     [--widths 320,390,768,1440] [--themes light,dark] [--js on,off] [--dsf 2] [--height 900]
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(join(process.cwd(), "noop.js"));
const { chromium } = require("playwright");

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const list = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

const base = arg("base", "http://localhost:3000").replace(/\/$/, "");
const routes = list(arg("routes", "/"));
const widths = list(arg("widths", "320,390,768,1440")).map(Number);
const themes = list(arg("themes", "light,dark"));
const jsModes = list(arg("js", "on,off"));
const dsf = Number(arg("dsf", "1"));
const height = Number(arg("height", "900"));
const out = arg("out", "shots");

const slug = (route) => (route === "/" ? "home" : route.replace(/^\/|\/$/g, "").replace(/[^a-z0-9]+/gi, "-"));

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const report = [];
for (const route of routes) {
  for (const width of widths) {
    for (const theme of themes) {
      for (const js of jsModes) {
        const context = await browser.newContext({
          viewport: { width, height },
          deviceScaleFactor: dsf,
          colorScheme: theme,
          reducedMotion: "reduce",
          javaScriptEnabled: js === "on",
        });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(String(e)));
        page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
        const res = await page.goto(base + route, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready).catch(() => {});
        await page.waitForTimeout(250);
        const facts = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          h1: document.querySelector("h1")?.textContent?.trim() ?? null,
        }));
        const file = `${slug(route)}-${width}-${theme}-${js === "on" ? "js" : "nojs"}.png`;
        await page.screenshot({ path: join(out, file), fullPage: true });
        report.push({
          file,
          status: res?.status(),
          overflow: facts.scrollWidth > facts.innerWidth,
          h1: facts.h1,
          errors,
        });
        await context.close();
      }
    }
  }
}
await browser.close();
writeFileSync(join(out, "report.json"), JSON.stringify(report, null, 2));
const bad = report.filter((r) => r.overflow || r.errors.length || !r.h1);
console.log(`${report.length} captures in ${out}/. ${bad.length ? `${bad.length} need a look:` : "No overflow, errors or missing h1."}`);
for (const r of bad) console.log(`  ${r.file}: ${[r.overflow && "sideways scroll", !r.h1 && "no h1", ...r.errors].filter(Boolean).join("; ")}`);
