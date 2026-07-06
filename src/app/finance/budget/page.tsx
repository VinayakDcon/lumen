"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useBudgetQuery } from "@/hooks/use-pmo-queries";
import { 
  LineChart, Search, Plus, Edit3, X, RefreshCw, IndianRupee, TrendingUp, AlertCircle
} from "lucide-react";
import { cn } from "@/utils/cn";
import { BudgetLine } from "@/types/pmo";

export default function BudgetPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addBudgetLine = usePmoStore((state) => state.addBudgetLine);
  const updateBudgetLine = usePmoStore((state) => state.updateBudgetLine);
  
  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: budgetLines = [], isLoading: isBudgetLoading } = useBudgetQuery(activeProgrammeId);

  const isLoading = isProgLoading || isBudgetLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<BudgetLine | null>(null);

  // Form states
  const [formPhase, setFormPhase] = useState("Design");
  const [formCategory, setFormCategory] = useState("Labor");
  const [formLineItem, setFormLineItem] = useState("");
  const [formPlanned, setFormPlanned] = useState(0);
  const [formCommitted, setFormCommitted] = useState(0);
  const [formActual, setFormActual] = useState(0);
  const [formNotes, setFormNotes] = useState("");

  // Unique categories for the dropdown
  const categories = useMemo(() => Array.from(new Set(budgetLines.map(b => b.category))), [budgetLines]);

  // Filtered Budget
  const filteredBudget = useMemo(() => {
    return budgetLines
      .filter((b) => {
        const matchesSearch = 
          b.line_item.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.phase.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (b.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = !categoryFilter || b.category === categoryFilter;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => a.phase.localeCompare(b.phase) || a.id - b.id);
  }, [budgetLines, searchQuery, categoryFilter]);

  // Open modal
  const handleOpenModal = (line?: BudgetLine) => {
    if (line) {
      setEditingLine(line);
      setFormPhase(line.phase);
      setFormCategory(line.category);
      setFormLineItem(line.line_item);
      setFormPlanned(line.planned_amount);
      setFormCommitted(line.committed_amount);
      setFormActual(line.actual_amount);
      setFormNotes(line.notes || "");
    } else {
      setEditingLine(null);
      setFormPhase("Design");
      setFormCategory("Labor");
      setFormLineItem("");
      setFormPlanned(0);
      setFormCommitted(0);
      setFormActual(0);
      setFormNotes("");
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingLine) {
      updateBudgetLine(editingLine.id, {
        phase: formPhase,
        category: formCategory,
        line_item: formLineItem,
        planned_amount: Number(formPlanned),
        committed_amount: Number(formCommitted),
        actual_amount: Number(formActual),
        notes: formNotes || null,
      });
    } else {
      addBudgetLine({
        programme_id: activeProgrammeId,
        phase: formPhase,
        category: formCategory,
        line_item: formLineItem,
        planned_amount: Number(formPlanned),
        committed_amount: Number(formCommitted),
        actual_amount: Number(formActual),
        currency: "INR",
        notes: formNotes || null,
      });
    }
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Budget Data...</span>
        </div>
      </div>
    );
  }

  if (!activeProgramme) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <RefreshCw className="w-16 h-16 text-slate-350 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Active Programme</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select a programme to view and manage its budget.
        </p>
      </div>
    );
  }

  // Count high level stats
  const totalPlanned = budgetLines.reduce((acc, b) => acc + b.planned_amount, 0);
  const totalCommitted = budgetLines.reduce((acc, b) => acc + b.committed_amount, 0);
  const totalActual = budgetLines.reduce((acc, b) => acc + b.actual_amount, 0);
  const totalRemaining = totalPlanned - totalActual;
  const percentSpent = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

  return (
    <div className="page-container fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <LineChart className="w-6 h-6 text-dc-blue" />
            Budget vs Actual
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track programme financial performance and variances.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="btn-primary"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Line Item
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-xl border border-slate-200/60 relative overflow-hidden group hover:border-dc-blue/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <IndianRupee className="w-16 h-16 text-navy" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Planned</div>
          <div className="text-3xl font-extrabold text-navy">₹ {(totalPlanned / 100000).toFixed(2)}L</div>
        </div>
        
        <div className="glass-panel p-5 rounded-xl border border-slate-200/60 relative overflow-hidden group hover:border-dc-blue/30 transition-colors">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Committed (POs Raised)</div>
          <div className="text-3xl font-extrabold text-navy">₹ {(totalCommitted / 100000).toFixed(2)}L</div>
          <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
            <div className="bg-sky-400 h-full" style={{ width: `${Math.min(100, (totalCommitted / totalPlanned) * 100 || 0)}%` }}></div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-200/60 relative overflow-hidden group hover:border-dc-blue/30 transition-colors">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Actual Spent</div>
          <div className="text-3xl font-extrabold text-navy">₹ {(totalActual / 100000).toFixed(2)}L</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(100, percentSpent)}%` }}></div>
            </div>
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{percentSpent.toFixed(0)}% of plan</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-200/60 relative overflow-hidden group hover:border-dc-blue/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            {totalRemaining < 0 ? <AlertCircle className="w-16 h-16 text-rose-600" /> : <TrendingUp className="w-16 h-16 text-emerald-600" />}
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Remaining</div>
          <div className={cn("text-3xl font-extrabold", totalRemaining < 0 ? "text-rose-600" : "text-emerald-700")}>
            ₹ {(totalRemaining / 100000).toFixed(2)}L
          </div>
          <div className="text-xs font-medium text-slate-500 mt-2">
            {totalPlanned > 0 ? (100 - percentSpent).toFixed(0) : 0}% left
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search line items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:bg-white transition-all"
          />
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Budget Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy text-white font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Phase</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Line Item</th>
                <th className="px-6 py-4 text-right">Planned</th>
                <th className="px-6 py-4 text-right">Committed</th>
                <th className="px-6 py-4 text-right">Actual</th>
                <th className="px-6 py-4 text-right">Remaining</th>
                <th className="px-6 py-4 text-center">Variance</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBudget.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    <LineChart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-slate-600">No budget lines found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or add a new line item.</p>
                  </td>
                </tr>
              ) : (
                filteredBudget.map((row) => {
                  const rem = row.planned_amount - row.actual_amount;
                  const variancePct = row.planned_amount > 0 ? ((row.actual_amount - row.planned_amount) / row.planned_amount) * 100 : 0;
                  const isOver = variancePct > 0;
                  
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-medium text-navy">{row.phase}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                          {row.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700">{row.line_item}</div>
                        {row.notes && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{row.notes}</div>}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-600">
                        {row.planned_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500">
                        {row.committed_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-indigo-700">
                        {row.actual_amount.toLocaleString()}
                      </td>
                      <td className={cn("px-6 py-4 text-right font-bold", rem < 0 ? "text-rose-600" : "text-emerald-600")}>
                        {rem.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {variancePct !== 0 ? (
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider",
                            isOver ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                          )}>
                            {isOver ? "+" : ""}{variancePct.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleOpenModal(row)}
                          className="p-1.5 text-slate-400 hover:text-dc-blue hover:bg-blue-50 rounded transition-colors"
                          title="Edit Line Item"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-lg text-navy flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-dc-blue" />
                {editingLine ? "Edit Budget Line" : "Add Budget Line"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="budget-form" onSubmit={handleFormSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phase <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formPhase}
                      onChange={(e) => setFormPhase(e.target.value)}
                      placeholder="e.g. Design, Prototyping..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Category <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="e.g. Labor, Hardware, Travel..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Line Item <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formLineItem}
                      onChange={(e) => setFormLineItem(e.target.value)}
                      placeholder="Description of the cost..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Planned Amount (INR)</label>
                    <input 
                      type="number" 
                      value={formPlanned}
                      onChange={(e) => setFormPlanned(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Committed Amount (INR)</label>
                    <input 
                      type="number" 
                      value={formCommitted}
                      onChange={(e) => setFormCommitted(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Actual Spent (INR)</label>
                    <input 
                      type="number" 
                      value={formActual}
                      onChange={(e) => setFormActual(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notes</label>
                  <textarea 
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Context for variance or spending..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                  />
                </div>

              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-navy hover:bg-slate-200/50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="budget-form"
                className="btn-primary"
              >
                {editingLine ? "Save Changes" : "Add Line"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
