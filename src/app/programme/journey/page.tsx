"use client";

import React from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useJourneyQuery } from "@/hooks/use-pmo-queries";
import { 
  Compass, Navigation, CheckCircle2
} from "lucide-react";
import { JourneyPhase, JourneyMilestone } from "@/types/pmo";
import { cn } from "@/utils/cn";

export default function ProgrammeJourneyPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const { data: journeyData, isLoading } = useJourneyQuery(activeProgrammeId);

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium">Loading programme journey...</span>
        </div>
      </div>
    );
  }

  if (!journeyData) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Compass className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Active Programme Selected</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select an active programme from the sidebar switcher.
        </p>
      </div>
    );
  }

  const { programme, phases, milestones, todayWk, weightedPct, scheduledPctAtToday, delta } = journeyData;
  const totalWk = programme.programme_weeks || 56;

  // Visual layout constants for responsive-ready SVG drawing
  const padL = 60;
  const padR = 60;
  const canvasWidth = 1200;
  const trackW = canvasWidth - padL - padR;
  const trackY = 160;

  // Converter from Week/Percentage to X coordinate
  const wkToX = (wk: number) => padL + (wk / totalWk) * trackW;

  const progX = padL + (weightedPct / 100) * trackW;
  const schedX = padL + (scheduledPctAtToday / 100) * trackW;
  const todayX = padL + (todayWk / totalWk) * trackW;

  return (
    <div className="page-container space-y-6 animate-in fade-in duration-300">
      
      {/* Header and Summary stats */}
      <div className="bg-white border border-slate-150 rounded-lg p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy">{programme.name} · Programme Journey</h1>
          <p className="text-slate-500 text-sm mt-1">
            <span className="font-semibold text-slate-700">{programme.customer || "INTERNAL"}</span>
            <span className="mx-2">·</span>
            <span>Week {todayWk} of {totalWk}</span>
            <span className="mx-2">·</span>
            <span>Goal: SOP @ Week {totalWk}</span>
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100 font-bold">
          <div className="text-center px-2">
            <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Where we are</span>
            <span className="text-xl font-black text-navy">{weightedPct}%</span>
          </div>
          <div className="text-center px-2">
            <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Where we should be</span>
            <span className="text-xl font-black text-navy">{scheduledPctAtToday}%</span>
          </div>
          <div className="text-center px-2 border-l border-slate-200">
            <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Schedule Δ</span>
            <span 
              className={cn(
                "text-xl font-black block",
                delta >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {delta >= 0 ? "+" : ""}{delta}%
            </span>
          </div>
          <div className="text-center px-2 border-l border-slate-200">
            <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Today</span>
            <span className="text-xl font-black text-navy">Wk {todayWk}</span>
          </div>
        </div>
      </div>

      {/* Visual Timeline Box */}
      <div className="bg-white border border-slate-150 rounded-lg p-6 shadow-sm overflow-hidden space-y-4">
        <h3 className="text-sm font-bold text-navy">Journey Roadmap pipeline</h3>

        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${canvasWidth} 280`} className="w-full min-w-[1000px] h-auto bg-slate-900/5 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-lg p-2 relative">
            {/* Background base path track line */}
            <path className="stroke-slate-250 dark:stroke-slate-700 fill-none" strokeWidth="6" strokeLinecap="round" d={`M${padL},${trackY} L${canvasWidth - padR},${trackY}`} />
            
            {/* Progress overlay path */}
            <path className="stroke-dc-blue fill-none" strokeWidth="6" strokeLinecap="round" d={`M${padL},${trackY} L${progX},${trackY}`} />

            {/* "Where we should be" dashed red line */}
            <line x1={schedX} y1={trackY - 60} x2={schedX} y2={trackY + 60} stroke="#C62828" strokeWidth="1.5" strokeDasharray="5,5" />
            <text x={schedX} y={trackY + 76} className="text-[14px]" textAnchor="middle">📍</text>
            <text x={schedX} y={trackY + 95} className="fill-red-800 dark:fill-red-400 text-[10px] font-black" textAnchor="middle">SHOULD BE HERE</text>

            {/* Today indicator line */}
            <line x1={todayX} y1={trackY - 90} x2={todayX} y2={trackY - 40} stroke="#9CA3AF" strokeWidth="1" />
            <text x={todayX} y={trackY - 98} className="fill-slate-500 dark:fill-slate-400 text-[9px] font-bold" textAnchor="middle">Today · Wk {todayWk}</text>

            {/* Phase Stations (Nodes) */}
            {(phases || [])
              .filter((ph) => ph.start_wk !== null && ph.end_wk !== null)
              .map((ph: JourneyPhase, idx: number) => {
                const x = wkToX(ph.end_wk);
                const isDone = ph.avg_pct >= 95;
                const isActive = todayWk >= ph.start_wk && todayWk <= ph.end_wk + 1;
                const circleColor = isDone ? "#2E7D32" : (isActive ? "#0B5BAF" : "#94A3B8");
                
                return (
                  <g key={idx} className="cursor-pointer group">
                    <circle cx={x} cy={trackY} r="14" fill={circleColor} stroke="#FFFFFF" strokeWidth="2.5" />
                    <text x={x} y={trackY + 4} className="fill-white text-[9px] font-black" textAnchor="middle">{ph.code}</text>
                    
                    {/* Name label above */}
                    <text x={x} y={trackY - 26} className="fill-navy dark:fill-slate-200 text-[10px] font-extrabold" textAnchor="middle">{ph.name}</text>
                    
                    {/* Pct completion below */}
                    <text x={x} y={trackY - 14} className="fill-slate-400 dark:fill-slate-400 text-[9px] font-bold" textAnchor="middle">{ph.avg_pct}%</text>
                  </g>
                );
              })}

            {/* Milestones flags */}
            {(() => {
              const seen = new Set();
              return (milestones || [])
                .filter((m: JourneyMilestone) => m.week <= totalWk)
                .map((m: JourneyMilestone, idx: number) => {
                  const x = wkToX(m.week);
                  const key = Math.round(x / 10);
                  if (seen.has(key)) return null;
                  seen.add(key);

                  const isGate = m.type.includes('★★');
                  const flagY = trackY - 60;
                  const isDone = m.status === 'DONE';
                  const flagColor = isDone ? "#2E7D32" : (isGate ? "#D97706" : "#6B7280");

                  return (
                    <g key={idx}>
                      <line x1={x} y1={flagY + 12} x2={x} y2={trackY - 15} stroke={flagColor} strokeWidth="1" strokeDasharray="3,3" />
                      <text x={x} y={flagY} className="text-xs" textAnchor="middle">{isGate ? '🏁' : '⚑'}</text>
                      <text x={x} y={flagY - 10} className="text-[8px] font-extrabold" fill={flagColor} textAnchor="middle">Wk {m.week}</text>
                    </g>
                  );
                });
            })()}

            {/* Rider/Rocket Marker at "You Are Here" position */}
            <g transform={`translate(${progX - 16}, ${trackY - 35})`} className="transition-transform duration-300 hover:scale-110 cursor-pointer">
              <circle cx="16" cy="18" r="18" fill="white" stroke="#0B5BAF" strokeWidth="2.5" className="shadow-lg" />
              <text x="16" y="24" className="text-base" textAnchor="middle">🚀</text>
            </g>
            <text x={progX} y={trackY + 32} className="fill-dc-blue text-[10px] font-black" textAnchor="middle">YOU ARE HERE</text>

            {/* Goal flag at the end */}
            <g transform={`translate(${canvasWidth - padR - 10}, ${trackY - 70})`}>
              <text x="10" y="20" className="fill-amber-600 text-xs font-black" textAnchor="end">🏆 GOAL: SOP</text>
              <text x="10" y="34" className="fill-navy dark:fill-slate-200 text-[10px] font-bold" textAnchor="end">Wk {totalWk} · {programme.sop_target || "—"}</text>
            </g>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-slate-100 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-500" />
            <span>Phase Complete (&gt;=95%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-dc-blue border border-blue-600 animate-pulse" />
            <span>Active/In Progress Phase</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-slate-400 border border-slate-350" />
            <span>Upcoming Gate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">📍</span>
            <span className="text-red-700">Target Line (Red)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">🚀</span>
            <span className="text-dc-blue">Actual Progress (Rider)</span>
          </div>
        </div>
      </div>

      {/* Phase Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-navy">Phase Progression Cards</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {(phases || []).map((ph: JourneyPhase, idx: number) => {
            const isDone = ph.avg_pct >= 95;
            const isActive = todayWk >= ph.start_wk && todayWk <= ph.end_wk + 1;
            
            return (
              <div 
                key={idx} 
                className={cn(
                  "bg-white border p-4 rounded-lg shadow-sm hover-lift flex flex-col justify-between h-36 border-slate-150 transition-all",
                  isDone && "bg-emerald-50/10 border-emerald-200/80 shadow-emerald-50/20",
                  isActive && "bg-blue-50/10 border-dc-blue shadow-blue-50/20 border-t-4"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-[9px] font-black text-white px-2 py-0.5 rounded uppercase tracking-wider"
                      style={{ backgroundColor: ph.colour || "#0B5BAF" }}
                    >
                      {ph.code}
                    </span>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : isActive ? (
                      <Navigation className="w-4 h-4 text-dc-blue animate-pulse shrink-0" />
                    ) : null}
                  </div>
                  <span className="text-xs font-black text-navy block mt-2 truncate" title={ph.name}>
                    {ph.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                    {ph.start_wk !== null && ph.end_wk !== null ? `Wk ${ph.start_wk}–${ph.end_wk}` : "Wk —"} · {ph.tasks_count} tasks
                  </span>
                </div>

                <div>
                  <div className="w-full bg-slate-150 h-1.5 rounded-full overflow-hidden mt-3">
                    <div 
                      className="h-full transition-all duration-350"
                      style={{ 
                        width: `${ph.avg_pct}%`,
                        backgroundColor: ph.colour || "#0B5BAF" 
                      }}
                    />
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-400 block mt-1">
                    {ph.avg_pct}% complete
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
