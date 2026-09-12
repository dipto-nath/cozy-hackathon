/**
 * Tech Events Platform Configurations
 *
 * Plain ES-module (no TypeScript) so Node.js can import it directly.
 * Each platform config drives scrapeWithFirecrawl() in scrape.js.
 *
 * Firecrawl docs:
 *  - extract()  → LLM-powered structured extraction (best for dynamic/protected pages)
 *  - scrape()   → raw markdown/HTML (best for simple static pages)
 */

/** @type {Record<string, object>} */
export const PLATFORM_CONFIGS = {
  // ─────────────────────────────────────────────────────────────────────────
  // 1. Luma — Cloudflare-protected, React-rendered SPA
  //    Strategy: Firecrawl extract() with wait + scroll actions so the
  //    React hydration completes before LLM extraction runs.
  // ─────────────────────────────────────────────────────────────────────────
  luma: {
    name: 'Luma',
    url: 'https://lu.ma/discover',
    platform_source: 'lu.ma',
    category: 'General Tech',
    // Firecrawl browser actions executed BEFORE extraction
    actions: [
      { type: 'wait', milliseconds: 4000 },         // wait for CF challenge + React hydration
      { type: 'scroll', direction: 'down', amount: 3 }, // trigger lazy-loading
      { type: 'wait', milliseconds: 1500 },
    ],
    extraction: {
      prompt: `Extract all tech events, conferences, and developer meetups from this Luma discovery page.
For each event return: title, date (ISO format YYYY-MM-DD), location (city + country or "Virtual"),
the direct event URL (lu.ma/xxx), fee_type ("Free" or "Paid"), and mode ("Online", "Offline", or "Hybrid").
Focus on developer-relevant events. Skip social or non-tech events.`,
      schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title:    { type: 'string' },
                date:     { type: 'string', description: 'YYYY-MM-DD' },
                location: { type: 'string' },
                url:      { type: 'string' },
                fee_type: { type: 'string', enum: ['Free', 'Paid'] },
                mode:     { type: 'string', enum: ['Online', 'Offline', 'Hybrid'] },
              },
              required: ['title', 'date', 'url'],
            },
          },
        },
        required: ['events'],
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Web3 Events Guide
  // ─────────────────────────────────────────────────────────────────────────
  web3events: {
    name: 'Web3 Events Guide',
    url: 'https://web3events.guide',
    platform_source: 'web3events.guide',
    category: 'Web3',
    extraction: {
      prompt: `Extract all Web3, blockchain, crypto, and DeFi events listed on this page.
For each event return: title, date (YYYY-MM-DD), location, url, fee_type ("Free"/"Paid"), mode ("Online"/"Offline"/"Hybrid").`,
      schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title:    { type: 'string' },
                date:     { type: 'string' },
                location: { type: 'string' },
                url:      { type: 'string' },
                fee_type: { type: 'string', enum: ['Free', 'Paid'] },
                mode:     { type: 'string', enum: ['Online', 'Offline', 'Hybrid'] },
              },
              required: ['title', 'date', 'url'],
            },
          },
        },
        required: ['events'],
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. The Signal Directory — curated Web3 list
  // ─────────────────────────────────────────────────────────────────────────
  signal: {
    name: 'The Signal Directory',
    url: 'https://thesignal.directory/web3-events',
    platform_source: 'thesignal.directory',
    category: 'Web3',
    extraction: {
      prompt: `Extract all Web3 events from this curated directory page.
For each event return: title, date (YYYY-MM-DD), location, url, fee_type ("Free"/"Paid"), mode ("Online"/"Offline"/"Hybrid").`,
      schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title:    { type: 'string' },
                date:     { type: 'string' },
                location: { type: 'string' },
                url:      { type: 'string' },
                fee_type: { type: 'string', enum: ['Free', 'Paid'] },
                mode:     { type: 'string', enum: ['Online', 'Offline', 'Hybrid'] },
              },
              required: ['title', 'date', 'url'],
            },
          },
        },
        required: ['events'],
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. CoinMarketCal — crypto/blockchain summit calendar
  // ─────────────────────────────────────────────────────────────────────────
  coinmarketcal: {
    name: 'CoinMarketCal',
    url: 'https://coinmarketcal.com/',
    platform_source: 'coinmarketcal.com',
    category: 'Web3',
    extraction: {
      prompt: `Extract crypto and blockchain conference events from this calendar.
Only include events that are physical summits, conferences, or hackathons (not price events).
For each: title, date (YYYY-MM-DD), location, url, fee_type ("Free"/"Paid"), mode ("Online"/"Offline"/"Hybrid").`,
      schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title:    { type: 'string' },
                date:     { type: 'string' },
                location: { type: 'string' },
                url:      { type: 'string' },
                fee_type: { type: 'string', enum: ['Free', 'Paid'] },
                mode:     { type: 'string', enum: ['Online', 'Offline', 'Hybrid'] },
              },
              required: ['title', 'date', 'url'],
            },
          },
        },
        required: ['events'],
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. CoinPedia Events
  // ─────────────────────────────────────────────────────────────────────────
  coinpedia: {
    name: 'CoinPedia Events',
    url: 'https://coinpedia.org/events/',
    platform_source: 'coinpedia.org',
    category: 'Web3',
    extraction: {
      prompt: `Extract all blockchain and crypto events listed on CoinPedia's events page.
For each: title, date (YYYY-MM-DD), location, url, fee_type ("Free"/"Paid"), mode ("Online"/"Offline"/"Hybrid").`,
      schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title:    { type: 'string' },
                date:     { type: 'string' },
                location: { type: 'string' },
                url:      { type: 'string' },
                fee_type: { type: 'string', enum: ['Free', 'Paid'] },
                mode:     { type: 'string', enum: ['Online', 'Offline', 'Hybrid'] },
              },
              required: ['title', 'date', 'url'],
            },
          },
        },
        required: ['events'],
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6. KonfHub — Indian and global developer events
  // ─────────────────────────────────────────────────────────────────────────
  konfhub: {
    name: 'KonfHub',
    url: 'https://konfhub.com/events',
    platform_source: 'konfhub.com',
    category: 'General Tech',
    extraction: {
      prompt: `Extract all developer and tech events from KonfHub's events listing.
Focus on conferences, meetups, and hackathons. For each: title, date (YYYY-MM-DD), location (city + country),
url (full konfhub.com event URL), fee_type ("Free"/"Paid"), mode ("Online"/"Offline"/"Hybrid").`,
      schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title:    { type: 'string' },
                date:     { type: 'string' },
                location: { type: 'string' },
                url:      { type: 'string' },
                fee_type: { type: 'string', enum: ['Free', 'Paid'] },
                mode:     { type: 'string', enum: ['Online', 'Offline', 'Hybrid'] },
              },
              required: ['title', 'date', 'url'],
            },
          },
        },
        required: ['events'],
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Techmeme Events — lightweight HTML table
  // ─────────────────────────────────────────────────────────────────────────
  techmeme: {
    name: 'Techmeme Events',
    url: 'https://www.techmeme.com/events',
    platform_source: 'techmeme.com',
    category: 'General Tech',
    extraction: {
      prompt: `Extract all upcoming tech industry conferences and enterprise events from Techmeme's events page.
The page contains a tabular list. For each event return: title, date (YYYY-MM-DD), location, url,
fee_type ("Paid" as default for enterprise events), mode ("Online"/"Offline"/"Hybrid").`,
      schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title:    { type: 'string' },
                date:     { type: 'string' },
                location: { type: 'string' },
                url:      { type: 'string' },
                fee_type: { type: 'string', enum: ['Free', 'Paid'] },
                mode:     { type: 'string', enum: ['Online', 'Offline', 'Hybrid'] },
              },
              required: ['title', 'date', 'url'],
            },
          },
        },
        required: ['events'],
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 8. DevEvents
  // ─────────────────────────────────────────────────────────────────────────
  devevents: {
    name: 'DevEvents',
    url: 'https://devevents.co',
    platform_source: 'devevents.co',
    category: 'General Tech',
    extraction: {
      prompt: `Extract all developer events and conferences from DevEvents. The site has tech-stack filters.
For each event: title, date (YYYY-MM-DD), location, url, fee_type ("Free"/"Paid"), mode ("Online"/"Offline"/"Hybrid").
Include AI, cloud, web, mobile, and open-source events.`,
      schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title:    { type: 'string' },
                date:     { type: 'string' },
                location: { type: 'string' },
                url:      { type: 'string' },
                fee_type: { type: 'string', enum: ['Free', 'Paid'] },
                mode:     { type: 'string', enum: ['Online', 'Offline', 'Hybrid'] },
              },
              required: ['title', 'date', 'url'],
            },
          },
        },
        required: ['events'],
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 9. Sessionize — public directory of developer conferences
  // ─────────────────────────────────────────────────────────────────────────
  sessionize: {
    name: 'Sessionize',
    url: 'https://sessionize.com/events',
    platform_source: 'sessionize.com',
    category: 'General Tech',
    extraction: {
      prompt: `Extract all upcoming developer conferences and tech events from Sessionize's events directory.
For each event: title, date (YYYY-MM-DD), location (city + country), url (full sessionize.com or event URL),
fee_type ("Free"/"Paid"), mode ("Online"/"Offline"/"Hybrid").`,
      schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title:    { type: 'string' },
                date:     { type: 'string' },
                location: { type: 'string' },
                url:      { type: 'string' },
                fee_type: { type: 'string', enum: ['Free', 'Paid'] },
                mode:     { type: 'string', enum: ['Online', 'Offline', 'Hybrid'] },
              },
              required: ['title', 'date', 'url'],
            },
          },
        },
        required: ['events'],
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 10. Confs.tech — handled separately via GitHub raw JSON (see scrape.js)
  // ─────────────────────────────────────────────────────────────────────────
};

/** Ordered list of platforms that use Firecrawl extraction */
export const FIRECRAWL_PLATFORM_KEYS = [
  'luma', 'web3events', 'signal', 'coinmarketcal',
  'coinpedia', 'konfhub', 'techmeme', 'devevents', 'sessionize',
];
