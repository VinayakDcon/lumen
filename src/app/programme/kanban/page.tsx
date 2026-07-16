"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useTasksQuery } from "@/hooks/use-pmo-queries";
import { 
  Plus, ChevronDown, ChevronRight, X, UploadCloud, Trash2
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Task, TaskStatus } from "@/types/pmo";

const STATUSES: TaskStatus[] = ["NOT STARTED", "IN PROGRESS", "DONE", "AT RISK", "DELAYED"];

const STATUS_ACCENTS: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  "NOT STARTED": { border: "border-t-slate-400", bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-400" },
  "IN PROGRESS": { border: "border-t-blue-550", bg: "bg-blue-50/10", text: "text-blue-700", dot: "bg-blue-500" },
  "DONE": { border: "border-t-emerald-650", bg: "bg-emerald-50/10", text: "text-emerald-700", dot: "bg-emerald-600" },
  "AT RISK": { border: "border-t-amber-500", bg: "bg-amber-50/10", text: "text-amber-700", dot: "bg-amber-500" },
  "DELAYED": { border: "border-t-red-600", bg: "bg-red-50/10", text: "text-red-750", dot: "bg-red-600" },
};

const PHASE_COLORS: Record<string, string> = {
  G0: "bg-purple-100 text-purple-800 border-purple-200",
  G1: "bg-indigo-100 text-indigo-800 border-indigo-200",
  G2: "bg-blue-100 text-blue-800 border-blue-200",
  G3: "bg-teal-100 text-teal-800 border-teal-200",
  G4: "bg-orange-100 text-orange-800 border-orange-200",
  G5: "bg-green-100 text-green-800 border-green-200",
  G6: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PROD: "bg-sky-100 text-sky-850 border-sky-200",
  SPARE: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function KanbanPage() {
  const user = usePmoStore((state) => state.user);
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  
  // Store actions
  const addTask = usePmoStore((state) => state.addTask);
  const updateTask = usePmoStore((state) => state.updateTask);
  const deleteTask = usePmoStore((state) => state.deleteTask);
  const people = usePmoStore((state) => state.people);

  // Queries
  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: rawTasks = [], isLoading: isTasksLoading, refetch } = useTasksQuery(activeProgrammeId);

  // Toolbar Filters
  const [phaseFilter, setPhaseFilter] = useState("");
  const [partFilter, setPartFilter] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [formWbs, setFormWbs] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhase, setFormPhase] = useState("G0");
  const [formPart, setFormPart] = useState("ALL");
  const [formDisc, setFormDisc] = useState("PM");
  const [formStartWk, setFormStartWk] = useState(1);
  const [formFinishWk, setFormFinishWk] = useState(4);
  const [formPlanHr, setFormPlanHr] = useState(20);
  const [formActualHr, setFormActualHr] = useState(0);
  const [formBlockedHr, setFormBlockedHr] = useState(0);
  const [formResources, setFormResources] = useState<string[]>([]);
  const [formReviewer, setFormReviewer] = useState("—");
  const [formStatus, setFormStatus] = useState<TaskStatus>("NOT STARTED");
  const [formPercent, setFormPercent] = useState(0);
  const [formApproval, setFormApproval] = useState<any>("—");
  const [formDocs, setFormDocs] = useState<any[]>([]);

  const isEditor = useMemo(() => {
    return user?.role && user.role !== "CUSTOMER";
  }, [user]);

  const phases = useMemo(() => {
    return Array.from(new Set(rawTasks.map((t) => t.phase))).filter(Boolean);
  }, [rawTasks]);

  const parts = useMemo(() => {
    if (activeProgramme?.scope_parts && activeProgramme.scope_parts.length > 0) {
      return activeProgramme.scope_parts;
    }
    const set = new Set<string>();
    rawTasks.forEach((t) => {
      if (t.part) {
        t.part.split(",").map((p) => p.trim()).forEach((p) => set.add(p));
      }
    });
    return Array.from(set).filter(Boolean);
  }, [rawTasks, activeProgramme]);

  const disciplines = ["PM", "Optics", "Mechanical", "Electrical", "Manufacturing", "Test/Quality", "Homologation", "Software"];

  // Helper to strip programme prefix
  const displayWbs = (wbs: string) => {
    if (!wbs) return "";
    const prefixed = String(wbs).match(/^[A-Za-z0-9_]+-(\d+(?:\.\d+)*)$/);
    if (prefixed) return prefixed[1];
    const pfx = (activeProgrammeId || "").toLowerCase() + "-";
    if (pfx.length > 1 && String(wbs).toLowerCase().startsWith(pfx)) return String(wbs).substring(pfx.length);
    return wbs;
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return rawTasks.filter((t) => {
      if (t.level !== 3) return false;
      if (phaseFilter && t.phase !== phaseFilter) return false;
      if (partFilter) {
        const partsList = (t.part || "").split(",").map((s) => s.trim());
        if (!partsList.includes("ALL") && !partsList.includes(partFilter)) return false;
      }
      return true;
    });
  }, [rawTasks, phaseFilter, partFilter]);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, wbs: string) => {
    e.dataTransfer.setData("text/plain", wbs);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const wbs = e.dataTransfer.getData("text/plain");
    if (!wbs) return;
    moveCard(wbs, status);
  };

  // Handle drag and drop column move
  const moveCard = async (wbs: string, status: TaskStatus) => {
    const updates: Partial<Task> = { status };
    if (status === "DONE") {
      updates.percent_complete = 100;
    } else if (status === "NOT STARTED") {
      updates.percent_complete = 0;
    }
    
    await updateTask(wbs, updates);
    refetch();
  };

  // Quick Status Advance
  const advanceStatus = async (wbs: string, currentStatus: TaskStatus) => {
    const nextIdx = (STATUSES.indexOf(currentStatus) + 1) % STATUSES.length;
    const nextStatus = STATUSES[nextIdx];
    const updates: Partial<Task> = { status: nextStatus };
    if (nextStatus === "DONE") {
      updates.percent_complete = 100;
    } else if (nextStatus === "NOT STARTED") {
      updates.percent_complete = 0;
    }
    await updateTask(wbs, updates);
    refetch();
  };

  // Open Edit Modal
  const openEditModal = (t: Task) => {
    setEditingTask(t);
    setFormWbs(t.wbs);
    setFormName(t.name);
    setFormPhase(t.phase || "G0");
    setFormPart(t.part || "ALL");
    setFormDisc(t.discipline || "PM");
    setFormStartWk(t.start_wk || 1);
    setFormFinishWk(t.finish_wk || 4);
    setFormPlanHr(t.plan_hr || t.effort_hr || 0);
    setFormActualHr(t.actual_hr || 0);
    setFormBlockedHr(t.blocked_hr || 0);
    setFormResources(t.resources ? t.resources.split(",").map((r) => r.trim()).filter(Boolean) : []);
    setFormReviewer(t.reviewer || "—");
    setFormStatus(t.status);
    setFormPercent(t.percent_complete || 0);
    setFormApproval(t.approval_status || "—");
    setFormDocs(t.docs || []);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWbs || !formName) return;

    // Ensure WBS starts with the active programme ID prefix
    let finalWbs = formWbs.trim();
    const prefix = `${activeProgrammeId}-`.toLowerCase();
    if (!finalWbs.toLowerCase().startsWith(prefix)) {
      finalWbs = `${activeProgrammeId}-${finalWbs}`;
    }

    // Detect level from dots on the suffix WBS hierarchy part
    const suffixPart = finalWbs.substring(activeProgrammeId.length + 1);
    const dots = (suffixPart.match(/\./g) || []).length;
    const computedLevel = dots === 0 ? 1 : (dots === 1 ? 2 : 3);

    const taskPayload: Task = {
      wbs: finalWbs,
      programme_id: activeProgrammeId,
      name: formName,
      phase: formPhase,
      part: formPart,
      discipline: formDisc,
      weeks: Math.max(1, formFinishWk - formStartWk + 1),
      plan_hr: formPlanHr,
      effort_hr: formPlanHr,
      actual_hr: formActualHr,
      blocked_hr: formBlockedHr,
      resources: formResources.join(", "),
      reviewer: formReviewer,
      status: formStatus,
      percent_complete: formPercent,
      approval_status: formApproval === "—" ? "NOT_REQUIRED" : formApproval,
      level: computedLevel,
      wbs_sort: finalWbs,
      start_wk: formStartWk,
      finish_wk: formFinishWk,
      cost_inr: formPlanHr * 1500,
      docs: formDocs
    };

    if (editingTask) {
      await updateTask(editingTask.wbs, taskPayload);
    } else {
      await addTask(taskPayload);
    }

    setIsModalOpen(false);
    setEditingTask(null);
    refetch();
  };

  if (!activeProgrammeId) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-white rounded-lg border border-slate-200">
        <h2 className="text-base font-bold text-slate-700 mb-2 font-sans">No Project Selected</h2>
        <p className="text-slate-500 text-xs max-w-md font-sans font-medium">
          You are not currently assigned to any active projects, or no project has been selected. Please select a project from the sidebar or contact your administrator.
        </p>
      </div>
    );
  }

  if (isProgLoading || isTasksLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Kanban Board...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col p-6 overflow-hidden bg-bg-base font-sans text-xs">
      
      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm shrink-0 mb-4">
        <div className="flex items-center gap-2.5">
          <select 
            value={phaseFilter} 
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-dc-blue cursor-pointer"
          >
            <option value="">All phases</option>
            {phases.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select 
            value={partFilter} 
            onChange={(e) => setPartFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-dc-blue cursor-pointer"
          >
            <option value="">All parts</option>
            {parts.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="text-[10px] text-slate-400 font-medium select-none">
          Click cards to edit · Drag cards to advance status
        </div>
      </div>

      {/* Kanban Board Columns Container */}
      <div className="flex-1 min-h-0 w-full grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-2">
        {STATUSES.map((status) => {
          const items = filteredTasks.filter(t => t.status === status);
          const totalHr = items.reduce((s, t) => s + (t.effort_hr || t.plan_hr || 0), 0);
          const accent = STATUS_ACCENTS[status];

          return (
            <div 
              key={status}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
              className="bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col h-full min-w-[200px] overflow-hidden"
            >
              {/* Column Header */}
              <div className={cn("px-3.5 py-2.5 border-t-3 font-bold flex items-center justify-between shadow-2xs shrink-0 select-none bg-slate-50", accent.border)}>
                <div className="flex items-center gap-1.5">
                  <span className={cn("w-2 h-2 rounded-full", accent.dot)} />
                  <span className="text-[11px] uppercase tracking-wider text-navy font-extrabold">{status}</span>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-black">
                  {items.length} · {totalHr}h
                </span>
              </div>

              {/* Column Card list */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 scrollbar-thin">
                {items.length === 0 ? (
                  <div className="h-24 flex items-center justify-center border border-dashed border-slate-200 rounded-lg text-slate-400 select-none">
                    Drop tasks here
                  </div>
                ) : (
                  items.map((t) => {
                    const pct = t.percent_complete || 0;
                    return (
                      <div 
                        key={t.wbs}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.wbs)}
                        onClick={() => openEditModal(t)}
                        className="bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-slate-350 rounded-lg p-3 shadow-xs hover:shadow-sm cursor-grab active:cursor-grabbing transition-all select-none group relative overflow-hidden"
                      >
                        <div className="flex justify-between items-center gap-1 mb-1.5">
                          <span className="font-mono font-bold text-[9px] text-slate-500">{displayWbs(t.wbs)}</span>
                          {t.phase && (
                            <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded border leading-none uppercase", PHASE_COLORS[t.phase] || "bg-slate-100 text-slate-600 border-slate-200")}>
                              {t.phase}
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-navy text-[11px] line-clamp-2 leading-tight mb-2 group-hover:text-dc-blue transition-colors">
                          {t.name}
                        </div>

                        <div className="flex items-center justify-between gap-1 flex-wrap mt-2 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="bg-slate-100 text-slate-600 text-[8px] font-bold px-1 py-0.5 rounded border border-slate-200">
                              {t.part || "ALL"}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              Wk {t.start_wk}–{t.finish_wk} · {t.effort_hr || t.plan_hr || 0}h
                            </span>
                          </div>

                          {isEditor && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                advanceStatus(t.wbs, t.status);
                              }}
                              className="text-[9px] font-bold text-dc-blue hover:text-white border border-dc-blue/20 hover:bg-dc-blue rounded px-1.5 py-0.5 transition-all flex items-center gap-0.5 cursor-pointer opacity-40 group-hover:opacity-100"
                              title="Advance Status"
                            >
                              ↻ next
                            </button>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 h-1 mt-2.5 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full transition-all", pct === 100 ? "bg-emerald-500" : pct > 50 ? "bg-blue-500" : "bg-amber-400")} 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Creation & Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150 text-slate-700 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-navy text-gold p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <h3 className="font-bold text-sm tracking-wide">
                {editingTask ? `Modify Task WBS: ${displayWbs(editingTask.wbs)}` : "Add New Task"}
              </h3>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
              
              <div className="grid grid-cols-2 gap-4">
                
                {/* WBS Code */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    WBS Code *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 1.2.3"
                    value={formWbs}
                    onChange={(e) => setFormWbs(e.target.value)}
                    required
                    disabled={!!editingTask}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue disabled:opacity-50 font-mono text-xs"
                  />
                </div>

                {/* Phase */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Phase/Swimlane
                  </label>
                  <select 
                    value={formPhase}
                    onChange={(e) => setFormPhase(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue text-xs cursor-pointer"
                  >
                    <option value="G0">Gate 0 (G0)</option>
                    <option value="G1">Gate 1 (G1)</option>
                    <option value="G2">Gate 2 (G2)</option>
                    <option value="G3">Gate 3 (G3)</option>
                    <option value="G4">Gate 4 (G4)</option>
                    <option value="G5">Gate 5 (G5)</option>
                    <option value="G6">Gate 6 (G6)</option>
                    <option value="PROD">SOP Series Production</option>
                    <option value="SPARE">Spare / BAU</option>
                  </select>
                </div>

              </div>

              {/* Task Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Task Title *
                </label>
                <input 
                  type="text" 
                  placeholder="Summarise scope description..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                
                {/* Scope Part */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Scope Part
                  </label>
                  <select 
                    value={formPart}
                    onChange={(e) => setFormPart(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue text-xs cursor-pointer"
                  >
                    <option value="ALL">ALL</option>
                    {activeProgramme?.scope_parts?.filter(p => p !== "ALL").map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Discipline */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Discipline
                  </label>
                  <select 
                    value={formDisc}
                    onChange={(e) => setFormDisc(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue text-xs cursor-pointer"
                  >
                    {disciplines.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Reviewer */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Reviewer Roster
                  </label>
                  <select 
                    value={formReviewer}
                    onChange={(e) => setFormReviewer(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue text-xs cursor-pointer"
                  >
                    <option value="—">—</option>
                    {people.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>

              </div>

              <div className="grid grid-cols-4 gap-4">
                
                {/* Start Wk */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Start Wk
                  </label>
                  <input 
                    type="number" 
                    min={1}
                    max={120}
                    value={formStartWk}
                    onChange={(e) => setFormStartWk(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue font-mono text-xs"
                  />
                </div>

                {/* Finish Wk */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Finish Wk
                  </label>
                  <input 
                    type="number" 
                    min={1}
                    max={120}
                    value={formFinishWk}
                    onChange={(e) => setFormFinishWk(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue font-mono text-xs"
                  />
                </div>

                {/* Planned Hr */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Plan Hours
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    value={formPlanHr}
                    onChange={(e) => setFormPlanHr(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue font-mono text-xs"
                  />
                </div>

                {/* Actual Hr */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Actual Hr
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    value={formActualHr}
                    onChange={(e) => setFormActualHr(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue font-mono text-xs"
                  />
                </div>

              </div>

              <div className="grid grid-cols-3 gap-4">
                
                {/* Blocked Hours */}
                <div>
                  <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">
                    Blocked Hours
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    value={formBlockedHr}
                    onChange={(e) => setFormBlockedHr(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue font-mono text-xs text-red-650"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Work Status
                  </label>
                  <select 
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                    className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue text-xs cursor-pointer"
                  >
                    <option value="NOT STARTED">Not Started</option>
                    <option value="IN PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                    <option value="AT RISK">At Risk</option>
                    <option value="DELAYED">Delayed</option>
                  </select>
                </div>

                {/* Percent Complete */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    % Complete
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    max={100}
                    value={formPercent}
                    onChange={(e) => setFormPercent(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue font-mono text-xs"
                  />
                </div>

              </div>

              {/* Resources Checklist */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Owners Assigned
                </label>
                <div className="grid grid-cols-3 gap-2 border border-slate-200 rounded p-3 max-h-32 overflow-y-auto bg-slate-50">
                  {people.map(p => {
                    const isChecked = formResources.includes(p.name);
                    return (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer text-[11px] hover:text-slate-900 select-none">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormResources([...formResources, p.name]);
                            } else {
                              setFormResources(formResources.filter(name => name !== p.name));
                            }
                          }}
                          className="rounded border-slate-350 text-dc-blue focus:ring-dc-blue cursor-pointer"
                        />
                        <span className="truncate">{p.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Scope Attachments */}
              <div className="border-t border-slate-100 pt-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Scope Attachments / Documents
                </label>
                
                {formDocs.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {formDocs.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 shadow-2xs">
                        <a 
                          href={doc.url} 
                          download={doc.name}
                          className="text-dc-blue hover:underline hover:text-dc-deep font-bold truncate max-w-[80%]"
                          title={`${doc.name} (${doc.size || 'unknown'})`}
                        >
                          {doc.name}
                          <span className="text-[10px] text-slate-400 font-normal ml-2">({doc.size})</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setFormDocs(formDocs.filter((_, i) => i !== idx));
                          }}
                          className="text-red-500 hover:text-red-700 p-0.5 rounded cursor-pointer transition-colors"
                          title="Remove attachment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 hover:border-slate-350 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer w-fit shadow-2xs">
                  <UploadCloud className="w-4 h-4 text-slate-500" />
                  <span>Upload Document</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const docUrl = URL.createObjectURL(file);
                        const formattedSize = file.size > 1024 * 1024 
                          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                          : `${(file.size / 1024).toFixed(0)} KB`;
                        const newDoc = {
                          name: file.name,
                          url: docUrl,
                          size: formattedSize,
                          uploaded_at: new Date().toISOString()
                        };
                        setFormDocs([...formDocs, newDoc]);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-4 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-dc-blue hover:bg-dc-deep text-white font-bold px-4 py-2 rounded transition-all cursor-pointer text-xs shadow-xs"
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
