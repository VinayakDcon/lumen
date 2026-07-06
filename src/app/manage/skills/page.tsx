"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useSkillsQuery, usePersonSkillsQuery, usePeopleQuery } from "@/hooks/use-pmo-queries";
import { 
  Award, Search, Plus, Edit3, X
} from "lucide-react";
import { Skill } from "@/types/pmo";
import { cn } from "@/utils/cn";

export default function SkillsMatrixPage() {
  const addSkill = usePmoStore((state) => state.addSkill);
  const updateSkill = usePmoStore((state) => state.updateSkill);
  
  const { data: skills = [], isLoading: isSkillsLoading } = useSkillsQuery();
  const { data: personSkills = [], isLoading: isPSLoading } = usePersonSkillsQuery();
  const { data: people = [], isLoading: isPeopleLoading } = usePeopleQuery();

  const isLoading = isSkillsLoading || isPSLoading || isPeopleLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Engineering");
  const [formDescription, setFormDescription] = useState("");

  // Categories
  const categories = useMemo(() => Array.from(new Set(skills.map(s => s.category))), [skills]);

  // Filtered Skills
  const filteredSkills = useMemo(() => {
    return skills
      .filter((s) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = s.name.toLowerCase().includes(query) || (s.description || "").toLowerCase().includes(query);
        const matchesCat = !categoryFilter || s.category === categoryFilter;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }, [skills, searchQuery, categoryFilter]);

  // Open modal
  const handleOpenModal = (skill?: Skill) => {
    if (skill) {
      setEditingSkill(skill);
      setFormName(skill.name);
      setFormCategory(skill.category);
      setFormDescription(skill.description || "");
    } else {
      setEditingSkill(null);
      setFormName("");
      setFormCategory("Engineering");
      setFormDescription("");
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSkill) {
      updateSkill(editingSkill.id, {
        name: formName,
        category: formCategory,
        description: formDescription || undefined
      });
    } else {
      addSkill({
        name: formName,
        category: formCategory,
        description: formDescription || undefined
      });
    }
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Skills Database...</span>
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
            <Award className="w-6 h-6 text-dc-blue" />
            Skills Matrix Taxonomy
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Define global competencies and track how many team members possess them.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="btn-primary"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Skill
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search skills..."
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
          <div className="text-sm font-semibold text-slate-500 px-3 border-l border-slate-200">
            {filteredSkills.length} Skills
          </div>
        </div>
      </div>

      {/* Skills Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy text-white font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4 w-16">ID</th>
                <th className="px-6 py-4">Skill Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">People Assigned</th>
                <th className="px-6 py-4">Experts (L4+)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSkills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-slate-600">No skills found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or add a new skill.</p>
                  </td>
                </tr>
              ) : (
                filteredSkills.map((skill) => {
                  const assignedCount = personSkills.filter(ps => ps.skill_id === skill.id).length;
                  const expertCount = personSkills.filter(ps => ps.skill_id === skill.id && ps.proficiency_level >= 4).length;
                  
                  return (
                    <tr key={skill.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">#{skill.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-navy">{skill.name}</div>
                        {skill.description && <div className="text-xs text-slate-500 truncate mt-0.5 max-w-xs">{skill.description}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                          {skill.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {assignedCount} {assignedCount === 1 ? 'Person' : 'People'}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">
                        {expertCount}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleOpenModal(skill)}
                          className="p-1.5 text-slate-400 hover:text-dc-blue hover:bg-blue-50 rounded transition-colors"
                          title="Edit Skill"
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-lg text-navy flex items-center gap-2">
                <Award className="w-5 h-5 text-dc-blue" />
                {editingSkill ? "Edit Skill" : "Add New Skill"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="skill-form" onSubmit={handleFormSubmit} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Skill Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Python Programming"
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
                    placeholder="e.g. Software, CAD, Management"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description</label>
                  <textarea 
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description of the skill..."
                    rows={3}
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
                form="skill-form"
                className="btn-primary"
              >
                {editingSkill ? "Save Changes" : "Add Skill"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
