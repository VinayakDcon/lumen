"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useUsersQuery, useCreateUserMutation, useUpdateUserMutation } from "@/hooks/use-pmo-queries";
import { 
  Users, Search, Plus, Edit3, X, Shield, Lock, Globe
} from "lucide-react";
import { User } from "@/types/pmo";
import { cn } from "@/utils/cn";

export default function UsersPage() {
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  
  const { data: users = [], isLoading } = useUsersQuery();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("ENGINEER");
  const [formActive, setFormActive] = useState<boolean>(true);
  const [formCustomerCompany, setFormCustomerCompany] = useState("");

  // Roles
  const roles = useMemo(() => Array.from(new Set(users.map(u => u.role))), [users]);

  // Filtered
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          u.name.toLowerCase().includes(query) || 
          u.username.toLowerCase().includes(query) || 
          u.email.toLowerCase().includes(query);
        const matchesRole = !roleFilter || u.role === roleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, searchQuery, roleFilter]);

  // Open modal
  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormUsername(user.username);
      setFormName(user.name);
      setFormEmail(user.email);
      setFormRole(user.role);
      setFormActive(user.active);
      setFormCustomerCompany(user.customer_company || "");
    } else {
      setEditingUser(null);
      setFormUsername("");
      setFormName("");
      setFormEmail("");
      setFormRole("ENGINEER");
      setFormActive(true);
      setFormCustomerCompany("");
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        await updateMutation.mutateAsync({
          id: editingUser.id.toString(),
          username: formUsername,
          name: formName,
          email: formEmail,
          role: formRole,
          active: formActive,
          customer_company: formCustomerCompany || undefined
        });
      } else {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        await createMutation.mutateAsync({
          username: formUsername,
          name: formName,
          email: formEmail,
          role: formRole,
          active: formActive,
          customer_company: formCustomerCompany || undefined,
          avatar_color: randomColor
        } as Omit<User, "id">);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save user:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Users...</span>
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
            <Shield className="w-6 h-6 text-dc-blue" />
            Users & Access Administration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage system logins, roles, and global platform access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="btn-primary"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add User
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:bg-white transition-all"
          />
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue"
          >
            <option value="">All Roles</option>
            {roles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <div className="text-sm font-semibold text-slate-500 px-3 border-l border-slate-200">
            {filteredUsers.length} Users
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy text-white font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4 w-16">ID</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4 text-center">Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-slate-600">No users found</p>
                    <p className="text-sm mt-1">Adjust filters or create a new user account.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{user.id}</td>
                    <td className="px-6 py-4 font-medium text-navy">{user.username}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{user.name}</td>
                    <td className="px-6 py-4 text-dc-blue">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider",
                        user.role === 'ADMIN' ? "bg-purple-100 text-purple-700" :
                        user.role === 'PMO' ? "bg-amber-100 text-amber-700" :
                        user.role === 'CUSTOMER' ? "bg-emerald-100 text-emerald-700" :
                        "bg-blue-100 text-blue-700"
                      )}>
                        {user.role}
                      </span>
                      {user.customer_company && (
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {user.customer_company}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.active ? (
                        <span className="text-emerald-500 font-bold">✓</span>
                      ) : (
                        <span className="text-rose-500 font-bold">✗</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="p-1.5 text-slate-400 hover:text-dc-blue hover:bg-blue-50 rounded transition-colors"
                        title="Edit User"
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
                <Lock className="w-5 h-5 text-dc-blue" />
                {editingUser ? "Edit User Account" : "Add User Account"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="user-form" onSubmit={handleFormSubmit} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Username <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      placeholder="e.g. jdoe"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Full Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. jane.doe@dcontour.com"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">System Role <span className="text-red-500">*</span></label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue"
                    required
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="PMO">PMO</option>
                    <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                    <option value="TEAM_LEAD">TEAM_LEAD</option>
                    <option value="ENGINEER">ENGINEER</option>
                    <option value="INTERN_SUPPORT_ENGINEER">INTERN_SUPPORT_ENGINEER</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                  </select>
                </div>

                {formRole === 'CUSTOMER' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Customer Company</label>
                    <input 
                      type="text" 
                      value={formCustomerCompany}
                      onChange={(e) => setFormCustomerCompany(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue transition-all"
                    />
                  </div>
                )}

                <div className="space-y-1.5 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="w-4 h-4 text-dc-blue border-slate-300 rounded focus:ring-dc-blue"
                    />
                    <span className="text-sm font-medium text-slate-700">Account is Active</span>
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
                form="user-form"
                className="btn-primary"
              >
                {editingUser ? "Save Changes" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
