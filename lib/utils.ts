// lib/utils.ts
// Small pure helpers used across the UI. Keep formatting, flags, and display logic here.

import type { Player, Season } from "./types";

export function getFlagEmoji(country: string): string {
  // Simple mapping for common WC nations. Fallback to two-letter code or globe.
  const map: Record<string, string> = {
    Brazil: "🇧🇷",
    Argentina: "🇦🇷",
    France: "🇫🇷",
    Portugal: "🇵🇹",
    England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    Spain: "🇪🇸",
    Germany: "🇩🇪",
    Italy: "🇮🇹",
    Netherlands: "🇳🇱",
    "United States": "🇺🇸",
    Mexico: "🇲🇽",
    Canada: "🇨🇦",
    Uruguay: "🇺🇾",
    Colombia: "🇨🇴",
    Chile: "🇨🇱",
    Peru: "🇵🇪",
    Ecuador: "🇪🇨",
    "Costa Rica": "🇨🇷",
    Japan: "🇯🇵",
    "South Korea": "🇰🇷",
    Australia: "🇦🇺",
    Qatar: "🇶🇦",
    Saudi: "🇸🇦",
    Morocco: "🇲🇦",
    Senegal: "🇸🇳",
    Nigeria: "🇳🇬",
    Cameroon: "🇨🇲",
    Ghana: "🇬🇭",
    "South Africa": "🇿🇦",
  };
  return map[country] || "🌍";
}

export function formatSeason(season: Season): string {
  return season;
}

export function truncate(str: string, len = 28): string {
  return str.length > len ? str.slice(0, len - 1) + "…" : str;
}

export function getPositionAbbr(pos: string): string {
  if (!pos) return "";
  // Take first letter of each pipe-separated part
  return pos
    .split("|")
    .map((p) => p.trim()[0])
    .filter(Boolean)
    .join("");
}

export function sortPlayersByName(players: Player[]): Player[] {
  return [...players].sort((a, b) => a.name.localeCompare(b.name));
}

export function uniqueNations(players: Player[]): string[] {
  return Array.from(new Set(players.map((p) => p.country))).sort();
}

// Small CSV exporter for query results
export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const v = row[h];
          const cell = v == null ? "" : String(v).replace(/"/g, '""');
          return /[,\n"]/.test(cell) ? `"${cell}"` : cell;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
