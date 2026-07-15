/* eslint-disable */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePmoStore } from "@/store/use-pmo-store";
import { useProgrammesQuery, useTimeEntriesQuery, useTasksQuery } from "@/hooks/use-pmo-queries";
import {
  Clock, Trash2, ChevronLeft, ChevronRight, CheckSquare,
  AlertTriangle, AlertCircle, CalendarDays, X, BriefcaseMedical,
  Pencil
} from "lucide-react";
import { cn } from "@/utils/cn";
import { TimeEntry } from "@/types/pmo";

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${d.getDate()} ${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
  };
  return `Week of ${fmt(monday)} – ${fmt(sunday)}`;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const DAY_LABELS = ["Mo","Tu","We","Th","Fr","Sa","Su"];

/** Build a 7-col calendar grid for a given year/month. */
function buildCalGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// ─── Mini Calendar Component ──────────────────────────────────────────────────

interface MiniCalendarProps {
  viewMonth: Date;
  onViewMonthChange: (d: Date) => void;
  onDateClick: (d: Date) => void;
  /** In 'week' mode: highlight the full week containing this Monday. */
  selectedWeekMonday?: Date;
  /** In 'leave' mode: these dates are highlighted as leave days. */
  leaveDays?: Set<string>;
  wfhDays?: Set<string>;
  halfDays?: Map<string, "first" | "second">;
  mode: "week" | "leave" | "wfh" | "half";
  todayStr: string;
}

function MiniCalendar({
  viewMonth, onViewMonthChange, onDateClick,
  selectedWeekMonday, leaveDays, wfhDays, halfDays, mode, todayStr
}: MiniCalendarProps) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const weeks = buildCalGrid(year, month);

  const selStart = selectedWeekMonday ? toYMD(selectedWeekMonday) : "";
  const selEnd   = selectedWeekMonday
    ? toYMD(new Date(selectedWeekMonday.getTime() + 6 * 86_400_000))
    : "";

  const prev = () => {
    const d = new Date(viewMonth); d.setMonth(d.getMonth() - 1); onViewMonthChange(d);
  };
  const next = () => {
    const d = new Date(viewMonth); d.setMonth(d.getMonth() + 1); onViewMonthChange(d);
  };

  return (
    <div className="p-3 select-none" style={{ width: 260 }}>
      {/* Month navigator */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prev}
          className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-black text-navy">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={next}
          className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(l => (
          <div key={l} className="text-center text-[9px] font-black text-slate-400 uppercase py-0.5">
            {l}
          </div>
        ))}
      </div>

      {/* Date grid */}
      {weeks.map((week, wi) => {
        const weekInSelectedRange =
          mode === "week" &&
          selStart &&
          week.some(d => d && toYMD(d) >= selStart && toYMD(d) <= selEnd);

        return (
          <div
            key={wi}
            className={cn(
              "grid grid-cols-7 rounded",
              weekInSelectedRange ? "bg-blue-50" : ""
            )}
          >
            {week.map((d, di) => {
              if (!d) return <div key={di} className="h-8" />;

              const dStr    = toYMD(d);
              const isToday = dStr === todayStr;
              const isLeave = leaveDays?.has(dStr) ?? false;
              const isWfh   = wfhDays?.has(dStr) ?? false;
              const isHalf  = halfDays?.has(dStr) ?? false;
              const inWeek  = mode === "week" && selStart && dStr >= selStart && dStr <= selEnd;
              const isWkEnd = d.getDay() === 0 || d.getDay() === 6;

              return (
                <button
                  key={di}
                  onClick={() => onDateClick(d)}
                  title={dStr}
                  className={cn(
                    "flex items-center justify-center text-[11px] font-semibold h-8 w-full rounded transition-all",
                    isLeave
                      ? "bg-orange-200 text-orange-700 font-black hover:bg-orange-300"
                      : isWfh
                      ? "bg-blue-100 text-blue-700 font-black hover:bg-blue-200"
                      : isHalf
                      ? "bg-amber-100 text-amber-700 font-black hover:bg-amber-200"
                      : isToday
                      ? "bg-slate-300 text-slate-800 font-black hover:bg-slate-400"
                      : inWeek
                      ? "text-dc-blue font-black hover:bg-blue-100"
                      : isWkEnd
                      ? "text-slate-300 hover:bg-slate-50"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MyTimesheetPage() {
  const queryClient   = useQueryClient();
  const user          = usePmoStore(s => s.user);
  const { data: programmes = [] } = useProgrammesQuery();
  useTimeEntriesQuery();
  const tasks         = usePmoStore(s => s.tasks);
  const timeEntries   = usePmoStore(s => s.timeEntries);
  const submissions   = usePmoStore(s => s.timesheetSubmissions);
  const addTimeEntry  = usePmoStore(s => s.addTimeEntry);
  const storeDeleteTimeEntry = usePmoStore(s => s.deleteTimeEntry);
  const deleteTimeEntry = async (id: number) => {
    await storeDeleteTimeEntry(id);
    queryClient.invalidateQueries({ queryKey: ["timesheetReport"] });
    queryClient.invalidateQueries({ queryKey: ["hoursAnalytics"] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
  };
  const submitTimesheetWeek = usePmoStore(s => s.submitTimesheetWeek);
  const updateTimeEntry = usePmoStore(s => s.updateTimeEntry);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);

  // Real today
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const todayStr = toYMD(todayDate);

  // ── Navigation state ──
  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() => getMonday(new Date()));
  const [showWeekCal,   setShowWeekCal]   = useState(false);
  const [weekCalMonth,  setWeekCalMonth]  = useState<Date>(() => getMonday(new Date()));
  const [showLeaveCal,  setShowLeaveCal]  = useState(false);
  const [leaveCalMonth, setLeaveCalMonth] = useState<Date>(() => new Date());

  // Leave days: Set of YYYY-MM-DD strings
  const [leaveDays, setLeaveDays] = useState<Set<string>>(new Set());

  const [showWfhCal,  setShowWfhCal]  = useState(false);
  const [wfhCalMonth, setWfhCalMonth] = useState<Date>(() => new Date());

  // WFH days: Set of YYYY-MM-DD strings
  const [wfhDays, setWfhDays] = useState<Set<string>>(new Set());

  const [showHalfDayCal,  setShowHalfDayCal]  = useState(false);
  const [halfDayCalMonth, setHalfDayCalMonth] = useState<Date>(() => new Date());
  const [pendingHalfDayDate, setPendingHalfDayDate] = useState<string | null>(null);

  // Half day leaves: Map YYYY-MM-DD -> 'first' | 'second'
  const [halfDays, setHalfDays] = useState<Map<string, "first" | "second">>(new Map());

  // Refs for click-outside dismissal
  const weekCalRef     = useRef<HTMLDivElement>(null);
  const leaveCalRef    = useRef<HTMLDivElement>(null);
  const wfhCalRef      = useRef<HTMLDivElement>(null);
  const halfDayCalRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (weekCalRef.current  && !weekCalRef.current.contains(e.target as Node))  setShowWeekCal(false);
      if (leaveCalRef.current && !leaveCalRef.current.contains(e.target as Node)) setShowLeaveCal(false);
      if (wfhCalRef.current   && !wfhCalRef.current.contains(e.target as Node))   setShowWfhCal(false);
      if (halfDayCalRef.current && !halfDayCalRef.current.contains(e.target as Node)) setShowHalfDayCal(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Quick-add form state ──
  const [selectedProgId,  setSelectedProgId]  = useState<string>("BG_AUTO_26_001");

  // Reactively query WBS tasks for the selected programme
  useTasksQuery(selectedProgId);

  const [selectedTaskWbs, setSelectedTaskWbs] = useState<string>("");
  const [selectedDate,    setSelectedDate]    = useState<string>(todayStr);
  const [workHr,          setWorkHr]          = useState<string>("");
  const [blockedHr,       setBlockedHr]       = useState<string>("");
  const [blockerReason,   setBlockerReason]   = useState<string>("No blocker");
  const [note,            setNote]            = useState<string>("");

  // ── Computed week bounds ──
  const weekStartStr = toYMD(currentWeekMonday);
  const weekEndDate  = new Date(currentWeekMonday);
  weekEndDate.setDate(currentWeekMonday.getDate() + 7);
  const weekEndStr = toYMD(weekEndDate);

  const activeProg = programmes.find(p => p.id === selectedProgId);

  const editingEntry = editingEntryId !== null ? timeEntries.find(e => e.id === editingEntryId) : null;

  // Tasks for the selected programme + BAU (filtering out level-3 tasks that are DONE unless it's the one we're editing)
  const filteredTasks = [
    ...tasks.filter(t => 
      (t.programme_id === selectedProgId || t.programme_id === "DC_BAU") &&
      t.level === 3 &&
      ((t.status || "").trim().toUpperCase() !== "DONE" || (editingEntry && t.wbs === editingEntry.wbs))
    ),
    ...(tasks.some(t => t.wbs === "DC_BAU-1.1.1") ? [] : [{
      wbs: "DC_BAU-1.1.1", programme_id: "DC_BAU", name: "Bench Hours",
      discipline: "BAU", level: 3, effort_hr: 0, actual_hr: 0,
      status: "IN PROGRESS", percent_complete: 0, start_wk: 1, end_wk: 52
    }])
  ];

  const personId  = user?.person_id || "person-2";
  const submission = submissions.find(
    s => (String(s.person_id) === String(personId) || String(s.person_id) === String(personId).replace("person-", "")) && s.week_start_date === weekStartStr
  );
  const isSubmitted = submission?.status === "SUBMITTED" || submission?.status === "APPROVED";
 
  // Auto-select first task when programme changes or filtered tasks load
  useEffect(() => {
    if (editingEntryId !== null) return; // Do not auto-select/reset while editing
    if (filteredTasks.length > 0) {
      const exists = filteredTasks.some(t => t.wbs === selectedTaskWbs);
      if (!exists) {
        setSelectedTaskWbs(filteredTasks[0].wbs);
      }
    } else {
      setSelectedTaskWbs("");
    }
  }, [selectedProgId, filteredTasks.length, selectedTaskWbs, editingEntryId]);
 
  // Week date array (Mon–Sun)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekMonday);
    d.setDate(currentWeekMonday.getDate() + i);
    return d;
  });
 
  // Time entries for current week
  const currentWeekEntries = timeEntries.filter(
    e => {
      const matchPerson = 
        String(e.person_id) === String(personId) || 
        String(e.person_id) === String(personId).replace("person-", "");
      return matchPerson && e.entry_date >= weekStartStr && e.entry_date < weekEndStr;
    }
  );

  let totalLogged = 0, billableLogged = 0, bauLogged = 0;
  currentWeekEntries.forEach(e => {
    const prod = e.hours || 0;
    const blk  = e.blocked_hours || 0;
    totalLogged += prod + blk;
    if (e.programme_id === "DC_BAU") bauLogged += prod;
    else billableLogged += prod;
  });

  // Count leave days falling inside this week, then adjust targets
  const weekLeaveCount = weekDates.filter(d => leaveDays.has(toYMD(d))).length;
  const weekHalfDayCount = weekDates.filter(d => halfDays.has(toYMD(d))).length;
  const targetTotal    = Math.max(0, 45 - (weekLeaveCount * 9) - (weekHalfDayCount * 4.5));
  const targetBillable = 36; // sub-targets stay fixed; total target changes
  const targetBau      = 9;

  const totalPct    = targetTotal    > 0 ? Math.min(Math.round((totalLogged    / targetTotal)    * 100), 100) : 100;
  const billablePct = targetBillable > 0 ? Math.min(Math.round((billableLogged / targetBillable) * 100), 100) : 100;
  const bauPct      = targetBau      > 0 ? Math.min(Math.round((bauLogged      / targetBau)      * 100), 100) : 100;

  // Entries grouped by date
  const entriesByDate: Record<string, TimeEntry[]> = {};
  weekDates.forEach(d => {
    const ds = toYMD(d);
    entriesByDate[ds] = currentWeekEntries.filter(e => e.entry_date === ds);
  });

  // ── Handlers ──

  const goWeek = (delta: number) => {
    const d = new Date(currentWeekMonday);
    d.setDate(d.getDate() + delta * 7);
    setCurrentWeekMonday(d);
    const logDate = new Date(d);
    logDate.setDate(d.getDate() + 2); // default to Wednesday
    setSelectedDate(toYMD(logDate));
  };

  const handleToday = () => {
    setCurrentWeekMonday(getMonday(new Date()));
    setSelectedDate(todayStr);
  };

  const handleWeekCalClick = (d: Date) => {
    const monday = getMonday(d);
    setCurrentWeekMonday(monday);
    setSelectedDate(toYMD(d));
    setShowWeekCal(false);
  };

  const handleLeaveCalClick = (d: Date) => {
    const ds = toYMD(d);
    setLeaveDays(prev => {
      const next = new Set(prev);
      next.has(ds) ? next.delete(ds) : next.add(ds);
      return next;
    });
  };

  const handleWfhCalClick = (d: Date) => {
    const ds = toYMD(d);
    setWfhDays(prev => {
      const next = new Set(prev);
      next.has(ds) ? next.delete(ds) : next.add(ds);
      return next;
    });
  };

  const handleHalfDayCalClick = (d: Date) => {
    const ds = toYMD(d);
    if (halfDays.has(ds)) {
      setHalfDays(prev => {
        const next = new Map(prev);
        next.delete(ds);
        return next;
      });
    } else {
      setPendingHalfDayDate(ds);
    }
  };

  const handleSelectHalf = (type: "first" | "second") => {
    if (pendingHalfDayDate) {
      setHalfDays(prev => {
        const next = new Map(prev);
        next.set(pendingHalfDayDate, type);
        return next;
      });
      setPendingHalfDayDate(null);
    }
  };

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitted) { alert("This timesheet has already been submitted and is locked."); return; }
    const matchedTask = filteredTasks.find(t => t.wbs === selectedTaskWbs);
    if (!matchedTask) { alert("Please choose a valid WBS task."); return; }
    const prodHours = parseFloat(workHr) || 0;
    const blkHours  = parseFloat(blockedHr) || 0;
    if (prodHours <= 0 && blkHours <= 0) { alert("Please log at least some work hours or blocked hours."); return; }
    if (prodHours + blkHours > 24)        { alert("Logged hours cannot exceed 24 hours in a single day."); return; }

    const entryData = {
      wbs: selectedTaskWbs, person_id: personId,
      person_name: user?.name || "Vinayak Chouhan",
      hours: prodHours, blocked_hours: blkHours,
      blocker_reason: blockerReason !== "No blocker" ? blockerReason : undefined,
      blocker_note: note.trim() || undefined,
      entry_date: selectedDate, note: note.trim() || undefined,
      programme_id: matchedTask.programme_id,
      task_name: matchedTask.name, discipline: matchedTask.discipline
    };

    if (editingEntryId !== null) {
      await updateTimeEntry(editingEntryId, entryData);
      setEditingEntryId(null);
    } else {
      await addTimeEntry(entryData);
    }

    queryClient.invalidateQueries({ queryKey: ["timesheetReport"] });
    queryClient.invalidateQueries({ queryKey: ["hoursAnalytics"] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
    setWorkHr(""); setBlockedHr(""); setBlockerReason("No blocker"); setNote("");
  };

  const startEditEntry = (e: TimeEntry) => {
    setEditingEntryId(e.id);
    if (e.programme_id && e.programme_id !== "DC_BAU") {
      setSelectedProgId(e.programme_id);
    }
    setSelectedTaskWbs(e.wbs);
    setSelectedDate(e.entry_date);
    setWorkHr(String(e.hours || ""));
    setBlockedHr(String(e.blocked_hours || ""));
    setBlockerReason(e.blocker_reason || "No blocker");
    setNote(e.note || "");
    
    // Scroll form into view
    const formElement = document.getElementById("time-entry-form-container");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setWorkHr(""); setBlockedHr(""); setBlockerReason("No blocker"); setNote("");
  };

  const handleSubmitWeek = () => {
    if (totalLogged <= 0) { alert("Cannot submit an empty timesheet. Please log some hours first."); return; }
    if (confirm("Are you sure you want to submit this week's timesheet for approval?\nThis will lock editing for this week.")) {
      submitTimesheetWeek(personId, weekStartStr);
      alert("Timesheet submitted successfully!");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page-container space-y-6">

      {/* ── Page title ── */}
      <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm">
        <h2 className="text-lg font-black text-navy flex items-center gap-2">
          <Clock className="w-5 h-5 text-dc-blue" />
          <span>My Timesheet · Daily Entry</span>
          {activeProg && (
            <span className="text-slate-400 font-semibold text-sm">· {activeProg.name}</span>
          )}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Log your daily billable tasks and internal project administrative (BAU) hours. Keep allocations up-to-date.
        </p>
      </div>

      {/* ── Week navigation & action strip ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-border-base rounded-lg p-4 shadow-sm">

        {/* Left: programme selector + week nav */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={selectedProgId}
            onChange={e => setSelectedProgId(e.target.value)}
            className="border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-dc-blue bg-white text-slate-700 w-44 font-semibold"
          >
            {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          {/* Prev / week label (calendar trigger) / Next */}
          <div className="flex items-center border border-slate-200 rounded overflow-visible">
            <button
              onClick={() => goWeek(-1)}
              className="px-2.5 py-1.5 text-slate-600 bg-slate-50 hover:bg-slate-100 text-xs border-r border-slate-200 transition-colors"
            >
              ← Prev week
            </button>

            {/* Calendar week picker */}
            <div className="relative" ref={weekCalRef}>
              <button
                onClick={() => { setWeekCalMonth(new Date(currentWeekMonday)); setShowWeekCal(v => !v); }}
                className="px-3.5 py-1.5 text-xs font-bold text-navy bg-white hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
              >
                {formatDateRange(currentWeekMonday)}
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showWeekCal && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50">
                  <div className="px-3 pt-3 pb-1 border-b border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Jump to week — click any date
                    </span>
                  </div>
                  <MiniCalendar
                    viewMonth={weekCalMonth}
                    onViewMonthChange={setWeekCalMonth}
                    onDateClick={handleWeekCalClick}
                    selectedWeekMonday={currentWeekMonday}
                    mode="week"
                    todayStr={todayStr}
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => goWeek(1)}
              className="px-2.5 py-1.5 text-slate-600 bg-slate-50 hover:bg-slate-100 text-xs border-l border-slate-200 transition-colors"
            >
              Next week →
            </button>
          </div>

          <button
            onClick={handleToday}
            className="border border-slate-200 hover:bg-slate-50 bg-white text-slate-700 px-3.5 py-1.5 rounded text-xs font-bold transition-colors"
          >
            Today
          </button>
        </div>

        {/* Right: Log Leave + Submit Week */}
        <div className="flex items-center gap-2">

          {/* Log Leave button + calendar popup */}
          <div className="relative" ref={leaveCalRef}>
            <button
              onClick={() => { setLeaveCalMonth(new Date()); setShowLeaveCal(v => !v); }}
              className={cn(
                "border px-4 py-2 rounded text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5",
                leaveDays.size > 0
                  ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              <BriefcaseMedical className="w-4 h-4" />
              <span>Log Leave</span>
              {leaveDays.size > 0 && (
                <span className="bg-orange-200 text-orange-800 rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none">
                  {leaveDays.size}
                </span>
              )}
            </button>

            {showLeaveCal && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50" style={{ minWidth: 264 }}>
                <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-slate-100">
                  <div>
                    <div className="text-[11px] font-black text-slate-700">Mark Leave Days</div>
                    <div className="text-[9px] text-slate-400 font-semibold mt-0.5">
                      Click a date to toggle · 9 hr deducted per leave day
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLeaveCal(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors ml-3"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <MiniCalendar
                  viewMonth={leaveCalMonth}
                  onViewMonthChange={setLeaveCalMonth}
                  onDateClick={handleLeaveCalClick}
                  leaveDays={leaveDays}
                  mode="leave"
                  todayStr={todayStr}
                />

                {leaveDays.size > 0 && (
                  <div className="px-3 pb-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {leaveDays.size} day{leaveDays.size > 1 ? "s" : ""} marked
                    </span>
                    <button
                      onClick={() => setLeaveDays(new Set())}
                      className="text-[10px] text-danger-red font-bold hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Log Work From Home button + calendar popup */}
          <div className="relative" ref={wfhCalRef}>
            <button
              onClick={() => { setWfhCalMonth(new Date()); setShowWfhCal(v => !v); }}
              className={cn(
                "border px-4 py-2 rounded text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5",
                wfhDays.size > 0
                  ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Log Work From Home</span>
              {wfhDays.size > 0 && (
                <span className="bg-blue-200 text-blue-800 rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none">
                  {wfhDays.size}
                </span>
              )}
            </button>

            {showWfhCal && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50" style={{ minWidth: 264 }}>
                <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-slate-100">
                  <div>
                    <div className="text-[11px] font-black text-slate-700">Mark WFH Days</div>
                    <div className="text-[9px] text-slate-400 font-semibold mt-0.5">
                      Click a date to toggle · Does not deduct hours
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWfhCal(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors ml-3"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <MiniCalendar
                  viewMonth={wfhCalMonth}
                  onViewMonthChange={setWfhCalMonth}
                  onDateClick={handleWfhCalClick}
                  wfhDays={wfhDays}
                  mode="wfh"
                  todayStr={todayStr}
                />

                {wfhDays.size > 0 && (
                  <div className="px-3 pb-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {wfhDays.size} day{wfhDays.size > 1 ? "s" : ""} marked
                    </span>
                    <button
                      onClick={() => setWfhDays(new Set())}
                      className="text-[10px] text-dc-blue font-bold hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Log Half Day button + calendar popup */}
          <div className="relative" ref={halfDayCalRef}>
            <button
              onClick={() => { setHalfDayCalMonth(new Date()); setShowHalfDayCal(v => !v); setPendingHalfDayDate(null); }}
              className={cn(
                "border px-4 py-2 rounded text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5",
                halfDays.size > 0
                  ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              <BriefcaseMedical className="w-4 h-4" />
              <span>Log Half Day</span>
              {halfDays.size > 0 && (
                <span className="bg-amber-200 text-amber-800 rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none">
                  {halfDays.size}
                </span>
              )}
            </button>

            {showHalfDayCal && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50" style={{ minWidth: 264 }}>
                <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-slate-100">
                  <div>
                    <div className="text-[11px] font-black text-slate-700">Mark Half Day Leaves</div>
                    <div className="text-[9px] text-slate-400 font-semibold mt-0.5">
                      Click a date to toggle · 4.5 hr deducted per half day
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowHalfDayCal(false); setPendingHalfDayDate(null); }}
                    className="text-slate-400 hover:text-slate-600 transition-colors ml-3"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative">
                  <MiniCalendar
                    viewMonth={halfDayCalMonth}
                    onViewMonthChange={setHalfDayCalMonth}
                    onDateClick={handleHalfDayCalClick}
                    halfDays={halfDays}
                    mode="half"
                    todayStr={todayStr}
                  />

                  {pendingHalfDayDate && (
                    <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-4 z-10 rounded-xl">
                      <div className="text-xs font-black text-navy mb-3 text-center">
                        Select half for {pendingHalfDayDate}
                      </div>
                      <div className="flex flex-col gap-2 w-full max-w-[180px]">
                        <button
                          onClick={() => handleSelectHalf("first")}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold py-1.5 px-3 rounded shadow-sm transition-colors text-center"
                        >
                          First Half (Morning)
                        </button>
                        <button
                          onClick={() => handleSelectHalf("second")}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold py-1.5 px-3 rounded shadow-sm transition-colors text-center"
                        >
                          Second Half (Afternoon)
                        </button>
                        <button
                          onClick={() => setPendingHalfDayDate(null)}
                          className="border border-slate-200 hover:bg-slate-50 text-slate-500 text-[10px] font-bold py-1 px-3 rounded transition-colors text-center mt-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {halfDays.size > 0 && (
                  <div className="px-3 pb-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {halfDays.size} day{halfDays.size > 1 ? "s" : ""} marked
                    </span>
                    <button
                      onClick={() => setHalfDays(new Map())}
                      className="text-[10px] text-danger-red font-bold hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Week */}
          <button
            onClick={handleSubmitWeek}
            disabled={isSubmitted || totalLogged === 0}
            className={cn(
              "text-white px-4 py-2 rounded text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5",
              isSubmitted || totalLogged === 0
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-navy hover:bg-slate-800"
            )}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Submit Week</span>
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* This Week */}
        <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">This Week</span>
          <div className="mt-3">
            <span className="text-2xl font-black text-danger-red">{totalLogged.toFixed(1)} hr</span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">
              of {targetTotal} hr target — {totalPct}%
            </span>
            {weekLeaveCount > 0 && (
              <div className="mt-1">
                <span className="text-[9px] bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded border border-orange-200 inline-flex items-center gap-1">
                  <BriefcaseMedical className="w-2.5 h-2.5" />
                  {weekLeaveCount} leave day{weekLeaveCount > 1 ? "s" : ""} this week
                </span>
              </div>
            )}
            {weekHalfDayCount > 0 && (
              <div className="mt-1">
                <span className="text-[9px] bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                  <BriefcaseMedical className="w-2.5 h-2.5" />
                  {weekHalfDayCount} half day{weekHalfDayCount > 1 ? "s" : ""} this week
                </span>
              </div>
            )}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-danger-red h-full transition-all" style={{ width: `${totalPct}%` }} />
            </div>
          </div>
        </div>

        {/* Billable */}
        <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Billable (Project)</span>
          <div className="mt-3">
            <span className="text-2xl font-black text-dc-blue">{billableLogged.toFixed(1)}</span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">target {targetBillable} hr — {billablePct}%</span>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-dc-blue h-full transition-all" style={{ width: `${billablePct}%` }} />
            </div>
          </div>
        </div>

        {/* BAU */}
        <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">BAU / Internal</span>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600">{bauLogged.toFixed(1)}</span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">target {targetBau} hr — {bauPct}%</span>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-600 h-full transition-all" style={{ width: `${bauPct}%` }} />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Status</span>
          <div className="mt-3 flex items-start justify-between">
            <div>
              <span className={cn(
                "text-base font-black tracking-tight",
                submission?.status === "SUBMITTED" ? "text-dc-blue" :
                submission?.status === "APPROVED"  ? "text-success-green" :
                submission?.status === "REJECTED"  ? "text-danger-red" : "text-slate-700"
              )}>
                {submission?.status || "DRAFT"}
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {submission?.status === "SUBMITTED" ? `Submitted ${new Date(submission.submitted_at || "").toLocaleDateString()}` :
                 submission?.status === "APPROVED"  ? `Approved by ${submission.approved_by}` :
                 submission?.status === "REJECTED"  ? `Rejected: ${submission.rejection_notes}` : "Not yet submitted"}
              </p>
            </div>
            {isSubmitted ? (
              <span className="bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase border border-slate-200">
                Locked
              </span>
            ) : (
              <span className="bg-blue-50 text-dc-blue rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase border border-blue-100">
                Editable
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Add Time Entry ── */}
      <div 
        id="time-entry-form-container"
        className={cn(
          "border border-dashed rounded-lg p-4 shadow-sm relative transition-all duration-300",
          isSubmitted
            ? "bg-slate-50/50 border-slate-200 opacity-60 pointer-events-none"
            : editingEntryId !== null
            ? "border-dc-blue bg-blue-50/15"
            : "border-amber-300 bg-amber-50/20"
        )}
      >
        {isSubmitted && (
          <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[0.5px] rounded-lg z-10 flex items-center justify-center">
            <span className="text-xs bg-slate-900 text-white font-extrabold tracking-wider px-3.5 py-1.5 rounded uppercase flex items-center gap-1 border border-slate-800">
              <AlertCircle className="w-3.5 h-3.5 text-gold shrink-0" />
              Timesheet submitted — time entries locked
            </span>
          </div>
        )}

        <form onSubmit={handleLogTime} className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0 text-slate-800 select-none">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-extrabold uppercase tracking-wide">
              {editingEntryId !== null ? "Edit Time Entry" : "Quick Add Time Entry"}
            </span>
          </div>

          {/* Task picker */}
          <div className="flex-1 min-w-[280px]">
            <select
              value={selectedTaskWbs}
              onChange={e => setSelectedTaskWbs(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-dc-blue"
            >
              <option value="" disabled>-- Choose task to log time against --</option>
              {filteredTasks.map(t => (
                <option key={t.wbs} value={t.wbs}>
                  {t.programme_id === "DC_BAU" ? "" : `${t.programme_id} · `}{t.wbs} · {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date picker — no min/max restriction */}
          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="border border-slate-200 rounded px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-dc-blue font-semibold text-slate-700"
            />
          </div>

          <div className="w-20">
            <input
              type="number" placeholder="Work hr" value={workHr}
              onChange={e => setWorkHr(e.target.value)}
              step="0.5" min="0"
              className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-center focus:outline-none focus:border-dc-blue"
            />
          </div>

          <div className="w-20">
            <input
              type="number" placeholder="Blocked hr" value={blockedHr}
              onChange={e => setBlockedHr(e.target.value)}
              step="0.5" min="0"
              className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-center focus:outline-none focus:border-dc-blue"
            />
          </div>

          <div>
            <select
              value={blockerReason}
              onChange={e => setBlockerReason(e.target.value)}
              className="border border-slate-200 rounded px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-dc-blue font-semibold text-slate-700"
            >
              <option value="No blocker">No blocker</option>
              <option value="Resource missing">Resource missing</option>
              <option value="Power cut">Power cut</option>
              <option value="Waiting input">Waiting input</option>
              <option value="Tool/software issue">Tool/software issue</option>
              <option value="Lab unavailable">Lab unavailable</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <input
              type="text" placeholder="Note (optional)" value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-dc-blue"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="bg-dc-blue hover:bg-dc-deep text-white px-4 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors shadow-sm"
            >
              {editingEntryId !== null ? "Save Changes" : "+ Log"}
            </button>
            {editingEntryId !== null && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="border border-slate-200 hover:bg-slate-100 text-slate-500 px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Mon–Sun daily columns ── */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDates.map(dateObj => {
          const dateStr     = toYMD(dateObj);
          const entries     = entriesByDate[dateStr] || [];
          const isToday     = dateStr === todayStr;
          const isWeekend   = dateObj.getDay() === 0 || dateObj.getDay() === 6;
          const isLeaveDay  = leaveDays.has(dateStr);
          const isWfhDay    = wfhDays.has(dateStr);
          const halfDayHalf = halfDays.get(dateStr);
          const totalDayHrs = entries.reduce((s, e) => s + (e.hours || 0) + (e.blocked_hours || 0), 0);

          const daysLabels  = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
          const labelIndex  = dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1;
          const months      = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          const dateFmt     = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${String(dateObj.getFullYear()).slice(-2)}`;

          return (
            <div
              key={dateStr}
              className={cn(
                "bg-white border rounded-lg p-4 shadow-sm flex flex-col transition-all min-h-[350px]",
                isToday
                  ? "ring-2 ring-dc-blue bg-blue-50/5 border-blue-200"
                  : isLeaveDay
                  ? "border-orange-200 bg-orange-50/20"
                  : halfDayHalf
                  ? "border-amber-200 bg-amber-50/15"
                  : isWfhDay
                  ? "border-blue-200 bg-blue-50/15"
                  : "border-slate-200"
              )}
            >
              {/* Column header */}
              <div className="border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 tracking-wider">
                    {daysLabels[labelIndex]}{isToday && " · TODAY"}
                  </span>
                  {isLeaveDay && (
                    <span className="text-[9px] bg-orange-100 text-orange-600 font-black px-1.5 py-0.5 rounded border border-orange-200 uppercase tracking-wide flex items-center gap-0.5">
                      <BriefcaseMedical className="w-2.5 h-2.5" />
                      Leave
                    </span>
                  )}
                  {isWfhDay && (
                    <span className="text-[9px] bg-blue-100 text-blue-600 font-black px-1.5 py-0.5 rounded border border-blue-200 uppercase tracking-wide flex items-center gap-0.5">
                      <CalendarDays className="w-2.5 h-2.5" />
                      WFH
                    </span>
                  )}
                  {halfDayHalf && (
                    <span className="text-[9px] bg-amber-100 text-amber-600 font-black px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wide flex items-center gap-0.5">
                      <BriefcaseMedical className="w-2.5 h-2.5" />
                      {halfDayHalf === "first" ? "1st Half" : "2nd Half"}
                    </span>
                  )}
                </div>
                <div className="text-xs font-black text-navy mt-0.5">{dateFmt}</div>
                <div className="text-xs text-slate-500 font-bold mt-1.5">{totalDayHrs.toFixed(1)} hr</div>
              </div>

              {/* Leave day indicator */}
              {isLeaveDay && (
                <div className="mb-3 bg-orange-50 border border-orange-200 rounded p-2.5 text-center">
                  <div className="text-[10px] font-black text-orange-600">Leave Day</div>
                  <div className="text-[9px] text-orange-400 font-semibold mt-0.5">
                    9 hr deducted from weekly target
                  </div>
                </div>
              )}

              {/* WFH day indicator */}
              {isWfhDay && (
                <div className="mb-3 bg-blue-50 border border-blue-200 rounded p-2.5 text-center">
                  <div className="text-[10px] font-black text-blue-600">Working From Home</div>
                  <div className="text-[9px] text-blue-400 font-semibold mt-0.5">
                    Standard hours count towards target
                  </div>
                </div>
              )}

              {/* Half Day indicator */}
              {halfDayHalf && (
                <div className="mb-3 bg-amber-50 border border-amber-200 rounded p-2.5 text-center">
                  <div className="text-[10px] font-black text-amber-600">
                    Half Day ({halfDayHalf === "first" ? "1st Half" : "2nd Half"})
                  </div>
                  <div className="text-[9px] text-amber-400 font-semibold mt-0.5">
                    4.5 hr deducted from weekly target
                  </div>
                </div>
              )}

              {/* Entries */}
              <div className="space-y-3 flex-1">
                {entries.length === 0 ? (
                  isWeekend ? (
                    <div className="text-center py-10 text-[11px] text-slate-400 font-bold italic select-none">
                      Weekend
                    </div>
                  ) : isLeaveDay ? (
                    <div className="text-center py-6 text-[10px] text-orange-400 font-semibold select-none">
                      On leave — no entries
                    </div>
                  ) : (
                    <div className="text-center py-10 text-[10px] text-slate-400 font-semibold select-none leading-relaxed">
                      No entries — use Quick Add
                    </div>
                  )
                ) : (
                  entries.map(e => {
                    const isInternal = e.programme_id === "DC_BAU";
                    return (
                      <div
                        key={e.id}
                        className="bg-slate-50/80 border border-slate-150 rounded p-2.5 relative group hover:border-slate-300 transition-colors"
                      >
                        {!isSubmitted && (
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditEntry(e)}
                              className="text-slate-400 hover:text-dc-blue cursor-pointer"
                              title="Edit entry"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTimeEntry(e.id)}
                              className="text-slate-400 hover:text-danger-red cursor-pointer"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <div className="text-[9px] font-bold text-navy truncate pr-12">
                          {isInternal ? "Internal" : e.programme_id} · {e.wbs}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-700 leading-snug mt-1">
                          {e.task_name}
                        </div>
                        <div className="text-[9px] text-slate-500 font-bold mt-2 flex flex-col gap-0.5">
                          <div>productive: <span className="text-navy">{e.hours.toFixed(1)}h</span></div>
                          {e.blocked_hours && e.blocked_hours > 0 && (
                            <div className="text-amber-600 flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                              blocked: <span>{e.blocked_hours.toFixed(1)}h</span>
                            </div>
                          )}
                        </div>
                        {e.note && (
                          <div className="text-[9px] text-slate-400 italic mt-1.5 border-t border-slate-100 pt-1 leading-normal">
                            Note: {e.note}
                          </div>
                        )}
                        {e.blocker_reason && (
                          <div className="text-[9px] text-amber-600 font-semibold mt-1 bg-amber-50 rounded px-1.5 py-0.5 border border-amber-100 leading-normal">
                            Blocker: {e.blocker_reason}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
