"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useRisksQuery } from "@/hooks/use-pmo-queries";
import { 
  AlertTriangle, Search, Plus, FileSpreadsheet, Edit3, Trash2, X, RefreshCw
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Risk } from "@/types/pmo";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from "recharts";

export default function RisksPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addRisk = usePmoStore((state) => state.addRisk);
  const updateRisk = usePmoStore((state) => state.updateRisk);
  const deleteRisk = usePmoStore((state) => state.deleteRisk);
  const cycleRiskStatus = usePmoStore((state) => state.cycleRiskStatus);

  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: risks = [], isLoading: isRisksLoading } = useRisksQuery(activeProgrammeId);

  const isLoading = isProgLoading || isRisksLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);

  // Form states
  const [formId, setFormId] = useState("");
  const [formArea, setFormArea] = useState<Risk["area"]>("TECHNICAL");
  const [formDesc, setFormDesc] = useState("");
  const [formProb, setFormProb] = useState<Risk["probability"]>("Med");
  const [formImpact, setFormImpact] = useState<Risk["impact"]>("Med");
  const [formOwner, setFormOwner] = useState("");
  const [formMitigation, setFormMitigation] = useState("");
  const [formTargetClose, setFormTargetClose] = useState("");
  const [formStatus, setFormStatus] = useState<Risk["status"]>("OPEN");
  const [formNotes, setFormNotes] = useState("");

  // Filtered risks list
  const filteredRisks = useMemo(() => {
    return risks
      .filter((r) => {
        const matchesSearch = 
          r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.owner || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesArea = !areaFilter || r.area === areaFilter;
        const matchesStatus = !statusFilter || r.status === statusFilter;
        return matchesSearch && matchesArea && matchesStatus;
      });
  }, [risks, searchQuery, areaFilter, statusFilter]);

  // Open modal
  const handleOpenModal = (r?: Risk) => {
    if (r) {
      setEditingRisk(r);
      setFormId(r.id);
      setFormArea(r.area);
      setFormDesc(r.description);
      setFormProb(r.probability);
      setFormImpact(r.impact);
      setFormOwner(r.owner);
      setFormMitigation(r.mitigation);
      setFormTargetClose(r.target_close || "");
      setFormStatus(r.status);
      setFormNotes(r.notes || "");
    } else {
      setEditingRisk(null);
      // Auto-suggest next ID
      const nextNum = risks.filter(x => x.programme_id === activeProgrammeId).length + 1;
      const code = String(nextNum).padStart(3, '0');
      setFormId(`${activeProgrammeId}-RISK-${code}`);
      setFormArea("TECHNICAL");
      setFormDesc("");
      setFormProb("Med");
      setFormImpact("Med");
      setFormOwner("");
      setFormMitigation("");
      setFormTargetClose("");
      setFormStatus("OPEN");
      setFormNotes("");
    }
    setIsModalOpen(true);
  };

  // Submit form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim() || !formDesc.trim()) {
      alert("Please fill in Risk ID and Description.");
      return;
    }

    const payload = {
      id: formId,
      programme_id: activeProgrammeId,
      area: formArea,
      description: formDesc,
      probability: formProb,
      impact: formImpact,
      owner: formOwner,
      mitigation: formMitigation,
      target_close: formTargetClose || null,
      status: formStatus,
      notes: formNotes
    };

    if (editingRisk) {
      updateRisk(editingRisk.id, payload);
    } else {
      addRisk(payload);
    }
    setIsModalOpen(false);
  };

  // Delete risk
  const handleDeleteRisk = (id: string) => {
    if (confirm(`Are you sure you want to delete Risk ${id}?`)) {
      deleteRisk(id);
    }
  };

  // CSV Export helper
  const handleExportCSV = () => {
    const headers = ["Risk ID", "Area", "Description", "Probability", "Impact", "Owner", "Mitigation Plan", "Target Close Date", "Status", "Notes"];
    const rows = filteredRisks.map((r) => [
      r.id,
      r.area,
      r.description,
      r.probability,
      r.impact,
      r.owner,
      r.mitigation,
      r.target_close || "—",
      r.status,
      r.notes || "—"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `risks_${activeProgrammeId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Risk Score utility
  const getRiskScore = (prob: string, imp: string) => {
    const p = { Low: 1, Med: 2, High: 3 }[prob] || 2;
    const i = { Low: 1, Med: 2, High: 3 }[imp] || 2;
    return p * i;
  };

  const getRiskClassification = (score: number) => {
    if (score >= 6) return { label: "CRITICAL", cls: "bg-red-50 text-red-700 border-red-200 cell-high", dot: "bg-red-600" };
    if (score >= 3) return { label: "WATCH", cls: "bg-amber-50 text-amber-700 border-amber-200 cell-med", dot: "bg-amber-600" };
    return { label: "LOW", cls: "bg-emerald-50 text-emerald-700 border-emerald-200 cell-low", dot: "bg-emerald-600" };
  };

  // Distribute active risks inside matrix
  const matrixData = useMemo(() => {
    const grid: Record<string, Record<string, Risk[]>> = {
      High: { Low: [], Med: [], High: [] },
      Med: { Low: [], Med: [], High: [] },
      Low: { Low: [], Med: [], High: [] }
    };
    risks.forEach((r) => {
      if (r.status === "CLOSED") return;
      const prob = r.probability || "Med";
      const imp = r.impact || "Med";
      if (grid[prob] && grid[prob][imp]) {
        grid[prob][imp].push(r);
      }
    });
    return grid;
  }, [risks]);

  // Risk Burndown Trend over project weeks (Mock/Computed)
  const burndownChartData = useMemo(() => {
    const weeks = activeProgramme?.programme_weeks || 56;
    const data = [];
    
    // Calculate total open risks over weeks (burndown logic)
    let openCount = risks.filter(r => r.status === "OPEN").length;
    let mitigatedCount = risks.filter(r => r.status === "MITIGATED").length;
    let closedCount = risks.filter(r => r.status === "CLOSED").length;

    // Distribute randomly for rendering a beautiful trend
    for (let w = 1; w <= weeks; w += 4) {
      const openWk = Math.max(0, openCount - Math.floor(w / 12));
      const closedWk = Math.min(closedCount + mitigatedCount, closedCount + mitigatedCount + Math.floor(w / 16));
      data.push({
        week: `Wk ${w}`,
        "Open Risks": openWk,
        "Closed/Mitigated": closedWk
      });
    }
    return data;
  }, [risks, activeProgramme]);

  const getStatusBadge = (status: Risk["status"]) => {
    switch (status) {
      case "CLOSED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "MITIGATED": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default: return "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 cursor-pointer";
    }
  };

  const getProbClass = (val: string) => {
    switch (val) {
      case "High": return "bg-red-50 text-red-700 border-red-100 font-bold";
      case "Low": return "bg-emerald-50 text-emerald-700 border-emerald-100 font-medium";
      default: return "bg-amber-50 text-amber-700 border-amber-100 font-semibold";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Risk Registry...</span>
        </div>
      </div>
    );
  }

  if (!activeProgramme) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertTriangle className="w-16 h-16 text-slate-350 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Active Programme</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select a programme to view and manage project risks.
        </p>
      </div>
    );
  }

  // Count high level risks stats
  const totalCount = risks.length;
  const openCount = risks.filter(r => r.status === "OPEN").length;
  const mitigatedCount = risks.filter(r => r.status === "MITIGATED").length;
  const closedCount = risks.filter(r => r.status === "CLOSED").length;

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col p-6 overflow-y-auto bg-bg-base font-sans text-xs space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
            <span>Risk Register & Burndown</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Map project vulnerability matrix and track mitigation burndown milestones.
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
            <span>Identify Risk</span>
          </button>
        </div>
      </div>

      {/* KPI stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Identified</span>
          <span className="text-xl font-black text-navy block mt-2">{totalCount}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-rose-600">Open Risks</span>
          <span className="text-xl font-black text-rose-600 block mt-2">{openCount}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-indigo-600">Mitigated</span>
          <span className="text-xl font-black text-indigo-600 block mt-2">{mitigatedCount}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-emerald-600">Closed</span>
          <span className="text-xl font-black text-emerald-600 block mt-2">{closedCount}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-slate-500">Avg Risk Score</span>
          <span className="text-xl font-black text-navy block mt-2">
            {risks.length 
              ? (risks.reduce((sum, r) => sum + getRiskScore(r.probability, r.impact), 0) / risks.length).toFixed(1)
              : "0.0"
            }
          </span>
        </div>
      </div>

      {/* Recharts trend & Burndown section */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm shrink-0">
        <h3 className="font-bold text-navy text-sm mb-4">Risk Burndown Timeline Chart</h3>
        <div className="w-full h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={burndownChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={9} />
              <YAxis stroke="#94a3b8" fontSize={9} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="Open Risks" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Closed/Mitigated" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3x3 Risk Matrix Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm shrink-0">
        <h3 className="font-bold text-navy text-sm mb-4">Interactive Risk Matrix (Impact × Probability)</h3>
        
        <div className="grid grid-cols-4 gap-2">
          {/* Header Row */}
          <div className="bg-slate-50 border border-slate-200 rounded p-2 flex items-center justify-center font-bold text-slate-400 text-center select-none leading-tight">
            PROBABILITY ↓<br/>IMPACT →
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded p-2 text-center font-bold text-slate-600 select-none">
            Low Impact
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded p-2 text-center font-bold text-slate-600 select-none">
            Med Impact
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded p-2 text-center font-bold text-slate-600 select-none">
            High Impact
          </div>

          {/* Matrix cell rows */}
          {(["High", "Med", "Low"] as Array<Risk["probability"]>).map((prob) => (
            <React.Fragment key={prob}>
              {/* Row Header */}
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5 flex items-center justify-center font-bold text-slate-600 select-none">
                {prob} prob
              </div>
              
              {/* Cells */}
              {(["Low", "Med", "High"] as Array<Risk["impact"]>).map((imp) => {
                const cellRisks = matrixData[prob][imp];
                const score = getRiskScore(prob, imp);
                const config = getRiskClassification(score);
                return (
                  <div key={imp} className={cn("border rounded p-2.5 flex flex-col gap-1 min-h-[90px] transition-all", config.cls)}>
                    <div className="flex items-center justify-between border-b border-inherit pb-1 mb-1.5">
                      <span className="font-black text-[9px] tracking-wide uppercase flex items-center gap-1">
                        <span className={cn("w-1.5 h-1.5 rounded-full inline-block", config.dot)}></span>
                        {config.label}
                      </span>
                      <span className="font-black text-[10px]">{cellRisks.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[100px] scrollbar-thin">
                      {cellRisks.map((r) => (
                        <div 
                          key={r.id} 
                          onClick={() => cycleRiskStatus(r.id)}
                          title={`${r.description} (Mitigation: ${r.mitigation})`}
                          className="bg-white/80 hover:bg-white border border-slate-200/55 rounded px-1.5 py-1 text-[9px] cursor-pointer shadow-3xs flex items-center justify-between gap-1 group/item hover:border-slate-350 transition-colors"
                        >
                          <b className="text-slate-900 font-mono group-hover/item:text-dc-blue transition-colors shrink-0">{r.id.split('-').pop()}</b>
                          <span className="truncate flex-1 text-slate-600 font-medium">{r.description}</span>
                          <span className="bg-slate-100 text-slate-500 border border-slate-200 rounded px-1 py-0.2 shrink-0 scale-90 origin-right leading-none uppercase font-bold text-[7px]">{r.area}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}

        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search risks by ID, description, owner..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs w-full focus:outline-none placeholder-slate-400"
          />
        </div>
        
        <select 
          value={areaFilter} 
          onChange={(e) => setAreaFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer font-medium"
        >
          <option value="">All Areas</option>
          <option value="COMMERCIAL">COMMERCIAL</option>
          <option value="TECHNICAL">TECHNICAL</option>
          <option value="SUPPLY">SUPPLY</option>
          <option value="SCHEDULE">SCHEDULE</option>
          <option value="QUALITY">QUALITY</option>
          <option value="SAFETY">SAFETY</option>
          <option value="COST">COST</option>
          <option value="OTHER">OTHER</option>
        </select>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer font-medium"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="MITIGATED">MITIGATED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1 min-h-[400px]">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] select-none">
              <th className="px-4 py-3">Risk ID</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Risk Description</th>
              <th className="px-4 py-3">Probability</th>
              <th className="px-4 py-3">Impact</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Mitigation Plan</th>
              <th className="px-4 py-3">Target Close</th>
              <th className="px-4 py-3">Status (Click to cycle)</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredRisks.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-16 text-center text-slate-400 italic">
                  No risks found matching search criteria.
                </td>
              </tr>
            ) : (
              filteredRisks.map((r) => {
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 group transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{r.id}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-slate-100 border border-slate-200 text-slate-700 rounded px-1.5 py-0.5 text-[9px] font-bold">
                        {r.area}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{r.description}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-block border rounded px-1.5 py-0.5 text-[9px] uppercase", getProbClass(r.probability))}>
                        {r.probability}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-block border rounded px-1.5 py-0.5 text-[9px] uppercase", getProbClass(r.impact))}>
                        {r.impact}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{r.owner || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate" title={r.mitigation}>
                      {r.mitigation || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{r.target_close || "—"}</td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => cycleRiskStatus(r.id)}
                        className={cn("inline-block border rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wide select-none transition-all shadow-3xs", getStatusBadge(r.status))}
                      >
                        {r.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleOpenModal(r)}
                          className="p-1 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded text-slate-600 hover:text-slate-900 transition-all font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteRisk(r.id)}
                          className="p-1 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded text-slate-400 hover:text-rose-700 transition-all inline-flex items-center cursor-pointer"
                          title="Delete Risk"
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

      {/* Add / Edit Risk Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-sky-400" />
                <span>{editingRisk ? `Edit Risk · ${editingRisk.id}` : "Identify Risk"}</span>
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
                
                {/* Risk ID */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Risk Code ID *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. BG_AUTO-RISK-001"
                    required
                    disabled={!!editingRisk}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue disabled:opacity-50 text-xs font-mono font-bold"
                  />
                </div>

                {/* Area Category */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Risk Area / Domain
                  </label>
                  <select 
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-bold"
                  >
                    <option value="TECHNICAL">TECHNICAL</option>
                    <option value="SUPPLY">SUPPLY</option>
                    <option value="COMMERCIAL">COMMERCIAL</option>
                    <option value="SCHEDULE">SCHEDULE</option>
                    <option value="QUALITY">QUALITY</option>
                    <option value="SAFETY">SAFETY</option>
                    <option value="COST">COST</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                {/* Risk Description */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Risk Description *
                  </label>
                  <textarea 
                    placeholder="Define project vulnerability (e.g. PCB prototype component shortages due to local custom inspection queues)..."
                    required
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-medium"
                  />
                </div>

                {/* Probability */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Probability
                  </label>
                  <select 
                    value={formProb}
                    onChange={(e) => setFormProb(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-bold"
                  >
                    <option value="Low">Low</option>
                    <option value="Med">Med</option>
                    <option value="High">High</option>
                  </select>
                </div>

                {/* Impact */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Impact Severity
                  </label>
                  <select 
                    value={formImpact}
                    onChange={(e) => setFormImpact(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-bold"
                  >
                    <option value="Low">Low</option>
                    <option value="Med">Med</option>
                    <option value="High">High</option>
                  </select>
                </div>

                {/* Owner */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Assignee Owner
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mohd Onais"
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-medium"
                  />
                </div>

                {/* Target Close Date */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Target Close Date
                  </label>
                  <input 
                    type="date" 
                    value={formTargetClose}
                    onChange={(e) => setFormTargetClose(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Risk Status
                  </label>
                  <select 
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-bold"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="MITIGATED">MITIGATED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                {/* Mitigation Plan */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Mitigation Plan *
                  </label>
                  <textarea 
                    placeholder="Provide secondary source vendors, engineering fallbacks, or emergency processes..."
                    required
                    value={formMitigation}
                    onChange={(e) => setFormMitigation(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                  />
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Additional Comments & Notes
                  </label>
                  <textarea 
                    placeholder="E.g. reference meeting dates, customer feedback details..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
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
                  Save Risk Specs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
