"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useToolingQuery } from "@/hooks/use-pmo-queries";
import { 
  Wrench, Search, Plus, Edit3, X, RefreshCw
} from "lucide-react";
import { cn } from "@/utils/cn";
import { ToolingPart } from "@/types/pmo";

export default function ToolingPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addToolingPart = usePmoStore((state) => state.addToolingPart);
  const updateToolingPart = usePmoStore((state) => state.updateToolingPart);
  
  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: tooling = [], isLoading: isToolingLoading } = useToolingQuery(activeProgrammeId);

  const isLoading = isProgLoading || isToolingLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolingPart | null>(null);

  // Form states
  const [formToolCode, setFormToolCode] = useState("");
  const [formPartName, setFormPartName] = useState("");
  const [formType, setFormType] = useState("Injection Mold");
  const [formVendor, setFormVendor] = useState("");
  const [formCountry, setFormCountry] = useState("India");
  const [formCost, setFormCost] = useState(0);
  const [formLeadTime, setFormLeadTime] = useState(0);
  const [formStatus, setFormStatus] = useState<ToolingPart["status"]>("DESIGN");
  const [formLocation, setFormLocation] = useState("");
  const [formOwner, setFormOwner] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Filtered
  const filteredTooling = useMemo(() => {
    return tooling
      .filter((t) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          t.tool_code.toLowerCase().includes(query) ||
          t.part_name.toLowerCase().includes(query) ||
          t.vendor.toLowerCase().includes(query);
        const matchesStatus = !statusFilter || t.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.id - a.id);
  }, [tooling, searchQuery, statusFilter]);

  // Open modal
  const handleOpenModal = (tool?: ToolingPart) => {
    if (tool) {
      setEditingTool(tool);
      setFormToolCode(tool.tool_code);
      setFormPartName(tool.part_name);
      setFormType(tool.type);
      setFormVendor(tool.vendor);
      setFormCountry(tool.country);
      setFormCost(tool.cost);
      setFormLeadTime(tool.lead_time_wk);
      setFormStatus(tool.status);
      setFormLocation(tool.location);
      setFormOwner(tool.owner);
      setFormNotes(tool.notes || "");
    } else {
      setEditingTool(null);
      setFormToolCode("");
      setFormPartName("");
      setFormType("Injection Mold");
      setFormVendor("");
      setFormCountry("India");
      setFormCost(0);
      setFormLeadTime(0);
      setFormStatus("DESIGN");
      setFormLocation("");
      setFormOwner("");
      setFormNotes("");
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTool) {
      updateToolingPart(editingTool.id, {
        tool_code: formToolCode,
        part_name: formPartName,
        type: formType,
        vendor: formVendor,
        country: formCountry,
        cost: Number(formCost),
        lead_time_wk: Number(formLeadTime),
        status: formStatus,
        location: formLocation,
        owner: formOwner,
        notes: formNotes || null,
      });
    } else {
      addToolingPart({
        programme_id: activeProgrammeId,
        tool_code: formToolCode,
        part_name: formPartName,
        type: formType,
        vendor: formVendor,
        country: formCountry,
        cost: Number(formCost),
        currency: "INR", // Hardcoded for simplicity in this demo
        lead_time_wk: Number(formLeadTime),
        status: formStatus,
        location: formLocation,
        owner: formOwner,
        notes: formNotes || null,
      });
    }
    setIsModalOpen(false);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "RELEASED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "T1_TRIAL":
      case "T2_TRIAL": return "bg-amber-50 text-amber-700 border-amber-200";
      case "FABRICATION": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "DESIGN": return "bg-sky-50 text-sky-700 border-sky-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Tooling Tracking...</span>
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
          Please select a programme to view and manage tooling parts.
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
            <Wrench className="w-6 h-6 text-dc-blue" />
            Tooling Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track injection molds, jigs, and fixtures across their lifecycle.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="btn-primary"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Tool
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search tools or parts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:bg-white transition-all"
          />
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue"
          >
            <option value="">All Statuses</option>
            <option value="DESIGN">Design</option>
            <option value="FABRICATION">Fabrication</option>
            <option value="T1_TRIAL">T1 Trial</option>
            <option value="T2_TRIAL">T2 Trial</option>
            <option value="RELEASED">Released</option>
          </select>
        </div>
      </div>

      {/* Tooling Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy text-white font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Tool Code</th>
                <th className="px-6 py-4">Part</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">Cost (₹)</th>
                <th className="px-6 py-4">Lead (Wk)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTooling.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-500">
                    <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-slate-600">No tools found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or add a new tool.</p>
                  </td>
                </tr>
              ) : (
                filteredTooling.map((tool) => (
                  <tr key={tool.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-mono font-bold text-navy">{tool.tool_code}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{tool.part_name}</td>
                    <td className="px-6 py-4 text-slate-600">{tool.type}</td>
                    <td className="px-6 py-4 text-slate-700">{tool.vendor}</td>
                    <td className="px-6 py-4 text-slate-600">{tool.country}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{tool.cost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-600">{tool.lead_time_wk} wk</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border",
                        getStatusBadgeClass(tool.status)
                      )}>
                        {tool.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{tool.location}</td>
                    <td className="px-6 py-4 text-slate-700">{tool.owner}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(tool)}
                        className="p-1.5 text-slate-400 hover:text-dc-blue hover:bg-blue-50 rounded transition-colors"
                        title="Edit Tool"
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
                <Wrench className="w-5 h-5 text-dc-blue" />
                {editingTool ? "Edit Tool" : "Add Tool Record"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="tool-form" onSubmit={handleFormSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tool Code <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formToolCode}
                      onChange={(e) => setFormToolCode(e.target.value)}
                      placeholder="e.g. TL-26-001"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Part Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formPartName}
                      onChange={(e) => setFormPartName(e.target.value)}
                      placeholder="e.g. Housing Bottom"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tool Type <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      placeholder="e.g. Injection Mold, Assembly Jig..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    >
                      <option value="DESIGN">Design</option>
                      <option value="FABRICATION">Fabrication</option>
                      <option value="T1_TRIAL">T1 Trial</option>
                      <option value="T2_TRIAL">T2 Trial</option>
                      <option value="RELEASED">Released</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Vendor <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formVendor}
                      onChange={(e) => setFormVendor(e.target.value)}
                      placeholder="Vendor building the tool"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Country</label>
                    <input 
                      type="text" 
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Cost</label>
                    <input 
                      type="number" 
                      value={formCost}
                      onChange={(e) => setFormCost(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Lead Time (Weeks)</label>
                    <input 
                      type="number" 
                      value={formLeadTime}
                      onChange={(e) => setFormLeadTime(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Current Location</label>
                    <input 
                      type="text" 
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Owner</label>
                    <input 
                      type="text" 
                      value={formOwner}
                      onChange={(e) => setFormOwner(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notes</label>
                  <textarea 
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Progress notes, shipping details..."
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
                form="tool-form"
                className="btn-primary"
              >
                {editingTool ? "Save Changes" : "Add Tool"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
