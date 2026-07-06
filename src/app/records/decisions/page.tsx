"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useDecisionsQuery } from "@/hooks/use-pmo-queries";
import { 
  Navigation, Search, Plus, FileSpreadsheet, Edit3, Trash2, X, Calendar, User, CheckCircle2, AlertCircle, HelpCircle, Network
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Decision } from "@/types/pmo";

export default function DecisionsPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addDecision = usePmoStore((state) => state.addDecision);
  const updateDecision = usePmoStore((state) => state.updateDecision);
  const deleteDecision = usePmoStore((state) => state.deleteDecision);
  const allTasks = usePmoStore((state) => state.tasks);

  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: decisions = [], isLoading: isDecsLoading } = useDecisionsQuery(activeProgrammeId);

  const isLoading = isProgLoading || isDecsLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDec, setEditingDec] = useState<Decision | null>(null);

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formText, setFormText] = useState("");
  const [formRationale, setFormRationale] = useState("");
  const [formDecidedBy, setFormDecidedBy] = useState("");
  const [formDecidedAt, setFormDecidedAt] = useState("");
  const [formStatus, setFormStatus] = useState<Decision["status"]>("PROPOSED");
  const [formAttendees, setFormAttendees] = useState("");
  const [formLinkedWbs, setFormLinkedWbs] = useState("");

  // Filter tasks belonging to this programme for the WBS dropdown
  const programmeTasks = useMemo(() => {
    return allTasks.filter(t => t.programme_id === activeProgrammeId);
  }, [allTasks, activeProgrammeId]);

  // Filtered decisions
  const filteredDecs = useMemo(() => {
    return decisions
      .filter((d) => {
        const matchesSearch = 
          d.decision_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (d.decision_text || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (d.rationale || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (d.decided_by || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || d.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.id - a.id);
  }, [decisions, searchQuery, statusFilter]);

  // Open modal helper
  const handleOpenModal = (d?: Decision) => {
    if (d) {
      setEditingDec(d);
      setFormCode(d.decision_code);
      setFormTitle(d.title);
      setFormText(d.decision_text || "");
      setFormRationale(d.rationale || "");
      setFormDecidedBy(d.decided_by || "");
      setFormDecidedAt(d.decided_at || "");
      setFormStatus(d.status);
      setFormAttendees(d.attendees || "");
      setFormLinkedWbs(d.linked_wbs || "");
    } else {
      setEditingDec(null);
      const nextNum = decisions.length + 1;
      setFormCode(`DEC-${String(nextNum).padStart(3, "0")}`);
      setFormTitle("");
      setFormText("");
      setFormRationale("");
      setFormDecidedBy("");
      setFormDecidedAt(new Date().toISOString().slice(0, 10));
      setFormStatus("PROPOSED");
      setFormAttendees("");
      setFormLinkedWbs("");
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formCode.trim()) {
      alert("Please fill in Decision Code and Title.");
      return;
    }

    const payload = {
      programme_id: activeProgrammeId,
      decision_code: formCode,
      title: formTitle,
      decision_text: formText || null,
      rationale: formRationale || null,
      decided_by: formDecidedBy || null,
      decided_at: formDecidedAt || null,
      status: formStatus,
      attendees: formAttendees || null,
      linked_wbs: formLinkedWbs || null
    };

    if (editingDec) {
      updateDecision(editingDec.id, payload);
    } else {
      addDecision(payload);
    }
    setIsModalOpen(false);
  };

  const handleDeleteDec = (id: number) => {
    if (confirm("Are you sure you want to delete this decision registry entry?")) {
      deleteDecision(id);
    }
  };

  // CSV Export helper
  const handleExportCSV = () => {
    const headers = ["Decision Code", "Title", "Decision Details", "Rationale", "Decided By", "Decided At", "Status", "Linked WBS", "Attendees"];
    const rows = filteredDecs.map((d) => [
      d.decision_code,
      d.title,
      d.decision_text || "—",
      d.rationale || "—",
      d.decided_by || "—",
      d.decided_at || "—",
      d.status,
      d.linked_wbs || "—",
      d.attendees || "—"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `decisions_${activeProgrammeId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Count high level stats
  const kpiTotal = decisions.length;
  const kpiApproved = decisions.filter(d => d.status === "APPROVED").length;
  const kpiProposed = decisions.filter(d => d.status === "PROPOSED").length;

  const getStatusBadgeClass = (status: Decision["status"]) => {
    switch (status) {
      case "APPROVED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "REVISITED": return "bg-rose-50 text-rose-700 border-rose-200 animate-pulse";
      default: return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Decisions...</span>
        </div>
      </div>
    );
  }

  if (!activeProgramme) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Navigation className="w-16 h-16 text-slate-350 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Active Programme</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select a programme to view and manage decision registers.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col p-6 overflow-y-auto bg-bg-base font-sans text-xs space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy flex items-center gap-2">
            <Navigation className="w-6 h-6 text-dc-blue rotate-45" />
            <span>Decision Register</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Maintain a central ledger of approved architectural pathways, material releases, and program signoffs.
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
            <span>Log Decision</span>
          </button>
        </div>
      </div>

      {/* KPI metrics strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 shrink-0 max-w-2xl">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Decisions Registered</span>
          <span className="text-xl font-black text-navy block mt-2">{kpiTotal}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-emerald-600">Approved Agreements</span>
          <span className="text-xl font-black text-emerald-600 block mt-2">{kpiApproved}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-amber-600">Proposed / Under review</span>
          <span className="text-xl font-black text-amber-600 block mt-2">{kpiProposed}</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search decisions by code, subject title, details, owner..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs w-full focus:outline-none placeholder-slate-400"
          />
        </div>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer font-medium"
        >
          <option value="">All Statuses</option>
          <option value="PROPOSED">PROPOSED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REVISITED">REVISITED</option>
        </select>
      </div>

      {/* Decisions registry ledger */}
      <div className="space-y-4">
        {filteredDecs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-16 text-center text-slate-400 italic shadow-sm">
            No decisions logged.
          </div>
        ) : (
          filteredDecs.map((d) => {
            return (
              <div 
                key={d.id} 
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-start gap-4"
              >
                {/* Visual Header */}
                <div className="flex md:flex-col items-center md:items-start gap-2 md:w-36 shrink-0 border-r border-slate-100 pr-2">
                  <span className="font-mono font-bold text-slate-900 text-sm block">
                    {d.decision_code}
                  </span>
                  <div className="flex items-center gap-1 text-slate-500 font-mono mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{d.decided_at || "—"}</span>
                  </div>
                  <span className={cn("inline-block border rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider mt-1.5", getStatusBadgeClass(d.status))}>
                    {d.status}
                  </span>
                </div>

                {/* Content main block */}
                <div className="flex-1 space-y-3 min-w-0 text-slate-700">
                  <h3 className="text-sm font-bold text-navy">{d.title}</h3>

                  <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 space-y-2">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Decision Definition</span>
                      <p className="text-[11px] leading-relaxed text-slate-800">{d.decision_text || "No details logged."}</p>
                    </div>

                    {d.rationale && (
                      <div className="border-t border-slate-200/60 pt-2 mt-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Engineering Rationale & Alternatives Evaluated</span>
                        <p className="text-[11px] leading-relaxed italic text-slate-650">{d.rationale}</p>
                      </div>
                    )}
                  </div>

                  {/* Badges / Links strip */}
                  <div className="flex flex-wrap items-center gap-3">
                    {d.linked_wbs && (
                      <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5 text-indigo-700 font-mono text-[9px]">
                        <Network className="w-3.5 h-3.5 text-indigo-400" />
                        <span>WBS Link: <b>{d.linked_wbs}</b></span>
                      </div>
                    )}
                    
                    {d.attendees && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-100/50 border border-slate-200 rounded px-2 py-0.5 max-w-full">
                        <User className="w-3.5 h-3.5 text-slate-450" />
                        <span className="font-bold text-slate-600 shrink-0">Approvers:</span>
                        <span className="truncate">{d.attendees}</span>
                      </div>
                    )}
                  </div>

                  {/* Signoff details */}
                  <div className="text-[10px] text-slate-450 font-mono">
                    Decided by: <b className="text-slate-650">{d.decided_by || "—"}</b>
                  </div>
                </div>

                {/* Options button block */}
                <div className="flex md:flex-col items-center justify-end gap-1.5 md:self-start shrink-0">
                  <button 
                    onClick={() => handleOpenModal(d)}
                    className="p-1.5 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded text-slate-650 hover:text-slate-950 transition-all font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteDec(d.id)}
                    className="p-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded text-slate-400 hover:text-rose-700 transition-all inline-flex items-center cursor-pointer"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Log Decision Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-sky-400 rotate-45" />
                <span>{editingDec ? "Edit Decision Log" : "Log Central Agreement"}</span>
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
                
                {/* Decision Code */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Decision ID *
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono font-bold"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Review Status
                  </label>
                  <select 
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-bold"
                  >
                    <option value="PROPOSED">PROPOSED (Under Review)</option>
                    <option value="APPROVED">APPROVED (Locked/Signed-Off)</option>
                    <option value="REVISITED">REVISITED (Superseded)</option>
                  </select>
                </div>

                {/* Title */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Decision Subject Title *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Selection of LDO regulator layout footprint"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-semibold"
                  />
                </div>

                {/* Decision Text */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Decision Details & Resolution Statement
                  </label>
                  <textarea 
                    placeholder="Clearly outline the agreed course of action..."
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                  />
                </div>

                {/* Rationale */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Engineering Rationale & Alternatives Considered
                  </label>
                  <textarea 
                    placeholder="Outline why this route was selected over alternatives..."
                    value={formRationale}
                    onChange={(e) => setFormRationale(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                  />
                </div>

                {/* Decided By */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Deciding Lead / Authority
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Umar Sharif"
                    value={formDecidedBy}
                    onChange={(e) => setFormDecidedBy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-semibold"
                  />
                </div>

                {/* Decided At */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Decision Date
                  </label>
                  <input 
                    type="date" 
                    value={formDecidedAt}
                    onChange={(e) => setFormDecidedAt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono"
                  />
                </div>

                {/* Linked WBS */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Linked WBS Task Node
                  </label>
                  <select 
                    value={formLinkedWbs}
                    onChange={(e) => setFormLinkedWbs(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-mono font-bold"
                  >
                    <option value="">-- No Link --</option>
                    {programmeTasks.map(t => (
                      <option key={t.wbs} value={t.wbs}>
                        [{t.wbs}] {t.name.slice(0, 45)}...
                      </option>
                    ))}
                  </select>
                </div>

                {/* Attendees */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Meeting Approvers / Attendees
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Umar, Vishal, Aditya"
                    value={formAttendees}
                    onChange={(e) => setFormAttendees(e.target.value)}
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
                  Save Decision Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
