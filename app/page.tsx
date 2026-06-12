"use client";

import { useEffect, useState } from "react";
import { loadGraph, getGraphStats, verifySanity, getPlayer } from "@/lib/graph";
import { loadDataset } from "@/lib/data";
import { DataBanner } from "@/components/DataBanner";
import { ClubSeasonQuery } from "@/components/ClubSeasonQuery";
import { PlayerExplorer } from "@/components/PlayerExplorer";
import { RivalryExplorer } from "@/components/RivalryExplorer";
import { DegreesOfSeparation } from "@/components/DegreesOfSeparation";
import { Leaderboards } from "@/components/Leaderboards";
import { getFlagEmoji } from "@/lib/utils";

export default function SquadBridgePage() {
  const [graphLoaded, setGraphLoaded] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [sanity, setSanity] = useState<any>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [playerSearch, setPlayerSearch] = useState("");
  const [allPlayersForSearch, setAllPlayersForSearch] = useState<any[]>([]);

  useEffect(() => {
    const dataset = loadDataset();
    loadGraph(dataset);
    const s = getGraphStats();
    const san = verifySanity();
    setStats(s);
    setSanity(san);
    setGraphLoaded(true);
  }, []);

  const handleSelectPlayer = (id: string) => {
    setSelectedPlayer(id);
    const p = getPlayer(id);
    if (p) setPlayerSearch(p.name);
    document.getElementById("player-explorer")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (graphLoaded) {
      const ds = loadDataset();
      setAllPlayersForSearch(ds.players);
    }
  }, [graphLoaded]);

  const liveSearchResults = playerSearch.length > 1
    ? allPlayersForSearch.filter((p) => p.name.toLowerCase().includes(playerSearch.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xl font-semibold tracking-tighter">SquadBridge</div>
            <div className="text-xs px-2 py-0.5 rounded bg-emerald-800/60 text-emerald-300">WC2026</div>
          </div>
          <div className="text-xs text-zinc-500 hidden md:block">Clubmates Without Borders • Strict club_id + season graph</div>
          <a href="https://github.com/layerx-labs/arena-the-squad-graph-arena-grokbuild" target="_blank" className="text-xs underline">GitHub</a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-semibold tracking-tighter">SquadBridge</h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            The hidden clubmate bonds between World Cup 2026 players. Discover surprising cross-national teammates, rivalry bridges, and degrees of separation — built strictly on the official pinned dataset using exact <code>club_id + season</code> joins.
          </p>
        </div>

        {stats && (
          <DataBanner
            playerCount={stats.playerCount}
            clubCount={stats.clubCount}
            edgeCount={stats.edgeCount}
            crossNational={stats.crossNationalEdgeCount}
          />
        )}

        {!graphLoaded && <div className="text-center text-sm py-8">Loading the full 1,248-player graph…</div>}

        {graphLoaded && sanity && (
          <div id="gaps" className="text-[11px] text-amber-400/70">
            Graph engine verified: PSG 2023-24 has {sanity.psg2023Count} players including Vitinha, Nuno Mendes & Gonçalo Ramos. 
            See <a href="https://github.com/layerx-labs/wc2026-squad-graph-dataset/blob/main/gaps.json" target="_blank" className="underline">gaps.json</a> for honest coverage limits.
          </div>
        )}

        {graphLoaded && <ClubSeasonQuery onSelectPlayer={handleSelectPlayer} />}

        {graphLoaded && (
          <div className="card p-5">
            <div className="section-title mb-2">Global Player Search</div>
            <div className="relative">
              <input
                type="text"
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                placeholder="Type a player name — e.g. Vitinha, Mbappé, Bellingham, Rodri…"
                className="w-full rounded-lg px-4 py-2 text-sm border border-zinc-800"
              />
              {liveSearchResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-h-72 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 text-sm shadow-2xl">
                  {liveSearchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPlayer(p.id)}
                      className="w-full text-left px-4 py-2 hover:bg-zinc-900 flex justify-between border-b border-zinc-900 last:border-b-0"
                    >
                      <span>{p.name}</span>
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        {getFlagEmoji(p.country)} {p.country}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">Click a result or use the Club & Season query above to explore any player’s full story.</div>
          </div>
        )}

        {graphLoaded && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RivalryExplorer />
            <Leaderboards />
          </div>
        )}

        {graphLoaded && (
          <div id="player-explorer" className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3">
              <PlayerExplorer initialPlayerId={selectedPlayer} onSelectPlayer={handleSelectPlayer} />
            </div>
            <div className="xl:col-span-2">
              <DegreesOfSeparation playerA={selectedPlayer} playerB={null} onSelectPlayer={handleSelectPlayer} />
              <div className="mt-3 text-[10px] text-zinc-500 px-1">
                Tip: Open two players via search or the explorer, then paste their IDs into the two fields and hit “Find Shortest Path”.
              </div>
            </div>
          </div>
        )}

        <div className="pt-8 border-t border-zinc-800 text-xs text-zinc-500 space-y-1">
          <div><strong>How the graph is built (exact reference logic):</strong> Group every player’s stints by (club_id, season). Every pair inside a group of 2+ shares an edge. Only Wikidata QIDs are used for clubs — never names.</div>
          <div>All computation is client-side in <code>lib/graph.ts</code> (pure functions + Vitest tests). Dataset is the immutable v1.0 pins from the hackathon CDN.</div>
          <div className="pt-2">Built for the AI Agent Hackathon – The Squad Graph. <a href="https://github.com/layerx-labs/arena-the-squad-graph-arena-grokbuild" className="underline">View full source & README</a></div>
        </div>
      </div>

      <footer className="text-center text-[10px] py-8 text-zinc-600 border-t border-zinc-900">
        SquadBridge • 2026 World Cup club history explorer • Data from Wikidata + Wikipedia via the official tournament squad dataset
      </footer>
    </div>
  );
}
