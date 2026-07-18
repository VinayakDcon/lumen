"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { 
  useResourcesQuery, 
  usePeopleQuery, 
  useTasksQuery,
  useProgrammesQuery,
  useCreateResourceMutation,
  useUpdateResourceMutation
} from "@/hooks/use-pmo-queries";
import { 
  UsersRound, Search, Plus, Edit3, X, UserCheck
} from "lucide-react";
import { cn } from "@/utils/cn";

export default function ResourcesPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const currentUser = usePmoStore((state) => state.user);

  const { data: programmes = [] } = useProgrammesQuery();

  // Find the active programme to access its team_members
  const activeProgramme = useMemo(
    () => programmes.find((p) => p.id === activeProgrammeId),
    [programmes, activeProgrammeId]
  );
  
  const { data: resources = [], isLoading: isResourcesLoading } = useResourcesQuery();
  const { data: people = [], isLoading: isPeopleLoading } = usePeopleQuery();
  const { data: tasks = [], isLoading: isTasksLoading } = useTasksQuery(activeProgrammeId);

  const createResourceMutation = useCreateResourceMutation();
  const updateResourceMutation = useUpdateResourceMutation();

  const isLoading = isResourcesLoading || isPeopleLoading || isTasksLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any | null>(null);

  // Form states
  const [formPersonId, setFormPersonId] = useState("");
  const [formRoleOverride, setFormRoleOverride] = useState("");
  const [formLevel, setFormLevel] = useState("");
  const [formRate, setFormRate] = useState<number>(0);
  const [formCapacity, setFormCapacity] = useState<number>(45);
  const [formAllocated, setFormAllocated] = useState<number>(0);

  // Derive people from programme team_members (set during wizard creation)
  const teamMemberPeople = useMemo(() => {
    const rawMembers: string[] = Array.isArray(activeProgramme?.team_members)
      ? (activeProgramme!.team_members as string[])
      : [];
    const personIds = new Set<string>(
      rawMembers
        .filter((m) => typeof m === "string" && m.startsWith("person-"))
        .map((m) => m.replace("person-", ""))
    );
    return people.filter((p) => personIds.has(String(p.id)));
  }, [activeProgramme, people]);

  // Helper to calculate allocated hours for a resource
  const resourceAllocHr = (resourceId: string) => {
    let alloc = 0;
    for (const t of tasks) {
      if (t.level !== 3) continue;
      const resField = t.resources || '';
      const resList = resField.split(',').map((s) => s.trim().toUpperCase());
      if (resList.includes(resourceId.toUpperCase())) {
        const n = resList.filter(Boolean).length || 1;
        alloc += (t.effort_hr || t.plan_hr || 0) / n;
      }
    }
    return Math.round(alloc);
  };

  // Computed / Joined Data — merge resources table with team-member-derived rows
  const resourcesWithPeople = useMemo(() => {
    const rawMembers: string[] = Array.isArray(activeProgramme?.team_members)
      ? (activeProgramme!.team_members as string[])
      : [];

    const legacyResourceIds = new Set<string>(
      rawMembers.filter((m) => typeof m === "string" && !m.startsWith("person-"))
    );

    const assignedResourceIds = new Set<string>(
      teamMemberPeople.map((p) => p.resource_id).filter(Boolean) as string[]
    );

    const rows: any[] = [];

    // 1. Loop through assigned people
    for (const person of teamMemberPeople) {
      const r = person.resource_id ? resources.find((x) => x.id === person.resource_id) : null;
      if (r) {
        const alloc = resourceAllocHr(r.id);
        rows.push({
          id: `person-${person.id}`,
          resourceId: r.id,
          personName: person.name,
          personEmail: person.email || '',
          avatar_color: person.avatar_color || '#1E90E8',
          role_override: r.name || r.id,
          level: r.level || person.role || '—',
          rate_per_hr: r.rate_inr || 0,
          capacity_hr_per_wk: r.capacity_hr_per_wk || 45,
          allocated_hr: alloc,
          cost: alloc * (r.rate_inr || 0),
          isTeamMember: true,
          hasResourceLink: true,
          rawResource: r,
          rawPerson: person
        });
      } else {
        rows.push({
          id: `person-${person.id}`,
          resourceId: person.resource_id || '—',
          personName: person.name,
          personEmail: person.email || '',
          avatar_color: person.avatar_color || '#1E90E8',
          role_override: person.role || '—',
          level: '—',
          rate_per_hr: 0,
          capacity_hr_per_wk: 0,
          allocated_hr: 0,
          cost: 0,
          isTeamMember: true,
          hasResourceLink: false,
          rawPerson: person
        });
      }
    }

    // 2. Loop through legacy resource IDs
    for (const rid of legacyResourceIds) {
      if (assignedResourceIds.has(rid)) continue;
      const r = resources.find((x) => x.id === rid);
      if (!r) continue;
      const alloc = resourceAllocHr(r.id);
      rows.push({
        id: `resource-${r.id}`,
        resourceId: r.id,
        personName: r.name || r.id,
        personEmail: '',
        avatar_color: '#64748b',
        role_override: r.name || r.id,
        level: r.level || '—',
        rate_per_hr: r.rate_inr || 0,
        capacity_hr_per_wk: r.capacity_hr_per_wk || 45,
        allocated_hr: alloc,
        cost: alloc * (r.rate_inr || 0),
        isTeamMember: false,
        hasResourceLink: true,
        rawResource: r
      });
    }

    return rows;
  }, [resources, people, teamMemberPeople, tasks, activeProgramme?.team_members]);

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
  const handleOpenModal = (resource?: any) => {
    if (resource) {
      setEditingResource(resource);
      setFormPersonId(resource.resourceId);
      setFormRoleOverride(resource.personName || "");
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
      setFormCapacity(45);
      setFormAllocated(0);
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formPersonId) return;
    const actor = currentUser?.username || 'System';

    if (editingResource && editingResource.resourceId) {
      updateResourceMutation.mutate({
        id: editingResource.resourceId,
        name: formRoleOverride || undefined,
        level: formLevel || undefined,
        rate_inr: formRate,
        capacity_hr_per_wk: formCapacity,
        actor
      });
    } else {
      createResourceMutation.mutate({
        id: formPersonId,
        name: formRoleOverride || formPersonId,
        level: formLevel || undefined,
        rate_inr: formRate,
        capacity_hr_per_wk: formCapacity,
        actor
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
                  <tr key={res.id} className={cn("hover:bg-slate-50/80 transition-colors group", !res.hasResourceLink ? "bg-amber-50/10" : "")}>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{res.resourceId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-sm shrink-0"
                          style={{ backgroundColor: res.avatar_color }}
                        >
                          {getInitials(res.personName)}
                        </div>
                        <div>
                          <span className="font-bold text-navy">{res.personName}</span>
                          {res.isTeamMember && (
                            <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                              Team Member
                            </span>
                          )}
                          {!res.hasResourceLink && (
                            <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                              No Resource ID Linked
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{res.role_override || '—'}</td>
                    <td className="px-6 py-4 text-slate-500">{res.level || '—'}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">₹{res.rate_per_hr.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{res.capacity_hr_per_wk} hr</td>
                    <td className="px-6 py-4 text-right font-bold text-dc-blue">{res.allocated_hr} hr</td>
                    <td className="px-6 py-4 text-right font-bold text-navy">₹{res.cost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      {res.hasResourceLink ? (
                        <button 
                          onClick={() => handleOpenModal(res)}
                          className="p-1.5 text-slate-400 hover:text-dc-blue hover:bg-blue-50 rounded transition-colors"
                          title="Edit Resource"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-amber-600 italic font-medium">Link via Team</span>
                      )}
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
                {editingResource ? "Edit Resource Profile" : "Create Resource Profile"}
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
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Resource ID <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formPersonId}
                    onChange={(e) => setFormPersonId(e.target.value.toUpperCase())}
                    placeholder="e.g. OP_1 or SOP_1"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue transition-all font-mono"
                    required
                    disabled={!!editingResource}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Resource Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formRoleOverride}
                    onChange={(e) => setFormRoleOverride(e.target.value)}
                    placeholder="e.g. Optics Engineer"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Level / Grade</label>
                  <input 
                    type="text" 
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    placeholder="e.g. H5 (Software Lead)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue transition-all"
                  />
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 font-medium focus:outline-none cursor-not-allowed"
                      disabled
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
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="resource-form"
                className="btn-primary"
              >
                {editingResource ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
