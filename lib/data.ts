// lib/data.ts
// Client-side data loader for the committed dataset (self-contained deployment).

import playersJson from "@/data/players.json";
import gapsJson from "@/data/gaps.json";
import type { PlayersData, GapsData } from "./types";

export function loadDataset(): PlayersData {
  return playersJson as PlayersData;
}

export function loadGaps(): GapsData {
  return gapsJson as GapsData;
}

export const DATASET_META = (playersJson as any).meta;
