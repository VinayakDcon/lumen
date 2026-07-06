"use client";

import React, { useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useHeatmapReportQuery } from "@/hooks/use-pmo-queries";
import { Map, AlertTriangle } from "lucide-react";
import { cn } from "@/utils/cn";

export default function ResourceHeatmapPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  
  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: heatmap, isLoading: isHeatmapLoading } = useHeatmapReportQuery(activeProgrammeId);

  const isLoading = isProgLoading || isHeatmapLoading;

  // Today's Week calculation
  const todayWk = useMemo(() => {
    if (!activeProgramme || !activeProgramme.kickoff_date) return 1;
    const start = new Date(activeProgramme.kickoff_date);
    const today = new Date();
    if (today < start) return 1;
    const wk = Math.floor((today.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    return Math.max(1, Math.min(activeProgramme.programme_weeks || 56, wk));
  }, [activeProgramme]);

  // Heatmap rows with totals and metrics calculations
  const rowsWithTotals = useMemo(() => {
    if (!heatmap || !heatmap.rows) return [];
    
    return heatmap.rows.map((r) => {
      const total = r.cells.reduce((sum, c) => sum + c.hr, 0);
      const peak = r.cells.length > 0 ? Math.max(...r.cells.map(c => c.util_pct)) : 0;
      const capacityTotal = r.capacity_hr_per_wk * heatmap.weeks;
      const utilAvg = capacityTotal ? Math.round((total / capacityTotal) * 100) : 0;

      return {
        ...r,
        total,
        peak,
        utilAvg
      };
    }).sort((a, b) => b.total - a.total);
  }, [heatmap]);

  const summary = useMemo(() => {
    if (!heatmap || rowsWithTotals.length === 0) return null;

    const totalHours = rowsWithTotals.reduce((sum, r) => sum + r.total, 0);
    const totalCapacity = rowsWithTotals.reduce((sum, r) => sum + (r.capacity_hr_per_wk * heatmap.weeks), 0);
    const avgUtil = totalCapacity ? Math.round((totalHours / totalCapacity) * 100) : 0;
    
    const overAllocatedCount = rowsWithTotals.filter(r => r.peak > 100).length;
    const heavyLoadedCount = rowsWithTotals.filter(r => r.utilAvg > 50).length;

    return {
      resourceCount: rowsWithTotals.length,
      totalHours,
      avgUtil,
      overAllocatedCount,
      heavyLoadedCount
    };
  }, [heatmap, rowsWithTotals]);

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Heatmap...</span>
        </div>
      </div>
    );
  }

  if (!activeProgramme || !heatmap || rowsWithTotals.length === 0) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Map className="w-16 h-16 text-slate-350 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Resources Found</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select a programme or assign resource efforts to level-3 tasks to populate the resource heatmap.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col p-6 overflow-y-auto bg-bg-base font-sans text-xs space-y-6">
      
      {/* Legend and header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">
          Resource utilization per week – % of 45-hr capacity
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200" />
            <span className="text-[10px] text-slate-500">0%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#90CAF9]" />
            <span className="text-[10px] text-slate-500">1-15%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#42A5F5]" />
            <span className="text-[10px] text-slate-500">15-30%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#0B5BAF]" />
            <span className="text-[10px] text-slate-500">30-50%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#E65100]" />
            <span className="text-[10px] text-slate-500">50-75%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#9E0D0D]" />
            <span className="text-[10px] text-slate-500">75-100%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#C62828]" />
            <span className="text-[10px] text-slate-500">&gt;100% (over)</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Resources</span>
            <span className="text-2xl font-black text-navy block mt-1.5">{summary.resourceCount}</span>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Hours Allocated</span>
            <span className="text-2xl font-black text-navy block mt-1.5">{Math.round(summary.totalHours)}</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Avg Programme Utilisation</span>
            <span className="text-2xl font-black text-navy block mt-1.5">{summary.avgUtil}%</span>
          </div>

          <div className={cn("bg-white border rounded-lg p-4 shadow-sm text-center", summary.overAllocatedCount > 0 ? "border-red-200 bg-red-50/10 text-red-750" : "border-slate-200")}>
            <span className="text-[9px] uppercase tracking-wider block opacity-75 font-bold">Over-allocated (&gt;100% any wk)</span>
            <span className="text-2xl font-black block mt-1.5">{summary.overAllocatedCount}</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Heavy-loaded (avg &gt;50%)</span>
            <span className="text-2xl font-black text-navy block mt-1.5">{summary.heavyLoadedCount}</span>
          </div>
        </div>
      )}

      {/* Grid of Resource heatmap cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {rowsWithTotals.map((r) => {
          const initial = (r.name || "?")[0].toUpperCase();
          const peakCls = r.peak > 100 
            ? "text-red-600 bg-red-50 border-red-100" 
            : r.peak > 75 
              ? "text-orange-600 bg-orange-50 border-orange-100" 
              : "text-blue-600 bg-blue-50 border-blue-100";
          
          const peakBadgeText = r.peak > 100 ? "danger" : r.peak > 75 ? "warning" : "normal";

          // Calculate SVG mini-chart coordinates
          const totalWk = heatmap.weeks;
          const chartW = 340;
          const chartH = 100;
          const padL = 30, padR = 10, padT = 8, padB = 22;
          const plotW = chartW - padL - padR;
          const plotH = chartH - padT - padB;
          const cap = r.capacity_hr_per_wk || 45;
          const maxY = Math.max(cap * 1.25, ...r.cells.map(c => c.hr || 0));
          const barW = plotW / totalWk;

          const capY = padT + plotH - (cap / maxY) * plotH;
          const todayX = padL + ((todayWk - 0.5) / totalWk) * plotW;

          // X-axis ticks (e.g. every 8 weeks or 4 weeks depending on duration)
          const ticks = [];
          const tickInterval = totalWk > 40 ? 8 : 4;
          for (let w = 0; w <= totalWk; w += tickInterval) {
            ticks.push({
              x: padL + (w / totalWk) * plotW,
              val: w
            });
          }

          return (
            <div 
              key={r.resource_id} 
              className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 select-none"
            >
              {/* Card Header info */}
              <div className="flex items-center gap-3">
                <div 
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 uppercase shadow-2xs",
                    r.peak > 100 ? "bg-red-600" : r.peak > 75 ? "bg-orange-500" : "bg-blue-600"
                  )}
                >
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-navy text-[11px] truncate flex items-baseline gap-1.5">
                    <span>{r.name}</span>
                    <span className="text-[9px] text-slate-400 font-mono font-medium">{r.resource_id}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-medium mt-0.5">
                    <span><b>{Math.round(r.total)}h</b> total</span>
                    <span>·</span>
                    <span><b>{r.utilAvg}%</b> avg load</span>
                    <span>·</span>
                    <span className={cn("px-1.5 py-0.5 rounded-full border leading-none font-bold text-[8px]", peakCls)}>
                      peak <b>{r.peak}%</b>
                    </span>
                  </div>
                </div>
              </div>

              {/* Inline SVG rendering of mini utilization bar chart */}
              <div className="w-full flex justify-center bg-slate-50/50 p-2 rounded-md border border-slate-100">
                <svg width={chartW} height={chartH} className="overflow-visible">
                  {/* Capacity Cap Line */}
                  <line 
                    x1={padL} 
                    y1={capY} 
                    x2={padL + plotW} 
                    y2={capY} 
                    stroke="#C62828" 
                    strokeWidth={1} 
                    strokeDasharray="3 3" 
                    opacity={0.7}
                  />
                  <text 
                    x={padL + 4} 
                    y={capY - 3} 
                    fill="#C62828" 
                    fontSize={8} 
                    fontWeight="bold"
                  >
                    {cap}hr cap
                  </text>

                  {/* Today vertical reference line */}
                  {todayWk >= 1 && todayWk <= totalWk && (
                    <line 
                      x1={todayX} 
                      y1={padT} 
                      x2={todayX} 
                      y2={padT + plotH} 
                      stroke="#0B5BAF" 
                      strokeWidth={1} 
                      strokeDasharray="2 2" 
                      opacity={0.6}
                    />
                  )}

                  {/* Allocation Bars */}
                  {r.cells.map((c, idx) => {
                    if (!c.hr || c.hr <= 0) return null;
                    const x = padL + idx * barW;
                    const h = (c.hr / maxY) * plotH;
                    const y = padT + plotH - h;

                    let barColor = "#90CAF9";
                    if (c.util_pct > 100) barColor = "#C62828";
                    else if (c.util_pct > 75) barColor = "#E65100";
                    else if (c.util_pct > 50) barColor = "#0B5BAF";
                    else if (c.util_pct > 25) barColor = "#42A5F5";

                    return (
                      <rect 
                        key={idx}
                        x={x} 
                        y={y} 
                        width={Math.max(barW - 1, 1)} 
                        height={h} 
                        fill={barColor} 
                        opacity={0.95}
                        rx={0.5}
                      >
                        <title>{`Wk ${c.wk}: ${c.hr}h (${c.util_pct}%)`}</title>
                      </rect>
                    );
                  })}

                  {/* X-Axis labels */}
                  {ticks.map((t, idx) => (
                    <text 
                      key={idx} 
                      x={t.x} 
                      y={chartH - 6} 
                      fontSize={8} 
                      fill="#94A3B8" 
                      textAnchor="middle"
                    >
                      {t.val}
                    </text>
                  ))}

                  {/* Borders / Axis lines */}
                  <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#E2E8F0" />
                  <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#E2E8F0" />
                </svg>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
