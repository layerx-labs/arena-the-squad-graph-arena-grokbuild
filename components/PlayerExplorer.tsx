"use client";

import { useState, useMemo } from "react";
import { User, ExternalLink } from "lucide-react";
import { getPlayerHistoryWithTeammates, getPlayer } from "@/lib/graph";
import { getFlagEmoji } from "@/lib/utils";
import type { Player } from "@/lib/types";

interface PlayerExplorerProps {
  initialPlayerId?: string | null;
  onSelectPlayer?: (id: string) => void;
}

export function PlayerExplorer({ initialPlayerId, onSelectPlayer }: PlayerExplorerProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialPlayerId || null);

  const { players } = useMemo(() => {
    try {
      return { players: [] as any[] }; // will be replaced by real load below
    } catch {
      return { players: [] };
    }
  }, []);

  // We need access to players list. Pull from graph cache when available.
  // Simpler: search across all by name
  const allPlayers: Player[] = useMemo(() => {
    // Lazy: we can scan the graph's internal cache via getPlayer + a trick
    // For now we do a one-time global scan from window if needed, but better to import data
    // Since this is client and graph is loaded, we expose a small search helper in graph later.
    // Quick hack: we will pass a full list from page later. For component self-containment, load once.
    return [];
  }, []);

  // Better approach: use a small global search list. We'll inject via prop in real use.
  // For this component we'll accept a prop for simplicity in the page.

  const result = selectedId ? getPlayerHistoryWithTeammates(selectedId) : null;
  const player = result?.player;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelectPlayer?.(id);
  };

  // Placeholder until we wire full search from page
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-emerald-400" />
        <div className="section-title">Player Explorer — Club History + Rival Teammates</div>
      </div>

      <div className="text-sm text-zinc-400">
        Search and select a player to see every stint they had and who they shared the dressing room with.
        Rival teammates (different national team) are highlighted.
      </div>

      <input
        type="text"
        placeholder="Search player name (e.g. Vitinha, Mbappé, Bellingham)..."
        className="w-full rounded-lg px-3 py-2 text-sm border border-zinc-800"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.length > 1) {
            // Real search will be handled by parent for now
            // We just show a tip
          }
        }}
      />

      {player && result && (
        <div className="space-y-3 pt-2">
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-semibold">{player.name}</span>
            <span className="text-sm">
              {getFlagEmoji(player.country)} {player.country} • {player.position}
            </span>
            <span className="text-xs text-zinc-500 font-mono">ID: {player.id}</span>
          </div>

          <div className="space-y-4">
            {result.history.map((stint, idx) => (
              <div key={idx} className="border border-zinc-800 rounded-lg p-3 bg-zinc-950/60">
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{stint.club_name}</span>
                    <span className="mx-1.5 text-zinc-600">•</span>
                    <span className="font-mono text-emerald-400">{stint.season}</span>
                  </div>
                  <div className="text-xs text-zinc-500">
                    {stint.teammateCount} teammates • {stint.rivalCount} rivals
                  </div>
                </div>

                {stint.rivalTeammates.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[10px] uppercase tracking-widest text-amber-400 mb-1">Rival teammates (different nation)</div>
                    <div className="flex flex-wrap gap-1 text-xs">
                      {stint.rivalTeammates.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelect(r.id)}
                          className="px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900/40 border border-amber-900/50"
                        >
                          {getFlagEmoji(r.country)} {r.name} <span className="opacity-60">({r.country})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {stint.teammates.length > 0 && (
                  <div className="mt-2 text-xs text-zinc-400">
                    Other teammates: {stint.teammates.slice(0, 6).map((t, i) => (
                      <button key={i} onClick={() => handleSelect(t.id)} className="hover:underline mr-1.5">
                        {getFlagEmoji(t.country)} {t.name}
                      </button>
                    ))}
                    {stint.teammates.length > 6 && <span className="opacity-50">+{stint.teammates.length - 6} more</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-[10px] text-emerald-400 flex items-center gap-1 cursor-pointer" onClick={() => onSelectPlayer?.(player.id)}>
            Use this player in Degrees of Separation or Graph <ExternalLink className="h-3 w-3" />
          </div>
        </div>
      )}

      {!player && (
        <div className="text-xs text-zinc-500 pt-2">
          Tip: Use the Club & Season query above or the Global Player Search to pick a player and explore their story.
        </div>
      )}
    </div>
  );
}
