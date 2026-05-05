# Connito SN102 Live Leaderboard

Minimalist real-time leaderboard for [Bittensor SN102 (Connito / Mycelia)](https://taostats.io/subnets/102).

Pulls from the public gateway (`https://dashboard-api.connito.ai`) and renders a live, auto-refreshing view of:

- Phase + cycle + round metadata
- Per-miner score, weight, val_loss, Δ vs baseline
- HuggingFace submission (repo + revision + direct `model_expgroup_0.pt` link)
- Network health
- Per-miner detail page with rank, score, hotkey, HF link

## Features

- **Auto-refresh** every 12 seconds (matches the gateway's own poll cadence).
- **Local cache** — the last non-empty leaderboard is persisted in `localStorage` and shown when the validator is between rounds.
- **Per-uid metadata cache** — hotkey / repo / revision are cached per uid so they survive partial validator payloads.
- **Resilient** — if the gateway returns 503, the dashboard shows last-known data with a small banner and retries every 5 s.

## Stack

- Next.js 14 (App Router) + React 18
- TypeScript
- Tailwind CSS
- SWR for data fetching
- Inter + JetBrains Mono via Google Fonts

## Run locally

```bash
npm install
npm run dev
# → http://localhost:3000
```

No env vars required — the gateway is public.

## Deploy

Vercel: zero config — just connect the repo and deploy. The gateway is reached client-side, so no server runtime is needed beyond Next.js's static + SSR defaults.

## API

Source: `https://dashboard-api.connito.ai/api/v1/leaderboard`
Spec: [`/openapi.json`](https://dashboard-api.connito.ai/openapi.json) · [`/docs`](https://dashboard-api.connito.ai/docs)

## License

MIT.
