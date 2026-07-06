"use client";

import React, { useState } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useDpdsGatesQuery, useProgrammesQuery } from "@/hooks/use-pmo-queries";
import { 
  Trophy, Plus, Trash2, ArrowRightLeft, FileSpreadsheet,
  Info, ChevronRight
} from "lucide-react";
import { DpdsGateInfo, DpdsDeliverable, DpdsDmaic } from "@/types/pmo";
import { cn } from "@/utils/cn";

export default function DpdsGatesPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const user = usePmoStore((state) => state.user);
  
  // Removed mock store actions, using direct backend fetch updates instead

  const { data: programmes = [] } = useProgrammesQuery();
  const { data: gatesData, isLoading, refetch } = useDpdsGatesQuery(activeProgrammeId);

  // Modal / form states
  const [addingToGate, setAddingToGate] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemKind, setNewItemKind] = useState<"DOC" | "TASK" | "DECISION" | "DFMEA" | "CHECKBOX">("CHECKBOX");
  const [newItemRequired, setNewItemRequired] = useState(true);

  const [showCarryover, setShowCarryover] = useState(false);
  const [carryoverSource, setCarryoverSource] = useState("");
  const [carryoverGate, setCarryoverGate] = useState("G0");

  const activeProgramme = programmes.find(p => p.id === activeProgrammeId);
  const isEditor = user?.role === "PMO" || user?.role === "ADMIN";

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium">Loading DPDS gates...</span>
        </div>
      </div>
    );
  }

  if (!activeProgramme || !gatesData) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Trophy className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Active Programme Selected</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select an active programme from the sidebar switcher.
        </p>
      </div>
    );
  }

  // Summary counts
  const gates = Object.values(gatesData) as DpdsGateInfo[];
  const totals = gates.reduce((a: { completed: number; total: number; passed: number }, g: DpdsGateInfo) => ({
    completed: a.completed + g.completed_count,
    total: a.total + g.total_count,
    passed: a.passed + (g.status === 'PASSED' ? 1 : 0),
  }), { completed: 0, total: 0, passed: 0 });

  const handleAddDeliverableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !addingToGate) return;

    try {
      const res = await fetch("/api-proxy/dpds/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programme_id: activeProgrammeId,
          gate_code: addingToGate,
          deliverable_name: newItemName.trim(),
          kind: newItemKind,
          required: newItemRequired ? 1 : 0
        })
      });
      if (!res.ok) throw new Error("Failed to add deliverable");
      setNewItemName("");
      setAddingToGate(null);
      refetch();
    } catch (err) {
      console.error(err);
      alert("Error adding deliverable");
    }
  };

  const handleCarryoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carryoverSource) return;

    try {
      const res = await fetch("/api-proxy/dpds/carryover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programme_id: activeProgrammeId,
          gate_code: carryoverGate,
          source_programme_id: carryoverSource
        })
      });
      if (!res.ok) throw new Error("Failed to carry over deliverables");
      setShowCarryover(false);
      setCarryoverSource("");
      refetch();
      alert(`Successfully carried over deliverables from ${carryoverSource} for gate ${carryoverGate}!`);
    } catch (err) {
      console.error(err);
      alert("Error carrying over deliverables");
    }
  };

  const handleExportPack = (gateCode: string) => {
    alert(`Generating review pack for ${gateCode}... (Ready to print)`);
  };

  const getDmaicPillClass = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-emerald-600 border-emerald-600 text-white font-extrabold shadow-sm";
      case "IN_PROGRESS":
        return "bg-blue-600 border-blue-600 text-white font-extrabold shadow-sm animate-pulse";
      case "CARRYOVER":
        return "bg-amber-400 border-amber-400 text-navy font-extrabold shadow-sm";
      default:
        return "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200 hover:text-slate-600";
    }
  };

  const getGateStatusClass = (status: string) => {
    switch (status) {
      case "PASSED":
        return "bg-emerald-600 text-white";
      case "READY":
        return "bg-blue-600 text-white";
      case "IN_PROGRESS":
        return "bg-amber-500 text-navy";
      default:
        return "bg-slate-200 text-slate-700";
    }
  };

  return (
    <div className="page-container space-y-6 animate-in fade-in duration-300">
      
      {/* Strategic Intent Banner */}
      <div className="border border-slate-150 bg-white rounded-lg p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-indigo-600 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Strategic Intent (DPDS Gateway)</span>
              <span className="bg-indigo-100 text-indigo-800 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                {activeProgramme.category || "Premium OEM"}
              </span>
            </div>
            <p className="text-navy font-bold text-sm mt-1 max-w-2xl leading-relaxed">
              {activeProgramme.notes || "Establish robust execution rhythm to clear client feasibility checks, finalize engineering mockups, and ensure SOP launch readiness."}
            </p>
          </div>
        </div>

        {/* Action strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full md:w-auto">
          {isEditor && (
            <button 
              onClick={() => setShowCarryover(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded shadow-sm transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Carry-over (Bezel Clone)</span>
            </button>
          )}
          <button 
            onClick={() => handleExportPack("G0")}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-dc-blue hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Gate Review Pack</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Text */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-dc-blue" />
          <span>
            {totals.completed} / {totals.total} deliverables complete · {totals.passed} of {gates.length} gates passed
          </span>
        </div>
        <div className="text-[10px] text-slate-400 italic">
          * Checked boxes automatically roll up to Gate Readiness metrics.
        </div>
      </div>

      {/* Carryover Overlay Form */}
      {showCarryover && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 shadow-inner animate-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleCarryoverSubmit} className="space-y-4 max-w-xl">
            <h4 className="text-xs font-black text-navy uppercase tracking-wider">Carry over deliverables (Bezel Fast-track)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Copy From</label>
                <select 
                  value={carryoverSource} 
                  onChange={(e) => setCarryoverSource(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-navy font-bold focus:outline-none focus:border-dc-blue"
                  required
                >
                  <option value="">— Select Source —</option>
                  {programmes.filter(p => p.id !== activeProgrammeId).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Gate</label>
                <select 
                  value={carryoverGate} 
                  onChange={(e) => setCarryoverGate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-navy font-bold focus:outline-none focus:border-dc-blue"
                >
                  {['G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <div className="flex gap-2 w-full">
                  <button 
                    type="submit" 
                    className="flex-1 bg-dc-blue hover:bg-blue-700 text-white text-xs font-bold py-2 rounded transition-colors shadow-sm"
                  >
                    Confirm
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCarryover(false)}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-navy text-xs font-bold py-2 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Gates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gates.map((g: DpdsGateInfo) => {
          const isAdding = addingToGate === g.code;
          return (
            <div key={g.code} className="bg-white border border-slate-150 rounded-lg shadow-sm overflow-hidden flex flex-col justify-between hover-lift relative">
              
              {/* Gate Header */}
              <div 
                className="px-4 py-3 flex items-center justify-between text-white"
                style={{ backgroundColor: g.colour || "#1E90E8" }}
              >
                <div>
                  <span className="text-sm font-black tracking-wider block">{g.code}</span>
                  <span className="text-[10px] font-semibold opacity-85 block truncate max-w-[200px]" title={g.name}>
                    {g.name} · Wk {g.start_wk}–{g.end_wk}
                  </span>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide",
                  getGateStatusClass(g.status)
                )}>
                  {g.status.replace(/_/g, " ")}
                </span>
              </div>

              {/* Gate Body */}
              <div className="p-4 flex-1 space-y-4">
                
                {/* Readiness Bar */}
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1.5">
                    <span>Gate Readiness</span>
                    <span className="text-navy font-black">{g.readiness_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className="h-full transition-all duration-300 bg-emerald-600"
                      style={{ width: `${g.readiness_pct}%` }}
                    />
                  </div>
                </div>

                {/* Deliverables Checklist */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Deliverables Checkpoints</span>
                  <ul className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                    {g.deliverables.map((d: DpdsDeliverable) => {
                      const isCompleted = d.completed === 1;
                      return (
                        <li key={d.id} className="py-2 flex items-start justify-between gap-2 group/del">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <input 
                              type="checkbox" 
                              checked={isCompleted} 
                              onChange={async (e) => {
                                try {
                                  const res = await fetch(`/api-proxy/dpds/deliverables/${d.id}`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ completed: e.target.checked })
                                  });
                                  if (!res.ok) throw new Error("Failed to update deliverable");
                                  refetch();
                                } catch (err) {
                                  console.error(err);
                                  alert("Error updating deliverable");
                                }
                              }}
                              className="mt-0.5 w-3.5 h-3.5 shrink-0 rounded cursor-pointer accent-dc-blue"
                            />
                            <div className="min-w-0 text-xs">
                              <span className={cn(
                                "font-semibold text-slate-700 break-words leading-relaxed",
                                isCompleted && "line-through text-slate-400 font-medium"
                              )}>
                                {d.deliverable_name}
                                {d.required === 1 && (
                                  <span className="text-red-500 font-bold ml-0.5" title="Mandatory checkpoint">*</span>
                                )}
                              </span>
                              
                              {/* Badge for Type */}
                              <span className="text-[8px] font-black text-slate-400 bg-slate-100 border border-slate-150 px-1 py-0.2 rounded uppercase ml-2 select-none tracking-wider">
                                {d.kind}
                              </span>

                              {/* Carryover link marker */}
                              {d.carryover_from_programme_id && (
                                <span 
                                  className="text-[8px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-1 py-0.2 rounded ml-1.5 inline-flex items-center gap-0.5"
                                  title={`Carried over from ${d.carryover_from_programme_id}`}
                                >
                                  ↪ {d.carryover_from_programme_id.slice(0, 8)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Delete Action (only visible to PMO/Admin on hover) */}
                          {isEditor && (
                            <button 
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api-proxy/dpds/deliverables/${d.id}`, {
                                    method: "DELETE"
                                  });
                                  if (!res.ok) throw new Error("Failed to delete deliverable");
                                  refetch();
                                } catch (err) {
                                  console.error(err);
                                  alert("Error deleting deliverable");
                                }
                              }}
                              className="opacity-0 group-hover/del:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity hover:bg-slate-50 rounded"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                    {g.deliverables.length === 0 && (
                      <div className="text-slate-400 text-xs italic py-4 text-center">
                        No deliverables checklist seeded
                      </div>
                    )}
                  </ul>
                </div>

              </div>

              {/* DMAIC Row and Footer Actions */}
              <div className="border-t border-slate-100 bg-slate-50/50">
                
                {/* Six Sigma DMAIC Indicators */}
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 text-xs">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider shrink-0">DMAIC Cycle:</span>
                  <div className="flex gap-1">
                    {(['D', 'M', 'A', 'I', 'C'] as const).map((phase: 'D' | 'M' | 'A' | 'I' | 'C') => {
                      const record = g.dmaic.find((m: DpdsDmaic) => m.dmaic_phase === phase);
                      const status = record?.status || "NOT_STARTED";
                      
                      return (
                        <button 
                          key={phase} 
                          onClick={async () => {
                            if (!isEditor) return;
                            try {
                              const res = await fetch("/api-proxy/dpds/dmaic/cycle", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  programme_id: activeProgrammeId,
                                  gate_code: g.code,
                                  dmaic_phase: phase
                                })
                              });
                              if (!res.ok) throw new Error("Failed to cycle DMAIC");
                              refetch();
                            } catch (err) {
                              console.error(err);
                              alert("Error cycling DMAIC phase status");
                            }
                          }}
                          disabled={!isEditor}
                          className={cn(
                            "w-6 h-6 rounded-full border text-[10px] font-black flex items-center justify-center transition-all",
                            getDmaicPillClass(status),
                            !isEditor && "cursor-not-allowed opacity-80"
                          )}
                          title={`${phase} Phase: ${status.replace(/_/g, " ")}${isEditor ? " · Click to cycle" : ""}`}
                        >
                          {phase}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 flex items-center justify-between">
                  {isEditor ? (
                    <button 
                      onClick={() => setAddingToGate(g.code)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-dc-blue hover:text-dc-blue bg-white text-navy text-xs font-bold rounded shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </button>
                  ) : (
                    <div />
                  )}
                  <button 
                    onClick={() => handleExportPack(g.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-dc-blue hover:text-dc-blue bg-white text-navy text-xs font-bold rounded shadow-sm transition-all"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span>Pack</span>
                  </button>
                </div>

              </div>

              {/* Inline Add Item Form Overlay */}
              {isAdding && (
                <div className="absolute inset-0 bg-white/95 z-10 p-5 flex flex-col justify-center animate-in fade-in duration-200 border-t border-slate-100">
                  <form onSubmit={handleAddDeliverableSubmit} className="space-y-4">
                    <h4 className="text-xs font-black text-navy uppercase tracking-wider border-b pb-1.5">
                      Add deliverable to {g.code}
                    </h4>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Deliverable Name</label>
                      <input 
                        type="text" 
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="e.g. Design review checklist signoff"
                        className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-navy font-bold focus:outline-none focus:border-dc-blue"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kind</label>
                        <select 
                          value={newItemKind}
                          onChange={(e) => setNewItemKind(e.target.value as "CHECKBOX" | "DOC" | "TASK" | "DECISION" | "DFMEA")}
                          className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-navy font-bold focus:outline-none focus:border-dc-blue"
                        >
                          <option value="CHECKBOX">CHECKBOX</option>
                          <option value="DOC">DOC</option>
                          <option value="TASK">TASK</option>
                          <option value="DECISION">DECISION</option>
                          <option value="DFMEA">DFMEA</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Required?</label>
                        <select 
                          value={newItemRequired ? "1" : "0"}
                          onChange={(e) => setNewItemRequired(e.target.value === "1")}
                          className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-navy font-bold focus:outline-none focus:border-dc-blue"
                        >
                          <option value="1">Yes (Mandatory)</option>
                          <option value="0">No (Nice-to-have)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button 
                        type="submit"
                        className="flex-1 bg-dc-blue hover:bg-blue-700 text-white text-xs font-bold py-2 rounded shadow-sm transition-colors"
                      >
                        Add Item
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setAddingToGate(null);
                          setNewItemName("");
                        }}
                        className="flex-1 bg-slate-200 hover:bg-slate-300 text-navy text-xs font-bold py-2 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
