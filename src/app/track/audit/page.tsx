"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useAuditLogsQuery } from "@/hooks/use-pmo-queries";
import { 
  History, Search, Filter, Trash2
} from "lucide-react";
import { cn } from "@/utils/cn";

export default function AuditPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);

  // Fetch Audit Logs from the store
  const { data: auditLogs = [], isLoading, refetch } = useAuditLogsQuery();

  // Filters State
  const [filterText, setFilterText] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [fieldFilter, setFieldFilter] = useState("");

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((a) => {
      // Filter by search string (actor, entity_id, values)
      if (filterText) {
        const query = filterText.toLowerCase();
        const matchesQuery = 
          (a.actor || "").toLowerCase().includes(query) ||
          (a.entity_id || "").toLowerCase().includes(query) ||
          (a.entity_type || "").toLowerCase().includes(query) ||
          (a.field || "").toLowerCase().includes(query) ||
          (a.old_value || "").toLowerCase().includes(query) ||
          (a.new_value || "").toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Filter by entity type
      if (entityFilter && a.entity_type !== entityFilter) return false;

      // Filter by field name
      if (fieldFilter && a.field !== fieldFilter) return false;

      return true;
    });
  }, [auditLogs, filterText, entityFilter, fieldFilter]);

  // Unique entity types and fields for selection filters
  const entityTypes = useMemo(() => {
    return Array.from(new Set(auditLogs.map(a => a.entity_type))).filter(Boolean);
  }, [auditLogs]);

  const fields = useMemo(() => {
    return Array.from(new Set(auditLogs.map(a => a.field))).filter(Boolean);
  }, [auditLogs]);

  // WBS strip utility for cleaner entity displaying
  const displayEntityId = (id: string) => {
    if (!id) return "";
    const pfx = (activeProgrammeId || "").toLowerCase() + "-";
    if (pfx.length > 1 && id.toLowerCase().startsWith(pfx)) {
      return id.substring(pfx.length);
    }
    return id;
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Audit Logs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col p-6 overflow-hidden bg-bg-base font-sans text-xs space-y-4">
      
      {/* Search and Filters Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
        
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          {/* Text Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search audit trail (actor, ID, value)..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded pl-8 pr-2.5 py-1.5 text-xs text-slate-700 w-full focus:outline-none focus:border-dc-blue focus:bg-white transition-all"
            />
          </div>

          {/* Entity Type select */}
          <select 
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-dc-blue cursor-pointer"
          >
            <option value="">All Entities</option>
            {entityTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>

          {/* Field select */}
          <select 
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-dc-blue cursor-pointer"
          >
            <option value="">All Fields</option>
            {fields.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {/* Changes Counter badge */}
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none bg-slate-100 px-2.5 py-1 rounded">
          {filteredLogs.length} recent changes
        </span>

      </div>

      {/* Audit Log Table Card */}
      <div className="flex-1 min-h-0 w-full bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        
        <div className="flex-1 overflow-auto scrollbar-thin">
          <table className="w-full text-xs text-left border-collapse relative">
            
            {/* Table Header */}
            <thead className="bg-navy text-gold text-[10px] uppercase font-bold tracking-wider sticky top-0 z-10 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-44">Timestamp</th>
                <th className="py-3 px-4 w-44">Actor</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4 w-32">Field</th>
                <th className="py-3 px-4">Old Value</th>
                <th className="py-3 px-4">New Value</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-150 text-slate-700 bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium select-none bg-slate-50/20">
                    No matching audit entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((a, idx) => (
                  <tr 
                    key={a.id} 
                    className={cn(
                      "hover:bg-slate-50/50 transition-colors h-9",
                      idx % 2 === 1 ? "bg-slate-50/20" : "bg-white"
                    )}
                  >
                    <td className="py-2.5 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">{a.ts || "—"}</td>
                    <td className="py-2.5 px-4 font-bold text-navy whitespace-nowrap">{a.actor || "system"}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap truncate max-w-[200px]" title={`${a.entity_type} - ${a.entity_id}`}>
                      <span className="text-[10px] bg-slate-100 border border-slate-200 px-1 py-0.5 rounded mr-1.5 uppercase font-bold text-slate-500">
                        {a.entity_type}
                      </span>
                      <span className="font-mono font-medium text-[10px] text-slate-700">
                        {displayEntityId(a.entity_id)}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                        {a.field}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-red-650 font-medium truncate max-w-[200px]" title={a.old_value}>{a.old_value || "—"}</td>
                    <td className="py-2.5 px-4 text-emerald-650 font-bold truncate max-w-[200px]" title={a.new_value}>{a.new_value || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>

      </div>

    </div>
  );
}
