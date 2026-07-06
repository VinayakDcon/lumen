"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useTasksQuery } from "@/hooks/use-pmo-queries";
import { 
  Award, Search, Plus, FileSpreadsheet, Edit3, X
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Task } from "@/types/pmo";

export default function DeliverablesPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const people = usePmoStore((state) => state.people);
  const updateTask = usePmoStore((state) => state.updateTask);
  const addTask = usePmoStore((state) => state.addTask);

  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: tasks = [], isLoading: isTasksLoading } = useTasksQuery(activeProgrammeId);

  const isLoading = isProgLoading || isTasksLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("");
  const [partFilter, setPartFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form states
  const [formWbs, setFormWbs] = useState("");
  const [formName, setFormName] = useState("");
  const [formTier, setFormTier] = useState<"KEY" | "GATE">("KEY");
  const [formPhase, setFormPhase] = useState("G0");
  const [formPart, setFormPart] = useState("ALL");
  const [formDisc, setFormDisc] = useState("PM");
  const [formStart, setFormStart] = useState(1);
  const [formFinish, setFormFinish] = useState(1);
  const [formPlanHr, setFormPlanHr] = useState(0);
  const [formActualHr, setFormActualHr] = useState(0);
  const [formPercent, setFormPercent] = useState(0);
  const [formOwner, setFormOwner] = useState("");
  const [formStatus, setFormStatus] = useState<Task["status"]>("NOT STARTED");
  const [formReviewer, setFormReviewer] = useState("");
  const [formApproval, setFormApproval] = useState("NOT_REQUIRED");
  const [formNotes, setFormNotes] = useState("");

  // Date calculation helper
  const getWeekDate = (wk: number) => {
    if (!activeProgramme?.kickoff_date) return "—";
    const kickoff = new Date(activeProgramme.kickoff_date);
    const d = new Date(kickoff);
    d.setDate(d.getDate() + (wk - 1) * 7);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
  };

  // Deliverable description cleaners
  const getCleanName = (deliverableStr: string) => {
    if (!deliverableStr) return "";
    return deliverableStr
      .replace(/★/g, "")
      .replace(/DELIVERABLE:\s*/i, "")
      .replace(/^[:·\s]+/, "")
      .trim();
  };

  // Filtered deliverables
  const deliverables = useMemo(() => {
    return tasks
      .filter((t) => t.deliverable && t.deliverable.trim() !== "")
      .filter((t) => {
        const cleanName = getCleanName(t.deliverable || "").toLowerCase();
        const matchesSearch = 
          cleanName.includes(searchQuery.toLowerCase()) ||
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.wbs.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPhase = !phaseFilter || t.phase === phaseFilter;
        const matchesPart = !partFilter || t.part === partFilter;
        const matchesStatus = !statusFilter || t.status === statusFilter;
        const matchesApproval = !approvalFilter || t.approval_status === approvalFilter;
        return matchesSearch && matchesPhase && matchesPart && matchesStatus && matchesApproval;
      })
      .sort((a, b) => (a.finish_wk || 0) - (b.finish_wk || 0));
  }, [tasks, searchQuery, phaseFilter, partFilter, statusFilter, approvalFilter]);

  // Unique phase options from tasks
  const phaseOptions = useMemo(() => {
    const phases = tasks.map((t) => t.phase).filter(Boolean);
    return Array.from(new Set(phases)).sort();
  }, [tasks]);

  // Unique part options from programme
  const partOptions = useMemo(() => {
    return ["ALL", ...(activeProgramme?.scope_parts || [])];
  }, [activeProgramme]);

  // Open modal helper
  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormWbs(task.wbs);
      setFormName(getCleanName(task.deliverable || task.name));
      setFormTier(task.deliverable?.includes("★★") ? "GATE" : "KEY");
      setFormPhase(task.phase || "G0");
      setFormPart(task.part || "ALL");
      setFormDisc(task.discipline || "PM");
      setFormStart(task.start_wk || 1);
      setFormFinish(task.finish_wk || 1);
      setFormPlanHr(task.plan_hr || 0);
      setFormActualHr(task.actual_hr || 0);
      setFormPercent(task.percent_complete || 0);
      setFormOwner(task.resources || "");
      setFormStatus(task.status || "NOT STARTED");
      setFormReviewer(task.reviewer || "");
      setFormApproval(task.approval_status || "NOT_REQUIRED");
      setFormNotes(task.notes || "");
    } else {
      setEditingTask(null);
      setFormWbs("");
      setFormName("");
      setFormTier("KEY");
      setFormPhase("G0");
      setFormPart("ALL");
      setFormDisc("PM");
      setFormStart(1);
      setFormFinish(1);
      setFormPlanHr(0);
      setFormActualHr(0);
      setFormPercent(0);
      setFormOwner("");
      setFormStatus("NOT STARTED");
      setFormReviewer("");
      setFormApproval("NOT_REQUIRED");
      setFormNotes("");
    }
    setIsModalOpen(true);
  };

  // Submit handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWbs.trim() || !formName.trim()) {
      alert("Please fill in WBS Code and Deliverable Name.");
      return;
    }

    const deliverableMarker = `${formTier === "GATE" ? "★★" : "★"} DELIVERABLE: ${formName}`;
    const payload = {
      name: formName,
      phase: formPhase,
      part: formPart,
      discipline: formDisc,
      start_wk: Number(formStart),
      finish_wk: Number(formFinish),
      weeks: Math.max(1, Number(formFinish) - Number(formStart) + 1),
      plan_hr: Number(formPlanHr),
      actual_hr: Number(formActualHr),
      percent_complete: Number(formPercent),
      resources: formOwner,
      deliverable: deliverableMarker,
      status: formStatus,
      reviewer: formReviewer,
      approval_status: formApproval as any,
      notes: formNotes
    };

    if (editingTask) {
      updateTask(editingTask.wbs, payload);
    } else {
      // Create new L3 task
      const newWbs = formWbs.includes("-") ? formWbs : `${activeProgrammeId}-${formWbs}`;
      addTask({
        ...payload,
        wbs: newWbs,
        programme_id: activeProgrammeId,
        level: 3,
        wbs_sort: newWbs,
        blocked_hr: 0
      });
    }

    setIsModalOpen(false);
  };

  // CSV Export helper
  const handleExportCSV = () => {
    const headers = ["WBS", "Deliverable Name", "Tier", "Phase", "Part", "Owner", "Reviewer", "Due Week", "Due Date", "Status", "Approval Status"];
    const rows = deliverables.map((t) => [
      t.wbs,
      getCleanName(t.deliverable || ""),
      (t.deliverable || "").includes("★★") ? "Phase-gate" : "Key",
      t.phase,
      t.part,
      t.resources,
      t.reviewer,
      `Wk ${t.finish_wk}`,
      getWeekDate(t.finish_wk || 1),
      t.status,
      t.approval_status || "—"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `deliverables_${activeProgrammeId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusClass = (status: Task["status"]) => {
    switch (status) {
      case "DONE": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "IN PROGRESS": return "bg-sky-50 text-sky-700 border-sky-200";
      case "AT RISK": return "bg-amber-50 text-amber-700 border-amber-200";
      case "DELAYED": return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getApprovalClass = (app: string) => {
    switch (app) {
      case "APPROVED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "SUBMITTED": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "REVISION_NEEDED": return "bg-amber-50 text-amber-700 border-amber-200";
      case "REJECTED": return "bg-rose-50 text-rose-700 border-rose-200";
      case "DRAFT": return "bg-slate-50 text-slate-600 border-slate-200";
      default: return "bg-slate-100 text-slate-400 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Deliverables...</span>
        </div>
      </div>
    );
  }

  if (!activeProgramme) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Award className="w-16 h-16 text-slate-350 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Active Programme</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select a programme to view and manage deliverables.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col p-6 overflow-y-auto bg-bg-base font-sans text-xs space-y-6">
      
      {/* Page Title & KPI block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy flex items-center gap-2">
            <Award className="w-6 h-6 text-dc-blue" />
            <span>Key & Phase-gate Deliverables</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Track and sign off on phase-gate requirements and customer-facing engineering items.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-slate-900 text-white font-bold px-3 py-1.5 rounded-md shadow-sm border border-slate-800">
            {deliverables.length} deliverables
          </span>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50 font-bold transition-colors shadow-xs cursor-pointer text-slate-700"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 bg-dc-blue hover:bg-dc-blue-dark text-white font-bold px-3 py-1.5 rounded-md transition-colors shadow-sm cursor-pointer animate-pulse"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Deliverable</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search deliverables by name, WBS..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs w-full focus:outline-none placeholder-slate-400"
          />
        </div>
        
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
          value={partFilter} 
          onChange={(e) => setPartFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer"
        >
          <option value="">All Parts</option>
          {partOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="NOT STARTED">NOT STARTED</option>
          <option value="IN PROGRESS">IN PROGRESS</option>
          <option value="DONE">DONE</option>
          <option value="AT RISK">AT RISK</option>
          <option value="DELAYED">DELAYED</option>
        </select>

        <select 
          value={approvalFilter} 
          onChange={(e) => setApprovalFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer"
        >
          <option value="">All Approvals</option>
          <option value="NOT_REQUIRED">Not Required</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="REVISION_NEEDED">Revision Needed</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Main Table Grid */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1 min-h-[400px]">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] select-none">
              <th className="px-4 py-3">WBS</th>
              <th className="px-4 py-3">Deliverable Description</th>
              <th className="px-4 py-3 text-center">Tier</th>
              <th className="px-4 py-3">Phase</th>
              <th className="px-4 py-3">Part</th>
              <th className="px-4 py-3">Owner (PMO)</th>
              <th className="px-4 py-3">Reviewer</th>
              <th className="px-4 py-3">Due Week</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Approval</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {deliverables.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-16 text-center text-slate-400 italic">
                  No deliverables found matching the active filters.
                </td>
              </tr>
            ) : (
              deliverables.map((t) => {
                const isGate = t.deliverable?.includes("★★");
                const cleanName = getCleanName(t.deliverable || "");
                return (
                  <tr key={t.wbs} className="hover:bg-slate-50/50 group transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{t.wbs}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{cleanName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold",
                        isGate ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"
                      )}>
                        {isGate ? "★★ Gate" : "★ Key"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-slate-100 text-slate-700 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-semibold">
                        {t.phase}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-slate-50 text-slate-500 border border-slate-200 rounded px-1.5 py-0.5 text-[9px] font-bold">
                        {t.part}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{t.resources || "—"}</td>
                    <td className="px-4 py-3">{t.reviewer || "—"}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">Wk {t.finish_wk}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{getWeekDate(t.finish_wk || 1)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-block border rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wide", getStatusClass(t.status))}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.approval_status && t.approval_status !== "NOT_REQUIRED" ? (
                        <span className={cn("inline-block border rounded px-1.5 py-0.5 text-[9px] font-bold uppercase", getApprovalClass(t.approval_status))}>
                          {t.approval_status.replace("_", " ")}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">No approval</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleOpenModal(t)}
                        className="p-1 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded text-slate-600 hover:text-slate-900 transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="font-bold text-[10px] pr-1">Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Award className="w-4 h-4 text-sky-400" />
                <span>{editingTask ? `Edit Deliverable · ${editingTask.wbs}` : "Add Deliverable"}</span>
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
                
                {/* WBS Code */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    WBS Code / Link *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 3.1.2 or MY_22-1.2.1"
                    required
                    disabled={!!editingTask}
                    value={formWbs}
                    onChange={(e) => setFormWbs(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue disabled:opacity-50 text-xs font-mono font-bold"
                  />
                </div>

                {/* Tier */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Deliverable Tier
                  </label>
                  <select 
                    value={formTier}
                    onChange={(e) => setFormTier(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-bold"
                  >
                    <option value="KEY">★ Key Deliverable</option>
                    <option value="GATE">★★ Phase-gate Deliverable</option>
                  </select>
                </div>

                {/* Deliverable Description */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Deliverable Description *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. DVP Sourcing Report, CAD Freeze Sign-off"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-medium"
                  />
                </div>

                {/* Phase */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Phase Code
                  </label>
                  <select 
                    value={formPhase}
                    onChange={(e) => setFormPhase(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer"
                  >
                    <option value="G0">G0 - Concept</option>
                    <option value="G1">G1 - Architecture</option>
                    <option value="G2">G2 - Design & Opt</option>
                    <option value="G3">G3 - Prototyping</option>
                    <option value="G4">G4 - PV Testing</option>
                    <option value="G5">G5 - SOP Release</option>
                    <option value="G6">G6 - Closeout</option>
                  </select>
                </div>

                {/* Scope Part */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Part Category
                  </label>
                  <select 
                    value={formPart}
                    onChange={(e) => setFormPart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-medium"
                  >
                    {partOptions.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Discipline */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Discipline
                  </label>
                  <select 
                    value={formDisc}
                    onChange={(e) => setFormDisc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer"
                  >
                    <option value="PM">PM - Program Management</option>
                    <option value="OPT">OPT - Optical Engineering</option>
                    <option value="MECH">MECH - Mechanical Engineering</option>
                    <option value="ELEC">ELEC - Electrical Engineering</option>
                    <option value="MFG">MFG - Manufacturing</option>
                    <option value="T-Q">T-Q - Tooling & Quality</option>
                    <option value="HOM">HOM - Homologation</option>
                    <option value="SOFT">SOFT - Software Development</option>
                  </select>
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
                    <option value="NOT STARTED">NOT STARTED</option>
                    <option value="IN PROGRESS">IN PROGRESS</option>
                    <option value="DONE">DONE</option>
                    <option value="AT RISK">AT RISK</option>
                    <option value="DELAYED">DELAYED</option>
                  </select>
                </div>

                {/* Start Week */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Start Week
                  </label>
                  <input 
                    type="number" 
                    min={1}
                    value={formStart}
                    onChange={(e) => setFormStart(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                  />
                </div>

                {/* Finish Week */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Finish Week (Due Wk)
                  </label>
                  <input 
                    type="number" 
                    min={1}
                    value={formFinish}
                    onChange={(e) => setFormFinish(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                  />
                </div>

                {/* Plan Hours */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Planned Effort (Hours)
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    value={formPlanHr}
                    onChange={(e) => setFormPlanHr(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono"
                  />
                </div>

                {/* Actual Hours */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Actual Effort logged (Hours)
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    value={formActualHr}
                    onChange={(e) => setFormActualHr(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono"
                  />
                </div>

                {/* Percent Complete */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Percent Complete (%)
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    max={100}
                    value={formPercent}
                    onChange={(e) => setFormPercent(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-bold"
                  />
                </div>

                {/* Approval Status */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Approval Workflow
                  </label>
                  <select 
                    value={formApproval}
                    onChange={(e) => setFormApproval(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-semibold"
                  >
                    <option value="NOT_REQUIRED">Not Required</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SUBMITTED">Submitted (Pending Review)</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REVISION_NEEDED">Revision Needed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                {/* Owner / Resources */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Owner / Assignees (CSV)
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mohd Onais, Aditya Verma"
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-medium"
                  />
                </div>

                {/* Reviewer */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Designated Reviewer
                  </label>
                  <select 
                    value={formReviewer}
                    onChange={(e) => setFormReviewer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-medium"
                  >
                    <option value="">— None —</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.name}>{p.name} · {p.role}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Design Notes & Comments
                  </label>
                  <textarea 
                    placeholder="Provide context, links, or expectations for the deliverable..."
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
