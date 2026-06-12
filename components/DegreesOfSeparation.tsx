"use client";

import { useState } from "react";
import { GitBranch } from "lucide-react";
import { getDegreesOfSeparation, getPlayer } from "@/lib/graph";
import { getFlagEmoji } from "@/lib/utils";
// toast removed for build (sonner uninstalled)
import type { DegreesPath } from "@/lib/types";

interface Props {
  playerA?: string | null;
  playerB?: string | null;
  onSelectPlayer?: (id: string) => void;
}

export function DegreesOfSeparation({ playerA, playerB, onSelectPlayer }: Props) {
  const [startId, setStartId] = useState(playerA || "");
  const [endId, setEndId] = useState(playerB || "");
  const [path, setPath] = useState<DegreesPath | null>(null);

  const compute = () => {
    if (!startId || !endId) {
      console.log("Pick two players (use the search or click from other panels)");
      return;
    }
    const p = getDegreesOfSeparation(startId, endId);
    setPath(p);
    if (!p) {
      console.log("No path found between these two players in the clubmate graph.");
    } else {
      console.log(`Path found: ${p.length / 2} hops`);
    }
  };

  const pStart = startId ? getPlayer(startId) : null;
  const pEnd = endId ? getPlayer(endId) : null;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-emerald-400" />
        <div className="section-title">Degrees of Separation</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end text-sm">
        <div className="md:col-span-2">
          <label className="text-xs text-zinc-500 block mb-1">Player A</label>
          <input
            value={pStart ? pStart.name : startId}
            onChange={(e) => setStartId(e.target.value)}
            placeholder="Player Wikidata ID or pick from explorer"
            className="w-full rounded px-3 py-1.5 text-sm border border-zinc-800 font-mono"
          />
          {pStart && <div className="text-xs mt-0.5 text-emerald-400">{getFlagEmoji(pStart.country)} {pStart.country}</div>}
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-zinc-500 block mb-1">Player B</label>
          <input
            value={pEnd ? pEnd.name : endId}
            onChange={(e) => setEndId(e.target.value)}
            placeholder="Player Wikidata ID or pick from explorer"
            className="w-full rounded px-3 py-1.5 text-sm border border-zinc-800 font-mono"
          />
          {pEnd && <div className="text-xs mt-0.5 text-emerald-400">{getFlagEmoji(pEnd.country)} {pEnd.country}</div>}
        </div>
        <button onClick={compute} className="primary h-9 rounded px-4 text-sm font-semibold w-full md:w-auto">Find Shortest Path</button>
      </div>

      {path && path.length > 0 && (
        <div className="pt-2 text-sm">
          <div className="text-xs uppercase tracking-widest text-emerald-400 mb-2">Clubmate Path</div>
          <div className="space-y-1">
            {path.map((hop, idx) => {
              if (hop.player_id) {
                const p = getPlayer(hop.player_id);
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span>👤</span>
                    <button onClick={() => onSelectPlayer?.(hop.player_id)} className="hover:underline font-medium text-emerald-300">
                      {hop.player_name} <span className="text-xs text-zinc-500">({hop.player_country})</span>
                    </button>
                  </div>
                );
              } else {
                return (
                  <div key={idx} className="ml-6 pl-3 border-l border-zinc-800 text-xs text-zinc-400">
                    shared <span className="font-mono text-emerald-400">{hop.club_name}</span> in {hop.season}
                  </div>
                );
              }
            })}
          </div>
          <div className="text-[10px] mt-2 text-zinc-500">Each link is a real shared club season (exact club_id + season join).</div>
        </div>
      )}
    </div>
  );
}
