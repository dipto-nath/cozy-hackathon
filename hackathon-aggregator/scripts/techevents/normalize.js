/**
 * scripts/techevents/normalize.js
 *
 * Reads raw-techevents.json produced by scrape.js and outputs a clean
 * techevents.json matching the TechEvent schema exactly:
 *
 *  {
 *    id:              string   (UUID v4)
 *    title:           string
 *    event_date:      string   (YYYY-MM-DD)
 *    location:        string   (City, Country | Virtual)
 *    url:             string
 *    category:        "Web3" | "AI" | "General Tech"
 *    platform_source: string
 *    fee_type:        "Free" | "Paid"
 *    mode:            "Online" | "Offline" | "Hybrid"
 *  }
 *
 * Usage:
 *   node scripts/techevents/normalize.js
 *
 * Or as part of the pipeline:
 *   npm run pipeline:techevents
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_INPUT  = resolve(__dirname, 'raw-techevents.json');
const NORMALIZED_OUTPUT = resolve(__dirname, '../../src/data/techevents.json');

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const VALID_CATEGORIES = new Set(['Web3', 'AI', 'General Tech']);
const VALID_MODES      = new Set(['Online', 'Offline', 'Hybrid']);
const VALID_FEE_TYPES  = new Set(['Free', 'Paid']);

// Include events from 30 days ago to account for multi-day events
const CUTOFF_DATE = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

// ─────────────────────────────────────────────────────────────────────────────
// Category inference (fallback when scraper category is missing/invalid)
// ─────────────────────────────────────────────────────────────────────────────
function inferCategory(title = '', location = '', existing = '') {
  if (VALID_CATEGORIES.has(existing)) return existing;

  const text = `${title} ${location}`.toLowerCase();

  if (/web3|blockchain|crypto|ethereum|defi|nft|solana|polygon|dao|metaverse/.test(text)) {
    return 'Web3';
  }
  if (/\bai\b|\bml\b|machine.?learn|artificial.?intel|llm|gpt|neural|deep.?learn|data.?sci/.test(text)) {
    return 'AI';
  }
  return 'General Tech';
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode inference (fallback from location string when mode is missing)
// ─────────────────────────────────────────────────────────────────────────────
function inferMode(location = '', existing = '') {
  if (VALID_MODES.has(existing)) return existing;

  const loc = location.toLowerCase();
  if (/online|virtual|remote|digital|worldwide|global/.test(loc)) return 'Online';
  if (/hybrid/.test(loc)) return 'Hybrid';
  return 'Offline';
}

// ─────────────────────────────────────────────────────────────────────────────
// Date parsing — returns "YYYY-MM-DD" string or null if unparseable
// ─────────────────────────────────────────────────────────────────────────────
function parseDate(raw = '') {
  if (!raw) return null;

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // Try natural parse (handles ISO 8601, "Jan 15 2025", "15/01/2025", etc.)
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  // "MM/DD/YYYY" or "DD/MM/YYYY" — attempt both
  const parts = raw.split(/[\/\-\.\s]/);
  if (parts.length === 3) {
    // Try MM/DD/YYYY first (common in US scrape results)
    const attempt = new Date(`${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`);
    if (!isNaN(attempt.getTime())) return attempt.toISOString().split('T')[0];
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// URL validation & cleanup
// ─────────────────────────────────────────────────────────────────────────────
function cleanUrl(raw = '') {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  // Ensure protocol
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (!trimmed.startsWith('http')) return `https://${trimmed}`;
  return trimmed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Location cleanup
// ─────────────────────────────────────────────────────────────────────────────
function cleanLocation(raw = '') {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.toLowerCase() === 'tbd' || trimmed.toLowerCase() === 'n/a') {
    return 'TBD';
  }
  return trimmed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalize a single raw event into the canonical TechEvent schema
// Returns null if the event cannot be usefully normalized.
// ─────────────────────────────────────────────────────────────────────────────
function normalizeEvent(raw) {
  // Title is mandatory
  const title = (raw.title ?? '').trim();
  if (!title) return null;

  // URL is mandatory
  const url = cleanUrl(raw.url ?? raw.link ?? '');
  if (!url) return null;

  // Date — skip events with totally unparseable dates
  const event_date = parseDate(raw.date ?? raw.event_date ?? raw.startDate ?? '');
  if (!event_date) return null;

  // Skip events older than CUTOFF_DATE
  if (new Date(event_date) < CUTOFF_DATE) return null;

  const location = cleanLocation(raw.location ?? raw.city ?? '');
  const category = inferCategory(title, location, raw.category ?? '');
  const mode     = inferMode(location, raw.mode ?? '');
  const fee_type = VALID_FEE_TYPES.has(raw.fee_type) ? raw.fee_type : 'Free';
  const platform_source = (raw.platform_source ?? 'unknown').trim();

  return {
    id:              randomUUID(),
    title,
    event_date,
    location,
    url,
    category,
    platform_source,
    fee_type,
    mode,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Deduplication — by normalized (title + event_date) key
// When a duplicate is found, prefer the version with more complete location.
// ─────────────────────────────────────────────────────────────────────────────
function deduplicate(events) {
  const seen = new Map();

  for (const event of events) {
    const key = `${event.title.toLowerCase().replace(/\s+/g, ' ')}|${event.event_date}`;
    if (!seen.has(key)) {
      seen.set(key, event);
    } else {
      // Keep the one with a more informative location
      const existing = seen.get(key);
      if (existing.location === 'TBD' && event.location !== 'TBD') {
        seen.set(key, event);
      }
    }
  }

  return Array.from(seen.values());
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats logger
// ─────────────────────────────────────────────────────────────────────────────
function printStats(raw, normalized, deduped) {
  const bySrc = {};
  const byCat = { Web3: 0, AI: 0, 'General Tech': 0 };
  const byMode = { Online: 0, Offline: 0, Hybrid: 0 };

  for (const e of deduped) {
    bySrc[e.platform_source] = (bySrc[e.platform_source] ?? 0) + 1;
    byCat[e.category]  = (byCat[e.category]  ?? 0) + 1;
    byMode[e.mode]     = (byMode[e.mode]      ?? 0) + 1;
  }

  console.log('\n📊 Normalization Summary');
  console.log(`   Raw events:        ${raw.length}`);
  console.log(`   After normalize:   ${normalized.length}`);
  console.log(`   After dedupe:      ${deduped.length}`);
  console.log('\n   By source:');
  Object.entries(bySrc).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`     ${k.padEnd(24)} ${v}`));
  console.log('\n   By category:', byCat);
  console.log('   By mode:    ', byMode);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('⚙️  Starting normalization…');

  // Read raw input
  if (!existsSync(RAW_INPUT)) {
    console.error(`❌ raw-techevents.json not found at: ${RAW_INPUT}`);
    console.error('   Run first: npm run scrape:techevents');
    process.exit(1);
  }

  const rawJson = await readFile(RAW_INPUT, 'utf8');
  const rawEvents = JSON.parse(rawJson);
  console.log(`✅ Loaded ${rawEvents.length} raw events`);

  // Normalize
  const normalized = rawEvents
    .map(normalizeEvent)
    .filter(Boolean); // remove nulls

  // Deduplicate
  const deduped = deduplicate(normalized);

  // Sort by date ascending (upcoming events first)
  deduped.sort((a, b) => a.event_date.localeCompare(b.event_date));

  // Print stats
  printStats(rawEvents, normalized, deduped);

  // Ensure output directory exists
  const outDir = resolve(__dirname, '../../src/data');
  await mkdir(outDir, { recursive: true });

  // Write output
  await writeFile(NORMALIZED_OUTPUT, JSON.stringify(deduped, null, 2), 'utf8');
  console.log(`\n✅ techevents.json written → ${NORMALIZED_OUTPUT}`);
  console.log(`   Total events: ${deduped.length}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});