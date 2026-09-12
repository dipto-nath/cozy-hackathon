/**
 * scripts/techevents/scrape.js
 *
 * Firecrawl-powered Tech Events scraper.
 * Fetches from 9 platforms via Firecrawl extract() and Confs.tech via GitHub JSON.
 *
 * Usage:
 *   FIRECRAWL_API_KEY=fc-xxx node scripts/techevents/scrape.js
 *   (or set key in .env and use dotenv)
 *
 * Output: scripts/techevents/raw-techevents.json
 */

import FirecrawlApp from '@mendable/firecrawl-js';
import { writeFile } from 'fs/promises';
import { PLATFORM_CONFIGS, FIRECRAWL_PLATFORM_KEYS, CONFSTECH_TOPICS } from './config.js';

// ─── Firecrawl client ────────────────────────────────────────────────────────
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY ?? 'fc-your-api-key-here';

if (FIRECRAWL_API_KEY === 'fc-your-api-key-here') {
  console.warn(
    '⚠️  No FIRECRAWL_API_KEY set. Set it as an environment variable:\n' +
    '   export FIRECRAWL_API_KEY=fc-xxx\n' +
    '   Then re-run: npm run scrape:techevents\n'
  );
}

const firecrawl = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });

// ─────────────────────────────────────────────────────────────────────────────
// Firecrawl extraction helper
// Uses the `extract` endpoint which runs an LLM over the rendered page content.
// This is the correct approach for:
//   - Cloudflare-protected pages (Luma)          → renders in Firecrawl's browser
//   - React SPAs that need JS execution           → actions: wait + scroll
//   - Pages with anti-bot measures               → Firecrawl handles bypasses
// ─────────────────────────────────────────────────────────────────────────────
async function scrapeWithFirecrawl(platformKey) {
  const config = PLATFORM_CONFIGS[platformKey];
  console.log(`\n🔍 Scraping ${config.name} (${config.url})…`);

  try {
    /** @type {import('@mendable/firecrawl-js').ScrapeParams} */
    const scrapeOptions = {
      formats: ['extract'],
      extract: {
        prompt: config.extraction.prompt,
        schema: config.extraction.schema,
      },
    };

    // Luma and other JS-heavy SPAs get browser actions so the page fully
    // renders before the LLM extraction runs.
    if (config.actions) {
      scrapeOptions.actions = config.actions;
    }

    const result = await firecrawl.scrapeUrl(config.url, scrapeOptions);

    if (!result.success) {
      console.warn(`  ⚠️  Firecrawl error for ${config.name}:`, result.error ?? 'unknown error');
      return [];
    }

    const extracted = result.extract;
    if (!extracted?.events || !Array.isArray(extracted.events)) {
      console.warn(`  ⚠️  No events array in extraction result for ${config.name}`);
      return [];
    }

    const events = extracted.events
      .filter(e => e.title && e.url)
      .map(event => ({
        title:           event.title.trim(),
        date:            event.date ?? '',
        location:        event.location ?? 'TBD',
        url:             event.url,
        category:        config.category,
        platform_source: config.platform_source,
        fee_type:        normalizeEnum(event.fee_type, ['Free', 'Paid'], 'Free'),
        mode:            normalizeEnum(event.mode, ['Online', 'Offline', 'Hybrid'], 'Offline'),
      }));

    console.log(`  ✅ ${events.length} events extracted from ${config.name}`);
    return events;
  } catch (err) {
    console.error(`  ❌ Error scraping ${config.name}:`, err.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────────
// Confs.tech — Direct GitHub per-topic JSON fetch
// Repo structure: conferences/{year}/{topic}.json  (NOT a single conferences.json)
// ─────────────────────────────────────────────────────────────────────────────────
async function fetchConfsTechEvents() {
  console.log('\n🔍 Fetching Confs.tech from GitHub per-topic JSON…');
  const BASE = 'https://raw.githubusercontent.com/tech-conferences/conference-data/main/conferences';
  const CUTOFF = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1];

  const results = await Promise.allSettled(
    years.flatMap(year =>
      CONFSTECH_TOPICS.map(async (topic) => {
        try {
          const r = await fetch(`${BASE}/${year}/${topic}.json`);
          if (!r.ok) return [];
          const confs = await r.json();
          return confs.map(c => ({ ...c, _topic: topic }));
        } catch {
          return [];
        }
      })
    )
  );

  const all = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  const seen = new Set();
  const events = [];

  for (const conf of all) {
    const date = conf.startDate || conf.date || '';
    if (!date) continue;
    if (new Date(date) < CUTOFF) continue;

    const key = `${(conf.name || '').toLowerCase().replace(/\s+/g, '')}|${date.split('T')[0]}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const loc = [conf.city, conf.country].filter(Boolean).join(', ') || 'Virtual';
    events.push({
      title:           conf.name,
      date:            date.split('T')[0],
      location:        conf.online ? 'Virtual' : loc,
      url:             conf.url || 'https://confs.tech',
      category:        categorizeName(conf.name, [conf._topic]),
      platform_source: 'confs.tech',
      fee_type:        'Paid',
      mode:            conf.online ? 'Online' : 'Offline',
    });
  }

  console.log(`  ✅ ${events.length} events from Confs.tech`);
  return events;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Auto-categorize an event by keyword matching on name + tags */
function categorizeName(name = '', tags = []) {
  const text = `${name} ${tags.join(' ')}`.toLowerCase();
  if (/web3|blockchain|crypto|ethereum|defi|nft|solana|polygon/.test(text)) return 'Web3';
  if (/\bai\b|ml\b|machine learning|artificial intelligence|llm|gpt|neural|data science/.test(text)) return 'AI';
  return 'General Tech';
}

/** Ensure a value is one of the allowed enum values, or return the default */
function normalizeEnum(value, allowed, fallback) {
  if (value && allowed.includes(value)) return value;
  return fallback;
}

/** Simple sleep for rate-limiting */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ─────────────────────────────────────────────────────────────────────────────
// Main pipeline
// ─────────────────────────────────────────────────────────────────────────────
export async function scrapeAllPlatforms() {
  const allEvents = [];

  // --- Firecrawl platforms (one at a time to respect rate limits) ---
  for (const key of FIRECRAWL_PLATFORM_KEYS) {
    const events = await scrapeWithFirecrawl(key);
    allEvents.push(...events);
    await sleep(2500); // 2.5 s between requests
  }

  // --- Confs.tech direct GitHub fetch ---
  const confsTechEvents = await fetchConfsTechEvents();
  allEvents.push(...confsTechEvents);

  console.log(`\n📦 Total raw events collected: ${allEvents.length}`);
  return allEvents;
}

async function main() {
  console.log('🚀 Starting Tech Events scraping pipeline…');
  console.log('   Time:', new Date().toISOString());

  const events = await scrapeAllPlatforms();

  const outputPath = new URL('./raw-techevents.json', import.meta.url).pathname;
  await writeFile(outputPath, JSON.stringify(events, null, 2), 'utf8');

  console.log(`\n✅ Raw data saved → ${outputPath}`);
  console.log('   Next step: npm run normalize:techevents');
}

// Run when called directly: node scripts/techevents/scrape.js
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}