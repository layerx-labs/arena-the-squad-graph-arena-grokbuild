"use client";

import { useState, useMemo } from "react";
import { Search, Users } from "lucide-react";
import { getTeammates, getPlayer, getClub, getCachedGraph } from "@/lib/graph";
import type { Player } from "@/lib/types";
import { getFlagEmoji } from "@/lib/utils";
// toast removed for build (sonner uninstalled)

interface ClubSeasonQueryProps {
  onSelectPlayer?: (id: string) => void;
}

export function ClubSeasonQuery({ onSelectPlayer }: ClubSeasonQueryProps) {
  const { players, clubs } = getCachedGraph();

  const [clubQuery, setClubQuery] = useState("");
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [season, setSeason] = useState("2023-24");

  const clubOptions = useMemo(() => {
    if (!clubQuery.trim()) {
      return clubs.slice(0, 12);
    }
    const q = clubQuery.toLowerCase();
    return clubs
      .filter((c) => c.name.toLowerCase().includes(q) || c.id.includes(q))
      .slice(0, 12);
  }, [clubQuery, clubs]);

  const teammates = useMemo(() => {
    if (!selectedClubId) return [];
    return getTeammates(selectedClubId, season);
  }, [selectedClubId, season]);

  const grouped = useMemo(() => {
    const map = new Map<string, Player[]>();
    for (const pid of teammates) {
      const p = getPlayer(pid);
      if (!p) continue;
      if (!map.has(p.country)) map.set(p.country, []);
      map.get(p.country)!.push(p);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([country, ps]) => ({ country, players: ps.sort((x, y) => x.name.localeCompare(y.name)) }));
  }, [teammates]);

  const selectedClub = selectedClubId ? getClub(selectedClubId) : null;

  const handleClubSelect = (clubId: string, name: string) => {
    setSelectedClubId(clubId);
    setClubQuery(name);
    console.log(`Loaded ${name} — ${season}`);
  };

  const exportCSV = () => {
    if (!teammates.length) return;
    const rows = teammates.map((pid) => {
      const p = getPlayer(pid)!;
      const c = selectedClub;
      return {
        player_id: p.id,
        name: p.name,
        country: p.country,
        position: p.position,
        club: c?.name,
        club_id: selectedClubId,
        season,
      };
    });
    const { downloadCSV } = require("@/lib/utils");
    downloadCSV(`teammates_${selectedClubId}_${season}.csv`, rows);
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-emerald-400" />
        <div className="section-title">Club & Season Teammates (Core Query)</div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        {/* Club search */}
        <div className="flex-1">
          <label className="text-xs text-zinc-500 block mb-1">Club (by name or QID)</label>
          <div className="relative">
            <input
              value={clubQuery}
              onChange={(e) => {
                setClubQuery(e.target.value);
                setSelectedClubId(null);
              }}
              placeholder="e.g. Paris Saint-Germain, Manchester City, or Q483020"
              className="w-full rounded-lg px-3 py-2 text-sm border border-zinc-800 focus:border-emerald-500"
            />
            {clubQuery && clubOptions.length > 0 && !selectedClubId && (
              <div className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl text-sm">
                {clubOptions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleClubSelect(c.id, c.name)}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-900 flex items-center justify-between"
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{c.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Season */}
        <div className="w-40">
          <label className="text-xs text-zinc-500 block mb-1">Season</label>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm border border-zinc-800"
          >
            {["2026-27", "2025-26", "2024-25", "2023-24", "2022-23", "2021-22", "2020-21", "2019-20", "2018-19"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            if (selectedClubId) {
              const tms = getTeammates(selectedClubId, season);
              console.log(`${tms.length} players together at ${selectedClub?.name || selectedClubId} in ${season}`);
            }
          }}
          className="self-end h-10 px-4 rounded-lg border border-zinc-800 hover:bg-zinc-900 text-sm flex items-center gap-2"
        >
          <Search className="h-4 w-4" /> Run Query
        </button>
      </div>

      {/* Results */}
      {teammates.length > 0 && selectedClub && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-sm">
              {teammates.length} players shared <span className="font-mono text-emerald-400">{selectedClub.name}</span> in <span className="font-mono">{season}</span>
            </div>
            <button onClick={exportCSV} className="text-xs px-2 py-1 rounded border border-zinc-800 hover:bg-zinc-900">
              Export CSV
            </button>
          </div>

          <div className="space-y-4">
            {grouped.map(({ country, players }) => (
              <div key={country}>
                <div className="flex items-center gap-2 mb-1 text-xs text-zinc-400">
                  {getFlagEmoji(country)} <span className="font-medium">{country}</span> — {players.length}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 text-sm">
                  {players.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectPlayer?.(p.id)}
                      className="player-row flex items-center justify-between rounded px-2 py-1 text-left hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
                    >
                      <span>{p.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{p.position}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-zinc-500">
            Click any player name to load them in the Player Explorer below.
          </div>
        </div>
      )}

      {selectedClubId && teammates.length === 0 && (
        <div className="text-sm text-amber-400">No players listed for this club + season (data gap or no overlapping stints).</div>
      )}
    </div>
  );
}
