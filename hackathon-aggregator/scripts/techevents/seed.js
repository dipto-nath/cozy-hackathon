#!/usr/bin/env node
/**
 * Fetch all real tech events from Confs.tech GitHub repo
 * and write them to src/data/techevents.json
 */
import { randomUUID } from 'crypto';
import { writeFile } from 'fs/promises';

const TOPICS = [
  'accessibility','android','api','cfml','cpp','css','data','devops','dotnet',
  'general','identity','ios','iot','java','javascript','kotlin','leadership',
  'networking','opensource','performance','php','product','python','ruby',
  'rust','scala','security','sre','tech-comm','testing','typescript','ux'
];

const BASE = 'https://raw.githubusercontent.com/tech-conferences/conference-data/main/conferences';
const now = new Date();
const CUTOFF = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

function catFromTopic(topic, name) {
  const t = `${topic} ${name}`.toLowerCase();
  if (/web3|blockchain|crypto|ethereum|defi|nft/.test(t)) return 'Web3';
  if (/\bai\b|\bml\b|machine.?learn|artificial.?intel|llm|gpt|data/.test(t)) return 'AI';
  return 'General Tech';
}

async function fetchYear(year) {
  const results = await Promise.allSettled(
    TOPICS.map(async (topic) => {
      try {
        const r = await fetch(`${BASE}/${year}/${topic}.json`);
        if (!r.ok) return [];
        const confs = await r.json();
        return confs.map(c => ({ ...c, _topic: topic }));
      } catch {
        return [];
      }
    })
  );
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
}

async function main() {
  const currentYear = new Date().getFullYear();
  console.log(`Fetching years: ${currentYear}, ${currentYear + 1}...`);

  const [thisYear, nextYear] = await Promise.all([
    fetchYear(currentYear),
    fetchYear(currentYear + 1),
  ]);

  const all = [...thisYear, ...nextYear];
  console.log(`Raw events fetched: ${all.length}`);

  const seen = new Set();
  const events = [];

  for (const conf of all) {
    const date = conf.startDate || conf.date || '';
    if (!date) continue;
    const d = new Date(date);
    if (d < CUTOFF) continue;

    const key = `${(conf.name || '').toLowerCase().replace(/\s+/g, '')}|${date.split('T')[0]}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const loc = [conf.city, conf.country].filter(Boolean).join(', ') || 'Virtual';
    events.push({
      id: randomUUID(),
      title: conf.name,
      event_date: date.split('T')[0],
      location: conf.online ? 'Virtual' : loc,
      url: conf.url || 'https://confs.tech',
      category: catFromTopic(conf._topic, conf.name),
      platform_source: 'confs.tech',
      fee_type: 'Paid',
      mode: conf.online ? 'Online' : 'Offline',
    });
  }

  events.sort((a, b) => a.event_date.localeCompare(b.event_date));

  const byCat = events.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});

  console.log(`Events after filter + dedup: ${events.length}`);
  console.log('By category:', byCat);
  console.log('By mode:', events.reduce((acc, e) => { acc[e.mode] = (acc[e.mode] || 0) + 1; return acc; }, {}));

  const outPath = new URL('../../src/data/techevents.json', import.meta.url).pathname.replace(/%20/g, ' ');
  await writeFile(outPath, JSON.stringify(events, null, 2), 'utf8');
  console.log(`\n✅ Written ${events.length} events → ${outPath}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
