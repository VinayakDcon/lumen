"use client";

import React, { useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import {
  useDashboardMetricsQuery,
  useFollowUpQuery,
  useScurveQuery,
  useActiveProgrammeQuery
} from "@/hooks/use-pmo-queries";
import {
  AlertTriangle,
  FolderKanban,
  CheckSquare,
  Trophy,
  Calendar,
  Clock,
  TrendingUp,
  FileText,
  Pin
} from "lucide-react";
import { cn } from "@/utils/cn";

export function DashboardView() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const { data: activeProgramme } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: metrics, isLoading: isMetricsLoading } = useDashboardMetricsQuery(activeProgrammeId);
  const { data: followUps = [], isLoading: isFollowUpsLoading } = useFollowUpQuery(activeProgrammeId);
  const { data: scurveData = [], isLoading: isScurveLoading } = useScurveQuery(activeProgrammeId);

  const getWeekDate = (kickoffStr: string | null, week: number): Date => {
    const base = kickoffStr ? new Date(kickoffStr) : new Date();
    base.setDate(base.getDate() + (week - 1) * 7);
    return base;
  };

  const today = useMemo(() => new Date(), []);
  const kickoffDateStr = activeProgramme?.kickoff_date || null;

  // Process follow-up tasks
  const dueSoon = useMemo(() => {
    return followUps.filter((t) => {
      if (t.status === "DONE") return false;
      const finishDate = getWeekDate(kickoffDateStr, t.finish_wk);
      const days = (finishDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 14;
    });
  }, [followUps, kickoffDateStr, today]);

  const stale = useMemo(() => {
    return followUps.filter((t) => {
      if (t.status === "DONE") return false;
      if (!t.updated_at) return false;
      const updatedDate = new Date(t.updated_at);
      const days = (today.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);
      return days > 14 && t.status === "IN PROGRESS";
    });
  }, [followUps, today]);

  // S-Curve calculations
  const scurveSvgPath = useMemo(() => {
    if (!scurveData || scurveData.length === 0) return { linePath: "", fillPath: "", points: [], gridY: [], gridX: [] };

    const padL = 60, padR = 30, padT = 30, padB = 40;
    const W = 700, H = 240;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const maxHr = Math.max(...scurveData.map(d => d.cumul_hr)) || 100;
    const maxWk = scurveData.length;

    const points = scurveData.map((d) => {
      const x = padL + (d.week / maxWk) * plotW;
      const y = padT + plotH - (d.cumul_hr / maxHr) * plotH;
      return { x, y, week: d.week, cumul_hr: d.cumul_hr };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const fillPath = points.length > 0
      ? `M ${points[0].x} ${padT + plotH} ` + points.map((p) => `L ${p.x} ${p.y}`).join(" ") + ` L ${points[points.length - 1].x} ${padT + plotH} Z`
      : "";

    // Grid details
    const gridY = Array.from({ length: 6 }).map((_, i) => {
      const val = Math.round(maxHr * i / 5);
      const y = padT + plotH - (i / 5) * plotH;
      return { y, val };
    });

    const gridX = [];
    for (let wk = 0; wk <= maxWk; wk += 8) {
      const x = padL + (wk / maxWk) * plotW;
      gridX.push({ x, week: wk });
    }

    return { linePath, fillPath, points, gridY, gridX, maxHr, maxWk };
  }, [scurveData]);

  if (!activeProgrammeId) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FolderKanban className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Active Programme Selected</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select an active programme from the sidebar switcher to load the dashboard.
        </p>
      </div>
    );
  }

  const isLoading = isMetricsLoading || isFollowUpsLoading || isScurveLoading;

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  // Format Helper
  const fmtNum = (val: number | undefined | null) => {
    if (val === undefined || val === null) return "0";
    return val.toLocaleString();
  };

  const totalStatusTasks = metrics?.byStatus.reduce((s, x) => s + x.c, 0) || 1;

  return (
    <div className="page-container space-y-6 animate-in fade-in duration-300">
      
      {/* Attention / Follow-up Panel */}
      <div className="border border-amber-200 bg-amber-50/30 rounded-lg p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wide">
          <Pin className="w-4 h-4 text-red-500 rotate-45 shrink-0" />
          <span>Follow-up · Items needing your attention</span>
        </div>

        {followUps.length === 0 ? (
          <p className="text-xs text-amber-700/80 pl-6">
            No tasks currently assigned to you. Update your team profile resource id link to see assignments.
          </p>
        ) : (
          <div className="space-y-2 pl-6">
            {dueSoon.length > 0 && (
              <div>
                <div className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider mb-1">
                  ⏰ Due within 14 days ({dueSoon.length})
                </div>
                <div className="space-y-1.5">
                  {dueSoon.slice(0, 5).map((t) => (
                    <div key={t.wbs} className="flex flex-wrap items-center gap-2 text-xs text-slate-700 font-semibold bg-white/70 border border-slate-100 rounded px-2.5 py-1.5">
                      <span className="font-mono text-[10px] text-dc-blue bg-blue-50 px-1 py-0.2 rounded font-bold">{t.wbs}</span>
                      <span className="truncate max-w-[200px]">{t.name}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-bold uppercase">{t.part}</span>
                      <span className="ml-auto text-[10px] text-slate-500">Wk {t.finish_wk}</span>
                      <span className="text-[9px] bg-blue-150 text-blue-750 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">{t.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stale.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] font-extrabold uppercase text-red-700 tracking-wider mb-1">
                  ⚠ Stale (no update in 14+ days while In Progress) ({stale.length})
                </div>
                <div className="space-y-1.5">
                  {stale.slice(0, 5).map((t) => (
                    <div key={t.wbs} className="flex flex-wrap items-center gap-2 text-xs text-slate-700 font-semibold bg-white/70 border border-slate-100 rounded px-2.5 py-1.5">
                      <span className="font-mono text-[10px] text-dc-blue bg-blue-50 px-1 py-0.2 rounded font-bold">{t.wbs}</span>
                      <span className="truncate max-w-[200px]">{t.name}</span>
                      <span className="ml-auto text-[10px] text-slate-400 font-medium">Last update: {t.updated_at ? new Date(t.updated_at).toLocaleDateString() : "—"}</span>
                      <span className="text-[9px] bg-blue-150 text-blue-750 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">{t.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dueSoon.length === 0 && stale.length === 0 && (
              <p className="text-xs text-emerald-700 font-semibold pl-1">
                ✓ All your tasks are up-to-date
              </p>
            )}
          </div>
        )}
      </div>

      {/* Dash KPI Grid */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Progress Card (Colored) */}
          <div className="bg-dc-blue text-white border border-dc-blue/10 rounded-lg p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80 block">Programme Progress</span>
              <span className="text-3xl font-black block mt-2">{metrics.avgPercentComplete}%</span>
            </div>
            <div className="mt-4">
              <span className="text-[10px] text-white/80 font-bold block mb-1.5">avg % complete</span>
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-white h-full transition-all duration-300"
                  style={{ width: `${metrics.avgPercentComplete}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tasks Card */}
          <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Tasks (L3)</span>
              <span className="text-3xl font-black text-navy block mt-2">{metrics.totalTasks}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-bold mt-4">total</div>
          </div>

          {/* Effort Card */}
          <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Effort · Plan vs Actual</span>
              <span className="text-3xl font-black text-navy block mt-2">{fmtNum(metrics.totalEffortHr)} hr</span>
            </div>
            <div className="text-[10px] text-slate-500 font-bold mt-4">
              actual: {fmtNum(metrics.actualEffortHr)} hr ({metrics.totalEffortHr > 0 ? Math.round((metrics.actualEffortHr / metrics.totalEffortHr) * 100) : 0}%)
            </div>
          </div>

          {/* Milestones Card */}
          <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Milestones</span>
              <span className="text-3xl font-black text-navy block mt-2">
                {metrics.milestonesDone}/{metrics.milestonesDone + metrics.milestonesPending}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-bold mt-4">done / total</div>
          </div>

          {/* Kits Shipped Card */}
          <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Kits Shipped</span>
              <span className="text-3xl font-black text-navy block mt-2">{metrics.kitsShipped}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-bold mt-4">of {metrics.kitsTotal || 33}</div>
          </div>

          {/* Risks Open Card */}
          <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Risks Open</span>
              <span className="text-3xl font-black text-navy block mt-2">{metrics.risksOpen}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-bold mt-4">awaiting</div>
          </div>
        </div>
      )}

      {/* Dynamic Tables Row 1 */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* By Phase */}
          <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm lg:col-span-2 space-y-4">
            <h3 className="text-sm font-black text-navy border-b border-slate-100 pb-2">By Phase</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                    <th className="pb-2">Phase</th>
                    <th className="pb-2">Tasks</th>
                    <th className="pb-2">Hr</th>
                    <th className="pb-2">%</th>
                    <th className="pb-2 pl-4">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                  {metrics.byPhase.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5">
                        <span className="text-[9px] font-black bg-blue-50 text-dc-blue border border-blue-100 px-2 py-0.5 rounded uppercase tracking-wide">
                          {p.phase}
                        </span>
                      </td>
                      <td className="py-2.5">{p.tasks_count}</td>
                      <td className="py-2.5">{fmtNum(p.effort)}</td>
                      <td className="py-2.5 font-bold text-navy">{Math.round(p.avg_pct || 0)}%</td>
                      <td className="py-2.5 pl-4">
                        <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className="bg-dc-blue h-full transition-all duration-300"
                            style={{ width: `${p.avg_pct || 0}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* By Status */}
          <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-navy border-b border-slate-100 pb-2">By Status</h3>
            <div className="space-y-4">
              {metrics.byStatus.map((s) => {
                const pct = (s.c / totalStatusTasks) * 100;
                let pillClass = "bg-slate-100 text-slate-600 border border-slate-200";
                let fillClass = "bg-slate-400";
                
                if (s.status === "DONE") {
                  pillClass = "bg-green-50 text-success-green border border-green-200";
                  fillClass = "bg-success-green";
                } else if (s.status === "IN PROGRESS") {
                  pillClass = "bg-blue-50 text-dc-blue border border-blue-200";
                  fillClass = "bg-dc-blue";
                }
                
                return (
                  <div key={s.status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={cn("text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase", pillClass)}>
                        {s.status}
                      </span>
                      <span className="font-bold text-navy">{s.c}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className={cn("h-full transition-all duration-300", fillClass)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Tables Row 2 */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* By Part */}
          <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm lg:col-span-2 space-y-4">
            <h3 className="text-sm font-black text-navy border-b border-slate-100 pb-2">
              By Part {activeProgramme?.scope_parts && activeProgramme.scope_parts.length > 0 && `· ${activeProgramme.scope_parts.join(" / ")}`}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                    <th className="pb-2">Part</th>
                    <th className="pb-2">Tasks</th>
                    <th className="pb-2">Hr</th>
                    <th className="pb-2">%</th>
                    <th className="pb-2 pl-4">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                  {metrics.byPart.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5">
                        <span className="text-[9px] font-black bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-wide">
                          {p.part}
                        </span>
                      </td>
                      <td className="py-2.5">{p.tasks_count}</td>
                      <td className="py-2.5">{fmtNum(p.effort)}</td>
                      <td className="py-2.5 font-bold text-navy">{Math.round(p.avg_pct || 0)}%</td>
                      <td className="py-2.5 pl-4">
                        <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className="bg-dc-blue h-full transition-all duration-300"
                            style={{ width: `${p.avg_pct || 0}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* S-Curve Chart */}
          <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-navy">S-Curve · Cumulative Effort</h3>
              <span className="text-[10px] text-slate-400 font-bold">Planned vs Cumulative Hours</span>
            </div>

            {scurveData.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-xs text-slate-400 font-semibold italic">
                No S-curve data available.
              </div>
            ) : (
              <div className="relative">
                <svg viewBox="0 0 700 240" className="w-full h-auto bg-slate-50/40 border border-slate-100 rounded-lg overflow-visible">
                  <defs>
                    <linearGradient id="scurve-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1E90E8" stopOpacity="0.25"/>
                      <stop offset="100%" stopColor="#1E90E8" stopOpacity="0"/>
                    </linearGradient>
                  </defs>

                  {/* Horizontal gridlines */}
                  {scurveSvgPath.gridY.map((g, idx) => (
                    <g key={idx}>
                      <line 
                        x1={60} 
                        y1={g.y} 
                        x2={700 - 30} 
                        y2={g.y} 
                        stroke="#E2E8F0" 
                        strokeWidth={1} 
                        strokeDasharray={idx === 0 ? "0" : "3,3"} 
                      />
                      <text 
                        x={50} 
                        y={g.y + 4} 
                        fontSize={9} 
                        fill="#94A3B8" 
                        textAnchor="end" 
                        className="font-bold"
                      >
                        {fmtNum(g.val)} h
                      </text>
                    </g>
                  ))}

                  {/* Vertical gridlines */}
                  {scurveSvgPath.gridX.map((g, idx) => (
                    <g key={idx}>
                      <line 
                        x1={g.x} 
                        y1={30} 
                        x2={g.x} 
                        y2={240 - 40} 
                        stroke="#E2E8F0" 
                        strokeWidth={1} 
                        strokeDasharray="3,3" 
                      />
                      <text 
                        x={g.x} 
                        y={240 - 20} 
                        fontSize={9} 
                        fill="#94A3B8" 
                        textAnchor="middle" 
                        className="font-bold"
                      >
                        Wk {g.week}
                      </text>
                    </g>
                  ))}

                  {/* Area fill path */}
                  {scurveSvgPath.fillPath && (
                    <path d={scurveSvgPath.fillPath} fill="url(#scurve-gradient)" />
                  )}

                  {/* S-curve path line */}
                  {scurveSvgPath.linePath && (
                    <path 
                      d={scurveSvgPath.linePath} 
                      fill="none" 
                      stroke="#0B5BAF" 
                      strokeWidth={2.5} 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Active highlight dots */}
                  {scurveSvgPath.points.filter((_, idx) => idx % 8 === 0 || idx === scurveSvgPath.points.length - 1).map((p, idx) => (
                    <circle 
                      key={idx} 
                      cx={p.x} 
                      cy={p.y} 
                      r={3.5} 
                      fill="#0B5BAF" 
                      stroke="#FFFFFF" 
                      strokeWidth={1.5}
                      className="cursor-pointer hover:r-5 transition-all"
                    >
                      <title>{`Wk ${p.week}: ${p.cumul_hr} hr`}</title>
                    </circle>
                  ))}

                  {/* Top-left description overlay */}
                  <text x={65} y={20} fontSize={10} fill="#0D1B2E" className="font-extrabold uppercase tracking-wide">
                    Cumulative effort: {fmtNum(scurveSvgPath.maxHr)} hr · {scurveSvgPath.maxWk} weeks
                  </text>
                </svg>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
