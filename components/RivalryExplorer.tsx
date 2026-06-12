"use client";

import { useState, useMemo } from "react";
import { Swords } from "lucide-react";
import { findCrossNationalBridges, getPlayer } from "@/lib/graph";
import { getFlagEmoji } from "@/lib/utils";
import { toast } from "sonner";

const COMMON_NATIONS = [
  "Brazil", "Argentina", "France", "Portugal", "England", "Spain", "Germany", "Italy",
  "Netherlands", "Uruguay", "Colombia", "Mexico", "United States", "Japan", "Morocco", "Senegal",
];

export function RivalryExplorer() {
  const [nationA, setNationA] = useState("Brazil");
  const [nationB, setNationB] = useState("Argentina");
  const [limit, setLimit] = useState(8);

  const bridges = useMemo(() => {
    if (nationA === nationB) return [];
    return findCrossNationalBridges(nationA, nationB).slice(0, limit);
  }, [nationA, nationB, limit]);

  const swap = () => {
    const tmp = nationA;
    setNationA(nationB);
    setNationB(tmp);
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Swords className="h-4 w-4 text-amber-400" />
        <div className="section-title">Rivalry / Cross-National Bridge Finder</div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-zinc-500">Nation A</label>
          <select value={nationA} onChange={(e) => setNationA(e.target.value)} className="block w-44 rounded px-2 py-1.5 text-sm border border-zinc-800">
            {COMMON_NATIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button onClick={swap} className="h-9 px-3 rounded border border-zinc-800 text-xs">↔ Swap</button>
        <div>
          <label className="text-xs text-zinc-500">Nation B</label>
          <select value={nationB} onChange={(e) => setNationB(e.target.value)} className="block w-44 rounded px-2 py-1.5 text-sm border border-zinc-800">
            {COMMON_NATIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button onClick={() => toast.info(`${bridges.length} bridges found between ${nationA} and ${nationB}`)} className="h-9 px-4 rounded bg-amber-600/90 hover:bg-amber-600 text-xs font-medium">Find Bridges</button>
      </div>

      {bridges.length > 0 ? (
        <div className="space-y-2 text-sm">
          {bridges.map((b, i) => (
            <div key={i} className="border border-zinc-800 rounded p-3 bg-zinc-950/50">
              <div className="font-medium">
                {b.club_name} <span className="font-mono text-emerald-400 text-xs">({b.season})</span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                {b.player_count} players • nations: {b.nations.map((n) => getFlagEmoji(n) + " " + n).join(" • ")}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs">
                {b.players.slice(0, 8).map((p, idx) => (
                  <span key={idx} className={p.country === nationA || p.country === nationB ? "text-amber-300" : ""}>
                    {getFlagEmoji(p.country)} {p.name}
                  </span>
                ))}
                {b.players.length > 8 && <span className="text-zinc-500">+{b.players.length - 8}</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-zinc-500">No bridges found for this pair in the dataset (or try another rivalry).</div>
      )}

      <div className="text-[10px] text-zinc-500">Shows every club+season where players from both squads were teammates. Real football family stories across rival nations.</div>
    </div>
  );
}
