"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useChangeRequestsQuery } from "@/hooks/use-pmo-queries";
import { 
  RefreshCw, Search, Plus, FileSpreadsheet, Edit3, X, HelpCircle, CheckCircle2, AlertCircle
} from "lucide-react";
import { cn } from "@/utils/cn";
import { ChangeRequest } from "@/types/pmo";

export default function ChangeRequestsPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addChangeRequest = usePmoStore((state) => state.addChangeRequest);
  const updateChangeRequest = usePmoStore((state) => state.updateChangeRequest);
  const currentUser = usePmoStore((state) => state.user);

  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: changeRequests = [], isLoading: isCrLoading } = useChangeRequestsQuery(activeProgrammeId);

  const isLoading = isProgLoading || isCrLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCr, setEditingCr] = useState<ChangeRequest | null>(null);

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<ChangeRequest["type"]>("DESIGN");
  const [formDesc, setFormDesc] = useState("");
  const [formCost, setFormCost] = useState(0);
  const [formTimeline, setFormTimeline] = useState(0);
  
  // Evaluation fields
  const [formStatus, setFormStatus] = useState<ChangeRequest["status"]>("OPEN");
  const [formNotes, setFormNotes] = useState("");

  // Filtered change requests
  const filteredCrs = useMemo(() => {
    return changeRequests
      .filter((cr) => {
        const matchesSearch = 
          cr.cr_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (cr.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          cr.raised_by.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = !typeFilter || cr.type === typeFilter;
        const matchesStatus = !statusFilter || cr.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => b.id - a.id);
  }, [changeRequests, searchQuery, typeFilter, statusFilter]);

  // Open modal
  const handleOpenModal = (cr?: ChangeRequest) => {
    if (cr) {
      setEditingCr(cr);
      setFormCode(cr.cr_code);
      setFormTitle(cr.title);
      setFormType(cr.type);
      setFormDesc(cr.description || "");
      setFormCost(cr.cost_impact_inr || 0);
      setFormTimeline(cr.timeline_impact_weeks || 0);
      setFormStatus(cr.status);
      setFormNotes(cr.decision_notes || "");
    } else {
      setEditingCr(null);
      const nextNum = changeRequests.length + 1;
      setFormCode(`CR-${String(nextNum).padStart(3, "0")}`);
      setFormTitle("");
      setFormType("DESIGN");
      setFormDesc("");
      setFormCost(0);
      setFormTimeline(0);
      setFormStatus("OPEN");
      setFormNotes("");
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Please fill in Change Request Title.");
      return;
    }

    if (editingCr) {
      updateChangeRequest(editingCr.id, {
        title: formTitle,
        type: formType,
        description: formDesc || null,
        cost_impact_inr: Number(formCost) || 0,
        timeline_impact_weeks: Number(formTimeline) || 0,
        status: formStatus,
        decision_notes: formNotes || null
      });
    } else {
      addChangeRequest({
        programme_id: activeProgrammeId,
        cr_code: formCode,
        title: formTitle,
        type: formType,
        description: formDesc || null,
        cost_impact_inr: Number(formCost) || 0,
        timeline_impact_weeks: Number(formTimeline) || 0
      });
    }
    setIsModalOpen(false);
  };

  // CSV Export helper
  const handleExportCSV = () => {
    const headers = ["CR Code", "Title", "Type", "Raised By", "Raised At", "Cost Impact (INR)", "Timeline Impact (Wks)", "Eval Due Date", "Status", "Decision Note"];
    const rows = filteredCrs.map((cr) => [
      cr.cr_code,
      cr.title,
      cr.type,
      cr.raised_by,
      cr.raised_at,
      cr.cost_impact_inr ? `Rs. ${cr.cost_impact_inr}` : "0",
      cr.timeline_impact_weeks || "0",
      cr.eval_due_at || "—",
      cr.status,
      cr.decision_notes || "—"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `change_requests_${activeProgrammeId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeClass = (status: ChangeRequest["status"]) => {
    switch (status) {
      case "APPROVED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "REJECTED": return "bg-rose-50 text-rose-700 border-rose-200";
      case "IN_REVIEW": return "bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse";
      case "CLOSED": return "bg-slate-100 text-slate-650 border-slate-350";
      default: return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const getTypeBadgeClass = (type: ChangeRequest["type"]) => {
    switch (type) {
      case "COST": return "bg-red-50 text-red-700 border-red-200";
      case "TIMELINE": return "bg-purple-50 text-purple-700 border-purple-200";
      case "DESIGN": return "bg-sky-50 text-sky-700 border-sky-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Change Requests...</span>
        </div>
      </div>
    );
  }

  if (!activeProgramme) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <RefreshCw className="w-16 h-16 text-slate-350 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Active Programme</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select a programme to view and manage engineering change requests.
        </p>
      </div>
    );
  }

  // Count high level stats
  const kpiTotal = changeRequests.length;
  const kpiOpen = changeRequests.filter(cr => cr.status === "OPEN" || cr.status === "IN_REVIEW").length;
  const kpiApproved = changeRequests.filter(cr => cr.status === "APPROVED").length;
  
  const kpiTotalCost = changeRequests
    .filter(cr => cr.status === "APPROVED")
    .reduce((sum, cr) => sum + (cr.cost_impact_inr || 0), 0);

  const kpiTotalTimeline = changeRequests
    .filter(cr => cr.status === "APPROVED")
    .reduce((sum, cr) => sum + (cr.timeline_impact_weeks || 0), 0);

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col p-6 overflow-y-auto bg-bg-base font-sans text-xs space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-dc-blue" />
            <span>Engineering Change Requests (ECR)</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Propose, evaluate, and approve changes to design specification, cost budgets, and timelines.
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
            <span>New CR</span>
          </button>
        </div>
      </div>

      {/* KPI metrics strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total ECRs</span>
          <span className="text-xl font-black text-navy block mt-2">{kpiTotal}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-amber-600">Pending Evaluation</span>
          <span className="text-xl font-black text-amber-600 block mt-2">{kpiOpen}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-emerald-600">Approved CRs</span>
          <span className="text-xl font-black text-emerald-600 block mt-2">{kpiApproved}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-rose-600">Approved Cost Impact</span>
          <span className="text-sm font-black text-rose-600 block mt-2">
            ₹{kpiTotalCost.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-purple-600">Approved Timeline Delay</span>
          <span className="text-xl font-black text-purple-600 block mt-2">+{kpiTotalTimeline} Wks</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search ECRs by code, title, raised by..." 
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
          <option value="">All Change Types</option>
          <option value="DESIGN">DESIGN (CAD/Hardware)</option>
          <option value="SPEC">SPEC (Datasheet/Requirement)</option>
          <option value="TIMELINE">TIMELINE (Gantt Schedule)</option>
          <option value="COST">COST (Budget Sourcing)</option>
          <option value="SCOPE">SCOPE (Project Boundary)</option>
        </select>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer font-medium"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_REVIEW">IN REVIEW</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* CR Table Registry */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1 min-h-[400px]">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] select-none">
              <th className="px-4 py-3">CR Code</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Raised By</th>
              <th className="px-4 py-3">Raised Date</th>
              <th className="px-4 py-3 text-right">Cost Impact</th>
              <th className="px-4 py-3 text-center">Timeline Impact</th>
              <th className="px-4 py-3">Eval Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredCrs.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-16 text-center text-slate-400 italic">
                  No Change Requests found.
                </td>
              </tr>
            ) : (
              filteredCrs.map((cr) => {
                return (
                  <tr key={cr.id} className="hover:bg-slate-50/50 group transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{cr.cr_code}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{cr.title}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-block border rounded px-1.5 py-0.5 text-[9px] font-bold uppercase", getTypeBadgeClass(cr.type))}>
                        {cr.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{cr.raised_by}</td>
                    <td className="px-4 py-3 font-mono text-slate-550">{cr.raised_at.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {cr.cost_impact_inr ? `₹${cr.cost_impact_inr.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                      {cr.timeline_impact_weeks ? `+${cr.timeline_impact_weeks} Wks` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{cr.eval_due_at || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-block border rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", getStatusBadgeClass(cr.status))}>
                        {cr.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleOpenModal(cr)}
                        className="p-1 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded text-slate-650 hover:text-slate-950 transition-all font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Evaluate</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Evaluate CR Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-sky-400" />
                <span>{editingCr ? `Evaluate Change Request · ${editingCr.cr_code}` : "Initiate Change Request"}</span>
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
                
                {/* CR Code */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    CR Code ID *
                  </label>
                  <input 
                    type="text" 
                    required
                    disabled={!!editingCr}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue disabled:opacity-50 text-xs font-mono font-bold"
                  />
                </div>

                {/* Change Type */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Change Classification Type
                  </label>
                  <select 
                    value={formType}
                    disabled={!!editingCr}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-bold"
                  >
                    <option value="DESIGN">DESIGN (CAD / Optics / Electrical)</option>
                    <option value="SPEC">SPEC (Engineering Datasheet)</option>
                    <option value="TIMELINE">TIMELINE (Schedule extension)</option>
                    <option value="COST">COST (Procurement Sourcing Budget)</option>
                    <option value="SCOPE">SCOPE (Programme Boundary)</option>
                  </select>
                </div>

                {/* Title */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Change Request Title *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Outer lens mold slider design shift"
                    required
                    disabled={!!editingCr}
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-semibold"
                  />
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Change Description & Engineering Rationale
                  </label>
                  <textarea 
                    placeholder="Provide full technical explanation of the requested changes and what issues it will mitigate..."
                    disabled={!!editingCr}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                  />
                </div>

                {/* Cost Impact */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Cost Impact (Estimated INR)
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    disabled={!!editingCr}
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono font-bold"
                  />
                </div>

                {/* Timeline Impact */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Timeline Impact (Weeks shift)
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    disabled={!!editingCr}
                    value={formTimeline}
                    onChange={(e) => setFormTimeline(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono font-bold"
                  />
                </div>

                {/* Evaluator controls if editing */}
                {editingCr && (
                  <React.Fragment>
                    <div className="col-span-2 border-t border-slate-100 pt-4">
                      <h4 className="font-bold text-navy mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Change Board / Reviewer Panel Decisions</span>
                      </h4>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Decision Status
                      </label>
                      <select 
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-bold"
                      >
                        <option value="OPEN">OPEN (Awaiting Board)</option>
                        <option value="IN_REVIEW">IN REVIEW (Technical Audit)</option>
                        <option value="APPROVED">APPROVED (Formal Release)</option>
                        <option value="REJECTED">REJECTED</option>
                        <option value="CLOSED">CLOSED (Mitigated)</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Decision Notes & Corrective Directives
                      </label>
                      <textarea 
                        placeholder="Provide details of why this request was approved/rejected, and outline linked tasks and budget updates..."
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                      />
                    </div>
                  </React.Fragment>
                )}

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
                  {editingCr ? "Save Evaluation" : "Initiate ECR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
