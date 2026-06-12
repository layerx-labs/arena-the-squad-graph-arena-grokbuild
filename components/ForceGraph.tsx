"use client";

import { useEffect, useRef, useState } from "react";
import { ForceGraph2D } from "react-force-graph";
import { getAllEdges, getPlayer, getClub, getCachedGraph } from "@/lib/graph";
import { getFlagEmoji } from "@/lib/utils";
import type { Player } from "@/lib/types";

interface Props {
  onNodeClick?: (playerId: string) => void;
  highlightPlayerId?: string | null;
  onlyCrossNational?: boolean;
  minGroupSize?: number;
  seasonFilter?: string | null;
}

interface GraphLink {
  source: string | { id: string };
  target: string | { id: string };
  club_id: string;
  season: string;
  club_name: string;
}

export function ForceGraph({ onNodeClick, highlightPlayerId, onlyCrossNational = false, minGroupSize = 2, seasonFilter }: Props) {
  const fgRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const { players } = getCachedGraph();
      const edges = getAllEdges();

      const nodeMap = new Map<string, any>();
      players.forEach((p) => {
        nodeMap.set(p.id, {
          id: p.id,
          name: p.name,
          country: p.country,
          val: 1,
          color: getCountryColor(p.country),
        });
      });

      let filteredEdges = edges;
      if (seasonFilter) {
        filteredEdges = edges.filter((e) => e.season === seasonFilter);
      }
      if (minGroupSize > 2) {
        const groupSizes = new Map<string, number>();
        for (const e of edges) {
          const k = `${e.club_id}:${e.season}`;
          groupSizes.set(k, (groupSizes.get(k) || 0) + 1);
        }
        filteredEdges = filteredEdges.filter((e) => (groupSizes.get(`${e.club_id}:${e.season}`) || 0) >= minGroupSize);
      }

      const links: GraphLink[] = filteredEdges.map((e) => ({
        source: e.source,
        target: e.target,
        club_id: e.club_id,
        season: e.season,
        club_name: getClub(e.club_id)?.name || e.club_id,
      }));

      // Optional cross-national filter
      let finalLinks = links;
      if (onlyCrossNational) {
        finalLinks = links.filter((l) => {
          const sCountry = nodeMap.get(typeof l.source === "string" ? l.source : l.source.id)?.country;
          const tCountry = nodeMap.get(typeof l.target === "string" ? l.target : l.target.id)?.country;
          return sCountry && tCountry && sCountry !== tCountry;
        });
      }

      // Prune nodes to only those appearing in the filtered links
      const used = new Set<string>();
      finalLinks.forEach((l: GraphLink) => {
        const sId = typeof l.source === "string" ? l.source : l.source.id;
        const tId = typeof l.target === "string" ? l.target : l.target.id;
        used.add(sId);
        used.add(tId);
      });
      const nodes = Array.from(nodeMap.values()).filter((n) => used.has(n.id) || (!finalLinks.length && players.length < 50));

      setGraphData({ nodes: nodes.slice(0, 900), links: finalLinks.slice(0, 4500) });
      setReady(true);
    } catch (e) {
      console.error("Graph data error", e);
    }
  }, [onlyCrossNational, minGroupSize, seasonFilter]);

  function getCountryColor(country: string) {
    const colors: Record<string, string> = {
      Brazil: "#009739",
      Argentina: "#74ACDF",
      France: "#002395",
      Portugal: "#006600",
      England: "#CE1124",
    };
    return colors[country] || "#888";
  }

  const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const fontSize = Math.max(10 / globalScale, 3);
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = node.color || "#aaa";
    ctx.beginPath();
    ctx.arc(node.x, node.y, 2.5, 0, 2 * Math.PI, false);
    ctx.fill();
    if (globalScale > 1.2) {
      ctx.fillStyle = "#ddd";
      ctx.fillText(label, node.x + 5, node.y + 3);
    }
    if (node.id === highlightPlayerId) {
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 1.5 / globalScale;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const handleNodeClick = (node: any) => {
    if (onNodeClick) onNodeClick(node.id);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 800);
      fgRef.current.zoom(2.2, 800);
    }
  };

  if (!ready) return <div className="h-[420px] flex items-center justify-center text-xs text-zinc-500">Building force-directed graph…</div>;

  return (
    <div className="graph-container" style={{ height: 520 }}>
      {graphData.nodes.length > 0 ? (
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeCanvasObject={nodeCanvasObject}
          linkColor={() => "#333"}
          linkWidth={0.6}
          onNodeClick={handleNodeClick}
          onNodeHover={() => {}}
          cooldownTicks={80}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          width={920}
          height={520}
        />
      ) : (
        <div className="h-full flex items-center justify-center text-xs text-zinc-500">No edges to display with current filters.</div>
      )}
      <div className="px-3 py-1 text-[10px] text-zinc-500 border-t border-zinc-800 flex justify-between">
        <div>Canvas force-directed • click node to focus • drag to pan</div>
        <div>{graphData.nodes.length} players • {graphData.links.length} edges (filtered)</div>
      </div>
    </div>
  );
}
