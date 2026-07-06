/* eslint-disable */
"use client";

import React, { useState, useEffect } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useTimeEntriesQuery } from "@/hooks/use-pmo-queries";
import { BarChart3 } from "lucide-react";
import { cn } from "@/utils/cn";

interface ResourceRow {
  name: string;
  hours: Record<string, number>;
  total: number;
}

export default function ResourceHoursPage() {
  const programmes = usePmoStore((state) => state.programmes);
  useTimeEntriesQuery();
  const timeEntries = usePmoStore((state) => state.timeEntries);
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);

  const activeProg = programmes.find((p) => p.id === activeProgrammeId);

  // Default filter: Last 8 weeks
  const [weeksRange, setWeeksRange] = useState<number>(8);
  const [apiData, setApiData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data from backend API with fallback
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/resource-utilization?weeks=${weeksRange}`);
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
  }, [weeksRange, timeEntries]);

  // Compute date range for local fallback (current baseline 2026-06-24)
  const currentDate = new Date("2026-06-24");
  const startDate = weeksRange > 0
    ? new Date(currentDate.getTime() - weeksRange * 7 * 24 * 60 * 60 * 1000)
    : new Date("1970-01-01");
  const startDateStr = startDate.toISOString().slice(0, 10);
  const currentDateStr = currentDate.toISOString().slice(0, 10);

  // Grouping logic for both API & fallback entries
  const processRows = (): { sortedPeople: string[]; sortedProgs: string[]; dataMap: Record<string, ResourceRow> } => {
    const dataMap: Record<string, ResourceRow> = {};
    const programmesSet = new Set<string>();

    if (apiData !== null) {
      // Use API response rows
      apiData.forEach((e) => {
        const personName = e.person_name || `Person ID: ${e.person_id}`;
        const progId = e.programme_id || "BENCH_TIME";
        const hrs = e.actual_hours || 0;

        programmesSet.add(progId);

        if (!dataMap[personName]) {
          dataMap[personName] = { name: personName, hours: {}, total: 0 };
        }
        dataMap[personName].hours[progId] = (dataMap[personName].hours[progId] || 0) + hrs;
        dataMap[personName].total += hrs;
      });
    } else {
      // Local fallback: compute from store timeEntries in date range
      const localFiltered = timeEntries.filter(
        (e) => e.entry_date >= startDateStr && e.entry_date <= currentDateStr
      );

      localFiltered.forEach((e) => {
        const personName = e.person_name || "Unknown";
        const progId = e.programme_id || "BENCH_TIME";
        const hrs = (e.hours || 0) + (e.blocked_hours || 0);

        programmesSet.add(progId);

        if (!dataMap[personName]) {
          dataMap[personName] = { name: personName, hours: {}, total: 0 };
        }
        dataMap[personName].hours[progId] = (dataMap[personName].hours[progId] || 0) + hrs;
        dataMap[personName].total += hrs;
      });
    }

    const sortedPeople = Object.keys(dataMap).sort();
    const sortedProgs = Array.from(programmesSet).sort();

    return { sortedPeople, sortedProgs, dataMap };
  };

  const { sortedPeople, sortedProgs, dataMap } = processRows();

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
      <div className="flex items-center justify-between bg-white border border-border-base rounded-lg p-4 shadow-sm">
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
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          {sortedPeople.length} {sortedPeople.length === 1 ? "person" : "people"}
        </div>
      </div>

      {/* Dynamic Pivot Table Grid */}
      <div className="bg-white border border-border-base rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-navy text-white font-bold">
                <th className="p-3 w-64 shrink-0">RESOURCE</th>
                {sortedProgs.map((projId) => (
                  <th key={projId} className="p-3 text-center min-w-[120px]">
                    {projId === "DC_BAU" ? "BAU / Admin" : projId}
                  </th>
                ))}
                <th className="p-3 text-center min-w-[120px] bg-slate-800">TOTAL HOURS</th>
              </tr>
            </thead>
            <tbody>
              {sortedPeople.length === 0 ? (
                <tr>
                  <td colSpan={sortedProgs.length + 2} className="p-8 text-center text-slate-400 italic">
                    No resource utilization data found for this period.
                  </td>
                </tr>
              ) : (
                sortedPeople.map((personName) => {
                  const row = dataMap[personName];
                  return (
                    <tr key={personName} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-navy">{row.name}</td>
                      {sortedProgs.map((projId) => {
                        const hr = row.hours[projId] || 0;
                        return (
                          <td
                            key={projId}
                            className={cn(
                              "p-3 text-center font-medium",
                              hr > 0 ? "text-slate-800 font-bold" : "text-slate-300"
                            )}
                          >
                            {hr > 0 ? hr.toFixed(1) : "—"}
                          </td>
                        );
                      })}
                      <td className="p-3 text-center font-black text-navy bg-slate-50">
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
