"use client";

import React, { useState, useMemo } from "react";
import { usePeopleQuery, useCreatePersonMutation, useUpdatePersonMutation, useDeletePersonMutation } from "@/hooks/use-pmo-queries";
import { useRole } from "@/hooks/use-role";
import { ReadOnlyBanner } from "@/components/ui/read-only-banner";
import { ProtectedAction } from "@/components/ui/protected-action";
import { 
  Users, Search, Plus, Edit3, X, User as UserIcon, Trash2
} from "lucide-react";
import { Person } from "@/types/pmo";

export default function TeamPage() {
  const { canManageTeam } = useRole();

  const { data: people = [], isLoading } = usePeopleQuery();
  const createMutation = useCreatePersonMutation();
  const updateMutation = useUpdatePersonMutation();
  const deleteMutation = useDeletePersonMutation();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formResourceId, setFormResourceId] = useState("");
  const [formCapacity, setFormCapacity] = useState(100);
  const [formActive, setFormActive] = useState(1);
  const [formDepartment, setFormDepartment] = useState("");
  const [formSystemRole, setFormSystemRole] = useState("ENGINEER");

  // Filtered
  const filteredPeople = useMemo(() => {
    return people
      .filter((p) => {
        const query = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(query) ||
          (p.role && p.role.toLowerCase().includes(query)) ||
          (p.email && p.email.toLowerCase().includes(query)) ||
          (p.resource_id && p.resource_id.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [people, searchQuery]);

  // Open modal
  const handleOpenModal = (person?: Person) => {
    if (!canManageTeam) return;
    if (person) {
      setEditingPerson(person);
      setFormName(person.name);
      setFormEmail(person.email || "");
      setFormRole(person.role || "");
      setFormResourceId(person.resource_id || "");
      setFormCapacity(person.capacity_pct || 100);
      setFormActive(person.active ?? 1);
      setFormDepartment(person.department || "");
      setFormSystemRole(person.system_role || "ENGINEER");
    } else {
      setEditingPerson(null);
      setFormName("");
      setFormEmail("");
      setFormRole("");
      setFormResourceId("");
      setFormCapacity(100);
      setFormActive(1);
      setFormDepartment("");
      setFormSystemRole("ENGINEER");
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const avatarColor = '#1E90E8';

    try {
      if (editingPerson) {
        await updateMutation.mutateAsync({
          id: editingPerson.id,
          name: formName,
          email: formEmail,
          role: formRole,
          resource_id: formResourceId,
          capacity_pct: formCapacity,
          active: formActive,
          department: formDepartment || undefined,
          system_role: formSystemRole,
          avatar_color: avatarColor,
        });
      } else {
        await createMutation.mutateAsync({
          name: formName,
          email: formEmail,
          role: formRole,
          resource_id: formResourceId,
          capacity_pct: formCapacity,
          active: formActive,
          avatar_color: avatarColor,
          department: formDepartment || undefined,
          system_role: formSystemRole,
        } as Omit<Person, "id">);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save person:", err);
    }
  };

  const handleDeletePerson = async (id: number | string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This will permanently remove them and their user account from the backend and DB.`)) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error("Failed to delete person:", err);
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Team...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      {!canManageTeam && <ReadOnlyBanner />}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Users className="w-6 h-6 text-dc-blue" />
            Global Team Roster
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {canManageTeam
              ? "Manage the global list of employees and their standard capacities."
              : "View the global list of employees and their standard capacities."}
          </p>
        </div>
        <ProtectedAction allowed={canManageTeam}>
          <button 
            className="btn-primary"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Person
          </button>
        </ProtectedAction>
      </div>

      {/* Filters and Search */}
      <div className="clay-card p-4 mb-6 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by name, role, email, or resource ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:bg-white transition-all"
          />
        </div>
        <div className="text-sm font-semibold text-slate-500">
          {filteredPeople.length} Team Members
        </div>
      </div>

      {/* Team Grid */}
      {filteredPeople.length === 0 ? (
        <div className="clay-card py-20 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-medium text-slate-600">No team members found</p>
          <p className="text-sm text-slate-500 mt-1">Adjust your search or add a new person.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPeople.map((person) => (
            <div key={person.id} className="clay-card p-5 flex flex-col group relative">
              <ProtectedAction allowed={canManageTeam}>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(person)}
                    className="p-1.5 text-slate-400 hover:text-dc-blue hover:bg-blue-50 rounded transition-all"
                    title="Edit Person"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeletePerson(person.id, person.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                    title="Delete Person"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </ProtectedAction>
              
              <div className="flex items-start gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
                  style={{ backgroundColor: person.avatar_color || '#1E90E8' }}
                >
                  {getInitials(person.name)}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-navy truncate" title={person.name}>{person.name}</h3>
                  <div className="text-xs font-medium text-slate-500 truncate" title={person.role || 'No Role'}>{person.role || 'No Role'}</div>
                  {person.email && <div className="text-xs text-dc-blue truncate mt-0.5" title={person.email}>{person.email}</div>}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {person.department && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {person.department}
                      </span>
                    )}
                    {person.system_role && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-dc-blue border border-blue-100">
                        {person.system_role}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Resource ID</div>
                  <div className="text-sm font-semibold text-slate-700 font-mono">{person.resource_id || '—'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Capacity</div>
                  <div className="text-sm font-semibold text-slate-700">{person.capacity_pct ?? 100}%</div>
                </div>
              </div>
              
              {!person.active && (
                <div className="absolute top-4 right-4 flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" title="Inactive"></span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal — only if canManageTeam */}
      {isModalOpen && canManageTeam && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-lg text-navy flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-dc-blue" />
                {editingPerson ? "Edit Team Member" : "Add Team Member"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="team-form" onSubmit={handleFormSubmit} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Full Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email</label>
                  <input 
                    type="email" 
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. jane.doe@dcontour.tech"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Role / Job Title</label>
                  <input 
                    type="text" 
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="e.g. Senior Mechanical Engineer"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Resource ID</label>
                    <input 
                      type="text" 
                      value={formResourceId}
                      onChange={(e) => setFormResourceId(e.target.value)}
                      placeholder="e.g. MECH_1"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Capacity (%)</label>
                    <input 
                      type="number" 
                      value={formCapacity}
                      onChange={(e) => setFormCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Department</label>
                    <select
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue"
                    >
                      <option value="">None</option>
                      <option value="Optics">Optics</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Software">Software</option>
                      <option value="Manufacturing">Manufacturing</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">System Role</label>
                    <select
                      value={formSystemRole}
                      onChange={(e) => setFormSystemRole(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue"
                    >
                      <option value="ENGINEER">ENGINEER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="PMO">PMO</option>
                      <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                      <option value="TEAM_LEAD">TEAM_LEAD</option>
                      <option value="OPTICS_LEAD">OPTICS_LEAD</option>
                      <option value="MECHANICAL_LEAD">MECHANICAL_LEAD</option>
                      <option value="ELECTRONICS_LEAD">ELECTRONICS_LEAD</option>
                      <option value="SOFTWARE_LEAD">SOFTWARE_LEAD</option>
                      <option value="MANUFACTURING_LEAD">MANUFACTURING_LEAD</option>
                      <option value="INTERN_SUPPORT_ENGINEER">INTERN_SUPPORT_ENGINEER</option>
                      <option value="CUSTOMER">CUSTOMER</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formActive === 1}
                      onChange={(e) => setFormActive(e.target.checked ? 1 : 0)}
                      className="w-4 h-4 text-dc-blue border-slate-300 rounded focus:ring-dc-blue"
                    />
                    <span className="text-sm font-medium text-slate-700">Active Employee</span>
                  </label>
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
                form="team-form"
                disabled={isSaving}
                className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : editingPerson ? "Save Changes" : "Add Person"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
