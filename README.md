# Crypto Live — Astro Islands Dashboard

Assignment **t7** for PUC's *Advanced Web Applications* course. A static Astro
page that hosts two interactive islands: a **Vue** filter panel and a **Svelte**
live-price ticker driven by the Binance WebSocket.

```
┌───────────────────────────────────────────────────────────┐
│  Astro (static HTML, server-side fetch of coin metadata)  │
│                                                           │
│   ┌─────────────────────┐    ┌──────────────────────┐     │
│   │  Vue (client:load)  │ ─▶ │ Svelte (client:visible)│   │
│   │   filter + form     │  ▲ │ Binance WS + Chart.js │    │
│   └─────────────────────┘  │ └──────────────────────┘     │
│              window CustomEvent('crypto:selection-changed')│
└───────────────────────────────────────────────────────────┘
```

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for a full walkthrough of how
Astro works, why each island uses the framework it does, and how the two
islands talk to each other.

## Quickstart

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs static site to ./dist
npm run preview  # serve the built site locally
```

Node **22.12+** is required (set in `package.json` engines).

## What each piece does

| Layer  | Files                                | Job                                                              |
| ------ | ------------------------------------ | ---------------------------------------------------------------- |
| Astro  | `src/pages/index.astro`, layouts     | Render the static shell; fetch coin metadata from CoinGecko at build. |
| Vue    | `src/components/CryptoFilter.vue`    | Coin checklist + search. Owns the selection, persists to `localStorage`, broadcasts changes. |
| Svelte | `src/components/PriceTicker.svelte`  | Listens for selection changes, seeds Chart.js sparklines from Binance REST klines, streams updates via WebSocket. |
| Shared | `src/lib/island-bus.ts`              | Event names + types both islands import.                         |
| Shared | `src/lib/coins.ts`                   | The static coin catalog (symbols, Binance pairs, CoinGecko IDs). |

## Extending

- **Add a coin** → add an entry to `COINS` in `src/lib/coins.ts`.
- **Add a new cross-island event** → declare it in `src/lib/island-bus.ts`,
  import it from both islands.
- **Swap the chart library** → only `PriceTicker.svelte` needs to change.
- **Add reconnection / dark mode / more timeframes** → see the "Out of scope"
  section at the bottom of `ARCHITECTURE.md`.

## Stack

Astro 6 · Vue 3.5 · Svelte 5 (runes) · Tailwind CSS v4 · Chart.js 4 · TypeScript (strict).
