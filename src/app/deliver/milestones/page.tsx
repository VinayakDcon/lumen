"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useMilestonesQuery } from "@/hooks/use-pmo-queries";
import { 
  Flag, Search, Plus, FileSpreadsheet, Edit3, Trash2, X, AlertTriangle
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Milestone } from "@/types/pmo";

export default function MilestonesPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addMilestone = usePmoStore((state) => state.addMilestone);
  const updateMilestone = usePmoStore((state) => state.updateMilestone);
  const deleteMilestone = usePmoStore((state) => state.deleteMilestone);
  const cycleMilestoneStatus = usePmoStore((state) => state.cycleMilestoneStatus);

  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: milestones = [], isLoading: isMilestonesLoading } = useMilestonesQuery(activeProgrammeId);

  const isLoading = isProgLoading || isMilestonesLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  // Form states
  const [formWeek, setFormWeek] = useState(1);
  const [formEvent, setFormEvent] = useState("");
  const [formType, setFormType] = useState("");
  const [formPhase, setFormPhase] = useState("");
  const [formWbs, setFormWbs] = useState("");
  const [formOwner, setFormOwner] = useState("");
  const [formStatus, setFormStatus] = useState<Milestone["status"]>("PENDING");
  const [formVisible, setFormVisible] = useState(1);
  const [formNotes, setFormNotes] = useState("");

  // Date calculation helper
  const getWeekDate = (wk: number) => {
    if (!activeProgramme?.kickoff_date) return "—";
    const kickoff = new Date(activeProgramme.kickoff_date);
    const d = new Date(kickoff);
    d.setDate(d.getDate() + (wk - 1) * 7);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
  };

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return milestones
      .filter((m) => {
        const matchesSearch = 
          m.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.wbs_link || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.owner || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = !typeFilter || m.type === typeFilter;
        const matchesPhase = !phaseFilter || m.phase === phaseFilter;
        const matchesStatus = !statusFilter || m.status === statusFilter;
        return matchesSearch && matchesType && matchesPhase && matchesStatus;
      })
      .sort((a, b) => a.week - b.week);
  }, [milestones, searchQuery, typeFilter, phaseFilter, statusFilter]);

  // Unique phase options from milestones
  const phaseOptions = useMemo(() => {
    const phases = milestones.map((m) => m.phase).filter(Boolean);
    return Array.from(new Set(phases)).sort() as string[];
  }, [milestones]);

  // Unique type options
  const typeOptions = ["★ Key", "★★ Gate", "Customer", "Internal"];

  // Open modal helper
  const handleOpenModal = (m?: Milestone) => {
    if (m) {
      setEditingMilestone(m);
      setFormWeek(m.week);
      setFormEvent(m.event);
      setFormType(m.type || "");
      setFormPhase(m.phase || "");
      setFormWbs(m.wbs_link || "");
      setFormOwner(m.owner || "");
      setFormStatus(m.status);
      setFormVisible(m.customer_visible);
      setFormNotes(m.notes || "");
    } else {
      setEditingMilestone(null);
      setFormWeek(1);
      setFormEvent("");
      setFormType("");
      setFormPhase("");
      setFormWbs("");
      setFormOwner("");
      setFormStatus("PENDING");
      setFormVisible(1);
      setFormNotes("");
    }
    setIsModalOpen(true);
  };

  // Form submit handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEvent.trim()) {
      alert("Please fill in Milestone Event Name.");
      return;
    }

    const payload = {
      programme_id: activeProgrammeId,
      week: Number(formWeek),
      event: formEvent,
      type: formType || null,
      phase: formPhase || null,
      wbs_link: formWbs || null,
      owner: formOwner || null,
      status: formStatus,
      customer_visible: Number(formVisible),
      notes: formNotes
    };

    if (editingMilestone) {
      updateMilestone(editingMilestone.id, payload);
    } else {
      addMilestone(payload);
    }

    setIsModalOpen(false);
  };

  // Delete milestone handler
  const handleDeleteMilestone = (id: number) => {
    if (confirm("Are you sure you want to delete this milestone?")) {
      deleteMilestone(id);
    }
  };

  // CSV Export helper
  const handleExportCSV = () => {
    const headers = ["Week", "Due Date", "Event", "Type", "Phase", "Linked WBS", "Owner", "Status", "Customer Visible", "Notes"];
    const rows = filteredMilestones.map((m) => [
      `Wk ${m.week}`,
      getWeekDate(m.week),
      m.event,
      m.type || "—",
      m.phase || "—",
      m.wbs_link || "—",
      m.owner || "—",
      m.status,
      m.customer_visible ? "Yes" : "No",
      m.notes || "—"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `milestones_${activeProgrammeId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusClass = (status: Milestone["status"]) => {
    switch (status) {
      case "DONE": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "AT RISK": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300";
    }
  };

  const getTypeBadgeClass = (type: string | null) => {
    const t = String(type || "").toLowerCase();
    if (t.includes("★")) return "bg-sky-50 text-sky-700 border-sky-200";
    if (t.includes("customer")) return "bg-purple-50 text-purple-700 border-purple-200";
    if (t.includes("internal")) return "bg-slate-50 text-slate-600 border-slate-200";
    return "bg-slate-50 text-slate-400 border-slate-200";
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Milestones...</span>
        </div>
      </div>
    );
  }

  if (!activeProgramme) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Flag className="w-16 h-16 text-slate-350 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Active Programme</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select a programme to view and manage milestones.
        </p>
      </div>
    );
  }

  // Calculate high level KPIs
  const kpiTotal = milestones.length;
  const kpiCompleted = milestones.filter(m => m.status === "DONE").length;
  const kpiAtRisk = milestones.filter(m => m.status === "AT RISK").length;
  const kpiPending = kpiTotal - kpiCompleted - kpiAtRisk;

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col p-6 overflow-y-auto bg-bg-base font-sans text-xs space-y-6">
      
      {/* Title & Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy flex items-center gap-2">
            <Flag className="w-6 h-6 text-dc-blue" />
            <span>Programme Milestones</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Track key engineering releases, prototype gates, and customer target dates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50 font-bold transition-colors shadow-xs cursor-pointer text-slate-700"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 bg-dc-blue hover:bg-dc-blue-dark text-white font-bold px-3 py-1.5 rounded-md transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Milestone</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Milestones</span>
          <span className="text-xl font-black text-navy block mt-2">{kpiTotal}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-emerald-600">Completed</span>
          <span className="text-xl font-black text-emerald-600 block mt-2">{kpiCompleted}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-amber-600">At Risk</span>
          <span className="text-xl font-black text-amber-600 block mt-2">{kpiAtRisk}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pending / Upcoming</span>
          <span className="text-xl font-black text-navy block mt-2">{kpiPending}</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search milestones by event, link, owner..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs w-full focus:outline-none placeholder-slate-400"
          />
        </div>
        
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer font-medium"
        >
          <option value="">All Types</option>
          {typeOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select 
          value={phaseFilter} 
          onChange={(e) => setPhaseFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer"
        >
          <option value="">All Phases</option>
          {phaseOptions.map((ph) => (
            <option key={ph} value={ph}>{ph}</option>
          ))}
        </select>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="AT RISK">AT RISK</option>
          <option value="DONE">DONE</option>
        </select>
      </div>

      {/* Milestones Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1 min-h-[400px]">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] select-none">
              <th className="px-4 py-3">Week</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Event Description</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Phase</th>
              <th className="px-4 py-3">Linked WBS</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Status (Click to cycle)</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredMilestones.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-slate-400 italic">
                  No milestones found matching the filters.
                </td>
              </tr>
            ) : (
              filteredMilestones.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 group transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">Wk {m.week}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{getWeekDate(m.week)}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{m.event}</td>
                  <td className="px-4 py-3">
                    {m.type ? (
                      <span className={cn("inline-block border rounded px-1.5 py-0.5 text-[10px] font-bold", getTypeBadgeClass(m.type))}>
                        {m.type}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {m.phase ? (
                      <span className="inline-block bg-slate-100 text-slate-700 border border-slate-200 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase">
                        {m.phase}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400 italic">{m.wbs_link || "—"}</td>
                  <td className="px-4 py-3 font-medium">{m.owner || "—"}</td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => cycleMilestoneStatus(m.id)}
                      className={cn("inline-block border rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wide transition-all shadow-2xs select-none cursor-pointer", getStatusClass(m.status))}
                    >
                      {m.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => handleOpenModal(m)}
                        className="p-1 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded text-slate-600 hover:text-slate-950 transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="font-bold text-[10px] pr-0.5">Edit</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteMilestone(m.id)}
                        className="p-1 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded text-slate-400 hover:text-rose-700 transition-all inline-flex items-center cursor-pointer"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Flag className="w-4 h-4 text-sky-400" />
                <span>{editingMilestone ? `Edit Milestone · Wk ${editingMilestone.week}` : "Add Milestone"}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="hover:bg-slate-800 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Milestone week */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Target Week *
                  </label>
                  <input 
                    type="number" 
                    min={1}
                    required
                    value={formWeek}
                    onChange={(e) => setFormWeek(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono font-bold"
                  />
                </div>

                {/* Milestone Type */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Milestone Type
                  </label>
                  <select 
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-bold"
                  >
                    <option value="">— Generic Milestone —</option>
                    <option value="★ Key">★ Key Milestone</option>
                    <option value="★★ Gate">★★ Phase-gate Review</option>
                    <option value="Customer">Customer-facing Milestone</option>
                    <option value="Internal">Internal Milestone</option>
                  </select>
                </div>

                {/* Event Name */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Event Description *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Design Freeze Complete, T0 Tooling Trials"
                    required
                    value={formEvent}
                    onChange={(e) => setFormEvent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-medium"
                  />
                </div>

                {/* Phase Link */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Project Phase Link
                  </label>
                  <select 
                    value={formPhase}
                    onChange={(e) => setFormPhase(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer"
                  >
                    <option value="">— No Phase Link —</option>
                    <option value="G0">G0 - Concept</option>
                    <option value="G1">G1 - Architecture</option>
                    <option value="G2">G2 - Design & Opt</option>
                    <option value="G3">G3 - Prototyping</option>
                    <option value="G4">G4 - PV Testing</option>
                    <option value="G5">G5 - SOP Release</option>
                    <option value="G6">G6 - Closeout</option>
                  </select>
                </div>

                {/* Linked WBS */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Linked WBS Code
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. bg_auto_26_001-3.2"
                    value={formWbs}
                    onChange={(e) => setFormWbs(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono"
                  />
                </div>

                {/* Owner */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Milestone Owner
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ankit Mishra"
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-medium"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Status
                  </label>
                  <select 
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-bold"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="AT RISK">AT RISK</option>
                    <option value="DONE">DONE</option>
                  </select>
                </div>

                {/* Customer visible checkbox */}
                <div className="col-span-2 flex items-center gap-2 py-2">
                  <input 
                    type="checkbox" 
                    id="ms-visible"
                    checked={formVisible === 1}
                    onChange={(e) => setFormVisible(e.target.checked ? 1 : 0)}
                    className="w-4 h-4 text-dc-blue border-slate-200 rounded focus:ring-dc-blue cursor-pointer"
                  />
                  <label htmlFor="ms-visible" className="text-slate-600 font-bold select-none cursor-pointer">
                    Show this milestone in the Customer Portal view
                  </label>
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Milestone Notes & Background
                  </label>
                  <textarea 
                    placeholder="Include details about dependencies, requirements, or issues..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                  />
                </div>

              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white border border-slate-200 rounded px-4 py-2 hover:bg-slate-50 text-slate-700 font-bold transition-colors text-xs cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-slate-900 hover:bg-black text-white font-bold px-4 py-2 rounded transition-colors text-xs cursor-pointer shadow-sm"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
