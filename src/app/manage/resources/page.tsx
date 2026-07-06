"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useProgrammeResourcesQuery, usePeopleQuery } from "@/hooks/use-pmo-queries";
import { 
  UsersRound, Search, Plus, Edit3, X, UserCheck
} from "lucide-react";
import { ProgrammeResource } from "@/types/pmo";
import { cn } from "@/utils/cn";

export default function ResourcesPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addProgrammeResource = usePmoStore((state) => state.addProgrammeResource);
  const updateProgrammeResource = usePmoStore((state) => state.updateProgrammeResource);
  
  const { data: resources = [], isLoading: isResourcesLoading } = useProgrammeResourcesQuery(activeProgrammeId);
  const { data: people = [], isLoading: isPeopleLoading } = usePeopleQuery();

  const isLoading = isResourcesLoading || isPeopleLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ProgrammeResource | null>(null);

  // Form states
  const [formPersonId, setFormPersonId] = useState("");
  const [formRoleOverride, setFormRoleOverride] = useState("");
  const [formLevel, setFormLevel] = useState("");
  const [formRate, setFormRate] = useState<number>(0);
  const [formCapacity, setFormCapacity] = useState<number>(40);
  const [formAllocated, setFormAllocated] = useState<number>(0);

  // Computed / Joined Data
  const resourcesWithPeople = useMemo(() => {
    return resources.map(res => {
      const person = people.find(p => p.id === res.person_id);
      return {
        ...res,
        personName: person?.name || "Unknown",
        personEmail: person?.email || "",
        avatar_color: person?.avatar_color || "#94a3b8",
        resourceId: person?.resource_id || "—"
      };
    });
  }, [resources, people]);

  // Filtered
  const filteredResources = useMemo(() => {
    return resourcesWithPeople
      .filter((r) => {
        const query = searchQuery.toLowerCase();
        return (
          r.personName.toLowerCase().includes(query) ||
          r.resourceId.toLowerCase().includes(query) ||
          (r.role_override || "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.personName.localeCompare(b.personName));
  }, [resourcesWithPeople, searchQuery]);

  // Open modal
  const handleOpenModal = (resource?: ProgrammeResource) => {
    if (resource) {
      setEditingResource(resource);
      setFormPersonId(resource.person_id);
      setFormRoleOverride(resource.role_override || "");
      setFormLevel(resource.level || "");
      setFormRate(resource.rate_per_hr);
      setFormCapacity(resource.capacity_hr_per_wk);
      setFormAllocated(resource.allocated_hr);
    } else {
      setEditingResource(null);
      setFormPersonId("");
      setFormRoleOverride("");
      setFormLevel("");
      setFormRate(0);
      setFormCapacity(40);
      setFormAllocated(0);
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formPersonId) return;

    if (editingResource) {
      updateProgrammeResource(editingResource.id, {
        person_id: formPersonId,
        role_override: formRoleOverride || undefined,
        level: formLevel || undefined,
        rate_per_hr: formRate,
        capacity_hr_per_wk: formCapacity,
        allocated_hr: formAllocated,
        cost: formRate * formAllocated
      });
    } else {
      addProgrammeResource({
        programme_id: activeProgrammeId,
        person_id: formPersonId,
        role_override: formRoleOverride || undefined,
        level: formLevel || undefined,
        rate_per_hr: formRate,
        capacity_hr_per_wk: formCapacity,
        allocated_hr: formAllocated,
        cost: formRate * formAllocated
      });
    }
    setIsModalOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const totalCost = useMemo(() => filteredResources.reduce((acc, curr) => acc + (curr.cost || 0), 0), [filteredResources]);
  const totalAllocated = useMemo(() => filteredResources.reduce((acc, curr) => acc + (curr.allocated_hr || 0), 0), [filteredResources]);

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Programme Resources...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <UsersRound className="w-6 h-6 text-dc-blue" />
            Programme Resources
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            People assigned specifically to {activeProgrammeId} and their financial impact.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="btn-primary"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Assign Resource
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-dc-blue flex items-center justify-center">
              <UsersRound className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned People</div>
              <div className="text-2xl font-bold text-navy">{filteredResources.length}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="text-xl font-bold">₹</span>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Est. Cost</div>
              <div className="text-2xl font-bold text-navy">₹{totalCost.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Allocated Hrs</div>
              <div className="text-2xl font-bold text-navy">{totalAllocated} hr</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by name, role, or resource ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Resources Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy text-white font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Resource ID</th>
                <th className="px-6 py-4">Person Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4 text-right">Rate / Hr</th>
                <th className="px-6 py-4 text-right">Capacity (Wk)</th>
                <th className="px-6 py-4 text-right">Allocated</th>
                <th className="px-6 py-4 text-right">Cost</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    <UsersRound className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-slate-600">No resources assigned</p>
                    <p className="text-sm mt-1">Assign someone to this programme.</p>
                  </td>
                </tr>
              ) : (
                filteredResources.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{res.resourceId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-sm shrink-0"
                          style={{ backgroundColor: res.avatar_color }}
                        >
                          {getInitials(res.personName)}
                        </div>
                        <span className="font-bold text-navy">{res.personName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{res.role_override || '—'}</td>
                    <td className="px-6 py-4 text-slate-500">{res.level || '—'}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">₹{res.rate_per_hr.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{res.capacity_hr_per_wk} hr</td>
                    <td className="px-6 py-4 text-right font-bold text-dc-blue">{res.allocated_hr} hr</td>
                    <td className="px-6 py-4 text-right font-bold text-navy">₹{res.cost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(res)}
                        className="p-1.5 text-slate-400 hover:text-dc-blue hover:bg-blue-50 rounded transition-colors"
                        title="Edit Assignment"
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-lg text-navy flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-dc-blue" />
                {editingResource ? "Edit Resource Assignment" : "Assign Resource"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="resource-form" onSubmit={handleFormSubmit} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Person <span className="text-red-500">*</span></label>
                  <select
                    value={formPersonId}
                    onChange={(e) => setFormPersonId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue"
                    required
                    disabled={!!editingResource} // Cannot change person once assigned
                  >
                    <option value="">Select a person...</option>
                    {people.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.resource_id || 'No Resource ID'})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Role (Override)</label>
                    <input 
                      type="text" 
                      value={formRoleOverride}
                      onChange={(e) => setFormRoleOverride(e.target.value)}
                      placeholder="e.g. Lead Dev"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Level</label>
                    <input 
                      type="text" 
                      value={formLevel}
                      onChange={(e) => setFormLevel(e.target.value)}
                      placeholder="e.g. Senior"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Rate / Hr (₹)</label>
                    <input 
                      type="number" 
                      value={formRate}
                      onChange={(e) => setFormRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Capacity / Wk</label>
                    <input 
                      type="number" 
                      value={formCapacity}
                      onChange={(e) => setFormCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Allocated Hr</label>
                    <input 
                      type="number" 
                      value={formAllocated}
                      onChange={(e) => setFormAllocated(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue transition-all"
                      required
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-dc-blue">Estimated Total Cost</span>
                    <span className="text-lg font-bold text-navy">₹{(formRate * formAllocated).toLocaleString()}</span>
                  </div>
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
                form="resource-form"
                className="btn-primary"
              >
                {editingResource ? "Save Changes" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
