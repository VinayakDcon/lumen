/* eslint-disable */
"use client";

import React, { useState } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useProgrammesQuery, useTimeEntriesQuery, useTimesheetReportQuery } from "@/hooks/use-pmo-queries";
import { Users2, BarChart2 } from "lucide-react";
import { cn } from "@/utils/cn";

export default function TeamHoursPage() {
  const user = usePmoStore((state) => state.user);
  const programmes = usePmoStore((state) => state.programmes);
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  
  const isPMOOrAdmin = user?.role === "PMO" || user?.role === "ADMIN";

  // Filter range selection: 1 (This week), 4 (Last 4 weeks), 8 (Last 8 weeks), 12 (Last 12 weeks)
  const [weeksRange, setWeeksRange] = useState<number>(8);
  const [filterByActive, setFilterByActive] = useState<boolean>(false);

  // Active project helper
  const activeProg = programmes.find(p => p.id === activeProgrammeId);

  // Query timesheet report from backend
  const { data: reportData } = useTimesheetReportQuery(
    weeksRange,
    filterByActive && isPMOOrAdmin && activeProgrammeId ? activeProgrammeId : undefined
  );

  const filteredEntries = reportData?.entries || [];

  // Calculate statistics totals
  const totalHours = filteredEntries.reduce((sum: number, e: any) => sum + (e.hours || 0) + (e.blocked_hours || 0), 0);
  const uniquePeople = Array.from(new Set(filteredEntries.map((e: any) => e.person_id)));
  const uniqueProgrammes = Array.from(new Set(filteredEntries.map((e: any) => e.programme_id))).filter(id => id !== "DC_BAU");
  const benchHours = filteredEntries.filter((e: any) => e.programme_id === "DC_BAU").reduce((sum: number, e: any) => sum + (e.hours || 0), 0);
  
  const avgHoursPerPersonWeek = uniquePeople.length > 0
    ? parseFloat((totalHours / (uniquePeople.length * weeksRange)).toFixed(1))
    : 0.0;

  // Build Pivot data structure
  const peopleLogging = Array.from(new Set(filteredEntries.map((e: any) => e.person_name)));
  
  // Sort people names for order consistency
  peopleLogging.sort();

  // Get active columns (projects) in the filtered set
  const projectCols = Array.from(new Set(filteredEntries.filter((e: any) => e.programme_id !== "DC_BAU" && e.programme_id).map((e: any) => e.programme_id as string))) as string[];
  projectCols.sort();

  // Map project names / details for visual colors
  const projectColorMap: Record<string, string> = {};
  programmes.forEach((p: any) => {
    projectColorMap[p.id] = p.colour || "#0B5BAF";
  });

  // Compute pivot cell values
  const pivotRows = peopleLogging.map((name: any) => {
    const personEntries = filteredEntries.filter((e: any) => e.person_name === name);
    
    const projectHours: Record<string, number> = {};
    projectCols.forEach((col: string) => {
      const hrs = personEntries.filter((e: any) => e.programme_id === col).reduce((sum: number, e: any) => sum + (e.hours || 0) + (e.blocked_hours || 0), 0);
      projectHours[col] = hrs;
    });

    const bench = personEntries.filter((e: any) => e.programme_id === "DC_BAU").reduce((sum: number, e: any) => sum + (e.hours || 0) + (e.blocked_hours || 0), 0);
    const rowTotal = Object.values(projectHours).reduce((sum: number, v: any) => sum + v, 0) + bench;

    return {
      name,
      projectHours,
      bench,
      total: rowTotal
    };
  });

  // Calculate totals per column
  const colTotals: Record<string, number> = {};
  projectCols.forEach((col: string) => {
    colTotals[col] = pivotRows.reduce((sum: number, row: any) => sum + (row.projectHours[col] || 0), 0);
  });
  const totalBench = pivotRows.reduce((sum: number, row: any) => sum + row.bench, 0);
  const grandTotal = pivotRows.reduce((sum: number, row: any) => sum + row.total, 0);

  return (
    <div className="page-container space-y-6">
      
      {/* Header bar */}
      <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-navy flex items-center gap-2">
            <Users2 className="w-5 h-5 text-dc-blue" />
            <span>Team Hours · Cross-Programme</span>
            {activeProg && (
              <span className="text-slate-400 font-semibold text-sm">
                · {activeProg.name}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Analyze resource effort distribution and overall load across engineering streams and internal initiatives.
          </p>
        </div>
      </div>

      {/* Control ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-border-base rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-5">
          <select
            value={weeksRange}
            onChange={(e) => setWeeksRange(parseInt(e.target.value))}
            className="border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-dc-blue bg-white text-slate-700 w-36 font-semibold"
          >
            <option value={1}>This week</option>
            <option value={1}>Last 1 Week</option>
            <option value={4}>Last 4 weeks</option>
            <option value={8}>Last 8 weeks</option>
            <option value={12}>Last 12 weeks</option>
          </select>

          {/* Reserved for PMO/Admin only (hidden for others) */}
          {isPMOOrAdmin && (
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={filterByActive}
                onChange={(e) => setFilterByActive(e.target.checked)}
                className="w-4 h-4 rounded text-dc-blue border-slate-300 focus:ring-dc-blue cursor-pointer"
              />
              <span>Filter by active programme</span>
            </label>
          )}
        </div>

        {/* Small stats label */}
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          {uniquePeople.length} people · {filteredEntries.length} entries · {totalHours.toFixed(1)} total hours · {benchHours.toFixed(1)} bench time
        </div>
      </div>

      {/* KPI summaries strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-border-base rounded-lg p-4 shadow-sm text-center">
          <span className="text-2xl font-black text-dc-blue block">{totalHours.toFixed(0)}</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Total Hours</span>
        </div>
        <div className="bg-white border border-border-base rounded-lg p-4 shadow-sm text-center">
          <span className="text-2xl font-black text-navy block">{uniquePeople.length}</span>
          <span className="text-[9px] text-slate-400 font-gold font-bold uppercase tracking-wider mt-1 block">People Logging</span>
        </div>
        <div className="bg-white border border-border-base rounded-lg p-4 shadow-sm text-center">
          <span className="text-2xl font-black text-navy block">{uniqueProgrammes.length}</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Programmes</span>
        </div>
        <div className="bg-white border border-border-base rounded-lg p-4 shadow-sm text-center">
          <span className="text-2xl font-black text-slate-600 block">{benchHours.toFixed(0)}</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Bench Time</span>
        </div>
        <div className="bg-white border border-border-base rounded-lg p-4 shadow-sm text-center">
          <span className="text-2xl font-black text-navy block">{weeksRange}</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Weeks Back</span>
        </div>
        <div className="bg-white border border-border-base rounded-lg p-4 shadow-sm text-center">
          <span className="text-2xl font-black text-dc-blue block">{avgHoursPerPersonWeek.toFixed(1)}</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Avg Hr/Person/Wk</span>
        </div>
      </div>

      {/* Cross-Programme Pivot Table */}
      <div className="bg-white border border-border-base rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-navy text-white font-bold">
                <th className="p-3 w-48 shrink-0">PERSON</th>
                {projectCols.map(col => {
                  const borderCol = projectColorMap[col] || "#0B5BAF";
                  return (
                    <th 
                      key={col} 
                      className="p-3 text-center min-w-[120px]"
                      style={{ borderBottom: `3px solid ${borderCol}` }}
                    >
                      {col}
                    </th>
                  );
                })}
                <th 
                  className="p-3 text-center min-w-[100px] text-white font-bold bg-navy"
                  style={{ borderBottom: "3px solid var(--color-warning-amber)" }}
                >
                  BENCH TIME
                </th>
                <th className="p-3 text-center min-w-[100px] bg-slate-800">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {pivotRows.length === 0 ? (
                <tr>
                  <td colSpan={projectCols.length + 3} className="p-6 text-center text-slate-400 italic">
                    No time logs found for the selected filter range.
                  </td>
                </tr>
              ) : (
                <>
                  {pivotRows.map(row => (
                    <tr key={row.name} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-navy">{row.name}</td>
                      {projectCols.map(col => {
                        const hrs = row.projectHours[col] || 0;
                        return (
                          <td 
                            key={col} 
                            className={cn(
                              "p-3 text-center font-medium",
                              hrs > 0 ? "text-dc-blue bg-blue-50/10 font-bold" : "text-slate-300"
                            )}
                          >
                            {hrs > 0 ? hrs.toFixed(1) : "—"}
                          </td>
                        );
                      })}
                      <td className={cn(
                        "p-3 text-center font-medium",
                        row.bench > 0 ? "text-amber-900 font-bold bg-amber-500/10" : "text-slate-300"
                      )}>
                        {row.bench > 0 ? row.bench.toFixed(1) : "—"}
                      </td>
                      <td className="p-3 text-center font-black text-navy bg-slate-50">{row.total.toFixed(1)}</td>
                    </tr>
                  ))}
                  
                  {/* Total Row */}
                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                    <td className="p-3 text-navy">Total</td>
                    {projectCols.map(col => {
                      const totalVal = colTotals[col] || 0;
                      return (
                        <td key={col} className="p-3 text-center text-navy font-bold">
                          {totalVal > 0 ? totalVal.toFixed(1) : "—"}
                        </td>
                      );
                    })}
                    <td className={cn(
                      "p-3 text-center font-bold",
                      totalBench > 0 ? "text-amber-900 bg-amber-500/15" : "text-slate-300"
                    )}>
                      {totalBench > 0 ? totalBench.toFixed(1) : "—"}
                    </td>
                    <td className="p-3 text-center text-navy bg-slate-200 font-black">{grandTotal.toFixed(1)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Time Entries */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-navy">Detailed Time Entries</h3>
        
        <div className="bg-white border border-border-base rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-navy text-white font-bold border-b border-slate-350">
                  <th className="p-3 w-28">DATE</th>
                  <th className="p-3 w-40">PERSON</th>
                  <th className="p-3 w-24">HOURS</th>
                  <th className="p-3 w-36">PROJECT</th>
                  <th className="p-3 w-44">WBS</th>
                  <th className="p-3 w-60">TASK</th>
                  <th className="p-3">NOTE</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                      No logs matching the filter.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((e: any, idx: number) => {
                    const totalHrs = (e.hours || 0) + (e.blocked_hours || 0);
                    return (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 text-slate-500 font-semibold">{e.entry_date}</td>
                        <td className="p-3 font-bold text-navy">{e.person_name}</td>
                        <td className="p-3 font-bold text-slate-800">{totalHrs.toFixed(1)}h</td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 uppercase">
                            {e.programme_id === "DC_BAU" ? "Internal" : e.programme_id}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-dc-blue">{e.wbs}</td>
                        <td className="p-3 font-medium text-slate-700 leading-snug">{e.task_name}</td>
                        <td className="p-3 text-slate-500 italic leading-snug">{e.note || "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
