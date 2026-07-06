"use client";

import React from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useCharterQuery } from "@/hooks/use-pmo-queries";
import { 
  Printer, Mail, FileText, AlertTriangle, Users, Trophy, CheckSquare
} from "lucide-react";
import { JourneyPhase, JourneyMilestone, CharterRisk, DpdsDeliverable, Person } from "@/types/pmo";
import { cn } from "@/utils/cn";

export default function ProjectCharterPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const { data: charterData, isLoading } = useCharterQuery(activeProgrammeId);

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium">Loading project charter...</span>
        </div>
      </div>
    );
  }

  if (!charterData) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FileText className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Active Programme Selected</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select an active programme from the sidebar switcher.
        </p>
      </div>
    );
  }

  const { programme, metrics, journey, risks, team, pendingDeliverables } = charterData;
  const totalWeeks = programme.programme_weeks || 56;
  const todayWk = journey?.todayWk || 1;

  // Handler for toolbar actions (mocked UI notifications)
  const handleAction = (actionName: string) => {
    alert(`${actionName} action triggered successfully! (Pure Client Simulation)`);
  };

  return (
    <div className="page-container space-y-6 animate-in fade-in duration-300">
      
      {/* Top Toolbar Action Row */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
        <button 
          onClick={() => handleAction("Print Charter")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-bold rounded transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Charter</span>
        </button>
        <button 
          onClick={() => handleAction("Weekly Status Email")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-bold rounded transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Weekly Status Email</span>
        </button>
        <button 
          onClick={() => handleAction("Stakeholder Digest")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-bold rounded transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Stakeholder Digest</span>
        </button>
        <button 
          onClick={() => handleAction("Risk Update")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-bold rounded transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Risk Update</span>
        </button>
        <button 
          onClick={() => handleAction("Customer Status")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-bold rounded transition-colors"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Customer Status</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="bg-white border border-slate-150 rounded-lg p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-navy">{programme.name}</h1>
            <span 
              className={cn(
                "px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                programme.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
              )}
            >
              {programme.status}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1 flex flex-wrap gap-x-2 gap-y-1 items-center">
            {(!programme.category || programme.category === "Customer Project") ? (
              <>
                <span className="font-semibold text-slate-700">Customer: {programme.customer || "—"}</span>
                <span className="text-slate-300">·</span>
                <span>Category: {programme.category || "Customer Project"}</span>
                <span className="text-slate-300">·</span>
                <span>Department: {programme.department || "BU1"}</span>
                <span className="text-slate-300">·</span>
                <span>Owner: {programme.created_by || "system"}</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-slate-700">Kickoff: {programme.kickoff_date || "—"}</span>
                <span className="text-slate-300">·</span>
                <span>Duration: {programme.programme_weeks || 56} weeks</span>
                {programme.activity_type && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span>Activity Type: {programme.activity_type}</span>
                  </>
                )}
                {programme.sponsor_owner && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span>Sponsor/Owner: {programme.sponsor_owner}</span>
                  </>
                )}
              </>
            )}
          </p>

        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded text-center shrink-0">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Duration</span>
            <span className="text-lg font-black text-navy">{totalWeeks} wks</span>
          </div>
          <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded text-center shrink-0">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Today Wk</span>
            <span className="text-lg font-black text-navy">Wk {todayWk}</span>
          </div>
        </div>
      </div>

      {/* Key Stats Grid */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          <div className="bg-white border border-slate-150 p-4 rounded-lg shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Progress</span>
            <span className="text-2xl font-black text-navy block mt-1">{metrics.avgPercentComplete}%</span>
          </div>
          <div className="bg-white border border-slate-150 p-4 rounded-lg shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tasks DONE</span>
            <span className="text-2xl font-black text-navy block mt-1">
              {(metrics.byStatus || []).find((s) => s.status === 'DONE')?.c || 0} / {metrics.totalTasks || 0}
            </span>
          </div>
          <div className="bg-white border border-slate-150 p-4 rounded-lg shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Hours (Plan/Act)</span>
            <span className="text-2xl font-black text-navy block mt-1">
              {metrics.totalEffortHr} / {metrics.actualEffortHr}
            </span>
          </div>
          <div className="bg-white border border-slate-150 p-4 rounded-lg shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Milestones DONE</span>
            <span className="text-2xl font-black text-navy block mt-1">
              {metrics.milestonesDone} / {metrics.milestonesDone + metrics.milestonesPending}
            </span>
          </div>
          <div className="bg-white border border-slate-150 p-4 rounded-lg shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Open Risks</span>
            <span className="text-2xl font-black text-navy block mt-1">{metrics.risksOpen}</span>
          </div>
          <div className="bg-white border border-slate-150 p-4 rounded-lg shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Kits Shipped</span>
            <span className="text-2xl font-black text-navy block mt-1">
              {metrics.kitsShipped} / {programme.total_kits || 0}
            </span>
          </div>
          <div className="bg-white border border-slate-150 p-4 rounded-lg shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase block">Schedule Δ</span>
            {journey?.delta !== null && journey?.delta !== undefined ? (
              <span 
                className={cn(
                  "text-2xl font-black block mt-1",
                  journey.delta >= 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {journey.delta >= 0 ? "+" : ""}{journey.delta}%
              </span>
            ) : (
              <span className="text-2xl font-black text-slate-400 block mt-1">—</span>
            )}
          </div>
        </div>
      )}

      {/* Scope and Mini timeline details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Scope Info */}
        <div className="bg-white border border-slate-150 rounded-lg p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-navy border-b pb-2">Programme Scope</h3>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Kickoff Date</span>
              <span className="font-bold text-slate-800">{programme.kickoff_date || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">SOP Target</span>
              <span className="font-bold text-slate-800">{programme.sop_target || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Total Kits</span>
              <span className="font-bold text-slate-800">{programme.total_kits || "—"} units</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Template Type</span>
              <span className="font-bold text-slate-800">{programme.template_id || "BLANK"}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-2">Scope Parts</span>
            <div className="flex flex-wrap gap-1.5">
              {(programme.scope_parts || []).map((part: string, idx: number) => (
                <span key={idx} className="bg-slate-100 text-slate-800 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-slate-200">
                  {part}
                </span>
              ))}
              {(!programme.scope_parts || programme.scope_parts.length === 0) && (
                <span className="text-slate-400 text-xs italic">No specific parts scoped</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-2">Target Markets</span>
            <div className="flex flex-wrap gap-1">
              {(programme.markets || []).map((market: string, idx: number) => (
                <span key={idx} className="bg-blue-50 text-dc-blue text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100">
                  {market}
                </span>
              ))}
              {(!programme.markets || programme.markets.length === 0) && (
                <span className="text-slate-400 text-xs italic">No specific markets configured</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-2">Variants</span>
            <div className="flex flex-wrap gap-1">
              {(programme.variants || []).map((variant: string, idx: number) => (
                <span key={idx} className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-100 uppercase tracking-wider text-[9px] font-black">
                  {variant}
                </span>
              ))}
              {(!programme.variants || programme.variants.length === 0) && (
                <span className="text-slate-400 text-xs italic">No variants configured</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Span 2): Mini Timeline / Gantt progress */}
        <div className="bg-white border border-slate-150 rounded-lg p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-navy">Mini Timeline (Phase Progress)</h3>
            <span className="text-xs text-slate-400">Fixed Today position: Wk {todayWk} of {totalWeeks}</span>
          </div>

          {/* SVG Proportional Mini Gantt */}
          <div className="overflow-x-auto">
            <svg viewBox="0 0 800 240" className="w-full min-w-[600px] h-auto border border-slate-100 rounded-lg bg-slate-50/40">
              {/* Background week grids */}
              {Array.from({ length: 9 }).map((_, idx) => {
                const wk = Math.round((idx / 8) * totalWeeks);
                const x = 50 + (wk / totalWeeks) * 700;
                return (
                  <g key={idx}>
                    <line x1={x} y1={25} x2={x} y2={210} stroke="#E2E8F0" strokeWidth={1} strokeDasharray="3,3" />
                    <text x={x} y={20} fontSize={9} fill="#94A3B8" textAnchor="middle" fontWeight="bold">Wk {wk}</text>
                  </g>
                );
              })}

              {/* Gantt Phase Bars */}
              {(journey?.phases || [])
                .filter((ph) => ph.start_wk !== null && ph.end_wk !== null)
                .map((ph: JourneyPhase, idx: number) => {
                  const barY = 35 + idx * 24;
                  const startX = 50 + ((ph.start_wk - 1) / totalWeeks) * 700;
                  const endX = 50 + (ph.end_wk / totalWeeks) * 700;
                  const barW = Math.max(8, endX - startX);
                  const fillW = barW * (ph.avg_pct / 100);

                  return (
                    <g key={idx}>
                      {/* Track rect */}
                      <rect x={startX} y={barY} width={barW} height={14} rx={3} fill="#E2E8F0" />
                      {/* Fill rect */}
                      <rect x={startX} y={barY} width={fillW} height={14} rx={3} fill={ph.colour || "#0B5BAF"} />
                      {/* Label inside or next */}
                      <text x={startX + 6} y={barY + 11} fontSize={8} fill="#FFFFFF" fontWeight="black">{ph.code}</text>
                      <text x={endX + 6} y={barY + 11} fontSize={9} fill="#475569" fontWeight="bold">
                        {ph.name} ({ph.avg_pct}%)
                      </text>
                    </g>
                  );
                })}

              {/* Today line */}
              {(() => {
                if (!programme.kickoff_date || !todayWk) return null;
                const todayX = 50 + (todayWk / totalWeeks) * 700;
                return (
                  <g>
                    <line x1={todayX} y1={22} x2={todayX} y2={215} stroke="#DC2626" strokeWidth={2} strokeDasharray="4,2" />
                    <circle cx={todayX} cy={22} r={3} fill="#DC2626" />
                    <rect x={todayX - 25} y={215} width={50} height={16} rx={3} fill="#DC2626" />
                    <text x={todayX} y={226} fontSize={8} fill="#FFFFFF" textAnchor="middle" fontWeight="black">TODAY</text>
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>

      </div>

      {/* Phase Status List Table */}
      <div className="bg-white border border-slate-150 rounded-lg p-5 shadow-sm">
        <h3 className="text-sm font-bold text-navy mb-4">Phase Status Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px]">
                <th className="pb-3 w-12 text-center">Code</th>
                <th className="pb-3 pl-4">Phase Name</th>
                <th className="pb-3 text-center">Duration</th>
                <th className="pb-3 text-center">Tasks Count</th>
                <th className="pb-3 pl-8">Progress Bar</th>
                <th className="pb-3 text-right">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {(journey?.phases || []).map((ph: JourneyPhase, idx: number) => {
                const hasWeeks = ph.start_wk !== null && ph.end_wk !== null;
                const duration = hasWeeks ? (ph.end_wk - ph.start_wk + 1) : 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 text-center">
                      <span 
                        className="text-[9px] font-black text-white px-2 py-0.5 rounded"
                        style={{ backgroundColor: ph.colour || "#0B5BAF" }}
                      >
                        {ph.code}
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-navy font-bold">{ph.name}</td>
                    <td className="py-3 text-center text-slate-500">
                      {hasWeeks ? `Wk ${ph.start_wk}–${ph.end_wk} (${duration} wks)` : "—"}
                    </td>
                    <td className="py-3 text-center">{ph.tasks_count}</td>
                    <td className="py-3 pl-8">
                      <div className="w-48 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                        <div 
                          className="h-full transition-all duration-300"
                          style={{ 
                            width: `${ph.avg_pct}%`,
                            backgroundColor: ph.colour || "#0B5BAF" 
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3 text-right font-black text-navy">{ph.avg_pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Widget 1: Top 5 Open Risks */}
        <div className="bg-white border border-slate-150 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-navy">Top Open Risks</h3>
          </div>
          <div className="space-y-3">
            {(risks || []).map((r: CharterRisk) => (
              <div key={r.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50/30 text-xs flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-navy uppercase tracking-wider">{r.id} · {r.area}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-black uppercase",
                    r.impact === "High" ? "bg-red-150 text-red-750" : "bg-amber-100 text-amber-800"
                  )}>
                    {r.impact} Impact
                  </span>
                </div>
                <p className="text-slate-700 font-medium">{r.description}</p>
                <div className="text-[10px] text-slate-500 flex justify-between mt-1">
                  <span>Mitigation: {r.mitigation}</span>
                  <span className="font-bold text-slate-700">Owner: {r.owner}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 2: Upcoming Milestones */}
        <div className="bg-white border border-slate-150 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Trophy className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-bold text-navy">Upcoming Milestones</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {(journey?.milestones || [])
              .filter((m: JourneyMilestone) => m.status === 'PENDING')
              .map((m: JourneyMilestone, idx: number) => {
                const isGate = m.type.includes('★★');
                return (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{isGate ? '🏁' : '⚑'}</span>
                      <div>
                        <span className="font-bold text-navy block">{m.event}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-black">{m.type}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-bold block">
                        Week {m.week}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Widget 3: Key Pending Deliverables */}
        <div className="bg-white border border-slate-150 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <CheckSquare className="w-4 h-4 text-dc-blue" />
            <h3 className="text-sm font-bold text-navy">Key Pending Deliverables</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {(pendingDeliverables || []).map((d: DpdsDeliverable) => (
              <div key={d.id} className="py-3 flex items-center justify-between text-xs font-semibold">
                <div>
                  <span className="font-bold text-navy block">
                    {d.deliverable_name}
                    {d.required ? <span className="text-red-500 ml-1 font-bold">*</span> : ""}
                  </span>
                  <span className="text-[9px] bg-blue-50 text-dc-blue border border-blue-100 px-1 py-0.2 rounded font-black tracking-wider uppercase mt-1 inline-block">
                    {d.gate_code} · {d.kind}
                  </span>
                </div>
                <div className="text-slate-400 text-[10px] italic">Incomplete</div>
              </div>
            ))}
            {(pendingDeliverables || []).length === 0 && (
              <div className="text-slate-400 text-xs italic py-4 text-center">No pending required deliverables</div>
            )}
          </div>
        </div>

        {/* Widget 4: Key Team Roster */}
        <div className="bg-white border border-slate-150 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-navy">Assigned Team Roster</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(team || []).map((member: Person) => (
              <div key={member.id} className="p-3 border border-slate-100 bg-slate-50/20 rounded-lg flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-xs shadow-inner shrink-0"
                  style={{ backgroundColor: member.avatar_color || "#1E90E8" }}
                >
                  {member.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="truncate text-xs">
                  <span className="font-bold text-navy block truncate">{member.name}</span>
                  <span className="text-[10px] text-slate-500 block truncate font-medium">{member.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
