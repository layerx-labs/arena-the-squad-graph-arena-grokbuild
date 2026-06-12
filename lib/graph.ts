// lib/graph.ts
// Pure graph engine implementing the EXACT reference logic from the hackathon brief.
// Reference (Python):
//   groups = defaultdict(set)
//   for p in data["players"]:
//       for s in p["stints"]:
//           groups[(s["club_id"], s["season"])].add(p["id"])
//   def teammates(club_id, season):
//       return groups.get((club_id, season), set())
//   edges = {tuple(sorted(pair)) for members in groups.values() for pair in combinations(members, 2)}
//
// Guarantees:
// - Joins exclusively on club_id (Wikidata QID) + season. Never on names.
// - stints already deduped per player (club_id, season).
// - National/youth teams intentionally excluded in the source data.
// - Returns sets/arrays for easy consumption; all functions are deterministic and pure.

import type {
  Player,
  Club,
  Season,
  Edge,
  CrossNationalBridge,
  DegreesPath,
  StrongestClubSeason,
  ClubSeasonKey,
} from "./types";

// Internal group map: key = "club_id:season" -> Set<player_id>
export type GroupMap = Map<ClubSeasonKey, Set<string>>;

interface PlayerIndex {
  byId: Map<string, Player>;
  clubsById: Map<string, Club>;
}

let cachedData: {
  players: Player[];
  clubs: Club[];
  groups: GroupMap;
  playerIndex: PlayerIndex;
  allEdges: Edge[];
} | null = null;

/**
 * Build the core groups map and indexes from raw players + clubs.
 * This is the single source of truth for all queries.
 */
export function buildGraph(players: Player[], clubs: Club[]) {
  const groups: GroupMap = new Map();
  const byId = new Map<string, Player>();
  const clubsById = new Map<string, Club>(clubs.map((c) => [c.id, c]));

  for (const p of players) {
    byId.set(p.id, p);
    for (const s of p.stints) {
      const key = `${s.club_id}:${s.season}` as ClubSeasonKey;
      if (!groups.has(key)) groups.set(key, new Set());
      groups.get(key)!.add(p.id);
    }
  }

  // Build all edges (undirected, deduped) for convenience
  const allEdges: Edge[] = [];
  for (const [key, members] of groups) {
    if (members.size < 2) continue;
    const [club_id, season] = key.split(":") as [string, Season];
    const arr = Array.from(members);
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        allEdges.push({
          source: arr[i],
          target: arr[j],
          club_id,
          season,
        });
      }
    }
  }

  cachedData = {
    players,
    clubs,
    groups,
    playerIndex: { byId, clubsById },
    allEdges,
  };

  return cachedData;
}

/** Load from the committed dataset (call once at app init or in tests). */
export function loadGraph(playersData: { players: Player[]; clubs: Club[] }) {
  return buildGraph(playersData.players, playersData.clubs);
}

/** Get cached graph (throws if not loaded). */
export function getCachedGraph() {
  if (!cachedData) throw new Error("Graph not loaded. Call loadGraph() first.");
  return cachedData;
}

// ====================== CORE QUERIES (as per brief) ======================

/** Core query: players who shared the exact club_id + season */
export function getTeammates(club_id: string, season: Season): string[] {
  const { groups } = getCachedGraph();
  const key = `${club_id}:${season}` as ClubSeasonKey;
  const set = groups.get(key);
  return set ? Array.from(set) : [];
}

/** Return full edge list (useful for viz and stats). */
export function getAllEdges(): Edge[] {
  return getCachedGraph().allEdges;
}

/** Number of players who shared a given (club, season) — size of the group. */
export function getGroupSize(club_id: string, season: Season): number {
  const ids = getTeammates(club_id, season);
  return ids.length;
}

/** Get player object by id (with full stints). */
export function getPlayer(id: string): Player | undefined {
  return getCachedGraph().playerIndex.byId.get(id);
}

/** Get club metadata by id. */
export function getClub(id: string): Club | undefined {
  return getCachedGraph().playerIndex.clubsById.get(id);
}

// ====================== HIGHER-LEVEL USEFUL QUERIES ======================

/** Full club history for one player + every teammate group they participated in. */
export function getPlayerHistoryWithTeammates(playerId: string) {
  const player = getPlayer(playerId);
  if (!player) return { player: null, history: [] as any[] };

  const history = player.stints.map((stint) => {
    const teammates = getTeammates(stint.club_id, stint.season)
      .filter((tid) => tid !== playerId)
      .map((tid) => {
        const tp = getPlayer(tid)!;
        return {
          id: tp.id,
          name: tp.name,
          country: tp.country,
          position: tp.position,
        };
      });

    const rivalTeammates = teammates.filter((t) => t.country !== player.country);

    const club = getClub(stint.club_id);
    return {
      club_id: stint.club_id,
      club_name: club?.name ?? stint.club_id,
      club_country: club?.country ?? "",
      season: stint.season,
      teammates,
      rivalTeammates,
      teammateCount: teammates.length,
      rivalCount: rivalTeammates.length,
    };
  });

  return { player, history };
}

/** Rivalry / Cross-national bridge finder: for two nations, find all shared (club,season) groups */
export function findCrossNationalBridges(
  nationA: string,
  nationB: string
): CrossNationalBridge[] {
  const { groups, playerIndex } = getCachedGraph();
  const results: CrossNationalBridge[] = [];

  for (const [key, memberIds] of groups) {
    if (memberIds.size < 2) continue;

    const players = Array.from(memberIds)
      .map((id) => playerIndex.byId.get(id)!)
      .filter(Boolean);

    const nationsInGroup = new Set(players.map((p) => p.country));
    if (nationsInGroup.size < 2) continue;

    const hasA = nationsInGroup.has(nationA);
    const hasB = nationsInGroup.has(nationB);
    if (!hasA || !hasB) continue;

    const [club_id, season] = key.split(":") as [string, Season];
    const club = getClub(club_id);

    results.push({
      club_id,
      club_name: club?.name ?? club_id,
      season,
      nations: Array.from(nationsInGroup),
      player_count: players.length,
      players: players.map((p) => ({ id: p.id, name: p.name, country: p.country })),
    });
  }

  // Sort by total players descending, then season
  return results.sort((a, b) => {
    if (b.player_count !== a.player_count) return b.player_count - a.player_count;
    return b.season.localeCompare(a.season);
  });
}

/** Strongest club/season connections across the tournament (by size + nation diversity) */
export function getStrongestClubSeasons(limit = 15): StrongestClubSeason[] {
  const { groups, playerIndex } = getCachedGraph();
  const list: StrongestClubSeason[] = [];

  for (const [key, memberIds] of groups) {
    if (memberIds.size < 2) continue;
    const players = Array.from(memberIds)
      .map((id) => playerIndex.byId.get(id)!)
      .filter(Boolean);
    const nations = Array.from(new Set(players.map((p) => p.country)));
    const [club_id, season] = key.split(":") as [string, Season];
    const club = getClub(club_id);

    list.push({
      club_id,
      club_name: club?.name ?? club_id,
      season,
      player_count: players.length,
      nation_count: nations.length,
      nations,
    });
  }

  // Score: heavily weight nation diversity, then raw size
  return list
    .sort((a, b) => {
      const scoreA = a.nation_count * 10 + a.player_count;
      const scoreB = b.nation_count * 10 + b.player_count;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.season.localeCompare(a.season);
    })
    .slice(0, limit);
}

/** Degrees of separation: shortest path between two players in the teammate graph.
 * Returns the sequence of hops with the club/season that connected them.
 * Uses simple BFS (graph is small: 1248 nodes).
 */
export function getDegreesOfSeparation(
  startId: string,
  endId: string
): DegreesPath | null {
  if (startId === endId) return [];

  const { groups, playerIndex } = getCachedGraph();
  const start = playerIndex.byId.get(startId);
  const end = playerIndex.byId.get(endId);
  if (!start || !end) return null;

  // Build adjacency: playerId -> array of {neighborId, club_id, season}
  const adj = new Map<string, Array<{ neighbor: string; club_id: string; season: Season }>>();

  for (const [key, members] of groups) {
    if (members.size < 2) continue;
    const [club_id, season] = key.split(":") as [string, Season];
    const arr = Array.from(members);
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];
        if (!adj.has(a)) adj.set(a, []);
        if (!adj.has(b)) adj.set(b, []);
        adj.get(a)!.push({ neighbor: b, club_id, season });
        adj.get(b)!.push({ neighbor: a, club_id, season });
      }
    }
  }

  // BFS
  type QueueItem = { id: string; path: DegreesPath };
  const queue: QueueItem[] = [
    { id: startId, path: [{ player_id: startId, player_name: start.name, player_country: start.country, club_id: "", club_name: "", season: "" }] },
  ];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;

    const neighbors = adj.get(id) || [];
    for (const { neighbor, club_id, season } of neighbors) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);

      const neighborPlayer = playerIndex.byId.get(neighbor)!;
      const club = getClub(club_id);
      const newPath: DegreesPath = [
        ...path,
        { player_id: "", player_name: "", player_country: "", club_id, club_name: club?.name ?? club_id, season },
        { player_id: neighbor, player_name: neighborPlayer.name, player_country: neighborPlayer.country, club_id: "", club_name: "", season: "" },
      ];

      if (neighbor === endId) {
        // Trim the empty starter hop
        return newPath.slice(1);
      }

      queue.push({ id: neighbor, path: newPath });
    }
  }

  return null; // no path
}

/** Global stats used in UI banners and leaderboards */
export function getGraphStats() {
  const { players, groups, allEdges } = getCachedGraph();
  let crossNationalEdges = 0;
  let maxGroupSize = 0;

  for (const [key, members] of groups) {
    maxGroupSize = Math.max(maxGroupSize, members.size);
    if (members.size < 2) continue;
    const ps = Array.from(members).map((id) => getPlayer(id)!).filter(Boolean);
    const nations = new Set(ps.map((p) => p.country));
    if (nations.size >= 2) {
      // count pairs that cross nations
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          if (ps[i].country !== ps[j].country) crossNationalEdges++;
        }
      }
    }
  }

  return {
    playerCount: players.length,
    clubCount: getCachedGraph().clubs.length,
    edgeCount: allEdges.length,
    crossNationalEdgeCount: crossNationalEdges,
    groupCount: groups.size,
    maxGroupSize,
  };
}

/** Sanity check used on load (from brief) */
export function verifySanity() {
  const psg2023 = getTeammates("Q483020", "2023-24");
  // From brief: Vitinha, Nuno Mendes, Gonçalo Ramos should be there (João Neves joins 2024-25)
  const names = psg2023.map((id) => getPlayer(id)?.name).filter(Boolean);
  return {
    psg2023Count: psg2023.length,
    hasVitinha: names.includes("Vitinha"),
    hasNunoMendes: names.includes("Nuno Mendes"),
    hasGoncaloRamos: names.includes("Gonçalo Ramos"),
    sampleNames: names.slice(0, 6),
  };
}
