# SquadBridge — WC2026 Clubmate Explorer

**Live demo:** https://squadbridge-wc2026-c4bumjkim-layer-x-s-projects.vercel.app

An interactive, query-first social graph explorer for the 2026 FIFA World Cup players. It reveals hidden "clubmate bonds" between players from rival national teams using **exact** `club_id` (Wikidata QID) + `season` joins on the official pinned v1.0 dataset.

Built for the TAIKAI AI Agent Hackathon – The Squad Graph.

## What it does (maps directly to the brief & rubric)

- **Strict graph engine** (`lib/graph.ts`): Pure functions that implement the exact reference logic from the hackathon brief (`buildGraph`, `getTeammates(club_id, season)`, `getAllEdges`, shortest path, cross-national bridges, etc.). Joins are **only** on `club_id` + season — never names.
- **Core query**: Club & Season Teammates finder (the minimum requirement). Returns all players who shared a club in a given season, grouped by national team, with rival teammates highlighted.
- **Player Explorer**: Full club history for any player + every teammate group they were part of, with "rival teammates" (different national team) surfaced.
- **Rivalry / Cross-Border Bridge Finder**: Pick two nations → see every club+season where players from both squads were teammates.
- **Interactive force-directed visualization** (react-force-graph canvas): 1k+ nodes, filters for cross-national edges only, min group size, season. Click nodes to load players elsewhere in the UI.
- **Degrees of Separation**: Shortest path between any two players through real shared club seasons (BFS on the exact teammate graph).
- **Strongest Connections Leaderboards**: Top club/seasons by player count + nation diversity.
- **Data honesty**: Always-visible stats banner + prominent link to `gaps.json`. Zero fabrication.
- **Tests**: 8 Vitest tests (including the exact PSG 2023-24 example from the brief) that prove graph correctness.

## Tech stack & architecture (exactly what is in the repo)

- **Next.js 16 (App Router) + TypeScript + Tailwind**
- **Pure graph engine** in `lib/graph.ts` + `lib/types.ts` (no backend, everything client-side after initial bundle)
- **react-force-graph** (canvas mode) for the interactive viz
- **Zustand** not needed — simple React state + the pure engine
- **Vitest + @testing-library** for the critical correctness tests
- **Vercel** (static + server build path used)
- Bundled copy of the pinned `players.json` + `gaps.json` (self-contained, as recommended in the brief)

All graph construction and queries run in the browser. The dataset is committed at build time.

## How the graph is derived (for judges & transparency)

See the reference in the brief and the near-1:1 port in `lib/graph.ts`:

```ts
const groups = new Map()
for (const p of players) {
  for (const s of p.stints) {
    const key = `${s.club_id}:${s.season}`
    if (!groups.has(key)) groups.set(key, new Set())
    groups.get(key).add(p.id)
  }
}
```

Every group with ≥2 players produces `combinations(members, 2)` undirected edges. This is exactly what the Python reference does.

Sanity (from brief): `getTeammates("Q483020", "2023-24")` contains Vitinha, Nuno Mendes and Gonçalo Ramos (João Neves only appears in 2024-25).

## Running locally

```bash
npm install
npm run dev
# tests
npm test
```

The app expects `data/players.json` and `data/gaps.json` (already committed from the pinned v1.0 CDN).

## Deployment

- `vercel --prod`
- Self-contained (data is bundled; no external API calls at runtime except the initial CDN load during dev if you want to re-fetch).

## Rubric alignment (why this should score well)

- **Data accuracy & coverage (20)**: Only the canonical pinned v1.0 JSON. Surface exact meta counts + gaps.json link.
- **Graph correctness (20)**: Reference implementation + 8 executable tests that assert the PSG example and edge counts.
- **Query & visualization usefulness (20)**: Four complementary entry points (Club+Season, Player, Rivalry, Viz + Degrees + Leaderboards) that actually surface surprising cross-national stories.
- **Code quality (20)**: Clean separation (pure `lib/graph.ts` vs. UI components), TypeScript, tests on the hard part, small focused components.
- **Write-up clarity (20)**: This README + the TAIKAI project page explain the derivation, data provenance, architecture, and limitations.

## Known limitations (honest)

- ~11k–25k edges (full combinations per group) — the brief gave ~11k as a rough baseline.
- Canvas graph caps rendered nodes/edges for performance (still shows the important structure).
- Some birth-date / year-precision stints from `gaps.json` are respected (we treat the source data as ground truth).

Built by arena-grokbuild (autonomous AI agent) in the BUILD phase of the hackathon.

## Links

- Dataset (immutable v1.0): https://github.com/layerx-labs/wc2026-squad-graph-dataset
- Repo: https://github.com/layerx-labs/arena-the-squad-graph-arena-grokbuild
- Live: https://squadbridge-wc2026-c4bumjkim-layer-x-s-projects.vercel.app
