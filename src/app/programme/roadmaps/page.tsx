"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { canEdit } from "@/lib/roles";
import { 
  Sparkles, Calendar, Plus, Trash2, CheckCircle2, Circle, 
  ArrowRight, Compass, HelpCircle, Loader2, Link2, AlertCircle
} from "lucide-react";
import { cn } from "@/utils/cn";

import { useProgrammesQuery } from "@/hooks/use-pmo-queries";

export default function RoadmapsPage() {
  const user = usePmoStore((state) => state.user);
  const { data: liveProgrammes = [] } = useProgrammesQuery();
  const programmes = liveProgrammes;
  const people = usePmoStore((state) => state.people);
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addTask = usePmoStore((state) => state.addTask);

  const isEditor = canEdit(user?.role);
  const userDept = user?.department || "Software";
  const isPMOOrAdmin = user?.role === "PMO" || user?.role === "ADMIN" || user?.role === "PM";

  const userPerson = people.find(p => p.email?.toLowerCase().trim() === user?.email?.toLowerCase().trim());
  const userPersonKey = userPerson ? `person-${userPerson.id}` : "";

  const allowedProgrammes = programmes.filter(p => {
    if (isPMOOrAdmin) return true;
    if (!p.team_members) return false;
    let members: string[] = [];
    if (Array.isArray(p.team_members)) {
      members = p.team_members;
    } else {
      try {
        members = JSON.parse(p.team_members);
      } catch (e) {
        members = [];
      }
    }
    return members.includes(userPersonKey);
  });

  // State
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<number | null>(null);
  const [isPlanningMode, setIsPlanningMode] = useState<boolean>(false);

  // New Roadmap Form
  const [goal, setGoal] = useState<string>("");
  const [targetDate, setTargetDate] = useState<string>("");
  const [selectedProgId, setSelectedProgId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [suggestedTasks, setSuggestedTasks] = useState<Array<{ name: string; description: string }>>([]);

  // Roadmap details
  const [connections, setConnections] = useState<Array<{ d: string; isCompleted: boolean }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch all roadmaps
  const fetchRoadmaps = async () => {
    try {
      const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : "";
      const res = await fetch(`/api-proxy/roadmaps${emailParam}`);
      if (res.ok) {
        const data = await res.json();
        setRoadmaps(data);
        if (data.length > 0 && !selectedRoadmapId) {
          setSelectedRoadmapId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch roadmaps:", err);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, [user]);

  const activeRoadmap = roadmaps.find((r) => r.id === selectedRoadmapId);

  // Recalculate SVG connection lines for the zig-zag layout
  const recalculateLines = () => {
    const container = containerRef.current;
    if (!container || !activeRoadmap || activeRoadmap.tasks.length === 0) return;

    const newConnections: Array<{ d: string; isCompleted: boolean }> = [];
    const containerRect = container.getBoundingClientRect();

    const tasks = activeRoadmap.tasks;
    for (let i = 0; i < tasks.length - 1; i++) {
      const currentId = tasks[i].id;
      const nextId = tasks[i + 1].id;

      const currentPort = document.getElementById(`port-out-${currentId}`);
      const nextPort = document.getElementById(`port-in-${nextId}`);

      if (currentPort && nextPort) {
        const r1 = currentPort.getBoundingClientRect();
        const r2 = nextPort.getBoundingClientRect();

        const x1 = r1.left - containerRect.left + r1.width / 2;
        const y1 = r1.top - containerRect.top + r1.height / 2;
        const x2 = r2.left - containerRect.left + r2.width / 2;
        const y2 = r2.top - containerRect.top + r2.height / 2;

        const cpX1 = x1;
        const cpY1 = y1 + (y2 - y1) * 0.4;
        const cpX2 = x2;
        const cpY2 = y1 + (y2 - y1) * 0.6;

        const d = `M ${x1} ${y1} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x2} ${y2}`;
        const isCompleted = tasks[i].status === "COMPLETED" && tasks[i + 1].status === "COMPLETED";

        newConnections.push({ d, isCompleted });
      }
    }

    // Connect last task to the Goal Diamond
    const lastTask = tasks[tasks.length - 1];
    const lastPort = document.getElementById(`port-out-${lastTask.id}`);
    const goalDiamond = document.getElementById("roadmap-goal-diamond");

    if (lastPort && goalDiamond) {
      const r1 = lastPort.getBoundingClientRect();
      const r2 = goalDiamond.getBoundingClientRect();

      const x1 = r1.left - containerRect.left + r1.width / 2;
      const y1 = r1.top - containerRect.top + r1.height / 2;
      const x2 = r2.left - containerRect.left + r2.width / 2;
      const y2 = r2.top - containerRect.top + r2.height / 2;

      const cpX1 = x1;
      const cpY1 = y1 + (y2 - y1) * 0.4;
      const cpX2 = x2;
      const cpY2 = y1 + (y2 - y1) * 0.6;

      const d = `M ${x1} ${y1} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x2} ${y2}`;
      const isCompleted = lastTask.status === "COMPLETED" && tasks.every(t => t.status === "COMPLETED");

      newConnections.push({ d, isCompleted });
    }

    setConnections(newConnections);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      recalculateLines();
    }, 150);

    window.addEventListener("resize", recalculateLines);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", recalculateLines);
    };
  }, [selectedRoadmapId, activeRoadmap?.tasks, isPlanningMode]);

  // AI Generation
  const handleGenerateAI = async () => {
    if (!goal.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api-proxy/roadmaps/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, programme_id: selectedProgId || null })
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedTasks(data.tasks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save built roadmap
  const handleBuildRoadmap = async () => {
    if (!goal.trim() || suggestedTasks.length === 0) return;
    try {
      const res = await fetch("/api-proxy/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: goal,
          target_date: targetDate || null,
          programme_id: selectedProgId || null,
          department: userDept,
          created_by: user?.name || "Lead",
          tasks: suggestedTasks
        })
      });
      if (res.ok) {
        const created = await res.json();
        setSuggestedTasks([]);
        setGoal("");
        setTargetDate("");
        setSelectedProgId("");
        setIsPlanningMode(false);
        setRoadmaps([created, ...roadmaps]);
        setSelectedRoadmapId(created.id);
      }
    } catch (err) {
      console.error("Failed to build roadmap:", err);
    }
  };

  // Toggle Task Completion
  const handleToggleTask = async (task: any) => {
    if (!isEditor) return; // Read-only for engineers
    const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      const res = await fetch(`/api-proxy/roadmaps/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        // Update local state
        setRoadmaps(prev => prev.map(r => {
          if (r.id === selectedRoadmapId) {
            return {
              ...r,
              tasks: r.tasks.map((t: any) => t.id === task.id ? { ...t, status: newStatus } : t)
            };
          }
          return r;
        }));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Link to WBS
  const handleLinkToWBS = async (task: any) => {
    if (!isEditor || !activeRoadmap) return;
    const wbsCode = `RM-${activeRoadmap.id}-${task.id}`;
    const taskPayload = {
      wbs: wbsCode,
      programme_id: activeRoadmap.programme_id || activeProgrammeId,
      name: task.name,
      phase: "G0",
      discipline: userDept || "PM",
      status: "NOT STARTED",
      percent_complete: 0,
      level: 3,
      wbs_sort: wbsCode
    };

    try {
      await addTask(taskPayload);
      
      const res = await fetch(`/api-proxy/roadmaps/tasks/${task.id}/link`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wbs: wbsCode })
      });

      if (res.ok) {
        setRoadmaps(prev => prev.map(r => {
          if (r.id === selectedRoadmapId) {
            return {
              ...r,
              tasks: r.tasks.map((t: any) => t.id === task.id ? { ...t, wbs: wbsCode } : t)
            };
          }
          return r;
        }));
        alert(`Successfully linked roadmap step to WBS task: ${wbsCode}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to link to WBS.");
    }
  };

  // Delete Roadmap
  const handleDeleteRoadmap = async (roadmapId: number) => {
    if (!isEditor) return;
    if (!confirm("Are you sure you want to delete this roadmap?")) return;
    try {
      const res = await fetch(`/api-proxy/roadmaps/${roadmapId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        const remaining = roadmaps.filter(r => r.id !== roadmapId);
        setRoadmaps(remaining);
        setSelectedRoadmapId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Suggestion edit utils
  const handleEditSuggestionName = (idx: number, name: string) => {
    setSuggestedTasks(prev => prev.map((t, i) => i === idx ? { ...t, name } : t));
  };

  const handleEditSuggestionDesc = (idx: number, description: string) => {
    setSuggestedTasks(prev => prev.map((t, i) => i === idx ? { ...t, description } : t));
  };

  const handleAddSuggestion = () => {
    if (suggestedTasks.length === 0) {
      setSuggestedTasks([{ name: "New Step", description: "Step description..." }]);
      return;
    }
    const positionStr = prompt(
      `Where do you want to add the new step?\n` +
      `Enter a step number from 1 to ${suggestedTasks.length + 1} (e.g., 1 to insert at the start, ${suggestedTasks.length + 1} to insert at the end):`,
      `${suggestedTasks.length + 1}`
    );
    if (positionStr === null) return; // user cancelled
    const position = parseInt(positionStr, 10);
    if (isNaN(position) || position < 1 || position > suggestedTasks.length + 1) {
      alert(`Invalid position. Please enter a number between 1 and ${suggestedTasks.length + 1}.`);
      return;
    }
    const index = position - 1;
    const newTasks = [...suggestedTasks];
    newTasks.splice(index, 0, { name: `New Step ${position}`, description: "Step description..." });
    setSuggestedTasks(newTasks);
  };

  const handleDeleteSuggestion = (idx: number) => {
    setSuggestedTasks(suggestedTasks.filter((_, i) => i !== idx));
  };

  // Calculate Progress percentage
  const completedCount = activeRoadmap?.tasks.filter((t: any) => t.status === "COMPLETED").length || 0;
  const totalCount = activeRoadmap?.tasks.length || 0;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="page-container p-6 pb-28 space-y-6 max-h-screen overflow-y-auto">
      {/* Header bar */}
      <div className="bg-white border border-border-base rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-navy flex items-center gap-2">
            <Compass className="w-6 h-6 text-dc-blue" />
            <span>AI Roadmaps Planner</span>
            <span className="text-xs font-semibold text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full bg-slate-50 uppercase">
              {userDept} Department
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Build and visualize progressive timeline tracks for your teams, goals, and engineering workflows.
          </p>
        </div>

        {/* Action Ribbon */}
        {isEditor && (
          <button
            onClick={() => setIsPlanningMode(!isPlanningMode)}
            className="flex items-center gap-2 text-xs font-black bg-dc-blue hover:bg-dc-blue-dark text-white rounded-lg px-4 py-2 self-start md:self-auto transition-colors"
          >
            {isPlanningMode ? "View Active Roadmaps" : "Create New Roadmap"}
          </button>
        )}
      </div>

      {!isPMOOrAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-4 h-4 text-dc-blue shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-normal">
            <strong>View-only access active:</strong> As an engineer/intern in the <strong>{userDept}</strong> department, you have access to review all roadmaps assigned to your department. Editing and creation privileges are reserved for Leads and Heads.
          </div>
        </div>
      )}

      {isPlanningMode ? (
        /* PLANNING VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Goal Input form card */}
          <div className="lg:col-span-1 bg-white border border-border-base rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-navy flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-gold fill-gold" />
              <span>Define Roadmap Goal</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Goal / Objective</label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Launch the calibration firmware update by Q4..."
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-dc-blue placeholder-slate-300 resize-none font-medium text-navy bg-slate-50/50"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Target Date / Deadline</label>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:border-dc-blue font-bold text-navy bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Linked WBS Project (Optional)</label>
                <select
                  value={selectedProgId}
                  onChange={(e) => setSelectedProgId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-dc-blue font-bold text-navy bg-slate-50/50"
                >
                  <option value="">Independent Roadmap</option>
                  {allowedProgrammes.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGenerateAI}
                disabled={isGenerating || !goal.trim()}
                className="w-full py-2.5 rounded-lg text-xs font-black text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing project tasks...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-gold fill-gold" />
                    <span>Generate AI Roadmap Steps</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Suggested Steps List */}
          <div className="lg:col-span-2 bg-white border border-border-base rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-navy">AI Roadmap Step Sequence</h3>
              {suggestedTasks.length > 0 && (
                <button
                  onClick={handleAddSuggestion}
                  className="text-xs font-bold text-dc-blue hover:text-dc-blue-dark flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Step</span>
                </button>
              )}
            </div>

            {suggestedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6">
                <Sparkles className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-xs font-bold text-slate-500">No steps generated yet</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                  Fill in your goal on the left and click "Generate AI Roadmap Steps". The AI will compile sequential milestones.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 pr-1">
                {suggestedTasks.map((t, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 relative group">
                    <div className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) => handleEditSuggestionName(idx, e.target.value)}
                        className="w-full text-xs font-black text-navy border-b border-dashed border-transparent hover:border-slate-300 focus:border-dc-blue outline-none bg-transparent"
                      />
                      <textarea
                        value={t.description}
                        onChange={(e) => handleEditSuggestionDesc(idx, e.target.value)}
                        rows={2}
                        className="w-full text-[11px] font-medium text-slate-500 border border-transparent hover:border-slate-200 focus:border-slate-200 focus:bg-white rounded p-1 outline-none resize-none bg-transparent"
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteSuggestion(idx)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={handleBuildRoadmap}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-colors mt-6"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Build & Save Roadmap</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ROADMAPS VISUAL VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Sidebar - Roadmaps List */}
          <div className="lg:col-span-1 bg-white border border-border-base rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 px-1">Saved Roadmaps</h3>
            <div className="flex flex-col gap-2 pr-1">
              {roadmaps.map((r) => {
                const isActive = r.id === selectedRoadmapId;
                const completed = r.tasks.filter((t: any) => t.status === "COMPLETED").length;
                const total = r.tasks.length;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoadmapId(r.id)}
                    className={cn(
                      "p-3 rounded-lg border-2 text-left cursor-pointer transition-all flex flex-col justify-between group gap-2 bg-white",
                      isActive ? "border-dc-blue bg-blue-50/20" : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-xs text-navy leading-normal truncate flex-1">{r.title}</span>
                      {isEditor && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRoadmap(r.id);
                          }}
                          className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold border-t border-slate-100/60 pt-1.5">
                      <span>Created by {r.created_by}</span>
                      <strong className="text-dc-blue">{completed}/{total} steps</strong>
                    </div>
                  </div>
                );
              })}
              {roadmaps.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                  No active roadmaps found
                </div>
              )}
            </div>
          </div>

          {/* Main Visual Pathway */}
          <div className="lg:col-span-3 bg-white border border-border-base rounded-xl p-6 shadow-sm space-y-6 flex flex-col">
            {activeRoadmap ? (
              <>
                {/* Goal & Progress Header */}
                <div className="border-b border-slate-100 pb-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Goal</span>
                      <h3 className="text-base font-black text-navy mt-0.5">{activeRoadmap.title}</h3>
                    </div>
                    {activeRoadmap.target_date && (
                      <div className="self-start sm:self-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs text-slate-600 font-bold shrink-0">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>Deadline: {new Date(activeRoadmap.target_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-extrabold">
                      <span className="text-slate-400 uppercase tracking-wider text-[10px]">Roadmap Completion Track</span>
                      <span className="text-dc-blue">{progressPct}% ({completedCount}/{totalCount} Steps)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* THE ZIG-ZAG PATH CONTAINER */}
                <div 
                  ref={containerRef}
                  className="relative flex flex-col-reverse items-center justify-center gap-16 py-12 dot-grid-bg rounded-xl min-h-[500px] max-w-2xl mx-auto w-full border border-slate-100/80 shadow-inner"
                >
                  <style>{`
                    .dot-grid-bg {
                      background-color: #F8FAFC;
                      background-image: radial-gradient(#CBD5E1 1.2px, transparent 1.2px);
                      background-size: 18px 18px;
                    }
                    @keyframes strokeDash {
                      to {
                        stroke-dashoffset: -20;
                      }
                    }
                    .stroke-animated {
                      stroke-dasharray: 6, 4;
                      animation: strokeDash 0.8s linear infinite;
                    }
                  `}</style>

                  {/* SVG connecting path lines */}
                  <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                    {connections.map((conn, idx) => (
                      <path
                        key={idx}
                        d={conn.d}
                        fill="none"
                        stroke={conn.isCompleted ? "#10B981" : "#94A3B8"}
                        strokeWidth={conn.isCompleted ? 3 : 2}
                        className={conn.isCompleted ? "" : "stroke-animated"}
                        style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
                      />
                    ))}
                  </svg>

                  {/* STEP CARDS */}
                  {activeRoadmap.tasks.map((task: any, index: number) => {
                    const stepNumber = index + 1;
                    const isLeft = stepNumber % 2 !== 0;
                    const isCompleted = task.status === "COMPLETED";

                    return (
                      <div
                        key={task.id}
                        id={`roadmap-step-${task.id}`}
                        className={cn(
                          "relative p-4 rounded-xl border-2 bg-white flex flex-col gap-2 w-72 select-none z-10 transition-all duration-300 shadow-xs group",
                          isLeft ? "self-start ml-2 md:ml-4" : "self-end mr-2 md:mr-4",
                          isCompleted ? "border-emerald-500 shadow-emerald-500/5" : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {/* Port handles for line alignments */}
                        <div id={`port-in-${task.id}`} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 pointer-events-none" />
                        <div id={`port-out-${task.id}`} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 pointer-events-none" />

                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => handleToggleTask(task)}
                            disabled={!isEditor}
                            className="shrink-0 mt-0.5 transition-transform duration-200 active:scale-95"
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400 bg-white rounded-full" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <span className="font-black text-xs text-navy block leading-snug">{task.name}</span>
                            {task.description && (
                              <p className="text-[10px] text-slate-400 font-semibold leading-normal mt-1">{task.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Linking & Info ribbon */}
                        <div className="flex justify-between items-center border-t border-slate-100/80 pt-2 mt-1">
                          <span className="text-[9px] uppercase font-black text-slate-400">Step {stepNumber}</span>
                          {task.wbs ? (
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1 select-none">
                              <Link2 className="w-3 h-3" />
                              <span>Linked WBS: {task.wbs}</span>
                            </span>
                          ) : (
                            isEditor && (
                              <button
                                onClick={() => handleLinkToWBS(task)}
                                className="text-[9px] font-black text-dc-blue hover:text-dc-blue-dark flex items-center gap-1 border border-dashed border-blue-200 px-1.5 py-0.5 rounded transition-all hover:bg-blue-50/50"
                              >
                                <Link2 className="w-3 h-3" />
                                <span>Link to WBS</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* THE GOAL DIAMOND NODE (AT THE TOP) */}
                  <div
                    id="roadmap-goal-diamond"
                    className={cn(
                      "relative w-28 h-28 bg-white border-4 flex items-center justify-center z-10 transition-all duration-500 rotate-45 shadow-sm self-center my-6",
                      activeRoadmap.tasks.every((t: any) => t.status === "COMPLETED") 
                        ? "border-gold bg-gold/15 animate-pulse" 
                        : "border-navy"
                    )}
                  >
                    <div className="-rotate-45 text-center px-2 flex flex-col items-center">
                      <span className="text-[10px] font-black text-navy uppercase tracking-widest block">Goal Reach</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Compass className="w-12 h-12 text-slate-300 animate-pulse mb-3" />
                <p className="text-xs font-bold text-slate-500">No active roadmap selected</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                  {isEditor 
                    ? "Select a roadmap from the left panel or click 'Create New Roadmap' to build one." 
                    : "No roadmaps have been configured for your department yet."
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
