"use client";

import React, { useState } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useCharterQuery, useTasksQuery, useCustomerCommsQuery } from "@/hooks/use-pmo-queries";
import { 
  Printer, Mail, FileText, AlertTriangle, Users, Trophy, CheckSquare, X, Copy, ExternalLink
} from "lucide-react";
import { JourneyPhase, JourneyMilestone, CharterRisk, DpdsDeliverable, Person } from "@/types/pmo";
import { cn } from "@/utils/cn";

export default function ProjectCharterPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const { data: charterData, isLoading } = useCharterQuery(activeProgrammeId);
  const { data: tasksData } = useTasksQuery(activeProgrammeId);
  const { data: commsData } = useCustomerCommsQuery(activeProgrammeId);

  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean;
    title: string;
    subject: string;
    body: string;
  }>({
    isOpen: false,
    title: "",
    subject: "",
    body: ""
  });
  const [isCopied, setIsCopied] = useState(false);

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

  const handlePrintCharter = () => {
    const content = document.getElementById("charter-content");
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) {
      alert("Popup blocker prevented printing. Please allow popups for this site.");
      return;
    }
    win.document.write(`
      <html>
        <head>
          <title>Project Charter - ${programme.name}</title>
          <style>
            body { background: white !important; padding: 40px !important; font-family: sans-serif; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          <div class="space-y-6">
            ${content.innerHTML}
          </div>
        </body>
      </html>
    `);
    
    // Copy stylesheets
    document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
      win.document.head.appendChild(node.cloneNode(true));
    });
    
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  };

  const handleEmailSummary = (kind: "weekly" | "stakeholder" | "risk" | "customer") => {
    let subject = "";
    let body = "";

    const recentDone = (tasksData || [])
      .filter((t: any) => t.status === "DONE" || t.status === "COMPLETE" || t.status === "COMPLETED")
      .slice(-5);
    const inProgress = (tasksData || [])
      .filter((t: any) => t.status === "IN PROGRESS")
      .slice(0, 8);
    const upcomingMs = (journey?.milestones || [])
      .filter((m: any) => m.status === "PENDING")
      .slice(0, 5);
    const openRisks = (risks || [])
      .filter((r: any) => r.status === "OPEN" || !r.status);
    const recentComms = (commsData || []).slice(0, 3);

    const fmtNum = (val: number | null | undefined) => {
      if (val === null || val === undefined) return "0";
      return typeof val === "number" ? val.toFixed(1) : val;
    };

    if (kind === "weekly") {
      subject = `[${programme.name}] Weekly Status · Wk ${todayWk}`;
      body = `Hi team,

Weekly status for ${programme.name} (Wk ${todayWk} of ${totalWeeks}):

PROGRESS · ${metrics?.avgPercentComplete || 0}% overall
- Tasks Done: ${(metrics?.byStatus || []).find((s: any) => s.status === 'DONE')?.c || 0} / ${metrics?.totalTasks || 0}
- In Progress: ${(metrics?.byStatus || []).find((s: any) => s.status === 'IN PROGRESS')?.c || 0}
- Hours actual / planned: ${fmtNum(metrics?.actualEffortHr)} / ${fmtNum(metrics?.totalEffortHr)}
- Open risks: ${metrics?.risksOpen || 0}
- Milestones done: ${metrics?.milestonesDone || 0} / ${(metrics?.milestonesDone || 0) + (metrics?.milestonesPending || 0)}

THIS WEEK · highlights:
${recentDone.map((t: any) => `  ✓ ${t.wbs} · ${t.name}`).join('\n')}

NEXT WEEK · in flight:
${inProgress.map((t: any) => `  ▸ ${t.wbs} · ${t.name} (${t.percent_complete}%)`).join('\n')}

UPCOMING MILESTONES (next ${upcomingMs.length}):
${upcomingMs.map((m: any) => `  • Wk ${m.week} · ${m.event}`).join('\n')}

OPEN RISKS · top ${Math.min(3, openRisks.length)}:
${openRisks.slice(0, 3).map((r: any) => `  ⚠ ${r.id} · ${r.description} (${r.probability}/${r.impact})`).join('\n')}

— ${programme.created_by || 'Programme Manager'}
DContour Litetech Pvt. Ltd.`;
    } else if (kind === "stakeholder") {
      subject = `[${programme.name}] Stakeholder digest · ${new Date().toLocaleDateString()}`;
      body = `${programme.name}
Customer: ${programme.customer || "—"}
Status: ${programme.status} · Wk ${todayWk} of ${totalWeeks}

HEADLINE
- Programme tracking at ${metrics?.avgPercentComplete || 0}% complete
- Milestones: ${metrics?.milestonesDone || 0} of ${(metrics?.milestonesDone || 0) + (metrics?.milestonesPending || 0)} delivered
- Kits shipped: ${metrics?.kitsShipped || 0} of ${programme.total_kits || 0}
- Open risks: ${metrics?.risksOpen || 0}

KEY ACHIEVEMENTS
${recentDone.slice(0, 4).map((t: any) => `  ✓ ${t.name}`).join('\n')}

UPCOMING (next 4 weeks)
${upcomingMs.slice(0, 4).map((m: any) => `  • Wk ${m.week} · ${m.event}`).join('\n')}

CONCERNS / RISKS
${openRisks.slice(0, 3).map((r: any) => `  ⚠ ${r.description}`).join('\n') || '  No high-priority risks'}

— DContour Programme Office`;
    } else if (kind === "risk") {
      subject = `[${programme.name}] Risk Update · ${new Date().toLocaleDateString()}`;
      body = `Risk Register Update — ${programme.name}

Total: ${risks.length} risks · ${openRisks.length} OPEN

OPEN RISKS · by priority:
${openRisks.map((r: any) => `  [${r.id}] ${r.area} · ${r.description}
     Probability: ${r.probability} · Impact: ${r.impact} · Owner: ${r.owner}
     Mitigation: ${r.mitigation}`).join('\n\n')}

— ${programme.created_by || 'Programme Manager'}`;
    } else if (kind === "customer") {
      subject = `[${programme.name}] Status update for ${programme.customer || "Customer"}`;
      body = `Dear ${programme.customer || "Customer"} team,

${programme.name} status update:

PROGRAMME PROGRESS
- We are at Wk ${todayWk} of ${totalWeeks} (~${metrics?.avgPercentComplete || 0}% complete)
- ${metrics?.milestonesDone || 0} of ${(metrics?.milestonesDone || 0) + (metrics?.milestonesPending || 0)} milestones delivered
- ${metrics?.kitsShipped || 0} of ${programme.total_kits || 0} kits shipped to date

RECENT WORK
${recentDone.slice(0, 5).map((t: any) => `  ✓ ${t.name}`).join('\n')}

UPCOMING DELIVERABLES (next 4 weeks)
${upcomingMs.slice(0, 4).map((m: any) => `  • Wk ${m.week} · ${m.event}`).join('\n')}

OPEN ITEMS REQUIRING YOUR INPUT
${recentComms.filter((c: any) => c.direction === 'OUT' && c.status === 'FOLLOW_UP').map((c: any) => `  - ${c.subject} (logged ${c.comm_date})`).join('\n') || '  None at this time'}

Please let us know if you have any questions.

Best regards,
${programme.created_by || 'Programme Manager'}
DContour Litetech Pvt. Ltd.`;
    }

    setEmailModal({
      isOpen: true,
      title: kind === "weekly" ? "Weekly Status Email" : kind === "stakeholder" ? "Stakeholder Digest" : kind === "risk" ? "Risk Update" : "Customer Status",
      subject,
      body
    });
    setIsCopied(false);
  };

  return (
    <div className="page-container space-y-6 animate-in fade-in duration-300">
      
      {/* Top Toolbar Action Row */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100 no-print">
        <button 
          onClick={handlePrintCharter}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-bold rounded transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Charter</span>
        </button>
        <button 
          onClick={() => handleEmailSummary("weekly")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-bold rounded transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Weekly Status Email</span>
        </button>
        <button 
          onClick={() => handleEmailSummary("stakeholder")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-bold rounded transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Stakeholder Digest</span>
        </button>
        <button 
          onClick={() => handleEmailSummary("risk")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-bold rounded transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Risk Update</span>
        </button>
        <button 
          onClick={() => handleEmailSummary("customer")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-bold rounded transition-colors"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Customer Status</span>
        </button>
      </div>

      <div id="charter-content" className="space-y-6">
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

            <div className="bg-white border border-slate-150 rounded-lg p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-navy">Mini Timeline (Phase Progress)</h3>
            <span className="text-xs text-slate-400">Fixed Today position: Wk {todayWk} of {totalWeeks}</span>
          </div>
 
          {/* SVG Proportional Mini Gantt */}
          <div className="overflow-x-auto">
            <svg viewBox="0 0 900 240" className="w-full min-w-[750px] h-auto bg-transparent">
              {/* Background week grids */}
              {Array.from({ length: 9 }).map((_, idx) => {
                const wk = Math.round((idx / 8) * totalWeeks);
                const x = 50 + (wk / totalWeeks) * 700;
                return (
                  <g key={idx}>
                    <line x1={x} y1={25} x2={x} y2={210} stroke="#E2E8F0" strokeWidth={1} strokeDasharray="4,4" className="dark:stroke-slate-800" />
                    <text x={x} y={18} fontSize={10} style={{ fill: "#475569" }} className="dark:fill-slate-400 font-bold" textAnchor="middle">Wk {wk}</text>
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
                  
                  const showBadge = barW >= 45;
                  const badgeW = showBadge ? 28 : 0;
                  const trackerX = startX + badgeW;
                  const trackerW = Math.max(8, barW - badgeW);
                  const fillW = trackerW * (ph.avg_pct / 100);
                  const phaseColor = ph.colour || "#0B5BAF";
 
                  return (
                    <g key={idx}>
                      {/* 1. Code Badge (Solid Color) */}
                      {showBadge && (
                        <>
                          <rect x={startX} y={barY} width={badgeW} height={14} rx={3} fill={phaseColor} />
                          <text x={startX + badgeW / 2} y={barY + 10} fontSize={8} fill="#FFFFFF" fontWeight="black" textAnchor="middle">{ph.code}</text>
                        </>
                      )}
 
                      {/* 2. Track rect (Pastel tint of phase color) */}
                      <rect 
                        x={trackerX} 
                        y={barY} 
                        width={trackerW} 
                        height={14} 
                        rx={3} 
                        fill={`${phaseColor}15`} 
                        stroke={`${phaseColor}30`} 
                        strokeWidth={1}
                        className="dark:fill-slate-800/40 dark:stroke-slate-700/50" 
                      />
                      
                      {/* 3. Fill rect (Solid progress) */}
                      {fillW > 0 && (
                        <rect x={trackerX} y={barY} width={fillW} height={14} rx={3} fill={phaseColor} />
                      )}
 
                      {/* 4. Text Label (Vibrant slate/navy, clean contrast) */}
                      <text x={endX + 8} y={barY + 11} fontSize={9} style={{ fill: "#0F172A" }} className="dark:fill-slate-300 font-bold">
                        {showBadge ? `${ph.name} (${ph.avg_pct}%)` : `${ph.code}: ${ph.name} (${ph.avg_pct}%)`}
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
                    <line x1={todayX} y1={22} x2={todayX} y2={215} stroke="#EF4444" strokeWidth={2} strokeDasharray="4,2" />
                    <circle cx={todayX} cy={22} r={3} fill="#EF4444" />
                    <rect x={todayX - 25} y={215} width={50} height={16} rx={3} fill="#EF4444" />
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

      {/* Email Preview Modal */}
      {emailModal.isOpen && (
        <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-dc-blue" />
                <h3 className="font-black text-navy text-sm uppercase tracking-wider">{emailModal.title}</h3>
              </div>
              <button 
                onClick={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider mb-1">Email Subject</label>
                <input 
                  type="text" 
                  readOnly 
                  value={emailModal.subject}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider mb-1">Email Body</label>
                <pre className="w-full border border-slate-200 rounded p-4 text-xs font-semibold text-slate-600 bg-slate-50/50 overflow-auto whitespace-pre-wrap font-mono leading-relaxed max-h-[300px]">
                  {emailModal.body}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-150 bg-slate-50 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(emailModal.body);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded flex items-center gap-1.5 transition-all shadow-sm border",
                  isCopied
                    ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <Copy className="w-4 h-4" />
                <span>{isCopied ? "Copied!" : "Copy to Clipboard"}</span>
              </button>

              <div className="flex gap-2">
                <a
                  href={`mailto:?subject=${encodeURIComponent(emailModal.subject)}&body=${encodeURIComponent(emailModal.body)}`}
                  className="px-4 py-2 bg-dc-blue hover:bg-dc-deep text-white text-xs font-bold rounded flex items-center gap-1.5 transition-all shadow-sm border border-dc-blue flex items-center justify-center"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in Email Client</span>
                </a>
                <button
                  onClick={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
                  className="btn-secondary px-4 py-2 text-xs font-bold rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
