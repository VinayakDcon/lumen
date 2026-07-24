"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore, mockResources } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useTasksQuery } from "@/hooks/use-pmo-queries";
import { 
  Plus, Upload, Download, Edit2, Trash2, ChevronDown, ChevronRight, 
  Search, ShieldAlert, Save, X, Check, HelpCircle, UploadCloud
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Task, TaskStatus } from "@/types/pmo";

export default function WbsPage() {
  const user = usePmoStore((state) => state.user);
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const hideCommercials = usePmoStore((state) => state.hideCommercials);
  const toggleHideCommercials = usePmoStore((state) => state.toggleHideCommercials);
  
  // Tasks mutations from store
  const addTask = usePmoStore((state) => state.addTask);
  const updateTask = usePmoStore((state) => state.updateTask);
  const deleteTask = usePmoStore((state) => state.deleteTask);
  const people = usePmoStore((state) => state.people);
  
  // Queries
  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: rawTasks = [], isLoading: isTasksLoading, refetch } = useTasksQuery(activeProgrammeId);

  // Local UI State
  const [filterText, setFilterText] = useState("");
  const [filterPhase, setFilterPhase] = useState("");
  const [filterPart, setFilterPart] = useState("");
  const [filterDisc, setFilterDisc] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [groupBy, setGroupBy] = useState<"hierarchy" | "phase" | "part" | "discipline" | "status">("hierarchy");
  const [collapsedWbs, setCollapsedWbs] = useState<string[]>([]);
  
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
  const [formFinishWk, setFormFinishWk] = useState(1);
  const [formPlanHr, setFormPlanHr] = useState(20);
  const [formActualHr, setFormActualHr] = useState(0);
  const [formBlockedHr, setFormBlockedHr] = useState(0);
  const [formResources, setFormResources] = useState<string[]>([]);
  const [formReviewer, setFormReviewer] = useState("—");
  const [formStatus, setFormStatus] = useState<TaskStatus>("NOT STARTED");
  const [formPercent, setFormPercent] = useState(0);
  const [formApproval, setFormApproval] = useState<any>("—");
  
  // Role checks
  const isEditor = useMemo(() => {
    return user?.role && user.role !== "CUSTOMER";
  }, [user]);

  // Fetch unique values for dropdown filters
  const phases = useMemo(() => {
    return Array.from(new Set(rawTasks.map(t => t.phase))).filter(Boolean);
  }, [rawTasks]);

  const parts = useMemo(() => {
    const set = new Set<string>();
    rawTasks.forEach(t => {
      if (t.part) {
        t.part.split(",").map(p => p.trim()).forEach(p => set.add(p));
      }
    });
    return Array.from(set).filter(Boolean);
  }, [rawTasks]);

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

  const wbsSortKey = (wbs: string): string => {
    if (!wbs) return '';
    return String(wbs).split('.').map(p => {
      const dashIdx = p.indexOf('-');
      if (dashIdx !== -1) {
        const prefix = p.substring(0, dashIdx + 1);
        const num = p.substring(dashIdx + 1);
        return prefix + num.padStart(4, '0');
      }
      return p.padStart(4, '0');
    }).join('.');
  };

  // Support N.0 parent conventions for descendant selection
  const wbsDescendantPrefix = (wbs: string) => {
    const norm = displayWbs(wbs);
    if (norm.endsWith(".0")) return norm.slice(0, -1);
    return norm + ".";
  };

  const isDescendantOf = (childWbs: string, parentWbs: string) => {
    const childNorm = displayWbs(childWbs);
    const parentNorm = displayWbs(parentWbs);
    if (childNorm === parentNorm) return false;
    return childNorm.startsWith(wbsDescendantPrefix(parentNorm));
  };

  const normaliseTaskStatus = (status: string, percentComplete = 0) => {
    const raw = String(status || 'NOT STARTED').trim().toUpperCase();
    const compact = raw.replace(/[\s_-]+/g, '');
    const pct = Math.max(0, Math.min(100, Math.round(Number(percentComplete) || 0)));
    let mapped: TaskStatus = 'NOT STARTED';
    if (['DONE', 'COMPLETE', 'COMPLETED', 'CLOSED', 'FINISHED', 'FINISH'].includes(compact)) mapped = 'DONE';
    else if (['INPROGRESS', 'WIP', 'STARTED', 'ONGOING', 'WORKING'].includes(compact)) mapped = 'IN PROGRESS';
    else if (['ATRISK', 'RISK'].includes(compact)) mapped = 'AT RISK';
    else if (['DELAYED', 'LATE', 'BLOCKED'].includes(compact)) mapped = 'DELAYED';
    else if (['NOTSTARTED', 'NOTSTART', 'PENDING', 'PLANNED', 'TODO', 'OPEN', ''].includes(compact)) mapped = 'NOT STARTED';
    
    if (pct >= 100 && (mapped === 'NOT STARTED' || mapped === 'IN PROGRESS')) return 'DONE';
    if (pct > 0 && pct < 100 && mapped === 'NOT STARTED') return 'IN PROGRESS';
    return mapped;
  };

  // Roll-up logic for parent tasks
  const rollupTaskInfo = (t: Task) => {
    if (t.level === 3) {
      const status = normaliseTaskStatus(t.status, t.percent_complete);
      const percent = status === "DONE" ? 100 : (t.percent_complete || 0);
      return {
        status,
        percent,
        plan_hr: t.effort_hr || t.plan_hr || 0,
        actual_hr: t.actual_hr || 0,
        blocked_hr: t.blocked_hr || 0,
        resources: t.resources || "—",
        isRollup: false
      };
    }

    // Find all Level 3 descendants
    const descendants = rawTasks.filter(o => o.level === 3 && isDescendantOf(o.wbs, t.wbs));
    
    // Sum of Level 2 children effort for Level 1, or own effort for Level 2
    let plan_hr = 0;
    if (t.level === 1) {
      const l2Children = rawTasks.filter(o => o.level === 2 && isDescendantOf(o.wbs, t.wbs));
      plan_hr = l2Children.reduce((sum, c) => sum + (c.effort_hr || c.plan_hr || 0), 0);
    } else if (t.level === 2) {
      plan_hr = t.effort_hr || t.plan_hr || 0;
    }

    if (descendants.length === 0) {
      return {
        status: normaliseTaskStatus(t.status || 'NOT STARTED', t.percent_complete),
        percent: t.percent_complete || 0,
        plan_hr: plan_hr,
        actual_hr: t.actual_hr || 0,
        blocked_hr: t.blocked_hr || 0,
        resources: t.resources || "—",
        isRollup: false
      };
    }

    const totalActual = descendants.reduce((sum, d) => sum + (d.actual_hr || 0), 0);
    const totalBlocked = descendants.reduce((sum, d) => sum + (d.blocked_hr || 0), 0);
    
    const childPct = (c: Task) => normaliseTaskStatus(c.status, c.percent_complete) === 'DONE' ? 100 : (c.percent_complete || 0);
    const avgPercent = descendants.reduce((sum, d) => sum + childPct(d), 0) / descendants.length;
    
    // Status Rollup logic: DELAYED > AT RISK > IN PROGRESS > DONE > NOT STARTED
    const counts = { "NOT STARTED": 0, "IN PROGRESS": 0, "DONE": 0, "AT RISK": 0, "DELAYED": 0 };
    descendants.forEach(d => {
      const dStatus = normaliseTaskStatus(d.status, d.percent_complete);
      counts[dStatus] = (counts[dStatus] || 0) + 1;
    });

    let rolledStatus: TaskStatus = "NOT STARTED";
    if (counts["DELAYED"] > 0) rolledStatus = "DELAYED";
    else if (counts["AT RISK"] > 0) rolledStatus = "AT RISK";
    else if (counts["DONE"] === descendants.length) rolledStatus = "DONE";
    else if (counts["IN PROGRESS"] > 0 || counts["DONE"] > 0) rolledStatus = "IN PROGRESS";

    // Resources list aggregation
    const resSet = new Set<string>();
    descendants.forEach(d => {
      if (d.resources) {
        d.resources.split(",").map(r => r.trim()).filter(r => r !== '—' && r !== '').forEach(r => resSet.add(r));
      }
    });
    const aggregatedResources = resSet.size > 0 ? Array.from(resSet).join(", ") : "—";

    return {
      status: rolledStatus,
      percent: Math.round(avgPercent),
      plan_hr: plan_hr,
      actual_hr: totalActual,
      blocked_hr: totalBlocked,
      resources: aggregatedResources,
      isRollup: true
    };
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return rawTasks.filter(t => {
      // 1. Text filter (WBS, name, resource)
      if (filterText) {
        const text = filterText.toLowerCase();
        const matchesSelf = t.wbs.toLowerCase().includes(text) || 
                            t.name.toLowerCase().includes(text) ||
                            (t.resources || "").toLowerCase().includes(text);
        if (!matchesSelf) {
          // If parent, check if any child matches
          const matchesDescendant = rawTasks.some(o => isDescendantOf(o.wbs, t.wbs) && (
            o.wbs.toLowerCase().includes(text) || 
            o.name.toLowerCase().includes(text) ||
            (o.resources || "").toLowerCase().includes(text)
          ));
          if (!matchesDescendant) return false;
        }
      }

      // 2. Phase filter
      if (filterPhase) {
        if (t.level === 3 && t.phase !== filterPhase) return false;
        if (t.level !== 3) {
          const hasMatchingChild = rawTasks.some(o => o.level === 3 && isDescendantOf(o.wbs, t.wbs) && o.phase === filterPhase);
          if (!hasMatchingChild) return false;
        }
      }

      // 3. Part filter
      if (filterPart) {
        const checkPart = (partVal: string) => {
          const arr = partVal.split(",").map(s => s.trim());
          return arr.includes("ALL") || arr.includes(filterPart);
        };
        if (t.level === 3 && !checkPart(t.part || "ALL")) return false;
        if (t.level !== 3) {
          const hasMatchingChild = rawTasks.some(o => o.level === 3 && isDescendantOf(o.wbs, t.wbs) && checkPart(o.part || "ALL"));
          if (!hasMatchingChild) return false;
        }
      }

      // 4. Discipline filter
      if (filterDisc) {
        const checkDisc = (discVal: string) => {
          return discVal.toLowerCase() === filterDisc.toLowerCase();
        };
        if (t.level === 3 && !checkDisc(t.discipline || "PM")) return false;
        if (t.level !== 3) {
          const hasMatchingChild = rawTasks.some(o => o.level === 3 && isDescendantOf(o.wbs, t.wbs) && checkDisc(o.discipline || "PM"));
          if (!hasMatchingChild) return false;
        }
      }

      // 5. Status filter
      if (filterStatus) {
        const rolled = rollupTaskInfo(t);
        if (rolled.status !== filterStatus) return false;
      }

      return true;
    });
  }, [rawTasks, filterText, filterPhase, filterPart, filterDisc, filterStatus]);

  // Expand / collapse helpers
  const toggleCollapse = (wbs: string) => {
    if (collapsedWbs.includes(wbs)) {
      setCollapsedWbs(collapsedWbs.filter(w => w !== wbs));
    } else {
      setCollapsedWbs([...collapsedWbs, wbs]);
    }
  };

  const expandAll = () => {
    setCollapsedWbs([]);
  };

  const collapseAll = () => {
    const parentWbs = rawTasks.filter(t => (t.level || 3) < 3).map(t => t.wbs);
    setCollapsedWbs(parentWbs);
  };

  // Sort tasks
  const sortedTasks = useMemo(() => {
    // For hierarchical view, sort WBS numerically/alphabetically (WBS sort order)
    let list = [...filteredTasks];
    
    if (groupBy === "hierarchy") {
      list.sort((a, b) => {
        const keyA = wbsSortKey(a.wbs_sort || a.wbs);
        const keyB = wbsSortKey(b.wbs_sort || b.wbs);
        return keyA.localeCompare(keyB);
      });
      // Filter out children of collapsed parents
      list = list.filter(t => {
        for (const p of collapsedWbs) {
          if (t.wbs !== p && isDescendantOf(t.wbs, p)) return false;
        }
        return true;
      });
    }
    
    return list;
  }, [filteredTasks, groupBy, collapsedWbs]);

  // Grouped task items (for non-hierarchical views)
  const groupedCategories = useMemo(() => {
    if (groupBy === "hierarchy") return null;
    
    const map: Record<string, Task[]> = {};
    // Only group leaf (level 3) tasks
    const leaves = filteredTasks.filter(t => t.level === 3);
    
    leaves.forEach(t => {
      let key = "—";
      if (groupBy === "phase") key = t.phase || "—";
      else if (groupBy === "part") key = t.part || "—";
      else if (groupBy === "discipline") key = t.discipline || "—";
      else if (groupBy === "status") key = t.status || "—";
      
      (map[key] = map[key] || []).push(t);
    });
    
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredTasks, groupBy]);

  // Cost estimation helper
  const getCost = (t: Task, rolledPlanHr: number) => {
    if (t.level === 3) {
      const firstRes = (t.resources || '').split(',')[0].trim();
      if (!firstRes || firstRes === '—') return 0;
      const r = mockResources.find(res => 
        res.id === firstRes || 
        res.id.toLowerCase() === firstRes.toLowerCase() ||
        res.name.toLowerCase() === firstRes.toLowerCase() ||
        firstRes.toLowerCase().includes(res.name.toLowerCase()) ||
        res.name.toLowerCase().includes(firstRes.toLowerCase())
      );
      const rate = r ? r.rate_inr : 1500;
      return (t.effort_hr || t.plan_hr || 0) * rate;
    } else {
      // For parent levels, sum the cost of Level 3 descendants
      const descendants = rawTasks.filter(o => o.level === 3 && isDescendantOf(o.wbs, t.wbs));
      return descendants.reduce((sum, d) => {
        const firstRes = (d.resources || '').split(',')[0].trim();
        if (!firstRes || firstRes === '—') return sum;
        const r = mockResources.find(res => 
          res.id === firstRes || 
          res.id.toLowerCase() === firstRes.toLowerCase() ||
          res.name.toLowerCase() === firstRes.toLowerCase() ||
          firstRes.toLowerCase().includes(res.name.toLowerCase()) ||
          res.name.toLowerCase().includes(firstRes.toLowerCase())
        );
        const rate = r ? r.rate_inr : 1500;
        return sum + (d.effort_hr || d.plan_hr || 0) * rate;
      }, 0);
    }
  };

  // Form submit handler
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
      cost_inr: formPlanHr * 1500
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

  // Open modal for adding task
  const openAddModal = () => {
    setEditingTask(null);
    setFormWbs("");
    setFormName("");
    setFormPhase("G0");
    setFormPart("ALL");
    setFormDisc("PM");
    setFormStartWk(1);
    setFormFinishWk(1);
    setFormPlanHr(20);
    setFormActualHr(0);
    setFormBlockedHr(0);
    setFormResources([]);
    setFormReviewer("—");
    setFormStatus("NOT STARTED");
    setFormPercent(0);
    setFormApproval("—");
    setIsModalOpen(true);
  };

  // Open modal for editing task
  const openEditModal = (t: Task) => {
    setEditingTask(t);
    setFormWbs(t.wbs);
    setFormName(t.name);
    setFormPhase(t.phase || "G0");
    setFormPart(t.part || "ALL");
    setFormDisc(t.discipline || "PM");
    setFormStartWk(t.start_wk || 1);
    setFormFinishWk(t.finish_wk || 1);
    setFormPlanHr(t.plan_hr || t.effort_hr || 0);
    setFormActualHr(t.actual_hr || 0);
    setFormBlockedHr(t.blocked_hr || 0);
    setFormResources(t.resources ? t.resources.split(",").map(r => r.trim()).filter(Boolean) : []);
    setFormReviewer(t.reviewer || "—");
    setFormStatus(t.status);
    setFormPercent(t.percent_complete || 0);
    setFormApproval(t.approval_status || "—");
    setIsModalOpen(true);
  };

  // WBS Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [replaceDuplicates, setReplaceDuplicates] = useState(true);
  const [importMode, setImportMode] = useState<"update" | "replace">("update");

  // Excel Export Handler (real .xlsx)
  const handleExportExcel = () => {
    if (!activeProgrammeId) {
      alert("Please select an active programme first.");
      return;
    }
    window.open(`/api-proxy/excel/export?programme_id=${activeProgrammeId}`, '_blank');
  };

  // Excel Import Trigger
  const handleImportWbs = () => {
    setImportStep(1);
    setImportFile(null);
    setImportPreview(null);
    setIsImportModalOpen(true);
  };

  // Step 1: File Upload -> Preview API Call
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImportFile(file);
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("programme_id", activeProgrammeId);

      try {
        const res = await fetch("/api-proxy/tasks/import-wbs/preview", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Preview failed");
        }

        const data = await res.json();
        setImportPreview(data);
        setImportStep(2);
      } catch (err: any) {
        console.error(err);
        alert(err.message || "Failed to parse import file. Check header fields.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Step 2: Confirm -> Commit API Call
  const handleConfirmImport = async () => {
    if (!importPreview) return;

    if (importMode === "replace") {
      const ok = confirm(
        "⚠️ REPLACE ENTIRE WBS\n\nThis will DELETE ALL existing WBS records for this programme and replace them with the imported data.\n\nThis action cannot be undone. Continue?"
      );
      if (!ok) return;
    }

    try {
      const res = await fetch("/api-proxy/tasks/import-wbs/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preview_id: importPreview.preview_id,
          programme_id: activeProgrammeId,
          replace_duplicates: replaceDuplicates,
          import_mode: importMode,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Confirmation failed");
      }

      const data = await res.json();
      setImportPreview(data);
      setImportStep(3);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "WBS confirmation failed.");
    }
  };

  // Badge rendering styles
  const getPhaseBadgeClass = (phase: string) => {
    const map: Record<string, string> = {
      G0: "bg-purple-600 text-white",
      G1: "bg-indigo-600 text-white",
      G2: "bg-blue-600 text-white",
      G3: "bg-teal-600 text-white",
      G4: "bg-orange-600 text-white",
      G5: "bg-green-600 text-white",
      G6: "bg-yellow-600 text-navy font-bold",
      PROD: "bg-slate-600 text-white",
      BAU: "bg-slate-400 text-white"
    };
    return map[phase] || "bg-slate-100 text-slate-700";
  };

  const fmtINR = (val: number) => {
    if (hideCommercials) return "🔒";
    if (!val) return "—";
    if (val >= 100000) {
      return `₹ ${(val / 100000).toFixed(1)} L`;
    }
    return `₹ ${val.toLocaleString()}`;
  };

  // Unified row renderer
  const renderTaskRow = (t: Task, isGroupedView = false) => {
    const rolled = rollupTaskInfo(t);
    const hasChildren = (t.level || 3) < 3 && rawTasks.some(o => (o.level || 3) === 3 && isDescendantOf(o.wbs, t.wbs));
    const isCollapsed = collapsedWbs.includes(t.wbs);
    const totalCost = getCost(t, rolled.plan_hr);

    // Color formatting based on depth level
    let rowBgClass = "";
    let nameIndentClass = "";
    let wbsTextClass = "";
    let discTextClass = "";
    let weeksTextClass = "";
    let planHrTextClass = "";
    let actualHrTextClass = "";
    let blockedHrTextClass = "";
    let resourceTextClass = "";
    let reviewerTextClass = "";
    let uploadBtnClass = "";
    let docLinkClass = "";
    let docBubbleClass = "";

    if ((t.level || 3) === 1) {
      rowBgClass = "bg-[#0D1B2E] dark:bg-[#1F2937] text-[#C9A95A] dark:text-[#C9A95A] font-bold border-b border-slate-800/60 dark:border-slate-800/60";
      nameIndentClass = "pl-2 font-bold text-[#C9A95A]";
      wbsTextClass = "text-[#C9A95A] font-bold";
      discTextClass = "text-slate-200 dark:text-slate-300 font-bold";
      weeksTextClass = "text-white font-mono";
      planHrTextClass = "text-[#C9A95A] font-bold font-mono";
      actualHrTextClass = "text-white font-bold font-mono";
      blockedHrTextClass = "text-red-400 font-bold font-mono";
      resourceTextClass = "text-slate-200 dark:text-slate-350 font-semibold";
      reviewerTextClass = "text-white/80";
      uploadBtnClass = "bg-white/10 hover:bg-white/20 text-[#C9A95A] border border-[#C9A95A]/40 hover:border-[#C9A95A]";
      docLinkClass = "text-white hover:underline font-semibold";
      docBubbleClass = "bg-white/10 border border-white/20 text-[#C9A95A]";
    } else if ((t.level || 3) === 2) {
      rowBgClass = "bg-[#E8F2FC] dark:bg-[#0F172A] text-[#0D1B2E] dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800";
      nameIndentClass = "pl-6 font-bold text-[#0D1B2E] dark:text-slate-200";
      wbsTextClass = "text-[#0D1B2E] dark:text-slate-200 font-bold";
      discTextClass = "text-[#0D1B2E]/80 dark:text-slate-300/80 font-bold";
      weeksTextClass = "text-[#0D1B2E] dark:text-slate-300 font-mono";
      planHrTextClass = "text-[#0D1B2E] dark:text-[#C9A95A] font-bold font-mono";
      actualHrTextClass = "text-[#0D1B2E] dark:text-slate-300 font-bold font-mono";
      blockedHrTextClass = "text-red-600 dark:text-red-400 font-bold font-mono";
      resourceTextClass = "text-slate-800 dark:text-slate-300 font-semibold";
      reviewerTextClass = "text-[#0D1B2E]/70 dark:text-slate-400/70";
      uploadBtnClass = "bg-[#0D1B2E]/10 hover:bg-[#0D1B2E]/20 text-[#0D1B2E] dark:text-slate-200 border border-[#0D1B2E]/30 dark:border-slate-700/50";
      docLinkClass = "text-[#0D1B2E] dark:text-dc-blue hover:underline font-semibold";
      docBubbleClass = "bg-[#0D1B2E]/5 dark:bg-slate-800 border border-[#0D1B2E]/10 dark:border-slate-700 text-[#0D1B2E] dark:text-slate-300";
    } else {
      rowBgClass = "bg-white dark:bg-[#111827] text-slate-650 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/50";
      nameIndentClass = "pl-10 text-slate-500 dark:text-slate-450 font-medium";
      wbsTextClass = "text-slate-400 dark:text-slate-500 font-mono";
      discTextClass = "text-slate-500 dark:text-slate-450 font-bold";
      weeksTextClass = "text-slate-600 dark:text-slate-400 font-mono";
      planHrTextClass = "text-slate-700 dark:text-slate-300 font-semibold font-mono";
      actualHrTextClass = "text-slate-700 dark:text-slate-300 font-semibold font-mono";
      blockedHrTextClass = "text-red-600 dark:text-red-400 font-bold font-mono";
      resourceTextClass = "text-slate-600 dark:text-slate-400 font-medium";
      reviewerTextClass = "text-slate-500 dark:text-slate-400";
      uploadBtnClass = "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300";
      docLinkClass = "text-dc-blue hover:underline hover:text-dc-deep font-semibold";
      docBubbleClass = "bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300";
    }

    return (
      <tr key={t.wbs} className={cn("transition-colors h-9", rowBgClass)}>
        
        {/* WBS code */}
        <td className={cn("py-2 px-4 select-none font-mono flex items-center gap-1", wbsTextClass)}>
          {!isGroupedView && hasChildren && (
            <button 
              onClick={() => toggleCollapse(t.wbs)}
              className="p-0.5 hover:bg-slate-200/20 rounded text-current"
            >
              {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
          {!isGroupedView && !hasChildren && <span className="w-4"></span>}
          <span>{displayWbs(t.wbs)}</span>
        </td>

        {/* Task Name */}
        <td className={cn("py-2 px-3 truncate max-w-[280px]", nameIndentClass)} title={t.name}>
          {t.name}
        </td>

        {/* Phase */}
        <td className="py-2 px-2 text-center">
          {t.phase && t.phase !== "—" && (
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold tracking-wider", getPhaseBadgeClass(t.phase))}>
              {t.phase}
            </span>
          )}
        </td>

        {/* Part */}
        <td className="py-2 px-2 text-center">
          {t.part && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[9px] border border-slate-200">
              {t.part}
            </span>
          )}
        </td>

        {/* Discipline */}
        <td className={cn("py-2 px-2 text-center text-[10px]", discTextClass)}>
          {t.discipline || "—"}
        </td>

        {/* Weeks */}
        <td className={cn("py-2 px-2 text-center", weeksTextClass)}>
          {t.start_wk && t.finish_wk ? `${t.start_wk}-${t.finish_wk}` : "—"}
        </td>

        {/* Planned Hours */}
        <td className={cn("py-2 px-2 text-center", planHrTextClass)}>
          {t.level === 3 ? "—" : (rolled.plan_hr || "—")}
        </td>

        {/* Actual Hours */}
        <td className={cn("py-2 px-2 text-center", actualHrTextClass)}>
          {rolled.actual_hr || 0}
        </td>

        {/* Blocked Hours */}
        <td className={cn("py-2 px-2 text-center", blockedHrTextClass)}>
          {rolled.blocked_hr || 0}
        </td>

        {/* Resources */}
        <td className={cn("py-2 px-3 truncate max-w-[180px] text-[11px]", resourceTextClass)} title={rolled.resources}>
          {rolled.resources}
        </td>

        {/* Reviewer */}
        <td className={cn("py-2 px-2 text-center", reviewerTextClass)}>
          {t.reviewer || "—"}
        </td>

        {/* Status */}
        <td className="py-2 px-2 text-center">
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border whitespace-nowrap inline-block",
            rolled.status === "NOT STARTED" ? "bg-grey-100 text-grey-500 border-grey-200" :
            rolled.status === "IN PROGRESS" ? "bg-warning-bg text-[#B26900] border-warning-bg" :
            rolled.status === "DONE" ? "bg-success-bg text-success-green border-success-bg" :
            rolled.status === "AT RISK" ? "bg-warning-bg text-[#B26900] border-warning-amber" :
            "bg-danger-bg text-danger-red border-danger-bg"
          )}>
            {rolled.status} {(t.level || 3) < 3 && "▾"}
          </span>
        </td>

        {/* Completion bar */}
        <td className="py-2 px-3 text-center">
          <div className="flex items-center gap-2 justify-center">
            <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full",
                  rolled.status === "DONE" ? "bg-green-600" : (rolled.status === "DELAYED" ? "bg-red-500" : "bg-dc-blue")
                )} 
                style={{ width: `${rolled.percent}%` }}
              />
            </div>
            <span className="font-mono text-[10px] w-6 text-right font-bold">{rolled.percent}%</span>
          </div>
        </td>

        {/* Approval status */}
        <td className="py-2 px-2 text-center">
          {t.approval_status && t.approval_status !== "NOT_REQUIRED" ? (
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[9px] font-bold border",
              t.approval_status === "APPROVED" ? "bg-green-50 text-green-700 border-green-200" :
              (t.approval_status === "REVISION_NEEDED" ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-slate-100 text-slate-600 border-slate-200")
            )}>
              {t.approval_status}
            </span>
          ) : "—"}
        </td>

        {/* Docs Column */}
        <td className="py-2 px-3 text-left min-w-[150px]">
          <div className="flex flex-col gap-1">
            {/* File List */}
            {t.docs && t.docs.length > 0 && (
              <div className="flex flex-col gap-1 max-w-[140px]">
                {t.docs.map((doc, idx) => (
                  <div key={idx} className={cn("flex items-center justify-between gap-1 text-[10px] rounded px-1.5 py-0.5 group", docBubbleClass)}>
                    <a 
                      href={doc.url} 
                      download={doc.name}
                      className={cn("truncate", docLinkClass)}
                      title={`${doc.name} (${doc.size || 'unknown'})`}
                    >
                      {doc.name}
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updatedDocs = t.docs?.filter((_, i) => i !== idx) || [];
                        updateTask(t.wbs, { docs: updatedDocs });
                      }}
                      className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0"
                      title="Remove document"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Attach File Button */}
            <label className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer w-fit", uploadBtnClass)}>
              <UploadCloud className="w-2.5 h-2.5 text-current" />
              <span>Add File</span>
              <input 
                type="file" 
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("wbs", t.wbs);
                    formData.append("uploaded_by", user?.name || "User");

                    try {
                      const uploadRes = await fetch("/api-proxy/attachments/upload", {
                        method: "POST",
                        body: formData
                      });
                      
                      if (!uploadRes.ok) {
                        const errData = await uploadRes.json();
                        alert(errData.error || "File upload rejected by security scan.");
                        return;
                      }

                      const uploadedFile = await uploadRes.json();
                      const formattedSize = file.size > 1024 * 1024 
                        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                        : `${(file.size / 1024).toFixed(0)} KB`;
                      
                      const newDoc = {
                        name: file.name,
                        url: `/api-proxy/attachments/download/${uploadedFile.id}`,
                        size: formattedSize
                      };
                      
                      const updatedDocs = [...(t.docs || []), newDoc];
                      await updateTask(t.wbs, { docs: updatedDocs });
                      alert(`✓ File "${file.name}" attached successfully!`);
                      refetch();
                    } catch (err: any) {
                      console.error("Upload error:", err);
                      alert("Network error: Failed to reach the upload server.");
                    }
                  }
                }}
              />
            </label>
          </div>
        </td>

        {/* Actions */}
        <td className="py-2 px-3 text-center">
          {isEditor && (
            <div className="flex items-center gap-1.5 justify-center">
              <button 
                onClick={() => openEditModal(t)}
                className="flex items-center gap-0.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold transition-all"
              >
                <Edit2 className="w-2.5 h-2.5" />
                <span>Edit</span>
              </button>
              <button 
                onClick={async () => {
                  if (confirm(`Delete WBS task ${t.wbs}?`)) {
                    await deleteTask(t.wbs);
                    refetch();
                  }
                }}
                className="p-1 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-600 rounded transition-all"
                title="Delete Task"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
          {!isEditor && <span className="text-slate-300 font-light">—</span>}
        </td>

      </tr>
    );
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
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading WBS Grid...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container font-sans text-xs">
      
      {/* Sub-Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs mb-4">
        
        {/* Search Input */}
        <div className="relative min-w-[200px] flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Filter by name / WBS / owner..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:border-dc-blue text-xs transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          
          <select 
            value={filterPhase} 
            onChange={(e) => setFilterPhase(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-dc-blue"
          >
            <option value="">All phases</option>
            {phases.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select 
            value={filterPart} 
            onChange={(e) => setFilterPart(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-dc-blue"
          >
            <option value="">All parts</option>
            {parts.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select 
            value={filterDisc} 
            onChange={(e) => setFilterDisc(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-dc-blue"
          >
            <option value="">All disciplines</option>
            {disciplines.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-dc-blue"
          >
            <option value="">All status</option>
            <option value="NOT STARTED">Not Started</option>
            <option value="IN PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
            <option value="AT RISK">At Risk</option>
            <option value="DELAYED">Delayed</option>
          </select>

          {/* Group By selector */}
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <span className="text-slate-400">Group:</span>
            <select 
              value={groupBy} 
              onChange={(e: any) => setGroupBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-dc-blue"
            >
              <option value="hierarchy">Hierarchy</option>
              <option value="phase">Phase</option>
              <option value="part">Part</option>
              <option value="discipline">Discipline</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* Actions Button Bar */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          {groupBy === "hierarchy" && (
            <div className="flex items-center gap-1 mr-2">
              <button 
                onClick={collapseAll}
                className="p-1.5 hover:bg-slate-100 rounded border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
                title="Collapse All"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-90" />
              </button>
              <button 
                onClick={expandAll}
                className="p-1.5 hover:bg-slate-100 rounded border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
                title="Expand All"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <span className="text-slate-400 font-medium mr-2 font-mono">
            {groupBy === "hierarchy" ? `${sortedTasks.length} of ${rawTasks.length} tasks` : `${rawTasks.filter(t => t.level === 3).length} leaf tasks`}
          </span>

          {isEditor && (
            <button 
              onClick={openAddModal}
              className="flex items-center gap-1 bg-dc-blue hover:bg-dc-deep text-white font-bold px-3 py-1.5 rounded transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          )}

          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          {isEditor && (
            <button 
              onClick={handleImportWbs}
              className="flex items-center gap-1 bg-slate-900 hover:bg-black text-white font-bold px-3 py-1.5 rounded transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import WBS</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid View */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto shadow-xs">
        <table className="w-full border-collapse text-left min-w-[1200px]">
          <thead>
            <tr className="bg-navy text-gold text-[10px] uppercase font-bold tracking-wider border-b border-slate-800">
              <th className="py-3 px-4 w-[100px]">WBS</th>
              <th className="py-3 px-3 min-w-[220px]">Task</th>
              <th className="py-3 px-2 text-center w-[80px]">Phase</th>
              <th className="py-3 px-2 text-center w-[70px]">Part</th>
              <th className="py-3 px-2 text-center w-[70px]">Disc</th>
              <th className="py-3 px-2 text-center w-[70px]">Wks</th>
              <th className="py-3 px-2 text-center w-[70px]">Plan Hr</th>
              <th className="py-3 px-2 text-center w-[70px]">Actual Hr</th>
              <th className="py-3 px-2 text-center w-[85px] text-red-500 font-bold">Blocked Hr</th>
              <th className="py-3 px-3 min-w-[160px]">Owner</th>
              <th className="py-3 px-2 text-center w-[90px]">Reviewer</th>
              <th className="py-3 px-2 text-center w-[100px]">Status</th>
              <th className="py-3 px-3 w-[100px] text-center">%</th>
              <th className="py-3 px-2 text-center w-[100px]">Approval</th>
              <th className="py-3 px-3 text-left w-[150px]">Docs</th>
              <th className="py-3 px-3 text-center w-[120px]">Actions</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            
            {groupBy === "hierarchy" ? (
              sortedTasks.map((t) => renderTaskRow(t, false))
            ) : (
              groupedCategories?.map(([groupName, items]) => {
                const totalHr = items.reduce((s, c) => s + (c.plan_hr || c.effort_hr || 0), 0);
                const totalActual = items.reduce((s, c) => s + (c.actual_hr || 0), 0);
                const totalBlocked = items.reduce((s, c) => s + (c.blocked_hr || 0), 0);
                const avgPercent = items.reduce((s, c) => s + (c.percent_complete || 0), 0) / items.length;
                const totalCost = items.reduce((sum, d) => sum + getCost(d, d.plan_hr || d.effort_hr || 0), 0);

                return (
                  <React.Fragment key={groupName}>
                    {/* Category Header Row */}
                    <tr className="bg-navy/5 border-y border-slate-200 h-9 text-navy font-bold text-xs select-none">
                      <td colSpan={16} className="py-2.5 px-4">
                        <span className="text-gold font-black mr-2">▶</span>
                        <span className="uppercase text-[10px] tracking-wider text-slate-500 font-extrabold mr-1">
                          {groupBy.toUpperCase()}:
                        </span>
                        <span className="text-navy text-sm font-black mr-4">{groupName}</span>
                        <span className="text-[10px] text-slate-500 font-medium font-mono">
                          · {items.length} tasks 
                          · {totalHr} hr plan 
                          · {totalActual} hr actual
                          · <span className="text-red-500 font-bold">{totalBlocked} hr blocked</span>
                          · {Math.round(avgPercent)}% avg completion
                        </span>
                      </td>
                    </tr>
                    
                    {/* Category Child Rows */}
                    {items.map((t) => renderTaskRow(t, true))}
                  </React.Fragment>
                );
              })
            )}

            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={16} className="py-12 text-slate-400 text-center font-medium italic bg-slate-50/50">
                  No tasks matched the filter criteria. Clear some parameters or select another programme.
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>

      {/* Task Creation & Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150 text-slate-700">
            
            {/* Modal Header */}
            <div className="bg-navy text-gold p-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-sm tracking-wide">
                {editingTask ? `Modify Task WBS: ${editingTask.wbs}` : "Add New WBS Task Element"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                
                {/* WBS Code */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    WBS Code *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. MY_22-1.2.3"
                    value={formWbs}
                    onChange={(e) => setFormWbs(e.target.value)}
                    required
                    disabled={!!editingTask}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue disabled:opacity-50"
                  />
                </div>

                {/* Phase */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    PhaseSwimlane
                  </label>
                  <select 
                    value={formPhase}
                    onChange={(e) => setFormPhase(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue"
                  >
                    <option value="G0">Gate 0 (G0)</option>
                    <option value="G1">Gate 1 (G1)</option>
                    <option value="G2">Gate 2 (G2)</option>
                    <option value="G3">Gate 3 (G3)</option>
                    <option value="G4">Gate 4 (G4)</option>
                    <option value="G5">Gate 5 (G5)</option>
                    <option value="G6">Gate 6 (G6)</option>
                    <option value="PROD">SOP Series Production</option>
                    <option value="BAU">BAU (Regular Activity)</option>
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
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue"
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
                    className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue"
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
                    className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue"
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
                    className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue font-mono"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue font-mono"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue font-mono"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue font-mono"
                  />
                </div>

              </div>

              <div className="grid grid-cols-3 gap-4">
                
                {/* Blocked Hours */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-red-500">
                    Blocked Hours
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    value={formBlockedHr}
                    onChange={(e) => setFormBlockedHr(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue font-mono"
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
                    className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue font-mono"
                  />
                </div>

              </div>

              {/* Resources Checklist */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Owner Assigned
                </label>
                <div className="grid grid-cols-3 gap-2 border border-slate-200 rounded p-3 max-h-32 overflow-y-auto">
                  {people.map(p => {
                    const isChecked = formResources.includes(p.name);
                    return (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer text-[11px] hover:text-slate-900">
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
                          className="rounded border-slate-300 text-dc-blue focus:ring-dc-blue"
                        />
                        <span className="truncate">{p.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex items-center gap-1.5 bg-dc-blue hover:bg-dc-deep text-white font-bold px-4 py-2 rounded transition-all shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTask ? "Update WBS Row" : "Insert Task Node"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* WBS Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 animate-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-dc-blue" />
                <h3 className="font-black text-navy text-sm uppercase tracking-wider">Import WBS Spreadsheet</h3>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Indication Header */}
            <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4 text-xs font-bold text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
                  importStep === 1 ? "bg-dc-blue text-white" : "bg-green-100 text-green-700"
                )}>
                  {importStep > 1 ? "✓" : "1"}
                </span>
                <span>Upload File</span>
              </div>
              <div className="w-8 h-px bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
                  importStep === 2 ? "bg-dc-blue text-white" : importStep > 2 ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"
                )}>
                  {importStep > 2 ? "✓" : "2"}
                </span>
                <span>Map & Preview</span>
              </div>
              <div className="w-8 h-px bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
                  importStep === 3 ? "bg-dc-blue text-white" : "bg-slate-200 text-slate-500"
                )}>
                  3
                </span>
                <span>Done</span>
              </div>
            </div>

            {/* Content Pane */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              
              {/* STEP 1: UPLOAD */}
              {importStep === 1 && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 hover:border-dc-blue rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-3 group relative cursor-pointer">
                    <input 
                      type="file" 
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-50 text-slate-400 group-hover:text-dc-blue flex items-center justify-center transition-colors">
                      <UploadCloud className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-navy">Drag & Drop WBS spreadsheet or click to browse</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">Supports Microsoft Excel (.xlsx, .xls) and standard text formats (.csv)</p>
                    </div>
                  </div>

                  {isUploading && (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-bold text-slate-500">Analyzing schema & validating rows...</p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: PREVIEW & MAP */}
              {importStep === 2 && importPreview && (
                <div className="space-y-5">
                  
                  {/* File Stats Summary */}
                  <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 block uppercase">Parsed File</span>
                      <span className="font-bold text-navy truncate block">{importFile?.name}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 block uppercase">Total Rows</span>
                      <span className="font-bold text-navy block">{importPreview.total_rows} rows</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 block uppercase">Parseable WBS Nodes</span>
                      <span className="font-bold text-emerald-600 block">{importPreview.parsed_rows} complete</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 block uppercase">Skipped Rows</span>
                      <span className="font-bold text-slate-500 block">{importPreview.skipped} skipped</span>
                    </div>
                  </div>

                  {/* Mode Config */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                      <h4 className="text-[10px] font-black text-navy uppercase tracking-wider border-b pb-1.5">Import Execution Mode</h4>
                      
                      <div className="space-y-2">
                        <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                          <input 
                            type="radio" 
                            name="importMode" 
                            checked={importMode === "update"}
                            onChange={() => setImportMode("update")}
                            className="mt-0.5 accent-dc-blue"
                          />
                          <div>
                            <span className="font-bold text-navy block">Update & Merge Timeline</span>
                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-normal">
                              Matches by WBS code. Updates status, notes, and actuals. Non-conflicting items are appended.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 cursor-pointer text-xs mt-3">
                          <input 
                            type="radio" 
                            name="importMode" 
                            checked={importMode === "replace"}
                            onChange={() => setImportMode("replace")}
                            className="mt-0.5 accent-red-500"
                          />
                          <div>
                            <span className="font-bold text-red-600 block">Replace Entire WBS</span>
                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-normal">
                              Deletes ALL current tasks and milestones for this project first and uploads a clean slate.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-black text-navy uppercase tracking-wider border-b pb-1.5">Duplicate Strategy</h4>
                        
                        <label className="flex items-center gap-2 cursor-pointer text-xs py-1.5 mt-2">
                          <input 
                            type="checkbox"
                            checked={replaceDuplicates}
                            onChange={(e) => setReplaceDuplicates(e.target.checked)}
                            className="rounded border-slate-300 text-dc-blue focus:ring-dc-blue font-bold"
                            disabled={importMode === "replace"}
                          />
                          <div>
                            <span className="font-bold text-navy">Overwrite Duplicate WBS Nodes</span>
                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-normal">
                              If unchecked, existing nodes will be skipped during WBS parsing.
                            </span>
                          </div>
                        </label>
                      </div>

                      {importPreview.duplicate_wbs && importPreview.duplicate_wbs.length > 0 && (
                        <div className="mt-2 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 p-2 rounded">
                          Found {importPreview.duplicate_wbs.length} duplicate codes (e.g. {importPreview.duplicate_wbs.slice(0, 5).join(", ")})
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warning Alerts */}
                  {importPreview.warnings && importPreview.warnings.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-black text-red-700 uppercase tracking-wider">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Parsing Warnings ({importPreview.warnings.length})</span>
                      </div>
                      <div className="max-h-24 overflow-y-auto divide-y divide-red-100/50 text-[10px] font-semibold text-red-600">
                        {importPreview.warnings.map((w: any, idx: number) => (
                          <div key={idx} className="py-1">
                            <span className="font-bold mr-1.5">Row {w.row}:</span> {w.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-black text-navy uppercase tracking-wider">Timeline Grid Preview (Top 200 Rows)</h4>
                    <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-56 shadow-inner">
                      <table className="w-full border-collapse text-[10px] text-left">
                        <thead>
                          <tr className="bg-navy text-gold font-bold sticky top-0 uppercase tracking-wider border-b border-slate-800">
                            <th className="py-2 px-3">WBS</th>
                            <th className="py-2 px-2">Level</th>
                            <th className="py-2 px-3">Task Name</th>
                            <th className="py-2 px-2 text-center">Phase</th>
                            <th className="py-2 px-2 text-center">Disc</th>
                            <th className="py-2 px-2 text-center">Wks</th>
                            <th className="py-2 px-2 text-right">Plan Hr</th>
                            <th className="py-2 px-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {importPreview.preview_data.map((r: any, idx: number) => {
                            return (
                              <tr key={idx} className={cn(
                                "hover:bg-slate-50/50",
                                r.level === 1 && "bg-slate-50 font-bold",
                                r.level === 2 && "font-semibold"
                              )}>
                                <td className="py-1.5 px-3 font-mono font-bold text-slate-500">{r.wbs_raw}</td>
                                <td className="py-1.5 px-2 text-slate-400">{r.level}</td>
                                <td className="py-1.5 px-3 truncate max-w-[200px]" style={{ paddingLeft: `${r.level * 8}px` }}>
                                  {r.name}
                                </td>
                                <td className="py-1.5 px-2 text-center text-slate-500">{r.phase || "—"}</td>
                                <td className="py-1.5 px-2 text-center text-slate-500">{r.discipline || "—"}</td>
                                <td className="py-1.5 px-2 text-center text-slate-500">
                                  {r.finish_wk - r.start_wk + 1}
                                </td>
                                <td className="py-1.5 px-2 text-right text-slate-600 font-mono">{r.effort_hr}</td>
                                <td className="py-1.5 px-2">
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                                    r.status === "DONE" && "bg-green-100 text-green-700",
                                    r.status === "IN PROGRESS" && "bg-blue-100 text-blue-700",
                                    r.status === "NOT STARTED" && "bg-slate-100 text-slate-500"
                                  )}>
                                    {r.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: SUCCESS RESULT */}
              {importStep === 3 && (
                <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-3xl shadow-inner animate-bounce">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-base font-black text-navy uppercase tracking-wider">Import Completed Successfully</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      Your project WBS sheet has been fully committed to the central database. WBS node summaries are rolled up automatically.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 rounded-lg p-5 max-w-md w-full grid grid-cols-2 gap-4 text-left text-xs font-bold">
                    <div className="border-r border-slate-200 pr-4 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Imported nodes:</span>
                        <span className="text-emerald-600 font-mono">{(importPreview as any)?.imported_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Overwritten:</span>
                        <span className="text-blue-600 font-mono">{(importPreview as any)?.replaced_count || 0}</span>
                      </div>
                    </div>
                    <div className="pl-4 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Purged/Replaced:</span>
                        <span className="text-red-500 font-mono">{(importPreview as any)?.deleted_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Skipped (duplicate):</span>
                        <span className="text-slate-500 font-mono">{(importPreview as any)?.skipped_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-150 bg-slate-50 flex items-center justify-between gap-3">
              {importStep === 1 && (
                <>
                  <div className="text-[10px] text-slate-400 font-semibold italic">
                    * Make sure first row contains column headers matching alias guidelines.
                  </div>
                  <button 
                    onClick={() => setIsImportModalOpen(false)}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded transition-colors"
                  >
                    Close
                  </button>
                </>
              )}

              {importStep === 2 && (
                <>
                  <button 
                    onClick={() => {
                      setImportStep(1);
                      setImportPreview(null);
                    }}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded transition-colors"
                  >
                    Back to Upload
                  </button>
                  <button 
                    onClick={handleConfirmImport}
                    className="bg-dc-blue hover:bg-dc-deep text-white text-xs font-bold px-5 py-2 rounded shadow-sm flex items-center gap-1.5 transition-all border border-dc-blue"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm & Commit WBS</span>
                  </button>
                </>
              )}

              {importStep === 3 && (
                <div className="flex justify-end w-full">
                  <button 
                    onClick={() => {
                      setIsImportModalOpen(false);
                      refetch();
                    }}
                    className="bg-dc-blue hover:bg-dc-deep text-white text-xs font-bold px-5 py-2 rounded shadow-sm transition-all"
                  >
                    Done — View WBS
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
