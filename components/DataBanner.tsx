"use client";

import Link from "next/link";

interface DataBannerProps {
  playerCount: number;
  clubCount: number;
  edgeCount: number;
  crossNational: number;
}

export function DataBanner({
  playerCount,
  clubCount,
  edgeCount,
  crossNational,
}: DataBannerProps) {
  return (
    <div className="data-banner rounded-xl px-4 py-3 text-xs flex flex-wrap items-center gap-x-6 gap-y-1 text-zinc-400">
      <div>
        <span className="text-zinc-300 font-medium">{playerCount.toLocaleString()}</span> players
      </div>
      <div>
        <span className="text-zinc-300 font-medium">{clubCount.toLocaleString()}</span> clubs
      </div>
      <div>
        <span className="text-zinc-300 font-medium">{edgeCount.toLocaleString()}</span> clubmate edges
      </div>
      <div>
        <span className="text-emerald-400 font-medium">{crossNational.toLocaleString()}</span> cross-national connections
      </div>
      <div className="flex-1" />
      <div className="text-[10px]">
        Built from the pinned v1.0 dataset • joins on <code className="font-mono">club_id + season</code> only •
        <Link href="https://github.com/layerx-labs/wc2026-squad-graph-dataset" target="_blank" className="underline ml-1">dataset</Link>
        {" • "}
        <a href="#gaps" className="underline">known gaps</a>
      </div>
    </div>
  );
}
