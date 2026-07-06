"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useDfmeaQuery } from "@/hooks/use-pmo-queries";
import { 
  TestTube, Search, Plus, FileSpreadsheet, Edit3, Trash2, X, Eye, ShieldAlert, CheckCircle, Info
} from "lucide-react";
import { cn } from "@/utils/cn";
import { DfmeaItem } from "@/types/pmo";

export default function DfmeaPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addDfmeaItem = usePmoStore((state) => state.addDfmeaItem);
  const updateDfmeaItem = usePmoStore((state) => state.updateDfmeaItem);
  const deleteDfmeaItem = usePmoStore((state) => state.deleteDfmeaItem);

  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: dfmeaData, isLoading: isDfmeaLoading } = useDfmeaQuery(activeProgrammeId);

  const isLoading = isProgLoading || isDfmeaLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rpnFilter, setRpnFilter] = useState(""); // "HIGH" (>=100), "MED" (50-99), "LOW" (<50)

  // Drawer & Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<DfmeaItem | null>(null);
  const [editingItem, setEditingItem] = useState<DfmeaItem | null>(null);

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formPart, setFormPart] = useState("");
  const [formMode, setFormMode] = useState("");
  const [formEffect, setFormEffect] = useState("");
  const [formCause, setFormCause] = useState("");
  const [formSev, setFormSev] = useState(5);
  const [formOcc, setFormOcc] = useState(5);
  const [formDet, setFormDet] = useState(5);
  const [formPrevention, setFormPrevention] = useState("");
  const [formDetectionC, setFormDetectionC] = useState("");
  const [formAction, setFormAction] = useState("");
  const [formOwner, setFormOwner] = useState("");
  const [formDue, setFormDue] = useState("");
  const [formStatus, setFormStatus] = useState<DfmeaItem["action_status"]>("OPEN");

  // RPN Score color badge utility
  const getRpnBadge = (rpn: number) => {
    if (rpn >= 100) return { label: rpn, cls: "bg-rose-50 text-rose-700 border-rose-200 font-bold" };
    if (rpn >= 50) return { label: rpn, cls: "bg-amber-50 text-amber-700 border-amber-200 font-semibold" };
    return { label: rpn, cls: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium" };
  };

  const getStatusBadge = (status: DfmeaItem["action_status"]) => {
    switch (status) {
      case "CLOSED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "IN_PROGRESS": return "bg-sky-50 text-sky-700 border-sky-200";
      default: return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!dfmeaData) return [];
    return dfmeaData.items
      .filter((i) => {
        const rpn = i.severity * i.occurrence * i.detection;
        const matchesSearch = 
          i.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.function_or_part.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.failure_mode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (i.action_owner || "").toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = !statusFilter || i.action_status === statusFilter;
        
        let matchesRpn = true;
        if (rpnFilter === "HIGH") matchesRpn = rpn >= 100;
        else if (rpnFilter === "MED") matchesRpn = rpn >= 50 && rpn < 100;
        else if (rpnFilter === "LOW") matchesRpn = rpn < 50;

        return matchesSearch && matchesStatus && matchesRpn;
      })
      .sort((a, b) => {
        const rpnA = a.severity * a.occurrence * a.detection;
        const rpnB = b.severity * b.occurrence * b.detection;
        return rpnB - rpnA; // Sort high RPN first
      });
  }, [dfmeaData, searchQuery, statusFilter, rpnFilter]);

  // Open Add/Edit Modal
  const handleOpenModal = (item?: DfmeaItem) => {
    if (item) {
      setEditingItem(item);
      setFormCode(item.item_code);
      setFormPart(item.function_or_part);
      setFormMode(item.failure_mode);
      setFormEffect(item.effect || "");
      setFormCause(item.cause || "");
      setFormSev(item.severity);
      setFormOcc(item.occurrence);
      setFormDet(item.detection);
      setFormPrevention(item.prevention_control || "");
      setFormDetectionC(item.detection_control || "");
      setFormAction(item.action_recommended || "");
      setFormOwner(item.action_owner || "");
      setFormDue(item.action_due_date || "");
      setFormStatus(item.action_status);
    } else {
      setEditingItem(null);
      const nextNum = (dfmeaData?.items || []).length + 1;
      setFormCode(`DFM-${String(nextNum).padStart(3, "0")}`);
      setFormPart("");
      setFormMode("");
      setFormEffect("");
      setFormCause("");
      setFormSev(5);
      setFormOcc(5);
      setFormDet(5);
      setFormPrevention("");
      setFormDetectionC("");
      setFormAction("");
      setFormOwner("");
      setFormDue("");
      setFormStatus("OPEN");
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formPart.trim() || !formMode.trim()) {
      alert("Please fill in Code, Part/Function, and Failure Mode.");
      return;
    }

    const payload = {
      programme_id: activeProgrammeId,
      item_code: formCode,
      function_or_part: formPart,
      failure_mode: formMode,
      effect: formEffect,
      cause: formCause,
      severity: Number(formSev),
      occurrence: Number(formOcc),
      detection: Number(formDet),
      prevention_control: formPrevention,
      detection_control: formDetectionC,
      action_recommended: formAction,
      action_owner: formOwner,
      action_due_date: formDue || null,
      action_status: formStatus
    };

    if (editingItem) {
      updateDfmeaItem(editingItem.id, payload);
    } else {
      addDfmeaItem(payload);
    }
    setIsModalOpen(false);
  };

  const handleDeleteItem = (id: number) => {
    if (confirm("Are you sure you want to delete this failure mode?")) {
      deleteDfmeaItem(id);
      if (activeItem?.id === id) {
        setIsDrawerOpen(false);
        setActiveItem(null);
      }
    }
  };

  const handleOpenDrawer = (item: DfmeaItem) => {
    setActiveItem(item);
    setIsDrawerOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      "Item Code", "Function/Part", "Failure Mode", "Effect", "Severity", "Cause", 
      "Occurrence", "Prevention Control", "Detection Control", "Detection", "RPN", 
      "Recommended Action", "Action Owner", "Due Date", "Status"
    ];
    const rows = filteredItems.map((i) => {
      const rpn = i.severity * i.occurrence * i.detection;
      return [
        i.item_code,
        i.function_or_part,
        i.failure_mode,
        i.effect || "—",
        i.severity,
        i.cause || "—",
        i.occurrence,
        i.prevention_control || "—",
        i.detection_control || "—",
        i.detection,
        rpn,
        i.action_recommended || "—",
        i.action_owner || "—",
        i.action_due_date || "—",
        i.action_status
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dfmea_${activeProgrammeId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading DFMEA...</span>
        </div>
      </div>
    );
  }

  if (!activeProgramme || !dfmeaData) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <TestTube className="w-16 h-16 text-slate-350 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Active Programme</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select a programme to access design failure modes and effects analysis.
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
            <TestTube className="w-6 h-6 text-indigo-600" />
            <span>DFMEA · Failure Mode Analysis</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Analyze failure modes, calculate risk priority numbers (RPN), and specify prevention and detection quality controls.
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
            <span>Add DFMEA Item</span>
          </button>
        </div>
      </div>

      {/* RPN Metrics grids */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Failure Modes</span>
          <span className="text-xl font-black text-navy block mt-2">{dfmeaData.stats.total}</span>
        </div>
        <div className={cn(
          "border rounded-lg p-4 shadow-xs text-center transition-colors",
          dfmeaData.stats.high_rpn > 0 
            ? "bg-rose-50 border-rose-200 text-rose-700 font-bold" 
            : "bg-white border-slate-200 text-navy"
        )}>
          <span className="text-[9px] font-bold uppercase tracking-wider block opacity-75">High RPN (≥100)</span>
          <span className="text-xl font-black block mt-2">{dfmeaData.stats.high_rpn}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-sky-700">Open Actions</span>
          <span className="text-xl font-black text-sky-700 block mt-2">{dfmeaData.stats.open}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Avg RPN Score</span>
          <span className="text-xl font-black text-navy block mt-2">
            {dfmeaData.items.length 
              ? Math.round(dfmeaData.items.reduce((s, i) => s + (i.severity * i.occurrence * i.detection), 0) / dfmeaData.items.length)
              : 0
            }
          </span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search DFMEA by code, part, failure mode, owner..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs w-full focus:outline-none placeholder-slate-400"
          />
        </div>
        
        <select 
          value={rpnFilter} 
          onChange={(e) => setRpnFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer font-semibold"
        >
          <option value="">All RPN Ratings</option>
          <option value="HIGH">Critical RPN (≥100)</option>
          <option value="MED">Moderate RPN (50 - 99)</option>
          <option value="LOW">Low RPN (&lt;50)</option>
        </select>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer font-medium"
        >
          <option value="">All Action Statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* Double pane: Left is Table, Right is slide-out drawer */}
      <div className="flex-1 flex gap-4 min-h-[400px]">
        {/* Main table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] select-none">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Function/Part</th>
                <th className="px-4 py-3">Failure Mode</th>
                <th className="px-4 py-3">Effect</th>
                <th className="px-4 py-3 text-center">Sev</th>
                <th className="px-4 py-3 text-center">Occ</th>
                <th className="px-4 py-3 text-center">Det</th>
                <th className="px-4 py-3 text-center">RPN</th>
                <th className="px-4 py-3">Recommended Action</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-16 text-center text-slate-400 italic">
                    No DFMEA analysis records found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((i) => {
                  const rpn = i.severity * i.occurrence * i.detection;
                  const rpnBadge = getRpnBadge(rpn);
                  return (
                    <tr 
                      key={i.id} 
                      className={cn(
                        "hover:bg-slate-50/50 group transition-all",
                        activeItem?.id === i.id ? "bg-slate-50/70 border-l-2 border-indigo-500" : ""
                      )}
                    >
                      <td 
                        onClick={() => handleOpenDrawer(i)}
                        className="px-4 py-3 font-mono font-bold text-slate-900 cursor-pointer hover:underline"
                      >
                        {i.item_code}
                      </td>
                      <td 
                        onClick={() => handleOpenDrawer(i)}
                        className="px-4 py-3 font-medium text-slate-800 cursor-pointer"
                      >
                        {i.function_or_part}
                      </td>
                      <td 
                        onClick={() => handleOpenDrawer(i)}
                        className="px-4 py-3 font-medium text-slate-800 cursor-pointer"
                      >
                        {i.failure_mode}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={i.effect}>
                        {i.effect || "—"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">{i.severity}</td>
                      <td className="px-4 py-3 text-center font-bold">{i.occurrence}</td>
                      <td className="px-4 py-3 text-center font-bold">{i.detection}</td>
                      
                      <td className="px-4 py-3 text-center">
                        <span className={cn("inline-block border rounded px-1.5 py-0.5 text-[9px]", rpnBadge.cls)}>
                          {rpnBadge.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={i.action_recommended}>
                        {i.action_recommended || "—"}
                      </td>
                      
                      <td className="px-4 py-3 font-medium">{i.action_owner || "—"}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{i.action_due_date || "—"}</td>
                      
                      <td className="px-4 py-3">
                        <span className={cn("inline-block border rounded px-1.5 py-0.5 text-[9px] font-bold uppercase", getStatusBadge(i.action_status))}>
                          {i.action_status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleOpenModal(i)}
                            className="p-1 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded text-slate-650 hover:text-slate-950 transition-all font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(i.id)}
                            className="p-1 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded text-slate-400 hover:text-rose-700 transition-all inline-flex items-center cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Detailed Side Drawer panel */}
        {isDrawerOpen && activeItem && (
          <div className="bg-slate-900 text-slate-100 rounded-lg w-80 p-5 border border-slate-800 shadow-lg flex flex-col space-y-4 shrink-0 transition-all animate-slide-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-sky-400" />
                <span>DFMEA Details · {activeItem.item_code}</span>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="hover:bg-slate-800 p-1 rounded-md transition-colors cursor-pointer text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 overflow-y-auto flex-1 text-[11px] pr-1 scrollbar-thin">
              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wide mb-0.5">Part / Function</span>
                <span className="font-semibold text-white">{activeItem.function_or_part}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wide mb-0.5">Failure Mode</span>
                <p className="bg-slate-800/40 p-2 rounded text-slate-200 border border-slate-800/80 leading-normal">{activeItem.failure_mode}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wide mb-0.5">Vulnerability Effect</span>
                <p className="bg-slate-800/40 p-2 rounded text-slate-300 leading-normal">{activeItem.effect || "—"}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wide mb-0.5">Potential Cause</span>
                <p className="text-slate-300 leading-normal">{activeItem.cause || "—"}</p>
              </div>

              <div className="grid grid-cols-4 gap-2 border-t border-b border-slate-800 py-3 my-2">
                <div className="text-center">
                  <span className="text-slate-400 block text-[8px] uppercase">Sev (S)</span>
                  <b className="text-white text-xs">{activeItem.severity}</b>
                </div>
                <div className="text-center">
                  <span className="text-slate-400 block text-[8px] uppercase">Occ (O)</span>
                  <b className="text-white text-xs">{activeItem.occurrence}</b>
                </div>
                <div className="text-center">
                  <span className="text-slate-400 block text-[8px] uppercase">Det (D)</span>
                  <b className="text-white text-xs">{activeItem.detection}</b>
                </div>
                <div className="text-center border-l border-slate-800 pl-2">
                  <span className="text-slate-400 block text-[8px] uppercase text-sky-400">RPN Score</span>
                  <b className="text-rose-400 text-xs">{activeItem.severity * activeItem.occurrence * activeItem.detection}</b>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wide mb-0.5">Prevention Controls</span>
                <span className="text-slate-200">{activeItem.prevention_control || "—"}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wide mb-0.5">Detection Controls</span>
                <span className="text-slate-200">{activeItem.detection_control || "—"}</span>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-2">
                <span className="text-sky-400 block text-[9px] font-bold uppercase tracking-wide mb-0.5">Recommended Actions Plan</span>
                <p className="bg-sky-950/20 p-2 border border-sky-900/40 rounded text-slate-200 leading-normal">{activeItem.action_recommended || "—"}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1.5">
                <div>
                  <span className="text-slate-400 block text-[8px] uppercase">Action Owner</span>
                  <span className="font-semibold text-white">{activeItem.action_owner || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[8px] uppercase">Due Date</span>
                  <span className="font-mono text-slate-300">{activeItem.action_due_date || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <TestTube className="w-4 h-4 text-sky-400" />
                <span>{editingItem ? `Edit DFMEA Item · ${editingItem.item_code}` : "Add DFMEA Failure Mode"}</span>
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
                
                {/* Item Code */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Failure Mode Code ID *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. DFM-001"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono font-bold"
                  />
                </div>

                {/* Function / Part */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Function or Part *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Lens Housing Seal, LED Driver PCB"
                    required
                    value={formPart}
                    onChange={(e) => setFormPart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-semibold"
                  />
                </div>

                {/* Failure Mode */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Potential Failure Mode *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Water ingress due to gasket compression set, LED flickering"
                    required
                    value={formMode}
                    onChange={(e) => setFormMode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-medium"
                  />
                </div>

                {/* Potential Effect */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Potential Effects of Failure
                  </label>
                  <textarea 
                    placeholder="Describe how failure impacts LAM / circuit operations..."
                    value={formEffect}
                    onChange={(e) => setFormEffect(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                  />
                </div>

                {/* Potential Cause */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Potential Cause(s) / Mechanism
                  </label>
                  <textarea 
                    placeholder="Describe physical/design cause (e.g. high dropout voltage of regulator)..."
                    value={formCause}
                    onChange={(e) => setFormCause(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                  />
                </div>

                {/* Sev, Occ, Det */}
                <div className="grid grid-cols-3 gap-2 col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Severity (1-10)
                    </label>
                    <input 
                      type="number" 
                      min={1}
                      max={100}
                      value={formSev}
                      onChange={(e) => setFormSev(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-dc-blue text-xs font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Occurrence (1-10)
                    </label>
                    <input 
                      type="number" 
                      min={1}
                      max={100}
                      value={formOcc}
                      onChange={(e) => setFormOcc(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-dc-blue text-xs font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Detection (1-10)
                    </label>
                    <input 
                      type="number" 
                      min={1}
                      max={100}
                      value={formDet}
                      onChange={(e) => setFormDet(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-dc-blue text-xs font-bold text-center"
                    />
                  </div>
                  <div className="col-span-3 text-center border-t border-slate-200 pt-2.5 mt-1">
                    <span className="text-[10px] text-slate-500">Computed RPN Score: </span>
                    <b className="text-rose-600 text-sm font-black tracking-wide ml-1">{formSev * formOcc * formDet}</b>
                  </div>
                </div>

                {/* Prevention Control */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Current Prevention Controls
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. FEA thermal modeling, layout guidelines"
                    value={formPrevention}
                    onChange={(e) => setFormPrevention(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                  />
                </div>

                {/* Detection Control */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Current Detection Controls
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Bench sweep voltage tests, water immersion chamber tests"
                    value={formDetectionC}
                    onChange={(e) => setFormDetectionC(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                  />
                </div>

                {/* Recommended Action */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Recommended Corrective Actions
                  </label>
                  <textarea 
                    placeholder="e.g. Change seal specification to EDPM gasket resilience materials..."
                    value={formAction}
                    onChange={(e) => setFormAction(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                  />
                </div>

                {/* Action Owner */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Action Owner
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ankit Mishra"
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-semibold"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Action Due Date
                  </label>
                  <input 
                    type="date" 
                    value={formDue}
                    onChange={(e) => setFormDue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Action Status
                  </label>
                  <select 
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-bold"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
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
                  Save Failure Mode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
