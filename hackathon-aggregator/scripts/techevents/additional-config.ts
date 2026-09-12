import { PLATFORM_CONFIGS } from './config.js';

/** Additional platform configs */
export const ADDITIONAL_CONFIGS: Record<string, any> = {
  coinpedia: {
    name: 'CoinPedia Events',
    url: 'https://coinpedia.org/events/',
    platform_source: 'coinpedia.org',
    category: 'Web3',
    extraction: {
      prompt: 'Extract blockchain/crypto conferences and summits. For each: title, date, location, url, fee_type, mode.',
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
  konfhub: {
    name: 'KonfHub',
    url: 'https://konfhub.com/events',
    platform_source: 'konfhub.com',
    category: 'General Tech',
    extraction: {
      prompt: 'Extract developer/tech events. For each: title, date, location, url, fee_type, mode.',
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
  techmeme: {
    name: 'Techmeme Events',
    url: 'https://techmeme.com/events',
    platform_source: 'techmeme.com',
    category: 'General Tech',
    extraction: {
      prompt: 'Extract tech conferences from HTML table. For each: title, date, location, url, fee_type, mode.',
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
  devevents: {
    name: 'DevEvents',
    url: 'https://devevents.co',
    platform_source: 'devevents.co',
    category: 'General Tech',
    extraction: {
      prompt: 'Extract developer events and tech conferences. For each: title, date, location, url, fee_type, mode, tech_stack array.',
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
                mode: { type: 'string', enum: ['Online', 'Offline', 'Hybrid'] },
                tech_stack: { type: 'array', items: { type: 'string' } }
              },
              required: ['title', 'date', 'location', 'url']
            }
          }
        },
        required: ['events']
      }
    }
  },
  sessionize: {
    name: 'Sessionize',
    url: 'https://sessionize.com/events',
    platform_source: 'sessionize.com',
    category: 'General Tech',
    extraction: {
      prompt: 'Extract developer conferences from public directory. For each: title, date, location, url, fee_type, mode.',
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

/** All platform configs merged */
export const ALL_PLATFORM_CONFIGS = {
  ...PLATFORM_CONFIGS,
  ...ADDITIONAL_CONFIGS
};