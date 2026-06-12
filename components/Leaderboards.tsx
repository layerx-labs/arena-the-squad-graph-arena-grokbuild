"use client";

import { useMemo } from "react";
import { Trophy } from "lucide-react";
import { getStrongestClubSeasons } from "@/lib/graph";
import { getFlagEmoji } from "@/lib/utils";

export function Leaderboards() {
  const topClubs = useMemo(() => getStrongestClubSeasons(12), []);

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-emerald-400" />
        <div className="section-title">Strongest Club Connections</div>
      </div>
      <div className="text-xs text-zinc-400">Top club+seasons by number of players + nation diversity (real shared history across borders).</div>

      <div className="space-y-1 text-sm">
        {topClubs.map((c, idx) => (
          <div key={idx} className="flex items-center justify-between border-b border-zinc-900 py-1.5 last:border-b-0">
            <div>
              <span className="font-medium">{c.club_name}</span>{" "}
              <span className="font-mono text-xs text-emerald-400">{c.season}</span>
            </div>
            <div className="text-right text-xs">
              {c.player_count} players • {c.nation_count} nations<br />
              <span className="text-[10px] text-zinc-500">{c.nations.slice(0, 3).map((n) => getFlagEmoji(n)).join(" ")}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-zinc-500">These are the places where the most cross-border “football families” were formed.</div>
    </div>
  );
}
