#!/usr/bin/env node
/**
 * Fetches Rema 1000's full weekly catalogue and writes a slim
 * discounts.json next to index.html.
 *
 * Runs in GitHub Actions (Node 20+) — no dependencies.
 */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "discounts.json");

const BASE = "https://api.digital.rema1000.dk/api/v3/products";
const PER_PAGE = 100;
const UA = "madplan-web/1.0 (+https://github.com)";

async function fetchPage(page) {
  const url = `${BASE}?filter[is_advertised]=true&include=department,category&per_page=${PER_PAGE}&page=${page}`;
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/json" } });
  if (!r.ok) throw new Error(`HTTP ${r.status} on page ${page}`);
  return r.json();
}

function pickPrices(prices) {
  let active = null;
  let normal = null;
  for (const pr of prices || []) {
    if (pr.is_advertised && !active) active = pr;
    if (!pr.is_advertised && !pr.is_campaign) {
      if (!normal || pr.price > normal.price) normal = pr;
    }
  }
  return { active, normal };
}

function dateOnly(s) { return typeof s === "string" ? s.slice(0, 10) : null; }

function slim(p) {
  const { active, normal } = pickPrices(p.prices);
  if (!active) return null;
  return {
    id: p.id,
    n: p.name || "",
    u: p.underline || "",
    d: p.department?.name || "Andet",
    c: p.category?.name || "",
    p: active.price,
    np: normal?.price ?? null,
    cu: active.compare_unit || "",
    cup: active.compare_unit_price ?? 0,
    e: dateOnly(active.ending_at),
    s: dateOnly(active.starting_at),
    camp: active.is_campaign ? 1 : 0,
    img: p.images?.[0]?.medium || ""
  };
}

function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
}

(async () => {
  console.log("Fetching Rema 1000 weekly catalogue…");
  // Page 1 first — gives us last_page so we don't over-fetch.
  const first = await fetchPage(1);
  const lastPage = first?.meta?.pagination?.last_page || 1;
  const total = first?.meta?.pagination?.total || 0;
  console.log(`Total advertised: ${total} across ${lastPage} pages of ${PER_PAGE}.`);

  const all = [...first.data];
  for (let p = 2; p <= lastPage; p++) {
    const j = await fetchPage(p);
    all.push(...(j.data || []));
    console.log(`  page ${p}/${lastPage} — ${j.data.length} products`);
  }

  const products = all.map(slim).filter(Boolean);
  products.sort((a, b) =>
    a.d.localeCompare(b.d, "da") || a.n.localeCompare(b.n, "da")
  );

  // Determine "this week" from the most common starting date among campaigns.
  const startCounts = {};
  for (const x of products) if (x.camp && x.s) startCounts[x.s] = (startCounts[x.s] || 0) + 1;
  const weekStart = Object.entries(startCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const out = {
    fetchedAt: new Date().toISOString(),
    weekNo: isoWeek(new Date()),
    weekStart,
    store: "rema1000",
    productCount: products.length,
    campaignCount: products.filter(p => p.camp).length,
    products
  };

  await writeFile(OUT, JSON.stringify(out, null, 0) + "\n", "utf8");
  console.log(`Wrote ${OUT} — ${products.length} products, ${out.campaignCount} campaign-priced.`);
})().catch(err => {
  console.error("Refresh failed:", err);
  process.exit(1);
});
