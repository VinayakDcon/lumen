"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useStandardsQuery } from "@/hooks/use-pmo-queries";
import { 
  BookOpen, Search, Plus, Edit3, X, RefreshCw, Link as LinkIcon
} from "lucide-react";
import { Standard } from "@/types/pmo";

export default function StandardsPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addStandard = usePmoStore((state) => state.addStandard);
  const updateStandard = usePmoStore((state) => state.updateStandard);
  
  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: standards = [], isLoading: isStdsLoading } = useStandardsQuery();

  const isLoading = isProgLoading || isStdsLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStd, setEditingStd] = useState<Standard | null>(null);

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formAuthority, setFormAuthority] = useState("");
  const [formMarket, setFormMarket] = useState("Global");
  const [formVersion, setFormVersion] = useState("");
  const [formAppliesTo, setFormAppliesTo] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formLink, setFormLink] = useState("");

  // Unique markets
  const markets = useMemo(() => Array.from(new Set(standards.map(s => s.market))), [standards]);

  // Filtered
  const filteredStds = useMemo(() => {
    return standards
      .filter((s) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          s.code.toLowerCase().includes(query) ||
          s.title.toLowerCase().includes(query) ||
          (s.tags.join(" ").toLowerCase().includes(query));
        const matchesMarket = !marketFilter || s.market === marketFilter;
        // In a real app we might filter standards by what applies to the programme, 
        // but for a general library, we might show all. We'll show all here.
        return matchesSearch && matchesMarket;
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [standards, searchQuery, marketFilter]);

  // Open modal
  const handleOpenModal = (std?: Standard) => {
    if (std) {
      setEditingStd(std);
      setFormCode(std.code);
      setFormTitle(std.title);
      setFormAuthority(std.authority);
      setFormMarket(std.market);
      setFormVersion(std.version);
      setFormAppliesTo(std.applies_to);
      setFormSummary(std.summary || "");
      setFormTags(std.tags.join(", "));
      setFormLink(std.link_url || "");
    } else {
      setEditingStd(null);
      setFormCode("");
      setFormTitle("");
      setFormAuthority("");
      setFormMarket("Global");
      setFormVersion("");
      setFormAppliesTo("");
      setFormSummary("");
      setFormTags("");
      setFormLink("");
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tagsArray = formTags.split(",").map(t => t.trim()).filter(t => t.length > 0);

    if (editingStd) {
      updateStandard(editingStd.id, {
        code: formCode,
        title: formTitle,
        authority: formAuthority,
        market: formMarket,
        version: formVersion,
        applies_to: formAppliesTo,
        summary: formSummary || null,
        tags: tagsArray,
        link_url: formLink || null,
      });
    } else {
      addStandard({
        programme_id: activeProgrammeId,
        code: formCode,
        title: formTitle,
        authority: formAuthority,
        market: formMarket,
        version: formVersion,
        applies_to: formAppliesTo,
        summary: formSummary || null,
        tags: tagsArray,
        link_url: formLink || null,
      });
    }
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Standards Library...</span>
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
          Please select a programme to access the standards library.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-dc-blue" />
            Standards Library
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Central repository of engineering, quality, and regulatory compliance standards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="btn-primary"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Standard
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Filter by code / market / topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:bg-white transition-all"
          />
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <select 
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue"
          >
            <option value="">All Markets</option>
            {markets.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Standards Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy text-white font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Authority</th>
                <th className="px-6 py-4">Market</th>
                <th className="px-6 py-4">Version</th>
                <th className="px-6 py-4">Applies To</th>
                <th className="px-6 py-4">Tags</th>
                <th className="px-6 py-4 w-64">Summary</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStds.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-slate-600">No standards found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or add a new standard.</p>
                  </td>
                </tr>
              ) : (
                filteredStds.map((std) => (
                  <tr key={std.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-navy flex items-center gap-1.5">
                        {std.code}
                        {std.link_url && std.link_url !== '#' && (
                          <a href={std.link_url} target="_blank" rel="noreferrer" className="text-dc-blue hover:text-blue-700">
                            <LinkIcon className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{std.title}</td>
                    <td className="px-6 py-4 text-slate-600">{std.authority}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                        {std.market}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-medium text-slate-600">{std.version}</td>
                    <td className="px-6 py-4 text-slate-600">{std.applies_to}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {std.tags.map(t => (
                          <span key={t} className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 truncate max-w-xs" title={std.summary || ""}>
                      {std.summary || "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(std)}
                        className="p-1.5 text-slate-400 hover:text-dc-blue hover:bg-blue-50 rounded transition-colors"
                        title="Edit Standard"
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
                <BookOpen className="w-5 h-5 text-dc-blue" />
                {editingStd ? "Edit Standard" : "Add Standard Record"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="std-form" onSubmit={handleFormSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Code <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="e.g. ISO 26262"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Title <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Road vehicles — Functional safety"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Authority <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formAuthority}
                      onChange={(e) => setFormAuthority(e.target.value)}
                      placeholder="e.g. ISO, ARAI, DIN..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Market <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formMarket}
                      onChange={(e) => setFormMarket(e.target.value)}
                      placeholder="e.g. Global, India, Europe..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Version <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formVersion}
                      onChange={(e) => setFormVersion(e.target.value)}
                      placeholder="e.g. 2018, Rev 1..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Applies To <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formAppliesTo}
                      onChange={(e) => setFormAppliesTo(e.target.value)}
                      placeholder="e.g. Electronics, Battery Pack..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Summary</label>
                  <textarea 
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    placeholder="Brief description of the standard..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tags (comma separated)</label>
                  <input 
                    type="text" 
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="e.g. Safety, Automotive, Testing..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Link URL</label>
                  <input 
                    type="url" 
                    value={formLink}
                    onChange={(e) => setFormLink(e.target.value)}
                    placeholder="https://..."
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
                form="std-form"
                className="btn-primary"
              >
                {editingStd ? "Save Changes" : "Add Standard"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
