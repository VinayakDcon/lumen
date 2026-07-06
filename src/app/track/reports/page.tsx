"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useEvmReportQuery } from "@/hooks/use-pmo-queries";
import { 
  TrendingUp, RefreshCw, AlertTriangle
} from "lucide-react";
import { cn } from "@/utils/cn";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ReferenceLine 
} from "recharts";

export default function EvmReportsPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const hideCommercials = usePmoStore((state) => state.hideCommercials);
  
  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  
  // As-of week state
  const [selectedWeekStr, setSelectedWeekStr] = useState("");
  const [activeWeek, setActiveWeek] = useState<number | undefined>(undefined);

  // Fetch EVM Report
  const { data: evm, isLoading: isEvmLoading, refetch } = useEvmReportQuery(activeProgrammeId, activeWeek);

  const isLoading = isProgLoading || isEvmLoading;

  const handleRefresh = (e: React.FormEvent) => {
    e.preventDefault();
    const wkNum = selectedWeekStr ? parseInt(selectedWeekStr) : undefined;
    setActiveWeek(wkNum);
    refetch();
  };

  // Synchronize internal input value once EVM data is loaded
  React.useEffect(() => {
    if (evm && !selectedWeekStr) {
      setSelectedWeekStr(String(evm.todayWeek));
    }
  }, [evm]);

  // Formatting helper for currency (INR)
  const formatINR = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value);
  };

  const getMetricStyle = (val: number, isIndex = false) => {
    const threshold = isIndex ? 1.0 : 0;
    if (val >= threshold) return "text-emerald-700 font-bold bg-emerald-50/50 border-emerald-100";
    return "text-red-700 font-bold bg-red-50/50 border-red-100";
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading EVM Report...</span>
        </div>
      </div>
    );
  }

  if (!activeProgramme || !evm) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <TrendingUp className="w-16 h-16 text-slate-350 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Active Programme</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select a programme to generate and review Earned Value reports.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col p-6 overflow-y-auto bg-bg-base font-sans text-xs space-y-6">
      
      {/* Header filter controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">
          EVM · BCWS / BCWP / ACWP · CV / SV / CPI / SPI / EAC
        </div>
        
        <form onSubmit={handleRefresh} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold">As-of week:</span>
            <input 
              type="number" 
              min={1}
              max={100}
              value={selectedWeekStr}
              onChange={(e) => setSelectedWeekStr(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-center font-mono text-xs w-16 focus:outline-none focus:border-dc-blue"
            />
          </div>
          <button 
            type="submit"
            className="flex items-center gap-1 bg-slate-900 hover:bg-black text-white font-bold px-3 py-1 rounded transition-colors text-xs cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </form>
      </div>

      {/* 10-Grid Metric Cards Panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* KPI 1: BAC */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Budget (BAC)</span>
          <span className={cn("text-lg font-black text-navy block mt-2", hideCommercials && "commercial-hidden w-24 h-6 mx-auto")}>
            {!hideCommercials && formatINR(evm.totalBudget)}
          </span>
        </div>

        {/* KPI 2: BCWS */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Planned Value (BCWS)</span>
          <span className={cn("text-lg font-black text-navy block mt-2", hideCommercials && "commercial-hidden w-24 h-6 mx-auto")}>
            {!hideCommercials && formatINR(evm.bcws)}
          </span>
        </div>

        {/* KPI 3: BCWP */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Earned Value (BCWP)</span>
          <span className={cn("text-lg font-black text-navy block mt-2", hideCommercials && "commercial-hidden w-24 h-6 mx-auto")}>
            {!hideCommercials && formatINR(evm.bcwp)}
          </span>
        </div>

        {/* KPI 4: ACWP */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Actual Cost (ACWP)</span>
          <span className={cn("text-lg font-black text-navy block mt-2", hideCommercials && "commercial-hidden w-24 h-6 mx-auto")}>
            {!hideCommercials && formatINR(evm.acwp)}
          </span>
        </div>

        {/* KPI 5: CV */}
        <div className={cn("border rounded-lg p-4 shadow-sm text-center transition-colors", getMetricStyle(evm.cv))}>
          <span className="text-[9px] uppercase tracking-wider block opacity-75">Cost Variance (CV)</span>
          <span className={cn("text-lg font-black block mt-2", hideCommercials && "commercial-hidden w-24 h-6 mx-auto bg-slate-200")}>
            {!hideCommercials && `${evm.cv >= 0 ? "+" : ""}${formatINR(evm.cv)}`}
          </span>
        </div>

        {/* KPI 6: SV */}
        <div className={cn("border rounded-lg p-4 shadow-sm text-center transition-colors", getMetricStyle(evm.sv))}>
          <span className="text-[9px] uppercase tracking-wider block opacity-75">Schedule Variance (SV)</span>
          <span className={cn("text-lg font-black block mt-2", hideCommercials && "commercial-hidden w-24 h-6 mx-auto bg-slate-200")}>
            {!hideCommercials && `${evm.sv >= 0 ? "+" : ""}${formatINR(evm.sv)}`}
          </span>
        </div>

        {/* KPI 7: CPI */}
        <div className={cn("border rounded-lg p-4 shadow-sm text-center transition-colors", getMetricStyle(evm.cpi, true))}>
          <span className="text-[9px] uppercase tracking-wider block opacity-75">CPI</span>
          <span className="text-lg font-black block mt-2">{evm.cpi.toFixed(2)}</span>
          <span className="text-[9px] block font-normal opacity-60 mt-0.5">BCWP / ACWP</span>
        </div>

        {/* KPI 8: SPI */}
        <div className={cn("border rounded-lg p-4 shadow-sm text-center transition-colors", getMetricStyle(evm.spi, true))}>
          <span className="text-[9px] uppercase tracking-wider block opacity-75">SPI</span>
          <span className="text-lg font-black block mt-2">{evm.spi.toFixed(2)}</span>
          <span className="text-[9px] block font-normal opacity-60 mt-0.5">BCWP / BCWS</span>
        </div>

        {/* KPI 9: EAC */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">EAC</span>
          <span className={cn("text-lg font-black text-navy block mt-2", hideCommercials && "commercial-hidden w-24 h-6 mx-auto")}>
            {!hideCommercials && formatINR(evm.eac)}
          </span>
        </div>

        {/* KPI 10: ETC */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">ETC</span>
          <span className={cn("text-lg font-black text-navy block mt-2", hideCommercials && "commercial-hidden w-24 h-6 mx-auto")}>
            {!hideCommercials && formatINR(evm.etc)}
          </span>
        </div>

      </div>

      {/* Recharts Cumulative EVM Line Chart Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <h3 className="font-bold text-navy text-sm mb-4">EVM Curves - Cumulative ₹ vs Week</h3>
        
        {hideCommercials ? (
          <div className="h-80 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg text-slate-400 select-none gap-2">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            <span className="font-semibold text-xs text-slate-500">Commercial Chart Hidden</span>
            <span className="text-[10px] text-slate-400">Toggle Commercials in the topbar to view cumulative values chart.</span>
          </div>
        ) : (
          <div className="h-80 w-full text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={evm.series.slice(0, activeProgramme.programme_weeks || 56)}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis 
                  dataKey="week" 
                  tickFormatter={(wk) => `Wk ${wk}`} 
                  stroke="#94A3B8" 
                  tick={{ fontSize: 9 }}
                />
                <YAxis 
                  stroke="#94A3B8" 
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 9 }}
                />
                <Tooltip 
                  formatter={(val: any) => [val !== undefined && val !== null ? formatINR(Number(val)) : "—", ""]} 
                  labelFormatter={(wk) => `Week ${wk}`}
                  contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "6px", border: "1px solid #E2E8F0" }}
                />
                <Legend iconType="circle" />
                
                {/* As-of Week Vertical Line */}
                <ReferenceLine 
                  x={evm.todayWeek} 
                  stroke="#C62828" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ value: `As of Wk ${evm.todayWeek}`, fill: "#C62828", position: "top", fontSize: 10, fontWeight: "bold" }}
                />

                {/* BCWS (Planned Value) - Blue */}
                <Line 
                  type="monotone" 
                  dataKey="bcws" 
                  name="BCWS (Planned)" 
                  stroke="#0B5BAF" 
                  strokeWidth={2.5} 
                  dot={false} 
                />

                {/* BCWP (Earned Value) - Green */}
                <Line 
                  type="monotone" 
                  dataKey="bcwp" 
                  name="BCWP (Earned)" 
                  stroke="#2E7D32" 
                  strokeWidth={2.5} 
                  dot={false} 
                />

                {/* ACWP (Actual Cost) - Orange */}
                <Line 
                  type="monotone" 
                  dataKey="acwp" 
                  name="ACWP (Actual)" 
                  stroke="#E65100" 
                  strokeWidth={2.5} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}
