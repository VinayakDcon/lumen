"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useTasksQuery } from "@/hooks/use-pmo-queries";
import { 
  X, Check, ShieldAlert, Award, UserCheck
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Task, TaskStatus } from "@/types/pmo";

export default function ApprovalsPage() {
  const user = usePmoStore((state) => state.user);
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  
  // Store actions
  const updateTask = usePmoStore((state) => state.updateTask);
  const people = usePmoStore((state) => state.people);

  // Queries
  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: rawTasks = [], isLoading: isTasksLoading, refetch } = useTasksQuery(activeProgrammeId);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Modal Form state
  const [formReviewer, setFormReviewer] = useState("—");
  const [formApproval, setFormApproval] = useState("—");
  const [formNotes, setFormNotes] = useState("");
  const [formOutputs, setFormOutputs] = useState("");

  const isEditor = useMemo(() => {
    return user?.role && ["PMO", "ADMIN", "PROJECT_MANAGER", "PM"].includes(user.role);
  }, [user]);

  // WBS display helper
  const displayWbs = (wbs: string) => {
    if (!wbs) return "";
    const prefixed = String(wbs).match(/^[A-Za-z0-9_]+-(\d+(?:\.\d+)*)$/);
    if (prefixed) return prefixed[1];
    const pfx = (activeProgrammeId || "").toLowerCase() + "-";
    if (pfx.length > 1 && String(wbs).toLowerCase().startsWith(pfx)) return String(wbs).substring(pfx.length);
    return wbs;
  };

  // Queues
  const mine = useMemo(() => {
    return rawTasks.filter(t => 
      t.reviewer === user?.name && 
      t.approval_status === "PENDING"
    );
  }, [rawTasks, user]);

  const mySub = useMemo(() => {
    return rawTasks.filter(t => 
      (t as any).submitted_by === user?.name && 
      t.approval_status === "PENDING"
    );
  }, [rawTasks, user]);

  const revision = useMemo(() => {
    return rawTasks.filter(t => t.approval_status === "REVISION_NEEDED");
  }, [rawTasks]);

  const approved = useMemo(() => {
    return rawTasks
      .filter(t => t.approval_status === "APPROVED")
      .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""))
      .slice(0, 10);
  }, [rawTasks]);

  // Open task detail modal
  const openModal = (t: Task) => {
    setSelectedTask(t);
    setFormReviewer(t.reviewer || "—");
    setFormApproval(t.approval_status || "—");
    setFormNotes((t as any).approval_notes || "");
    setFormOutputs((t as any).expected_outputs || "");
    setIsModalOpen(true);
  };

  // Actions
  const handleApprove = () => {
    if (!selectedTask) return;
    updateTask(selectedTask.wbs, {
      approval_status: "APPROVED",
      status: "DONE",
      percent_complete: 100,
      approval_notes: formNotes,
      updated_at: new Date().toISOString()
    } as any);
    setIsModalOpen(false);
    setSelectedTask(null);
    refetch();
  };

  const handleRequestRevision = () => {
    if (!selectedTask) return;
    if (!formNotes.trim()) {
      alert("Please add notes explaining what needs revision.");
      return;
    }
    updateTask(selectedTask.wbs, {
      approval_status: "REVISION_NEEDED",
      status: "IN PROGRESS",
      approval_notes: formNotes,
      updated_at: new Date().toISOString()
    } as any);
    setIsModalOpen(false);
    setSelectedTask(null);
    refetch();
  };

  const handleSubmitForReview = () => {
    if (!selectedTask) return;
    updateTask(selectedTask.wbs, {
      approval_status: "PENDING",
      submitted_by: user?.name || "vinayak.chouhan",
      reviewer: formReviewer,
      expected_outputs: formOutputs,
      updated_at: new Date().toISOString()
    } as any);
    setIsModalOpen(false);
    setSelectedTask(null);
    refetch();
  };

  if (isProgLoading || isTasksLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Approvals...</span>
        </div>
      </div>
    );
  }

  if (!activeProgramme) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <UserCheck className="w-16 h-16 text-slate-350 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Active Programme</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select a programme to review task approval workflows.
        </p>
      </div>
    );
  }

  const renderQueueList = (tasks: Task[], placeholder: string, borderClass: string) => {
    if (tasks.length === 0) {
      return (
        <div className="h-24 flex items-center justify-center border border-dashed border-slate-200 rounded-lg text-slate-400 font-medium select-none bg-slate-50/50">
          {placeholder}
        </div>
      );
    }

    return (
      <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
        {tasks.map((t) => (
          <div 
            key={t.wbs}
            onClick={() => openModal(t)}
            className={cn(
              "p-3.5 bg-white border border-slate-200 hover:border-slate-3.5 shadow-xs hover:shadow-sm cursor-pointer transition-all flex flex-col gap-2 border-l-4 select-none",
              borderClass
            )}
          >
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="font-mono text-[10px] font-bold text-slate-500">{displayWbs(t.wbs)}</span>
              <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase leading-none">
                {t.part || "ALL"}
              </span>
            </div>
            <div className="font-bold text-navy text-[11.5px] leading-tight line-clamp-1">
              {t.name}
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium pt-1 border-t border-slate-100/55">
              <span>Owner: {t.resources ? t.resources.split(",")[0] : "—"}</span>
              <span>Finish: Wk {t.finish_wk}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col p-6 overflow-y-auto bg-bg-base font-sans text-xs space-y-6">
      
      {/* Page description */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm shrink-0 flex items-center justify-between select-none">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Task Gate Reviews · Deliverables Approval Queue
        </span>
        <span className="text-[10px] text-slate-400">
          Tasks awaiting your review or your team&apos;s response
        </span>
      </div>

      {/* 4-Column Approvals Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        
        {/* Column 1: Awaiting My Review */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-extrabold text-[11px] text-navy uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Awaiting My Review
            </span>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 rounded">{mine.length}</span>
          </div>
          {renderQueueList(mine, "Nothing here.", "border-l-blue-500")}
        </div>

        {/* Column 2: My Submissions Awaiting Approval */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-extrabold text-[11px] text-navy uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              My Submissions
            </span>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 rounded">{mySub.length}</span>
          </div>
          {renderQueueList(mySub, "Nothing here.", "border-l-amber-500")}
        </div>

        {/* Column 3: Revision Needed */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-extrabold text-[11px] text-navy uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-650" />
              Revision Needed
            </span>
            <span className="text-[10px] font-bold bg-red-100 text-red-800 px-1.5 rounded">{revision.length}</span>
          </div>
          {renderQueueList(revision, "Nothing here.", "border-l-red-500")}
        </div>

        {/* Column 4: Recently Approved */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-extrabold text-[11px] text-navy uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Recently Approved
            </span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 rounded">{approved.length}</span>
          </div>
          {renderQueueList(approved, "Nothing here.", "border-l-emerald-500")}
        </div>

      </div>

      {/* Approvals Details and Workflow Modal */}
      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 text-slate-700 flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-navy text-gold p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <h3 className="font-bold text-sm tracking-wide">
                Task Gate Review: {displayWbs(selectedTask.wbs)}
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedTask(null);
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Task Title</span>
                <span className="text-navy font-bold text-sm block mt-1 leading-snug">{selectedTask.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-3.5 my-2">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Scope Part</span>
                  <span className="text-navy font-semibold text-xs mt-1 block">{selectedTask.part || "ALL"}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Discipline</span>
                  <span className="text-navy font-semibold text-xs mt-1 block">{selectedTask.discipline || "PM"}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Planned Hours</span>
                  <span className="text-navy font-semibold text-xs mt-1 block">{(selectedTask as any).plan_hr || (selectedTask as any).effort_hr || 0} hr</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Current Status</span>
                  <span className="text-navy font-semibold text-xs mt-1 block">{selectedTask.status} ({selectedTask.percent_complete || 0}%)</span>
                </div>
              </div>

              {/* Reviewer / Approval setup */}
              {selectedTask.approval_status === "PENDING" && (selectedTask.reviewer === user?.name || (selectedTask as any).reviewer_user_id === user?.id) ? (
                // Review actions for assigned reviewer
                <div className="space-y-4 pt-1">
                  
                  {(selectedTask as any).expected_outputs && (
                    <div className="bg-slate-50 border border-slate-200 rounded p-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Expected Deliverable / Outputs</span>
                      <span className="text-navy text-xs leading-normal">{(selectedTask as any).expected_outputs}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Reviewer Assessment / Notes
                    </label>
                    <textarea 
                      placeholder="Add review comments or explain revision requirements..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-dc-blue"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button 
                      onClick={handleRequestRevision}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold px-3 py-2 rounded text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Request Revision</span>
                    </button>
                    <button 
                      onClick={handleApprove}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded text-xs transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>✓ Approve Task</span>
                    </button>
                  </div>

                </div>
              ) : (
                // Setup workflow for task owner / manager (Submit for review)
                <div className="space-y-4 pt-1">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Select Reviewer
                      </label>
                      <select 
                        value={formReviewer}
                        onChange={(e) => setFormReviewer(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue text-xs cursor-pointer"
                      >
                        <option value="—">— None —</option>
                        {people.map(p => <option key={p.id} value={p.name}>{p.name} · {p.role}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Approval State
                      </label>
                      <select 
                        value={formApproval}
                        disabled
                        className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs opacity-75 select-none"
                      >
                        <option value="—">NOT REQUIRED</option>
                        <option value="NOT_REQUIRED">NOT REQUIRED</option>
                        <option value="PENDING">PENDING (Submitted)</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REVISION_NEEDED">REVISION NEEDED</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Expected Output Description
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Design simulation PDF, outer lens prototype..."
                      value={formOutputs}
                      onChange={(e) => setFormOutputs(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-dc-blue"
                    />
                  </div>

                  {(selectedTask as any).approval_notes && (
                    <div className="bg-amber-50/40 border border-amber-100 rounded p-3 text-amber-900">
                      <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block mb-1">Last Review Notes</span>
                      <span className="text-xs leading-normal">{(selectedTask as any).approval_notes}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button 
                      onClick={handleSubmitForReview}
                      disabled={formReviewer === "—"}
                      className="bg-slate-900 hover:bg-black text-white disabled:opacity-50 font-bold px-4 py-2 rounded text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Award className="w-4 h-4" />
                      <span>Submit for Gate Review</span>
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
