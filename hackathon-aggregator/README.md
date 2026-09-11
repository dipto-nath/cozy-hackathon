# HackAggregator — Hackathon Aggregator Frontend

A cozy, warm-toned hackathon discovery app built with **React + TypeScript + Vite + Tailwind CSS**.
Browse hackathons aggregated from platforms like Devpost, MLH, and Unstop; filter by mode, fee, and state; search across titles and organizations; and track registration deadlines with countdown badges.

## Features

- 🔍 **Debounced search** (300 ms) across hackathon titles and organizations
- 🎛️ **Filters** — mode (Online / Offline / Hybrid), fee type (Free / Paid), and state location
- ⏳ **Deadline countdowns** with urgent (≤ 2 days) pulse badges and expired states
- 🌗 **Light / dark theme** toggle persisted to `localStorage` (`hack-theme` key)
- 🦴 **Loading skeletons** with shimmer animation, plus empty and error states
- 🎨 Custom design system: cream / sage / terracotta / dusk / night palettes, soft shadows, `4xl` radii

## Getting started

```bash
npm install
npm run dev      # start dev server (http://localhost:5173)
```

Other scripts:

```bash
npm run build    # type-check (tsc -b) + production build to dist/
npm run lint     # ESLint (flat config)
npm run preview  # serve the production build locally
```

## Backend API

The frontend expects a REST API at `http://localhost:8000/api/hackathons` (configurable via `API_BASE` in `src/hooks/useHackathons.ts`).

Supported query parameters:

| Param    | Values                              | Description              |
| -------- | ----------------------------------- | ------------------------ |
| `mode`   | `Online` \| `Offline` \| `Hybrid`   | Event mode filter        |
| `fee`    | `Free` \| `Paid`                    | Entry fee filter         |
| `state`  | e.g. `Karnataka`                    | State/location filter    |
| `search` | free text                           | Title/organization query |

Expected response shape (`Hackathon[]`):

```json
[
  {
    "id": "string",
    "title": "string",
    "organization": "string",
    "platform_source": "string",
    "url": "string",
    "mode": "Online",
    "fee_type": "Free",
    "state_location": "string",
    "registration_deadline": "ISO date",
    "event_date": "ISO date"
  }
]
```

Without a running backend the app renders its error state gracefully.

## Project structure

```
src/
├── components/
│   ├── Header.tsx          # sticky header: logo, search, theme toggle
│   ├── Hero.tsx            # headline section
│   ├── FilterBar.tsx       # mode / fee segmented controls + state select
│   ├── HackathonCard.tsx   # single event card with badges & countdown
│   └── HackathonGrid.tsx   # responsive grid + loading/empty/error states
├── hooks/
│   ├── useHackathons.ts    # fetch hook with query-string building + abort-on-cancel
│   ├── useDebounce.ts      # generic debounce hook
│   └── useTheme.tsx        # ThemeProvider + useTheme context hook
├── types/index.ts          # Hackathon, FilterState types
├── utils/countdown.ts      # deadline math + date formatting
├── App.tsx                 # state wiring: filters, search, derived states
├── main.tsx                # entry point
└── index.css               # Tailwind directives + custom styles
```

## Notes

- Tailwind is configured via `tailwind.config.js` (v3, `darkMode: 'class'`) + `postcss.config.js`.
- The theme toggle adds/removes the `dark` class on `<html>`; all components ship paired light/dark utilities.

