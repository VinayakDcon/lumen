"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useQuotesQuery } from "@/hooks/use-pmo-queries";
import { 
  FileSpreadsheet, Search, Plus, Edit3, X, RefreshCw, FileText, CheckCircle, HandCoins
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Quote } from "@/types/pmo";

export default function QuotesPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addQuote = usePmoStore((state) => state.addQuote);
  const updateQuote = usePmoStore((state) => state.updateQuote);
  const currentUser = usePmoStore((state) => state.user);
  
  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: quotes = [], isLoading: isQuotesLoading } = useQuotesQuery(activeProgrammeId);

  const isLoading = isProgLoading || isQuotesLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("TOOLING");
  const [formDecisionDate, setFormDecisionDate] = useState("");
  const [formStatus, setFormStatus] = useState<Quote["status"]>("OPEN");
  const [formNotes, setFormNotes] = useState("");

  // Filtered quotes
  const filteredQuotes = useMemo(() => {
    return quotes
      .filter((q) => {
        const matchesSearch = 
          q.quote_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (q.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || q.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.id - a.id);
  }, [quotes, searchQuery, statusFilter]);

  // Open modal
  const handleOpenModal = (q?: Quote) => {
    if (q) {
      setEditingQuote(q);
      setFormCode(q.quote_code);
      setFormTitle(q.title);
      setFormDesc(q.description || "");
      setFormCategory(q.category || "TOOLING");
      setFormDecisionDate(q.target_decision_date || "");
      setFormStatus(q.status);
      setFormNotes(q.decision_notes || "");
    } else {
      setEditingQuote(null);
      const nextNum = quotes.length + 1;
      setFormCode(`RFQ-${String(nextNum).padStart(4, "0")}`);
      setFormTitle("");
      setFormDesc("");
      setFormCategory("TOOLING");
      setFormDecisionDate("");
      setFormStatus("OPEN");
      setFormNotes("");
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Please fill in Quote Title.");
      return;
    }

    if (editingQuote) {
      updateQuote(editingQuote.id, {
        title: formTitle,
        description: formDesc || null,
        category: formCategory,
        target_decision_date: formDecisionDate || null,
        status: formStatus,
        decision_notes: formNotes || null
      });
    } else {
      addQuote({
        programme_id: activeProgrammeId,
        quote_code: formCode,
        title: formTitle,
        description: formDesc || null,
        category: formCategory,
        target_decision_date: formDecisionDate || null,
        status: formStatus,
        raised_by: currentUser?.name || "System"
      } as any);
    }
    setIsModalOpen(false);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "SELECTED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "DECLINED": return "bg-rose-50 text-rose-700 border-rose-200";
      case "UNDER_EVAL": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "RECEIVED": return "bg-sky-50 text-sky-700 border-sky-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Quotes...</span>
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
          Please select a programme to view and manage Request for Quotes (RFQs).
        </p>
      </div>
    );
  }

  // Count high level stats
  const kpiTotal = quotes.length;
  const kpiSelected = quotes.filter(q => q.status === "SELECTED").length;
  const kpiUnderEval = quotes.filter(q => q.status === "UNDER_EVAL").length;
  const kpiOpen = quotes.filter(q => q.status === "OPEN" || q.status === "RECEIVED").length;

  return (
    <div className="page-container fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-dc-blue" />
            Quotes (Compare)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage Request for Quotes and compare vendor bids.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="btn-primary"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New RFQ
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-xl border border-slate-200/60 relative overflow-hidden group hover:border-dc-blue/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileSpreadsheet className="w-16 h-16 text-navy" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total RFQs</div>
          <div className="text-3xl font-extrabold text-navy">{kpiTotal}</div>
        </div>
        
        <div className="glass-panel p-5 rounded-xl border border-emerald-200/60 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle className="w-16 h-16 text-emerald-600" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Selected</div>
          <div className="text-3xl font-extrabold text-emerald-700">{kpiSelected}</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-indigo-200/60 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <HandCoins className="w-16 h-16 text-indigo-600" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Under Eval</div>
          <div className="text-3xl font-extrabold text-indigo-700">{kpiUnderEval}</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-amber-200/60 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText className="w-16 h-16 text-amber-600" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Open / Recv</div>
          <div className="text-3xl font-extrabold text-amber-700">{kpiOpen}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:bg-white transition-all"
          />
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="RECEIVED">Received</option>
            <option value="UNDER_EVAL">Under Evaluation</option>
            <option value="SELECTED">Selected</option>
            <option value="DECLINED">Declined</option>
          </select>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">RFQ Code</th>
                <th className="px-6 py-4">Title & Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Target Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-slate-600">No quotes found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {quote.quote_code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-navy">{quote.title}</div>
                      {quote.description && (
                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{quote.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wider bg-slate-100 text-slate-600">
                        {quote.category?.replace("_", " ") || "GENERAL"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {quote.target_decision_date ? (
                        new Date(quote.target_decision_date).toLocaleDateString()
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border",
                        getStatusBadgeClass(quote.status)
                      )}>
                        {quote.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(quote)}
                        className="p-1.5 text-slate-400 hover:text-dc-blue hover:bg-blue-50 rounded transition-colors"
                        title="Edit RFQ"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
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
                <FileSpreadsheet className="w-5 h-5 text-dc-blue" />
                {editingQuote ? "Edit RFQ" : "New Request For Quote"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="quote-form" onSubmit={handleFormSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">RFQ Code</label>
                    <input 
                      type="text" 
                      value={formCode}
                      disabled
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 font-mono"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Title <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. PCB Assembly Batch 1"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    >
                      <option value="TOOLING">Tooling</option>
                      <option value="PCB_FAB">PCB Fab</option>
                      <option value="SMT">SMT</option>
                      <option value="LOGISTICS">Logistics</option>
                      <option value="SERVICES">Services</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    >
                      <option value="OPEN">Open</option>
                      <option value="RECEIVED">Received Quotes</option>
                      <option value="UNDER_EVAL">Under Evaluation</option>
                      <option value="SELECTED">Vendor Selected</option>
                      <option value="DECLINED">Declined/Closed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Target Decision Date</label>
                    <input 
                      type="date" 
                      value={formDecisionDate}
                      onChange={(e) => setFormDecisionDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description</label>
                  <textarea 
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Provide details about the scope of work..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                  />
                </div>

                {editingQuote && formStatus === "SELECTED" && (
                  <div className="space-y-1.5 bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
                    <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Decision Notes</label>
                    <textarea 
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Why was this vendor selected?"
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                )}
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="quote-form"
                className="btn-primary"
              >
                {editingQuote ? "Save Changes" : "Create RFQ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
