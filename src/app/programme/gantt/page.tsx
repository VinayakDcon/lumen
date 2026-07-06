"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useTasksQuery } from "@/hooks/use-pmo-queries";
import { 
  Plus, UploadCloud, ChevronDown, ChevronRight, 
  X, Check, Printer, Camera, Trash2
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Task, TaskStatus } from "@/types/pmo";

const STATUS_COLORS: Record<string, string> = {
  "NOT STARTED": "#9CA3AF",
  "IN PROGRESS": "#1E90E8",
  "DONE": "#2E7D32",
  "AT RISK": "#F9A825",
  "DELAYED": "#C62828"
};

const DISC_COLORS: Record<string, string> = {
  "PM": "#0D1B2E",
  "OPT": "#7B1FA2",
  "MECH": "#1E90E8",
  "ELEC": "#E65100",
  "MFG": "#00838F",
  "T-Q": "#2E7D32",
  "HOM": "#C62828",
  "SOFT": "#374151"
};

const PHASE_COLORS: Record<string, string> = {
  G0: "#7B1FA2",
  G1: "#5E35B1",
  G2: "#0B5BAF",
  G3: "#00838F",
  G4: "#E65100",
  G5: "#2E7D32",
  G6: "#827717",
  PROD: "#1E90E8",
  SPARE: "#9CA3AF"
};

export default function GanttPage() {
  const user = usePmoStore((state) => state.user);
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  
  // Tasks mutations and collapse state from store
  const addTask = usePmoStore((state) => state.addTask);
  const updateTask = usePmoStore((state) => state.updateTask);
  const deleteTask = usePmoStore((state) => state.deleteTask);
  const people = usePmoStore((state) => state.people);
  const ganttCollapsed = usePmoStore((state) => state.ganttCollapsed);
  const toggleGanttCollapse = usePmoStore((state) => state.toggleGanttCollapse);
  const ganttExpandAll = usePmoStore((state) => state.ganttExpandAll);
  const ganttCollapseAll = usePmoStore((state) => state.ganttCollapseAll);
  
  // Queries
  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: rawTasks = [], isLoading: isTasksLoading, refetch } = useTasksQuery(activeProgrammeId);

  // Gantt Toolbar Filter States
  const [levelFilter, setLevelFilter] = useState<"all" | "2" | "3">("2");
  const [phaseFilter, setPhaseFilter] = useState("");
  const [partFilter, setPartFilter] = useState("");
  const [discFilter, setDiscFilter] = useState("");
  const [resFilter, setResFilter] = useState("");
  const [windowMode, setWindowMode] = useState<"auto" | "todaypm12" | "todaypm24" | "g0g2" | "g2g4" | "g4g6" | "full">("auto");
  const [zoom, setZoom] = useState<"1" | "1.5" | "2" | "3" | "4">("2");
  const [colorBy, setColorBy] = useState<"status" | "phase" | "discipline">("status");

  // Quick Add Form States
  const [quickWbs, setQuickWbs] = useState("");
  const [quickName, setQuickName] = useState("");
  const [quickPhase, setQuickPhase] = useState("G0");
  const [quickWks, setQuickWks] = useState<number>(4);

  // Modal Dialog Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
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
  const [formDocs, setFormDocs] = useState<any[]>([]);

  const isEditor = useMemo(() => {
    return user?.role && ["PMO", "ADMIN", "PROJECT_MANAGER", "PM"].includes(user.role);
  }, [user]);

  // Compute Today's Week
  const todayWk = useMemo(() => {
    if (!activeProgramme || !activeProgramme.kickoff_date) return 1;
    const start = new Date(activeProgramme.kickoff_date);
    const today = new Date();
    if (today < start) return 1;
    const wk = Math.floor((today.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    return Math.max(1, Math.min(activeProgramme.programme_weeks || 56, wk));
  }, [activeProgramme]);

  // Unique phases for dropdown
  const phases = useMemo(() => {
    return Array.from(new Set(rawTasks.map((t) => t.phase))).filter(Boolean);
  }, [rawTasks]);

  // Unique parts for dropdown
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

  // Unique resources / competences
  const uniqueResources = useMemo(() => {
    const set = new Set<string>();
    rawTasks.forEach((t) => {
      if (t.resources) {
        t.resources.split(",").map((r) => r.trim()).filter((r) => r !== "—" && r !== "").forEach((r) => set.add(r));
      }
    });
    return Array.from(set).sort();
  }, [rawTasks]);

  const disciplines = ["PM", "Optics", "Mechanical", "Electrical", "Manufacturing", "Test/Quality", "Homologation", "Software"];

  const wbsDescendantPrefix = (wbs: string) => {
    if (wbs.endsWith(".0")) return wbs.slice(0, -1);
    return wbs + ".";
  };

  const isDescendantOf = (childWbs: string, parentWbs: string) => {
    if (childWbs === parentWbs) return false;
    return childWbs.startsWith(wbsDescendantPrefix(parentWbs));
  };

  const displayWbs = (wbs: string) => {
    if (!wbs) return "";
    const prefixed = String(wbs).match(/^[A-Za-z0-9_]+-(\d+(?:\.\d+)*)$/);
    if (prefixed) return prefixed[1];
    const pfx = (activeProgrammeId || "").toLowerCase() + "-";
    if (pfx.length > 1 && String(wbs).toLowerCase().startsWith(pfx)) return String(wbs).substring(pfx.length);
    return wbs;
  };

  // Pre-computes filter matching for Level 3 items
  const matchesL3 = (t: Task) => {
    if (discFilter && !(t.discipline || "").split(",").map((s) => s.trim()).includes(discFilter)) return false;
    if (resFilter) {
      const res = (t.resources || "").split(",").map((s) => s.trim());
      if (!res.includes(resFilter)) return false;
    }
    return true;
  };

  // Check if parent has at least one descendant matching
  const parentHasMatch = (parentWbs: string) => {
    return rawTasks.some((o) => o.level === 3 && isDescendantOf(o.wbs, parentWbs) && matchesL3(o));
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return rawTasks.filter((t) => {
      if (phaseFilter && t.phase !== phaseFilter) return false;
      
      if (partFilter) {
        const partsList = (t.part || "").split(",").map((s) => s.trim());
        if (!partsList.includes("ALL") && !partsList.includes(partFilter)) return false;
      }
      
      if (levelFilter === "3" && t.level !== 3) return false;
      if (levelFilter === "2" && t.level === 1) return false;

      // Filter discipline & resources
      if (t.level === 3) {
        if (!matchesL3(t)) return false;
      } else {
        if (discFilter || resFilter) {
          if (!parentHasMatch(t.wbs)) return false;
        }
      }

      return true;
    });
  }, [rawTasks, levelFilter, phaseFilter, partFilter, discFilter, resFilter]);

  // Sort & Collapse
  const visibleTasks = useMemo(() => {
    let list = [...filteredTasks];
    list.sort((a, b) => (a.wbs_sort || a.wbs).localeCompare(b.wbs_sort || b.wbs, undefined, { numeric: true }));

    // Filter out descendants of collapsed parents
    list = list.filter((t) => {
      for (const p of ganttCollapsed) {
        if (t.wbs !== p && isDescendantOf(t.wbs, p)) return false;
      }
      return true;
    });

    return list;
  }, [filteredTasks, ganttCollapsed]);

  // Compute Timeline Start & End Weeks
  const { winStart, winEnd } = useMemo(() => {
    const maxWeeks = activeProgramme?.programme_weeks || 56;
    
    if (windowMode === "todaypm12") {
      return {
        winStart: Math.max(1, todayWk - 12),
        winEnd: Math.min(maxWeeks, todayWk + 12)
      };
    }
    
    if (windowMode === "todaypm24") {
      return {
        winStart: Math.max(1, todayWk - 24),
        winEnd: Math.min(maxWeeks, todayWk + 24)
      };
    }
    
    if (windowMode === "g0g2") {
      return { winStart: 1, winEnd: Math.min(maxWeeks, 20) };
    }
    
    if (windowMode === "g2g4") {
      return { winStart: Math.max(1, 9), winEnd: Math.min(maxWeeks, 40) };
    }
    
    if (windowMode === "g4g6") {
      return { winStart: Math.max(1, 25), winEnd: Math.min(maxWeeks, 56) };
    }
    
    if (windowMode === "full") {
      return { winStart: 1, winEnd: maxWeeks };
    }

    // Default 'auto': auto fit visible tasks
    if (visibleTasks.length === 0) {
      return { winStart: 1, winEnd: 24 };
    }
    
    const starts = visibleTasks.map((t) => t.start_wk).filter((wk): wk is number => typeof wk === "number");
    const finishes = visibleTasks.map((t) => t.finish_wk).filter((wk): wk is number => typeof wk === "number");
    const calculatedStart = starts.length > 0 ? Math.min(...starts) : 1;
    const calculatedEnd = finishes.length > 0 ? Math.max(...finishes) : 24;

    return {
      winStart: Math.max(1, calculatedStart),
      winEnd: Math.max(calculatedStart + 4, Math.min(maxWeeks, calculatedEnd))
    };
  }, [windowMode, visibleTasks, todayWk, activeProgramme]);

  const weeksCount = winEnd - winStart + 1;
  
  const zoomWkWidths = {
    "1": 18,
    "1.5": 27,
    "2": 36,
    "3": 54,
    "4": 72
  };
  const wkWidth = zoomWkWidths[zoom] || 36;
  const labelW = 320;
  const timelineW = weeksCount * wkWidth;

  const weeks = useMemo(() => {
    const arr = [];
    for (let w = winStart; w <= winEnd; w++) arr.push(w);
    return arr;
  }, [winStart, winEnd]);

  // Phase swimlanes mapping from visible tasks
  const phaseMap = useMemo(() => {
    const map: Record<string, { start: number; end: number }> = {};
    visibleTasks.forEach((t) => {
      if (!t.phase || t.phase === "—") return;
      if (!map[t.phase]) {
        map[t.phase] = { start: t.start_wk || 1, end: t.finish_wk || 1 };
      } else {
        map[t.phase].start = Math.min(map[t.phase].start, t.start_wk || 1);
        map[t.phase].end = Math.max(map[t.phase].end, t.finish_wk || 1);
      }
    });
    return map;
  }, [visibleTasks]);

  const colorOf = (t: Task) => {
    if (colorBy === "status") return STATUS_COLORS[t.status] || "#9CA3AF";
    if (colorBy === "discipline") return DISC_COLORS[t.discipline] || "#9CA3AF";
    return PHASE_COLORS[t.phase] || "#1E90E8";
  };

  // Inline Quick Add Handler
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickWbs || !quickName) return;

    const dots = (quickWbs.match(/\./g) || []).length;
    const computedLevel = dots === 0 ? 1 : (dots === 1 ? 2 : 3);

    const taskPayload: Task = {
      wbs: quickWbs,
      programme_id: activeProgrammeId,
      name: quickName,
      phase: quickPhase,
      part: "ALL",
      discipline: "PM",
      weeks: quickWks,
      plan_hr: 20,
      effort_hr: 20,
      actual_hr: 0,
      blocked_hr: 0,
      resources: "—",
      reviewer: "—",
      status: "NOT STARTED",
      percent_complete: 0,
      approval_status: "NOT_REQUIRED",
      level: computedLevel,
      wbs_sort: quickWbs,
      start_wk: 1,
      finish_wk: quickWks,
      docs: []
    };

    addTask(taskPayload);
    setQuickWbs("");
    setQuickName("");
    refetch();
  };

  // Open Edit Task Modal
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

    const dots = (formWbs.match(/\./g) || []).length;
    const computedLevel = dots === 0 ? 1 : (dots === 1 ? 2 : 3);

    const taskPayload: Task = {
      wbs: formWbs,
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
      wbs_sort: formWbs,
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

  // Compile Gantt layout vector blocks in memory as a single combined SVG
  const buildGanttCombinedSvg = () => {
    if (!activeProgramme) return null;
    
    // Layout sizes
    const labelW = 320;
    const rowH = 28;
    const headerH = 44;
    const phaseBarH = 22;
    const zoomVal = parseFloat(zoom);
    const pxPerWk = Math.max(8, Math.round(14 * zoomVal));
    const winSpan = winEnd - winStart;
    const taskW = winSpan * pxPerWk;
    const totalW = labelW + taskW;
    const headerSvgH = headerH + phaseBarH;
    const bodyH = visibleTasks.length * rowH + 24;
    const totalH = headerSvgH + bodyH;
    
    const wkToX = (wk: number) => labelW + ((wk - winStart) / winSpan) * taskW;
    
    const phaseColours: Record<string, string> = {
      G0: "#7B1FA2", G1: "#5E35B1", G2: "#0B5BAF", G3: "#00838F",
      G4: "#E65100", G5: "#2E7D32", G6: "#827717",
      PROD: "#1E90E8", SPARE: "#9CA3AF"
    };

    const colorOfSvg = (t: Task) => {
      if (colorBy === 'status') return STATUS_COLORS[t.status] || '#9CA3AF';
      if (colorBy === 'discipline') return DISC_COLORS[t.discipline] || '#9CA3AF';
      return phaseColours[t.phase] || '#1E90E8';
    };

    const escapeXml = (str: string) => {
      if (!str) return "";
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    // ============= HEADER SVG =============
    let hsvg = `<g>`;
    hsvg += `<rect x="0" y="0" width="${totalW}" height="${headerSvgH}" fill="white"/>`;
    hsvg += `<rect x="0" y="0" width="${totalW}" height="${headerH}" fill="#0D1B2E"/>`;
    hsvg += `<text x="14" y="${headerH / 2 + 4}" font-size="11" font-weight="700" fill="#C9A95A" letter-spacing="1" font-family="'Inter', system-ui, sans-serif">WBS · TASK</text>`;
    
    let tickEvery = 1;
    while (tickEvery * pxPerWk < 50) tickEvery *= 2;
    for (let w = winStart; w <= winEnd; w += tickEvery) {
      const x = wkToX(w);
      hsvg += `<text x="${x}" y="16" font-size="10" fill="#FFFFFF" text-anchor="middle" font-weight="600" font-family="'Inter', system-ui, sans-serif">Wk ${w}</text>`;
      hsvg += `<line x1="${x}" y1="22" x2="${x}" y2="${headerH}" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>`;
    }
    
    // Phase swimlane bar
    const phY = headerH + 2;
    for (const [phCode, bounds] of Object.entries(phaseMap)) {
      const start = bounds.start;
      const end = bounds.end;
      const x1 = wkToX(Math.max(start, winStart));
      const x2 = wkToX(Math.min(end + 1, winEnd));
      if (x2 <= x1) continue;
      hsvg += `<rect x="${x1}" y="${phY}" width="${x2 - x1}" height="${phaseBarH - 4}" fill="${phaseColours[phCode] || '#9CA3AF'}" opacity="0.9" rx="3"/>`;
      if (x2 - x1 > 30) hsvg += `<text x="${(x1 + x2) / 2}" y="${phY + 14}" font-size="11" font-weight="700" fill="white" text-anchor="middle" font-family="'Inter', system-ui, sans-serif">${phCode}</text>`;
    }
    
    // Today marker on header
    if (todayWk >= winStart && todayWk <= winEnd) {
      const x = wkToX(todayWk);
      hsvg += `<line x1="${x}" y1="${headerH}" x2="${x}" y2="${headerSvgH}" stroke="#C62828" stroke-width="2" stroke-dasharray="5,3"/>`;
      hsvg += `<rect x="${x - 36}" y="${phY + 2}" width="72" height="14" fill="#C62828" rx="2"/>`;
      hsvg += `<text x="${x}" y="${phY + 13}" font-size="10" fill="white" font-weight="700" text-anchor="middle" font-family="'Inter', system-ui, sans-serif">▼ Today Wk ${todayWk}</text>`;
    }
    hsvg += `</g>`;

    // ============= BODY SVG =============
    let svg = `<g transform="translate(0, ${headerSvgH})">`;
    svg += `<rect x="0" y="0" width="${totalW}" height="${bodyH}" fill="white"/>`;
    
    // Vertical gridlines through body
    for (let w = winStart; w <= winEnd; w += tickEvery) {
      const x = wkToX(w);
      svg += `<line x1="${x}" y1="0" x2="${x}" y2="${bodyH - 12}" stroke="#E5E7EB" stroke-width="1" stroke-dasharray="2,3"/>`;
    }

    // Task rows
    let y = 4;
    visibleTasks.forEach((t, idx) => {
      const isAlt = idx % 2 === 1;
      if (isAlt) svg += `<rect x="${labelW}" y="${y}" width="${taskW}" height="${rowH}" fill="#F9FAFB"/>`;
      svg += `<line x1="0" y1="${y + rowH}" x2="${totalW}" y2="${y + rowH}" stroke="#E5E7EB" stroke-width="1"/>`;
      
      const labelTxt = `${displayWbs(t.wbs)} · ${t.name}`;
      const tLevel = t.level || 3;
      const indent = (tLevel - 1) * 10;
      const lvlBg = tLevel === 1 ? '#0D1B2E' : (tLevel === 2 ? '#E8F2FC' : 'white');
      const lvlFg = tLevel === 1 ? '#C9A95A' : (tLevel === 2 ? '#0B5BAF' : '#1F2937');
      svg += `<rect x="0" y="${y}" width="${labelW}" height="${rowH}" fill="${lvlBg}"/>`;
      
      const hasChildren = tLevel < 3 && rawTasks.some(o => (o.level || 3) === 3 && isDescendantOf(o.wbs, t.wbs));
      let labelStartX = 10 + indent;
      if (hasChildren) {
        const isCollapsed = ganttCollapsed.includes(t.wbs);
        svg += `<text x="${labelStartX}" y="${y + rowH / 2 + 4}" font-size="13" fill="${lvlFg}" font-weight="700" style="cursor:pointer; user-select:none" font-family="'Inter', system-ui, sans-serif">${isCollapsed ? '▶' : '▼'}</text>`;
        labelStartX += 14;
      }
      
      const maxChars = hasChildren ? 36 : 40;
      const trimmed = labelTxt.length > maxChars ? labelTxt.slice(0, maxChars) + '…' : labelTxt;
      svg += `<text x="${labelStartX}" y="${y + rowH / 2 + 4}" font-size="11" fill="${lvlFg}" font-weight="${tLevel <= 2 ? '700' : '400'}" font-family="'Inter', system-ui, sans-serif">${escapeXml(trimmed)}<title>${escapeXml(labelTxt)}</title></text>`;
      
      if ((t as any).source_meeting_id) {
        svg += `<text x="${labelW - 16}" y="${y + rowH / 2 + 4}" font-size="11">📝<title>From meeting #${(t as any).source_meeting_id}</title></text>`;
      }

      let effStart = t.start_wk || 1;
      let effFinish = t.finish_wk || 1;
      let childAggHr = t.effort_hr || t.plan_hr || 0;
      let childAggPct = t.percent_complete || 0;
      
      if (tLevel < 3) {
        const kids = rawTasks.filter(o => o.level === 3 && isDescendantOf(o.wbs, t.wbs));
        if (kids.length) {
          const startWeeks = kids.map(c => c.start_wk).filter((wk): wk is number => typeof wk === "number");
          const finishWeeks = kids.map(c => c.finish_wk).filter((wk): wk is number => typeof wk === "number");
          effStart = startWeeks.length ? Math.min(...startWeeks) : 1;
          effFinish = finishWeeks.length ? Math.max(...finishWeeks) : 1;
          childAggHr = kids.reduce((sum, c) => sum + (c.effort_hr || c.plan_hr || 0), 0);
          const totEff = childAggHr || 1;
          childAggPct = Math.round(kids.reduce((sum, c) => sum + (c.effort_hr || c.plan_hr || 0) * (c.percent_complete || 0), 0) / totEff);
        }
      }

      const tStart = Math.max(effStart, winStart);
      const tEnd = Math.min(effFinish + 1, winEnd);
      
      if (tEnd > tStart) {
        const x1 = wkToX(tStart);
        const x2 = wkToX(tEnd);
        const barW = Math.max(6, x2 - x1);
        const barColor = colorOfSvg(t);
        
        if (t.level === 3) {
          const pct = t.percent_complete || 0;
          const filledW = (barW * pct) / 100;
          
          svg += `<rect x="${x1}" y="${y + 5}" width="${barW}" height="${rowH - 10}" fill="${barColor}" opacity="0.25" rx="4">
            <title>${escapeXml(t.name)} · Wk ${t.start_wk}-${t.finish_wk} · ${t.effort_hr || 0} hr · ${pct}% · ${t.status}</title>
          </rect>`;
          svg += `<rect x="${x1}" y="${y + 5}" width="${filledW}" height="${rowH - 10}" fill="${barColor}" rx="4"/>`;
          svg += `<rect x="${x1}" y="${y + 5}" width="${barW}" height="${rowH - 10}" fill="none" stroke="${barColor}" stroke-width="1" rx="4"/>`;
          
          if (barW > 70) {
            const inText = `${t.effort_hr || 0}h · ${pct}%`;
            svg += `<text x="${x1 + 6}" y="${y + rowH / 2 + 4}" font-size="10" fill="${pct > 50 ? 'white' : '#0D1B2E'}" font-weight="600" font-family="'Inter', system-ui, sans-serif">${inText}</text>`;
          } else if (barW > 30) {
            svg += `<text x="${x1 + 4}" y="${y + rowH / 2 + 4}" font-size="10" fill="white" font-weight="600" font-family="'Inter', system-ui, sans-serif">${pct}%</text>`;
          }
          
          if (t.resources && x2 + 80 < totalW) {
            const resTxt = (t.resources || '').split(',').map(r => r.trim()).slice(0, 3).join(', ');
            svg += `<text x="${x2 + 6}" y="${y + rowH / 2 + 4}" font-size="10" fill="#6B7280" font-family="'Inter', system-ui, sans-serif">${escapeXml(resTxt)}</text>`;
          }
        } else {
          const pct = childAggPct;
          const filledW = (barW * pct) / 100;
          
          svg += `<rect x="${x1}" y="${y + 5}" width="${barW}" height="${rowH - 10}" fill="${barColor}" opacity="0.30" rx="3">
            <title>${escapeXml(t.name)} · Wk ${effStart}-${effFinish} · ${childAggHr} hr · ${pct}%</title>
          </rect>`;
          svg += `<rect x="${x1}" y="${y + 5}" width="${filledW}" height="${rowH - 10}" fill="${barColor}" opacity="0.9" rx="3"/>`;
          
          const capH = 4;
          svg += `<polygon points="${x1},${y + rowH - 5 - capH} ${x1},${y + rowH - 5} ${x1 + 5},${y + rowH - 5}" fill="${barColor}" opacity="0.9"/>`;
          svg += `<polygon points="${x2},${y + rowH - 5 - capH} ${x2},${y + rowH - 5} ${x2 - 5},${y + rowH - 5}" fill="${barColor}" opacity="0.9"/>`;
          
          if (barW > 50) {
            svg += `<text x="${x1 + 6}" y="${y + rowH / 2 + 4}" font-size="10" fill="white" font-weight="700" font-family="'Inter', system-ui, sans-serif">${childAggHr}h · ${pct}%</text>`;
          } else if (barW > 24) {
            svg += `<text x="${x1 + 4}" y="${y + rowH / 2 + 4}" font-size="10" fill="white" font-weight="700" font-family="'Inter', system-ui, sans-serif">${t.phase || ''}</text>`;
          }
        }
      }
      y += rowH;
    });

    if (todayWk >= winStart && todayWk <= winEnd) {
      const x = wkToX(todayWk);
      svg += `<line x1="${x}" y1="0" x2="${x}" y2="${y}" stroke="#C62828" stroke-width="2" stroke-dasharray="5,3"/>`;
    }
    
    svg += `</g>`;

    // ============= COMBINED SVG =============
    const combinedXml = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" style="background:white">
      <rect x="0" y="0" width="${totalW}" height="${totalH}" fill="white"/>
      ${hsvg}
      ${svg}
    </svg>`;

    return { xml: combinedXml, w: totalW, h: totalH };
  };

  // Export Gantt layout Canvas + PNG (client-side rasterisation)
  const handleExportPng = () => {
    const c = buildGanttCombinedSvg();
    if (!c) return;
    const img = new Image();
    const blob = new Blob([c.xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2; // High-res export
      canvas.width = c.w * scale;
      canvas.height = c.h * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((b) => {
          if (b) {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(b);
            a.download = `gantt-${activeProgrammeId}-${new Date().toISOString().slice(0, 10)}.png`;
            a.click();
            URL.revokeObjectURL(a.href);
          }
        }, "image/png");
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert("PNG export failed. Please use Print to save as PDF.");
    };
    img.src = url;
  };

  // Landscape Printing
  const handlePrintGantt = () => {
    const c = buildGanttCombinedSvg();
    if (!c) return;
    const win = window.open("", "_blank");
    if (!win) {
      alert("Popup blocked. Please enable popups to print.");
      return;
    }
    // Build legend html string
    let legendHtml = `<span class="legend-title">Legend:</span>`;
    if (colorBy === "status") {
      legendHtml += Object.entries(STATUS_COLORS).map(([s, color]) =>
        `<span class="legend-pill"><span class="legend-swatch" style="background:${color}"></span>${s}</span>`
      ).join("");
    } else if (colorBy === "discipline") {
      legendHtml += Object.entries(DISC_COLORS).map(([s, color]) =>
        `<span class="legend-pill"><span class="legend-swatch" style="background:${color}"></span>${s}</span>`
      ).join("");
    } else {
      legendHtml += Object.entries(PHASE_COLORS).slice(0, 7).map(([s, color]) =>
        `<span class="legend-pill"><span class="legend-swatch" style="background:${color}"></span>${s}</span>`
      ).join("");
    }

    win.document.write(`<!DOCTYPE html><html><head><title>Gantt · ${activeProgramme?.name || activeProgrammeId}</title>
      <style>
        @page { size: A3 landscape; margin: 10mm; }
        body { font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 12px; }
        h1 { font-size: 16px; color: #0D1B2E; margin: 0 0 4px; }
        .meta { font-size: 11px; color: #6B7280; margin-bottom: 12px; }
        svg { width: 100%; height: auto; max-width: 100%; }
        .legend { margin-top: 8px; font-size: 10px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; padding: 10px 14px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; }
        .legend-pill { display:inline-flex; align-items:center; gap: 4px; margin-right:10px; }
        .legend-swatch { width:10px; height:10px; border-radius:2px; display:inline-block; }
      </style></head><body>
      <h1>${activeProgramme?.name || activeProgrammeId} · Gantt</h1>
      <div class="meta">Generated ${new Date().toLocaleString()}</div>
      ${c.xml}
      <div class="legend">${legendHtml}</div>
      <script>window.onload = () => setTimeout(() => window.print(), 300);<\/script>
    </body></html>`);
    win.document.close();
  };

  if (isProgLoading || isTasksLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Gantt Grid...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col p-6 overflow-hidden font-sans text-xs bg-bg-base">
      
      {/* Gantt Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-t-lg border border-slate-200 shadow-sm shrink-0">
        
        {/* Main dropdown selections */}
        <div className="flex items-center gap-2 flex-wrap">
          <select 
            value={levelFilter}
            onChange={(e: any) => setLevelFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-dc-blue"
          >
            <option value="2">L2 + L3 (workstream rollups)</option>
            <option value="all">All levels (overview)</option>
            <option value="3">L3 tasks only (flat)</option>
          </select>

          {/* Expand/Collapse buttons */}
          <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
            <button 
              onClick={ganttCollapseAll}
              className="p-1.5 hover:bg-slate-100 rounded border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              title="Collapse all parent rows"
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-90" />
            </button>
            <button 
              onClick={ganttExpandAll}
              className="p-1.5 hover:bg-slate-100 rounded border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              title="Expand all parent rows"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Core filters */}
          <select 
            value={phaseFilter} 
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-dc-blue"
          >
            <option value="">All phases</option>
            {phases.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select 
            value={partFilter} 
            onChange={(e) => setPartFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-dc-blue"
          >
            <option value="">All parts</option>
            {parts.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select 
            value={discFilter} 
            onChange={(e) => setDiscFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-dc-blue"
          >
            <option value="">All disciplines</option>
            {disciplines.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select 
            value={resFilter} 
            onChange={(e) => setResFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-dc-blue"
          >
            <option value="">All owners</option>
            {uniqueResources.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Timeline controls */}
        <div className="flex items-center gap-2 flex-wrap font-sans">
          <select 
            value={windowMode}
            onChange={(e: any) => setWindowMode(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-dc-blue"
          >
            <option value="auto">Window: auto fit visible</option>
            <option value="todaypm12">Today ±12 wk (zoom)</option>
            <option value="todaypm24">Today ±24 wk</option>
            <option value="g0g2">G0 → G2 (concept→design)</option>
            <option value="g2g4">G2 → G4 (design→PV)</option>
            <option value="g4g6">G4 → G6 (PV→SOP)</option>
            <option value="full">Full programme</option>
          </select>

          <select 
            value={zoom}
            onChange={(e: any) => setZoom(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-dc-blue"
          >
            <option value="1">Zoom 1×</option>
            <option value="1.5">Zoom 1.5×</option>
            <option value="2">Zoom 2×</option>
            <option value="3">Zoom 3×</option>
            <option value="4">Zoom 4×</option>
          </select>

          <select 
            value={colorBy}
            onChange={(e: any) => setColorBy(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-dc-blue"
          >
            <option value="status">Colour: Status</option>
            <option value="phase">Colour: Phase</option>
            <option value="discipline">Colour: Discipline</option>
          </select>

          {/* Action buttons */}
          <button 
            onClick={handleExportPng}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded transition-colors cursor-pointer"
            title="Download Gantt PNG"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>
          <button 
            onClick={handlePrintGantt}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded transition-colors cursor-pointer"
            title="Print Gantt View"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          {isEditor && (
            <button 
              onClick={() => {
                setEditingTask(null);
                setFormWbs("");
                setFormName("");
                setFormPhase("G0");
                setFormPart("ALL");
                setFormDisc("PM");
                setFormStartWk(1);
                setFormFinishWk(4);
                setFormPlanHr(20);
                setFormActualHr(0);
                setFormBlockedHr(0);
                setFormResources([]);
                setFormReviewer("—");
                setFormStatus("NOT STARTED");
                setFormPercent(0);
                setFormApproval("—");
                setFormDocs([]);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-dc-blue hover:bg-dc-deep text-white font-bold px-3.5 py-1.5 rounded transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          )}

          <span className="text-slate-400 font-medium font-mono text-[10px] ml-1 bg-slate-100 px-2 py-1 rounded">
            {visibleTasks.length} of {rawTasks.length} tasks · Wk {winStart}–{winEnd}
          </span>
        </div>

      </div>

      {/* Quick Add Bar */}
      {isEditor && (
        <form 
          onSubmit={handleQuickAdd} 
          className="flex items-center gap-2.5 bg-slate-50 p-2.5 border-x border-b border-slate-200/80 mb-4 rounded-b-lg shadow-sm shrink-0"
        >
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] pl-1 mr-1">Quick Add:</span>
          
          <input 
            type="text" 
            placeholder="WBS Code" 
            value={quickWbs}
            onChange={(e) => setQuickWbs(e.target.value)}
            required
            className="bg-white border border-slate-200 rounded px-2.5 py-1 focus:outline-none focus:border-dc-blue w-28 font-mono text-xs"
          />

          <input 
            type="text" 
            placeholder="Task Name" 
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            required
            className="bg-white border border-slate-200 rounded px-2.5 py-1 focus:outline-none focus:border-dc-blue flex-1 text-xs"
          />

          <select 
            value={quickPhase}
            onChange={(e) => setQuickPhase(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-dc-blue w-32 text-xs"
          >
            <option value="G0">Gate 0 (G0)</option>
            <option value="G1">Gate 1 (G1)</option>
            <option value="G2">Gate 2 (G2)</option>
            <option value="G3">Gate 3 (G3)</option>
            <option value="G4">Gate 4 (G4)</option>
            <option value="G5">Gate 5 (G5)</option>
            <option value="G6">Gate 6 (G6)</option>
          </select>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold">Wks:</span>
            <input 
              type="number" 
              min={1} 
              max={100}
              value={quickWks}
              onChange={(e) => setQuickWks(parseInt(e.target.value) || 1)}
              required
              className="bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-dc-blue w-14 text-center font-mono text-xs"
            />
          </div>

          <button 
            type="submit" 
            className="bg-slate-900 hover:bg-black text-white font-bold px-3 py-1 rounded transition-colors text-xs cursor-pointer"
          >
            + Add to Timeline
          </button>
        </form>
      )}

      {/* Gantt Interactive Board View Card */}
      <div className="flex-1 min-h-0 w-full flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-4">
        {/* horizontal and vertical scroll wrapper */}
        <div className="overflow-auto flex-1 min-h-0 relative scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent" id="gantt-scroll-container">
          <div 
            style={{ minWidth: `${labelW + timelineW}px`, width: "100%" }} 
            className="flex flex-col relative"
          >
            
            {/* Headers row: contains labels header and timeline weeks header */}
            <div className="flex sticky top-0 z-30 bg-navy text-gold text-[10px] uppercase font-bold tracking-wider border-b border-slate-850 h-10 shrink-0">
              
              {/* Frozen left WBS column header */}
              <div 
                style={{ width: `${labelW}px` }} 
                className="py-3 px-4 shrink-0 bg-navy sticky left-0 z-40 border-r border-slate-800 flex items-center select-none"
              >
                WBS · TASK
              </div>
              
              {/* Horizontally scrollable weeks header */}
              <div 
                style={{ minWidth: `${timelineW}px`, width: "100%" }} 
                className="flex-1 relative h-full bg-navy shrink-0"
              >
                {weeks.map((w) => {
                  const pct = ((w - winStart) / weeksCount) * 100;
                  const cellW = 100 / weeksCount;
                  return (
                    <div 
                      key={w} 
                      style={{ left: `${pct}%`, width: `${cellW}%` }} 
                      className="absolute text-center text-[9px] font-semibold text-white/90 border-r border-white/10 h-full flex flex-col justify-center select-none"
                    >
                      <span>Wk {w}</span>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Phase Swimlanes Indicator Row */}
            <div className="flex border-b border-slate-200 bg-slate-50 h-7 items-center shrink-0">
              {/* Sticky left space overlay */}
              <div 
                style={{ width: `${labelW}px` }} 
                className="shrink-0 sticky left-0 z-20 bg-slate-50 border-r border-slate-200 h-full shadow-xs"
              />
              
              {/* Timeline swimlane bars */}
              <div 
                style={{ minWidth: `${timelineW}px`, width: "100%" }} 
                className="flex-1 relative h-full overflow-hidden shrink-0 bg-slate-50"
              >
                {Object.entries(phaseMap).map(([phCode, bounds]: any) => {
                  const tStart = Math.max(bounds.start, winStart);
                  const tEnd = Math.min(bounds.end + 1, winEnd);
                  if (tEnd <= tStart) return null;
                  
                  const leftPct = ((tStart - winStart) / weeksCount) * 100;
                  const widthPct = ((tEnd - tStart) / weeksCount) * 100;
                  
                  return (
                    <div 
                      key={phCode}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      className={cn(
                        "absolute h-5 top-1 rounded text-[10px] font-bold text-white flex items-center justify-center shadow-xs opacity-90 truncate px-1",
                        phCode === "G0" ? "bg-purple-650" :
                        phCode === "G1" ? "bg-indigo-600" :
                        phCode === "G2" ? "bg-blue-600" :
                        phCode === "G3" ? "bg-teal-600" :
                        phCode === "G4" ? "bg-orange-600" :
                        phCode === "G5" ? "bg-green-600" :
                        phCode === "G6" ? "bg-yellow-600 text-navy font-black" :
                        phCode === "PROD" ? "bg-dc-blue" : "bg-slate-400"
                      )}
                    >
                      {phCode}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gantt Rows container */}
            <div className="flex flex-col divide-y divide-slate-100 bg-white">
              {visibleTasks.map((t) => {
                const hasChildren = (t.level || 3) < 3 && rawTasks.some(o => (o.level || 3) === 3 && isDescendantOf(o.wbs, t.wbs));
                const isCollapsed = ganttCollapsed.includes(t.wbs);
                
                // Effective start/finish weeks for parents
                let effStart = t.start_wk || 1;
                let effFinish = t.finish_wk || 1;
                let rolledProgress = t.percent_complete || 0;
                let rolledEffort = t.effort_hr || t.plan_hr || 0;
                
                if (t.level && t.level < 3) {
                  const kids = rawTasks.filter(o => o.level === 3 && isDescendantOf(o.wbs, t.wbs));
                  if (kids.length) {
                    const startWeeks = kids.map(c => c.start_wk).filter((wk): wk is number => typeof wk === "number");
                    const finishWeeks = kids.map(c => c.finish_wk).filter((wk): wk is number => typeof wk === "number");
                    effStart = startWeeks.length ? Math.min(...startWeeks) : 1;
                    effFinish = finishWeeks.length ? Math.max(...finishWeeks) : 1;
                    rolledEffort = kids.reduce((sum, c) => sum + (c.effort_hr || c.plan_hr || 0), 0);
                    const totalEff = rolledEffort || 1;
                    rolledProgress = Math.round(kids.reduce((sum, c) => sum + (c.effort_hr || c.plan_hr || 0) * (c.percent_complete || 0), 0) / totalEff);
                  }
                }
                
                // Style configurations based on level depth
                let rowBgClass = "";
                let labelBgClass = "";
                let labelTextClass = "";
                let nameIndentStyle = { paddingLeft: `${((t.level || 3) - 1) * 12 + (hasChildren ? 4 : 16)}px` };
                
                if (t.level === 1) {
                  rowBgClass = "bg-navy text-gold font-bold";
                  labelBgClass = "bg-navy text-gold font-bold";
                  labelTextClass = "text-gold font-bold";
                } else if (t.level === 2) {
                  rowBgClass = "bg-dc-soft text-navy font-bold";
                  labelBgClass = "bg-dc-soft text-navy font-bold";
                  labelTextClass = "text-navy font-bold";
                } else {
                  const isEven = visibleTasks.indexOf(t) % 2 === 0;
                  rowBgClass = isEven ? "bg-white text-slate-700" : "bg-slate-50/20 text-slate-700";
                  labelBgClass = isEven ? "bg-white group-hover:bg-slate-50" : "bg-slate-50/50 group-hover:bg-slate-50";
                  labelTextClass = "text-slate-700 font-medium";
                }

                return (
                  <div key={t.wbs} className={cn("flex h-9 hover:bg-slate-50 group transition-colors select-none shrink-0", rowBgClass)}>
                    
                    {/* Sticky label column */}
                    <div 
                      style={{ width: `${labelW}px` }} 
                      className={cn(
                        "shrink-0 sticky left-0 z-20 border-r border-slate-200 flex items-center pr-3 h-full shadow-xs truncate",
                        labelBgClass
                      )}
                    >
                      <div className="flex items-center gap-1.5 w-full truncate" style={nameIndentStyle}>
                        {hasChildren && (
                          <button 
                            type="button"
                            onClick={() => toggleGanttCollapse(t.wbs)}
                            className="p-0.5 hover:bg-slate-200/20 rounded text-current shrink-0 cursor-pointer"
                          >
                            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                        <span className={cn("font-mono text-[10px]", labelTextClass)}>{displayWbs(t.wbs)}</span>
                        <span className="truncate text-[11px]" title={t.name}>{t.name}</span>
                      </div>
                    </div>

                    {/* Timeline grid track part */}
                    <div 
                      style={{ minWidth: `${timelineW}px`, width: "100%" }} 
                      className="flex-1 relative h-full flex items-center shrink-0 bg-transparent"
                    >
                      {/* Week vertical dividers */}
                      {weeks.map((w) => {
                        const pct = ((w - winStart) / weeksCount) * 100;
                        const cellW = 100 / weeksCount;
                        return (
                          <div 
                            key={w}
                            style={{ left: `${pct}%`, width: `${cellW}%` }}
                            className="absolute border-r border-slate-100/70 h-full pointer-events-none"
                          />
                        );
                      })}

                      {/* Timeline Bar drawing */}
                      {(() => {
                        const tStart = Math.max(effStart, winStart);
                        const tEnd = Math.min(effFinish + 1, winEnd);
                        if (tEnd <= tStart) return null;
                        
                        const leftPct = ((tStart - winStart) / weeksCount) * 100;
                        const widthPct = ((tEnd - tStart) / weeksCount) * 100;
                        
                        const barColor = colorOf(t);
                        
                        if (t.level === 3) {
                          const pct = t.percent_complete || 0;
                          
                          return (
                            <>
                              <div 
                                style={{ 
                                  left: `${leftPct}%`, 
                                  width: `${widthPct}%`,
                                  backgroundColor: `${barColor}1F`, 
                                  borderColor: barColor,
                                  borderStyle: "solid",
                                  borderWidth: "1px"
                                }}
                                onClick={() => openEditModal(t)}
                                className="absolute h-5.5 rounded-md cursor-pointer hover:shadow-md transition-all flex items-center overflow-hidden z-10"
                                title={`${t.name} · Wk ${t.start_wk}-${t.finish_wk} · ${t.effort_hr || 0} hr · ${pct}% · ${t.status}`}
                              >
                                {/* Filled percent complete progress */}
                                <div 
                                  style={{ 
                                    width: `${pct}%`,
                                    backgroundColor: barColor
                                  }}
                                  className="h-full rounded-r-xs opacity-90 absolute left-0 top-0 pointer-events-none"
                                />
                                
                                {/* Bar progress number */}
                                <span 
                                  className="absolute left-2 text-[9px] font-bold z-10 pointer-events-none truncate max-w-[92%]"
                                  style={{ color: pct > 50 ? "#FFFFFF" : "#0F172A" }}
                                >
                                  {pct}%
                                </span>
                              </div>

                              {/* Owner initials trailing the bar */}
                              {t.resources && t.resources !== "—" && (
                                <span 
                                  style={{ left: `calc(${leftPct}% + ${widthPct}% + 6px)` }}
                                  className="absolute text-[9px] text-slate-400 font-bold font-sans truncate max-w-[120px] pointer-events-none select-none z-10"
                                  title={t.resources}
                                >
                                  {t.resources.split(",").map(r => r.trim()).slice(0, 2).map(r => r.split(" ").map(n => n[0]).join("")).join("/")}
                                </span>
                              )}
                            </>
                          );
                        } else {
                          const pct = rolledProgress;
                          
                          return (
                            <div 
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                              onClick={() => openEditModal(t)}
                              className="absolute h-6 flex items-center cursor-pointer z-10"
                              title={`${t.name} · Wk ${effStart}-${effFinish} · ${rolledEffort} hr · ${pct}%`}
                            >
                              {/* Summary bar body backdrop */}
                              <div 
                                style={{ backgroundColor: `${barColor}30` }}
                                className="absolute h-2.5 w-full top-1.5 opacity-80 pointer-events-none rounded-sm border border-slate-300/10"
                              />
                              {/* Filled summary progress */}
                              <div 
                                style={{ 
                                  width: `${pct}%`,
                                  backgroundColor: barColor
                                }}
                                className="absolute h-2.5 top-1.5 opacity-95 pointer-events-none rounded-sm"
                              />
                              {/* Tapered summary ends */}
                              <div 
                                style={{ borderTopColor: barColor }} 
                                className="absolute left-0 bottom-0.5 w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[4px] pointer-events-none"
                              />
                              <div 
                                style={{ borderTopColor: barColor }} 
                                className="absolute right-0 bottom-0.5 w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[4px] pointer-events-none"
                              />
                              
                              {/* Summary Rolled Hours indicator inside or trailing */}
                              {widthPct > 8 && (
                                <span className="absolute left-2.5 text-[9px] font-black z-10 text-white pointer-events-none drop-shadow-sm">
                                  {rolledEffort}h · {pct}%
                                </span>
                              )}
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Today vertical line */}
            {todayWk >= winStart && todayWk <= winEnd && (
              <div 
                style={{ 
                  left: `calc(${labelW}px + ${((todayWk - winStart) / weeksCount) * 100}%)`,
                  height: "100%"
                }}
                className="absolute border-l border-red-650 border-dashed top-10 pointer-events-none z-10"
              />
            )}

          </div>
        </div>

        {/* Gantt Legend styling block (sticky footer inside card) */}
        <div className="shrink-0 bg-slate-50 border-t border-slate-200 p-3 flex items-center gap-4 flex-wrap text-[11px] font-medium text-slate-600">
          <span className="font-bold text-navy uppercase text-[10px] tracking-wider">
            Legend ({colorBy.toUpperCase()}):
          </span>
          
          {colorBy === "status" && Object.entries(STATUS_COLORS).map(([s, c]) => (
            <span key={s} className="flex items-center gap-1.5">
              <span style={{ backgroundColor: c }} className="w-3 h-3 rounded shadow-xs" />
              <span>{s}</span>
            </span>
          ))}

          {colorBy === "discipline" && Object.entries(DISC_COLORS).map(([s, c]) => (
            <span key={s} className="flex items-center gap-1.5">
              <span style={{ backgroundColor: c }} className="w-3 h-3 rounded shadow-xs" />
              <span>{s}</span>
            </span>
          ))}

          {colorBy === "phase" && Object.entries(PHASE_COLORS).slice(0, 7).map(([s, c]) => (
            <span key={s} className="flex items-center gap-1.5">
              <span style={{ backgroundColor: c }} className="w-3 h-3 rounded shadow-xs" />
              <span>{s}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Task Creation & Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150 text-slate-700 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-navy text-gold p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <h3 className="font-bold text-sm tracking-wide">
                {editingTask ? `Modify Gantt Task WBS: ${displayWbs(editingTask.wbs)}` : "Add New WBS Task Element"}
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
                    className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue text-xs"
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
                    className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue text-xs"
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
                    className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue text-xs"
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
                    className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue text-xs"
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
                    className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-dc-blue text-xs"
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

              {/* Resources / Owner Checklist */}
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
                          className="rounded border-slate-350 text-dc-blue focus:ring-dc-blue"
                        />
                        <span className="truncate">{p.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Scope Attachments / Documents */}
              <div className="border-t border-slate-100 pt-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Scope Attachments / Documents
                </label>
                
                {/* File list */}
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
                
                {/* Upload Action Button */}
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer w-fit shadow-2xs">
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
                {editingTask && (
                  <button 
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete WBS task ${displayWbs(editingTask.wbs)}?`)) {
                        deleteTask(editingTask.wbs);
                        setIsModalOpen(false);
                        refetch();
                      }
                    }}
                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-650 font-bold px-4 py-2 rounded border border-red-200 transition-colors mr-auto cursor-pointer text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
                <button 
                  type="submit"
                  className="flex items-center gap-1.5 bg-dc-blue hover:bg-dc-deep text-white font-bold px-4 py-2 rounded transition-all shadow-xs cursor-pointer text-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTask ? "Update WBS Row" : "Insert Task Node"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
