"use client";

import React, { useState, useMemo } from "react";
import { usePeopleQuery, useCreatePersonMutation, useUpdatePersonMutation } from "@/hooks/use-pmo-queries";
import { useRole } from "@/hooks/use-role";
import { ReadOnlyBanner } from "@/components/ui/read-only-banner";
import { ProtectedAction } from "@/components/ui/protected-action";
import { 
  Users, Search, Plus, Edit3, X, User as UserIcon
} from "lucide-react";
import { Person } from "@/types/pmo";

export default function TeamPage() {
  const { canManageTeam } = useRole();

  const { data: people = [], isLoading } = usePeopleQuery();
  const createMutation = useCreatePersonMutation();
  const updateMutation = useUpdatePersonMutation();

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
    } else {
      setEditingPerson(null);
      setFormName("");
      setFormEmail("");
      setFormRole("");
      setFormResourceId("");
      setFormCapacity(100);
      setFormActive(1);
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

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
        });
      } else {
        await createMutation.mutateAsync({
          name: formName,
          email: formEmail,
          role: formRole,
          resource_id: formResourceId,
          capacity_pct: formCapacity,
          active: formActive,
          avatar_color: randomColor,
        } as Omit<Person, "id">);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save person:", err);
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
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center justify-between">
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 py-20 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-medium text-slate-600">No team members found</p>
          <p className="text-sm text-slate-500 mt-1">Adjust your search or add a new person.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPeople.map((person) => (
            <div key={person.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col hover:border-dc-blue/40 transition-colors group relative">
              <ProtectedAction allowed={canManageTeam}>
                <button 
                  onClick={() => handleOpenModal(person)}
                  className="absolute top-3 right-3 p-1.5 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-dc-blue hover:bg-blue-50 rounded transition-all"
                  title="Edit Person"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </ProtectedAction>
              
              <div className="flex items-start gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
                  style={{ backgroundColor: person.avatar_color || '#94a3b8' }}
                >
                  {getInitials(person.name)}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-navy truncate" title={person.name}>{person.name}</h3>
                  <div className="text-xs font-medium text-slate-500 truncate" title={person.role || 'No Role'}>{person.role || 'No Role'}</div>
                  {person.email && <div className="text-xs text-dc-blue truncate mt-0.5" title={person.email}>{person.email}</div>}
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
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-navy hover:bg-slate-200/50 rounded-lg transition-colors"
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
