# PLAN.md — Arena Agent: arena-grokbuild (The Squad Graph)

## Project Idea (Concrete & Winning-Focused)
**Name:** SquadBridge – Clubmates Without Borders (WC2026)

**One-sentence pitch:** An interactive, query-first web explorer that reveals the hidden "clubmate bonds" between World Cup 2026 players — with special emphasis on surprising cross-national and cross-rivalry connections (e.g., a Brazilian and an Argentine who were teammates at the same club in the same season) — built strictly on the provided dataset using exact club_id + season joins.

**Why this will win the hackathon (rubric-aligned):**
- It is *specific and original* for the World Cup theme: instead of a generic "player graph," it surfaces "football family" stories that transcend national rivalries, making queries inherently insightful and shareable (journalists, fans, scouts will love the "they were teammates?!" moments).
- It treats the provided JSON as sacred (no name-based joins, full respect for gaps.json coverage baseline) while going beyond the minimum to deliver high-usefulness queries + visualization.
- Prioritizes the two hardest rubric items for this challenge (Graph correctness + Query/visualization usefulness) while keeping code clean and docs exemplary.
- Scope is deliberately "simplest thing that wins": client-side Next.js app (no over-engineering), but with multiple intuitive entry points to the graph so users actually *use* it.

**Target users:** Football fans and data enthusiasts during the 2026 World Cup; sports journalists looking for human-interest angles; analysts/scouts tracking "club history overlaps."

**Problem it solves:** The official tournament coverage never shows how club football creates real shared history between players who will soon be rivals on the pitch. The raw dataset has the facts; SquadBridge turns them into explorable, visual stories.

## Core Features (Must-Have for Rubric)
1. **Strict Graph Engine** (Graph correctness):
   - Pure functions: `buildGroups(players)`, `getTeammates(club_id, season)`, `getAllEdges()` that implement the exact reference logic from the brief (group by (club_id, season), combinations for edges ≥2 players).
   - Never joins on names or current_club only. Uses Wikidata QIDs exclusively.
   - Pre-computes and surfaces global stats: total players (1248), clubs (1578), derivable edges (~11k), cross-national edges.

2. **Multiple Powerful Queries** (Query usefulness):
   - **Club & Season Teammates Finder** (core requirement): Autocomplete for club (by name + id), season picker (or range). Returns ordered list of all players who were there together, grouped by national team, with flags and positions. Shows the exact shared stints.
   - **Player Explorer**: Search any player (by name or id) → shows their full club history (stints) + all historical teammates, color-coded by the teammate's national team. Highlights "rival teammates" (different country).
   - **Rivalry / Cross-Border Bridge Finder** (original killer feature): Select two nations (or "any rival pair") → returns all club+season bridges between players from those squads, ranked by number of shared players. Example output: "3 players from Brazil + Argentina shared stints at Club X in 2021-22."
   - **Strongest Connections Leaderboards**: Top 10 clubs/seasons by (a) total players connected, (b) number of *different nations* represented in that group. Top players by number of unique cross-national teammates.

3. **Interactive Visualization**:
   - Force-directed graph (nodes = players colored by national team; edges = shared club-season stints).
   - Filters: season range slider, nation selector (multi or "focus on Europe/South America"), min-group-size, "only show cross-national edges".
   - Interactions: Hover/click a node or edge reveals the exact club(s)+season(s) that created the link. Zoom/pan/search to highlight a player.
   - Canvas-based for performance with 1k+ nodes.

4. **Degrees of Separation** (stretch that boosts usefulness):
   - Pick any two players (from same or rival teams) → compute shortest path(s) in the teammate graph and explain it ("Player A (Brazil) — Club PSG 2023-24 — Player B (France) — ...").
   - Shows the club "hops" and the actual shared seasons.

5. **UI/UX Essentials**:
   - Clean, fast, mobile-friendly (Tailwind + shadcn-style components).
   - "Data honesty" banner: always visible stats + link to gaps.json explanation ("8 players have no historical stints listed...").
   - Export buttons: CSV of current query results, JSON subgraph.
   - Sanity checks baked in: on load, verify PSG 2023-24 contains the players mentioned in the brief.

## Prioritized Stretch Goals (Implement in Order)
- Interactive graph + filters (high impact on usefulness).
- Degrees of separation + path visualization.
- Rivalry nation-pair explorer + strongest club bridges.
- (If time) Simple "era filter" (pre-2020 vs recent) and country-of-club filter using the club.country field.
- (Nice) Shareable deep links for specific queries (e.g. ?club=Q483020&season=2023-24).

**Explicitly out of scope for this plan (to stay simple):** 3D viz, live API, user accounts, LLM summaries, scraping more data (use only the pinned v1.0 JSON).

## Tech Stack + One-Line Justifications
- **Next.js 14 (App Router) + TypeScript + Tailwind CSS**: Zero-config Vercel deployment; excellent React ecosystem for interactive components + static data handling; type safety critical for graph correctness.
- **react-force-graph (canvas mode) or @react-three/fiber fallback**: Proven performant force-directed graph for thousands of nodes/edges; easy to add click/hover labels without heavy D3 boilerplate.
- **cmdk + lucide-react + framer-motion**: Delightful command-palette-style search and smooth interactions without bloat; improves perceived usefulness.
- **Zustand (tiny state)**: Simple global state for filters/queries without Redux complexity.
- **Vitest + simple test utils**: Unit tests for the pure graph builder (non-negotiable for "graph correctness" rubric score).
- **Vercel**: Official recommended deploy target; automatic previews from GitHub; static + edge functions if ever needed (we won't).
- **JSON data handling**: Bundle a copy of players.json + gaps.json at build time (self-contained deployment, matches "commit a copy" tip in brief).

**No heavy alternatives considered**: Avoid full D3 (too much code), avoid backend (data is static + small), avoid Supabase/Prisma (overkill).

## Architecture (Simple & Maintainable)
```
/ (Next.js root)
├── app/
│   ├── layout.tsx          # Global nav, data-honesty banner, theme
│   ├── page.tsx            # Main dashboard: stats + primary query UIs + leaderboards
│   ├── explore/            # Full-screen interactive graph + filters
│   └── player/[id]/        # Deep player view (optional nice-to-have)
├── components/
│   ├── QueryClubSeason.tsx # Core "teammates at club/season" widget
│   ├── PlayerSearch.tsx    # Player explorer + rival highlight
│   ├── RivalryExplorer.tsx # Nation-pair bridge finder
│   ├── ForceGraph.tsx      # The interactive viz wrapper
│   ├── DegreesOfSeparation.tsx
│   └── DataBanner.tsx
├── lib/
│   ├── graph.ts            # ★ THE CORE: buildGroups(), getTeammates(), computeEdges(), shortestPath(), all pure & tested
│   ├── types.ts            # Exact match to players.json schema + our derived types
│   ├── utils.ts            # Flags, formatting, sanity checks
│   └── precompute.ts       # Build-time aggregates (top bridges, nation stats)
├── data/
│   ├── players.json        # Committed copy of the pinned v1.0 dataset
│   └── gaps.json
├── __tests__/graph.test.ts # Critical correctness tests (PSG 2023-24, edge counts, no name joins)
└── README.md               # Full setup, "How the graph works" section with code excerpts, screenshots, data caveats
```

- **Data flow**: On build, copy JSONs → client bundle. All graph construction happens in lib/graph.ts (runs in browser but is fast; precompute heavy aggregates in a build script if needed).
- **Graph correctness guarantee**: lib/graph.ts will be a near 1:1 port of the reference Python snippet. Tests will assert exact behavior on the Vitinha/PSG example.
- **Deployment**: `vercel --prod` from the GitHub repo (layerx-labs/arena-the-squad-graph-arena-grokbuild). Use Next.js static export if possible for maximum simplicity.
- **Performance notes**: 1248 nodes / ~11k edges is trivial for modern browsers with canvas graph. Filters will prune the rendered set.

## How This Maps to Every Rubric Criterion (Weight 20 each)
1. **Data accuracy and coverage (20)**: We load *only* the canonical pinned JSON. We surface exact meta counts (player_count, club_count). We display and link gaps.json prominently so users know the coverage baseline. Zero fabrication; club_id-only joins enforced in types and logic.
2. **Graph correctness (20)**: The entire value prop rests on `lib/graph.ts`. It will be the reference implementation. We will include executable tests and a "verify against reference" section. Example from brief (PSG 2023-24 connecting Vitinha + Nuno Mendes + Gonçalo Ramos) will be a first-class test case.
3. **Query and visualization usefulness (20)**: This is our differentiator. Four complementary query surfaces + interactive filtered graph + degrees-of-separation paths + rivalry-specific tooling. Users won't just "see a graph"; they will *discover stories* quickly. Leaderboards and export make it practical.
4. **Code quality (20)**: Clean separation (pure graph logic vs. UI), TypeScript, small focused components, build-time data, tests for the hard part. README will include architecture diagram and "how to extend the graph" notes. Prefer readability over cleverness.
5. **Write-up clarity (20)**: README will be the single source of truth: step-by-step "how the graph is derived" with the exact code, data provenance (CDN + GitHub release pins), limitations, how to run locally, and screenshots of every major feature. The TAIKAI project page will be a polished copy of the best sections + live demo link.

## Build Phase Milestones (Ordered, Time-Boxed)
1. **Foundation (Day 1)**: Init Next.js + TS + Tailwind in the target repo. Fetch & commit v1.0 players.json + gaps.json. Implement `lib/graph.ts` + types + basic `getTeammates` / edge builder. Add Vitest + first 3-4 correctness tests (including the PSG sanity case from brief). Verify counts match meta.
2. **Core Query UI (Day 1-2)**: Build the Club+Season query widget + results table (with nation grouping + flags). Add global stats dashboard + data banner. Wire the graph engine to UI. Add player search (basic).
3. **Rivalry & Leaderboards (Day 2)**: Implement RivalryExplorer and the "strongest bridges" leaderboards. Add cross-national edge highlighting everywhere.
4. **Visualization & Paths (Day 3)**: Integrate force-graph component. Add filters, click-to-reveal logic, and the DegreesOfSeparation component + path renderer. Make graph responsive and performant.
5. **Polish + Deploy (Day 3-4)**: Mobile fixes, loading states, export, deep links, more tests, perf tuning (prune graph on filters). Push to GitHub. Deploy to Vercel. Verify live queries match local/reference logic.
6. **Docs & Final (Day 4)**: Comprehensive README (setup, graph construction explanation, screenshots, rubric alignment notes, "known gaps" section). Draft the TAIKAI write-up. Record a 60-second demo video if time. Final sanity pass on accuracy.
7. **Buffer**: Any remaining stretch or bug fixes.

**Total realistic scope**: All core + top 3-4 stretches in ~4 focused days.

## Definition of "Done" (for complete_phase handoff)
- GitHub repo (layerx-labs/arena-the-squad-graph-arena-grokbuild) contains full source + clean history.
- Live, public Vercel URL that loads the app, runs all queries, and renders the interactive graph.
- All core requirements satisfied + at least interactive graph, degrees of separation, and strongest connections.
- Graph engine produces accurate results (provable via tests + manual verification against brief examples and reference Python logic).
- README is excellent: explains data sources, exact graph building algorithm (with code), architecture, usage, limitations.
- The TAIKAI project page write-up is prepared (will be finalized in build phase).
- No violations of operating rules; everything stays inside /workspace until proper commits.

**Success metric for us**: After peer evaluation, high scores on Graph correctness + Query usefulness (the two areas this dataset + rubric reward most) while maintaining top-tier cleanliness and clarity.

---

*This plan is the complete handoff artifact. No application code will be written until the build phase after `complete_phase`.*