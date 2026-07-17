/* eslint-disable */
"use client";

import React, { useState, useEffect } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useTimeEntriesQuery, useProgrammesQuery } from "@/hooks/use-pmo-queries";
import { BarChart3 } from "lucide-react";
import { cn } from "@/utils/cn";

interface ResourceRow {
  name: string;
  hours: Record<string, number>;
  total: number;
}

export default function ResourceHoursPage() {
  const { data: programmes = [] } = useProgrammesQuery();
  useTimeEntriesQuery();
  const timeEntries = usePmoStore((state) => state.timeEntries);
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const user = usePmoStore((state) => state.user);
  const people = usePmoStore((state) => state.people);

  const activeProg = programmes.find((p) => p.id === activeProgrammeId);

  // Default filter: Last 8 weeks
  const [weeksRange, setWeeksRange] = useState<number>(8);
  const [selectedProgId, setSelectedProgId] = useState<string>("");
  const [apiData, setApiData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [highlightedPerson, setHighlightedPerson] = useState<string | null>(null);

  const userPerson = people.find(p => p.email?.toLowerCase().trim() === user?.email?.toLowerCase().trim());
  const userPersonKey = userPerson ? `person-${userPerson.id}` : "";
  const isPMOOrAdmin = user?.role === "PMO" || user?.role === "ADMIN";

  const allowedProgrammes = programmes.filter(p => {
    if (isPMOOrAdmin) return true;
    return p.team_members?.includes(userPersonKey);
  });

  // Fetch data from backend API with fallback
  const fetchData = async () => {
    try {
      setLoading(true);
      const emailQuery = user?.email ? `&email=${encodeURIComponent(user.email)}` : "";
      const progQuery = selectedProgId ? `&programme_id=${encodeURIComponent(selectedProgId)}` : "";
      const res = await fetch(`/api-proxy/resource-utilization?weeks=${weeksRange}${emailQuery}${progQuery}`);
      if (res.ok) {
        const data = await res.json();
        setApiData(data);
      } else {
        setApiData(null);
      }
    } catch (err) {
      setApiData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [weeksRange, timeEntries, user, selectedProgId]);

  // Compute date range for local fallback (current baseline 2026-06-24)
  const currentDate = new Date("2026-06-24");
  const startDate = weeksRange > 0
    ? new Date(currentDate.getTime() - weeksRange * 7 * 24 * 60 * 60 * 1000)
    : new Date("1970-01-01");
  const startDateStr = startDate.toISOString().slice(0, 10);
  const currentDateStr = currentDate.toISOString().slice(0, 10);

  // Grouping logic for both API & fallback entries
  const processRows = (): { 
    sortedPeople: string[]; 
    sortedCols: string[]; 
    dataMap: Record<string, ResourceRow>; 
    taskNamesMap: Record<string, string> 
  } => {
    const dataMap: Record<string, ResourceRow> = {};
    const colsSet = new Set<string>();
    const taskNamesMap: Record<string, string> = {};

    if (apiData !== null) {
      // Use API response rows
      apiData.forEach((e) => {
        const personName = e.person_name || `Person ID: ${e.person_id}`;
        const colKey = selectedProgId ? (e.wbs || "General") : (e.programme_id || "BENCH_TIME");
        const hrs = e.actual_hours || 0;

        colsSet.add(colKey);
        if (selectedProgId && e.wbs) {
          taskNamesMap[e.wbs] = e.task_name || e.wbs;
        }

        if (!dataMap[personName]) {
          dataMap[personName] = { name: personName, hours: {}, total: 0 };
        }
        dataMap[personName].hours[colKey] = (dataMap[personName].hours[colKey] || 0) + hrs;
        dataMap[personName].total += hrs;
      });
    } else {
      // Local fallback: compute from store timeEntries in date range
      let localFiltered = timeEntries.filter(
        (e) => e.entry_date >= startDateStr && e.entry_date <= currentDateStr
      );

      // Apply role-based filtering to local fallback data
      const isLead = user?.role === "SOFTWARE_LEAD" || user?.role === "MECHANICAL_LEAD" || user?.role === "ELECTRONICS_LEAD" || user?.role === "OPTICS_LEAD";
      if (!isPMOOrAdmin) {
        if (isLead) {
          const leadDept = userPerson?.department || "";
          localFiltered = localFiltered.filter(e => {
            // Find corresponding person in people array to resolve department
            const p = people.find(person => person.name === e.person_name || `person-${person.id}` === String(e.person_id));
            return p?.department === leadDept || e.person_name === user?.name;
          });
        } else {
          // Engineer: no access
          localFiltered = [];
        }
      }

      // Filter by selected programme if set in fallback
      if (selectedProgId) {
        localFiltered = localFiltered.filter((e) => e.programme_id === selectedProgId);
      }

      localFiltered.forEach((e) => {
        const personName = e.person_name || "Unknown";
        const colKey = selectedProgId ? (e.wbs || "General") : (e.programme_id || "BENCH_TIME");
        const hrs = (e.hours || 0) + (e.blocked_hours || 0);

        colsSet.add(colKey);
        if (selectedProgId && e.wbs) {
          taskNamesMap[e.wbs] = e.wbs;
        }

        if (!dataMap[personName]) {
          dataMap[personName] = { name: personName, hours: {}, total: 0 };
        }
        dataMap[personName].hours[colKey] = (dataMap[personName].hours[colKey] || 0) + hrs;
        dataMap[personName].total += hrs;
      });
    }

    const sortedPeople = Object.keys(dataMap).sort();
    const sortedCols = Array.from(colsSet).sort();

    return { sortedPeople, sortedCols, dataMap, taskNamesMap };
  };

  const { sortedPeople, sortedCols, dataMap, taskNamesMap } = processRows();

  return (
    <div className="page-container space-y-6">
      
      {/* Title Header Block */}
      <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-navy flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-dc-blue" />
            <span>Resource Hours</span>
            {activeProg && (
              <span className="text-slate-400 font-semibold text-sm">
                · {activeProg.name}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track effort summary per resource aggregated across active project workstreams and internal modules.
          </p>
        </div>
      </div>

      {/* Control ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-border-base rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <select
            value={weeksRange}
            onChange={(e) => setWeeksRange(parseInt(e.target.value))}
            className="border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-dc-blue bg-white text-slate-700 w-36 font-semibold cursor-pointer"
          >
            <option value={1}>Last 1 Week</option>
            <option value={4}>Last 4 weeks</option>
            <option value={8}>Last 8 weeks</option>
            <option value={12}>Last 12 weeks</option>
            <option value={26}>Last 26 weeks</option>
            <option value={0}>All time</option>
          </select>

          {/* Programme selection dropdown */}
          <select
            value={selectedProgId}
            onChange={(e) => setSelectedProgId(e.target.value)}
            className="border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-dc-blue bg-white text-slate-700 w-52 font-semibold cursor-pointer"
          >
            <option value="">All Programmes</option>
            {allowedProgrammes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id})
              </option>
            ))}
          </select>
        </div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          {sortedPeople.length} {sortedPeople.length === 1 ? "person" : "people"}
        </div>
      </div>

      {/* Dynamic Pivot Table Grid */}
      <div className="bg-white border border-border-base rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-auto max-h-[650px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-navy text-white font-bold">
                <th className="p-3 w-64 shrink-0 sticky left-0 top-0 bg-navy z-30 border-r border-slate-700">RESOURCE</th>
                {sortedCols.map((colId) => (
                  <th 
                    key={colId} 
                    className="p-3 text-center min-w-[120px] sticky top-0 bg-navy z-20"
                    title={selectedProgId ? taskNamesMap[colId] : undefined}
                  >
                    {selectedProgId ? (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-300 tracking-wider font-mono">{colId}</span>
                        <span className="text-[8px] font-bold text-white max-w-[110px] truncate mt-0.5" title={taskNamesMap[colId]}>
                          {taskNamesMap[colId] || "General"}
                        </span>
                      </div>
                    ) : (
                      colId === "DC_BAU" ? "BAU / Admin" : colId
                    )}
                  </th>
                ))}
                <th className="p-3 text-center min-w-[120px] bg-slate-800 sticky top-0 z-20">TOTAL HOURS</th>
              </tr>
            </thead>
            <tbody>
              {sortedPeople.length === 0 ? (
                <tr>
                  <td colSpan={sortedCols.length + 2} className="p-8 text-center text-slate-400 italic">
                    No resource utilization data found for this period.
                  </td>
                </tr>
              ) : (
                sortedPeople.map((personName) => {
                  const row = dataMap[personName];
                  const isHighlighted = highlightedPerson === row.name;
                  return (
                    <tr 
                      key={personName} 
                      onClick={() => setHighlightedPerson(isHighlighted ? null : row.name)}
                      className={cn(
                        "group border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors",
                        isHighlighted ? "bg-blue-50/70 hover:bg-blue-50" : ""
                      )}
                    >
                      <td 
                        className={cn(
                          "p-3 font-bold text-navy sticky left-0 transition-colors z-10 border-r border-slate-200",
                          isHighlighted 
                            ? "bg-blue-100/80 text-dc-blue"
                            : "bg-white group-hover:bg-slate-50"
                        )}
                      >
                        {row.name}
                      </td>
                      {sortedCols.map((colId) => {
                        const hr = row.hours[colId] || 0;
                        return (
                          <td
                            key={colId}
                            className={cn(
                              "p-3 text-center font-medium transition-colors",
                              hr > 0 ? "text-slate-800 font-bold" : "text-slate-300"
                            )}
                          >
                            {hr > 0 ? hr.toFixed(1) : "—"}
                          </td>
                        );
                      })}
                      <td 
                        className={cn(
                          "p-3 text-center font-black text-navy transition-colors",
                          isHighlighted ? "bg-blue-100/40" : "bg-slate-50"
                        )}
                      >
                        {row.total.toFixed(1)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
