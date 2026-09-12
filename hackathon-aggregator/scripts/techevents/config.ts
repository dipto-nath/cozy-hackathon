/** Platform configurations with Firecrawl extraction strategies */
export const PLATFORM_CONFIGS: Record<string, any> = {
  luma: {
    name: 'Luma',
    url: 'https://lu.ma/discover',
    platform_source: 'lu.ma',
    category: 'General Tech',
    extraction: {
      prompt: 'Extract all tech events, conferences, and meetups from this page. For each event, return: title, date (YYYY-MM-DD), location, url, fee_type (Free/Paid), mode (Online/Offline/Hybrid). Focus on developer/tech events.',
      schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                date: { type: 'string' },
                location: { type: 'string' },
                url: { type: 'string' },
                fee_type: { type: 'string', enum: ['Free', 'Paid'] },
                mode: { type: 'string', enum: ['Online', 'Offline', 'Hybrid'] }
              },
              required: ['title', 'date', 'location', 'url']
            }
          }
        },
        required: ['events']
      }
    }
  },
  web3events: {
    name: 'Web3 Events Guide',
    url: 'https://web3events.guide',
    platform_source: 'web3events.guide',
    category: 'Web3',
    extraction: {
      prompt: 'Extract all Web3/blockchain/crypto events. For each: title, date, location, url, fee_type, mode.',
      schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                date: { type: 'string' },
                location: { type: 'string' },
                url: { type: 'string' },
                fee_type: { type: 'string', enum: ['Free', 'Paid'] },
                mode: { type: 'string', enum: ['Online', 'Offline', 'Hybrid'] }
              },
              required: ['title', 'date', 'location', 'url']
            }
          }
        },
        required: ['events']
      }
    }
  },
  signal: {
    name: 'The Signal Directory',
    url: 'https://thesignal.directory/web3-events',
    platform_source: 'thesignal.directory',
    category: 'Web3',
    extraction: {
      prompt: 'Extract curated Web3 events. For each: title, date, location, url, fee_type, mode.',
      schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                date: { type: 'string' },
                location: { type: 'string' },
                url: { type: 'string' },
                fee_type: { type: 'string', enum: ['Free', 'Paid'] },
                mode: { type: 'string', enum: ['Online', 'Offline', 'Hybrid'] }
              },
              required: ['title', 'date', 'location', 'url']
            }
          }
        },
        required: ['events']
      }
    }
  },
  coinmarketcal: {
    name: 'CoinMarketCal',
    url: 'https://coinmarketcal.com/',
    platform_source: 'coinmarketcal.com',
    category: 'Web3',
    extraction: {
      prompt: 'Extract crypto/blockchain events from calendar. For each: title, date, location, url, fee_type, mode.',
      schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                date: { type: 'string' },
                location: { type: 'string' },
                url: { type: 'string' },
                fee_type: { type: 'string', enum: ['Free', 'Paid'] },
                mode: { type: 'string', enum: ['Online', 'Offline', 'Hybrid'] }
              },
              required: ['title', 'date', 'location', 'url']
            }
          }
        },
        required: ['events']
      }
    }
  }
};