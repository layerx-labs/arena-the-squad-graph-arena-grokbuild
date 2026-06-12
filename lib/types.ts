// lib/types.ts
// Exact match to the provided players.json schema + derived types for SquadBridge.
// All joins MUST use club_id (Wikidata QID) + season string "YYYY-YY".

export type Season = string; // e.g. "2023-24"

export interface Club {
  id: string; // Wikidata QID e.g. "Q483020"
  name: string;
  country: string;
}

export interface Stint {
  club_id: string;
  season: Season;
}

export interface Player {
  id: string; // Wikidata QID e.g. "Q66818509"
  name: string;
  country: string; // national team at WC2026
  position: string;
  current_club_id: string;
  stints: Stint[];
}

export interface PlayersData {
  meta: {
    tournament: string;
    season_format: string;
    edge_rule: string;
    player_count: number;
    club_count: number;
  };
  clubs: Club[];
  players: Player[];
}

export interface GapsData {
  // As provided in gaps.json for transparency
  [key: string]: unknown;
}

// Derived graph types
export type ClubSeasonKey = `${string}:${Season}`; // "Q483020:2023-24"

export interface TeammateGroup {
  club_id: string;
  club_name: string;
  season: Season;
  player_ids: string[];
}

export interface Edge {
  source: string; // player id
  target: string; // player id
  club_id: string;
  season: Season;
}

export interface CrossNationalBridge {
  club_id: string;
  club_name: string;
  season: Season;
  nations: string[]; // the two (or more) countries
  player_count: number;
  players: Array<{ id: string; name: string; country: string }>;
}

export interface PlayerPathHop {
  player_id: string;
  player_name: string;
  player_country: string;
  club_id: string;
  club_name: string;
  season: Season;
}

export type DegreesPath = PlayerPathHop[]; // alternating player -> shared stint -> next player

export interface StrongestClubSeason {
  club_id: string;
  club_name: string;
  season: Season;
  player_count: number;
  nation_count: number;
  nations: string[];
}
