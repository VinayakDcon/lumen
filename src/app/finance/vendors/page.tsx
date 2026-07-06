"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useVendorsQuery } from "@/hooks/use-pmo-queries";
import { 
  Building2, Search, Plus, FileSpreadsheet, Edit3, X, MapPin, Globe, Banknote, ShieldCheck
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Vendor } from "@/types/pmo";

export default function VendorsPage() {
  const addVendor = usePmoStore((state) => state.addVendor);
  const updateVendor = usePmoStore((state) => state.updateVendor);
  
  const { data: vendors = [], isLoading } = useVendorsQuery();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("TOOLING");
  const [formCountry, setFormCountry] = useState("India");
  const [formCity, setFormCity] = useState("");
  const [formStatus, setFormStatus] = useState<Vendor["status"]>("ACTIVE");

  // Filtered vendors
  const filteredVendors = useMemo(() => {
    return vendors
      .filter((v) => {
        const matchesSearch = 
          v.vendor_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.country.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !categoryFilter || v.category === categoryFilter;
        const matchesStatus = !statusFilter || v.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => b.id - a.id);
  }, [vendors, searchQuery, categoryFilter, statusFilter]);

  // Open modal
  const handleOpenModal = (v?: Vendor) => {
    if (v) {
      setEditingVendor(v);
      setFormCode(v.vendor_code);
      setFormName(v.name);
      setFormCategory(v.category);
      setFormCountry(v.country);
      setFormCity(v.city);
      setFormStatus(v.status);
    } else {
      setEditingVendor(null);
      const nextNum = vendors.length + 1;
      setFormCode(`VND-${String(nextNum).padStart(4, "0")}`);
      setFormName("");
      setFormCategory("TOOLING");
      setFormCountry("India");
      setFormCity("");
      setFormStatus("UNDER_REVIEW");
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Please fill in Vendor Name.");
      return;
    }

    if (editingVendor) {
      updateVendor(editingVendor.id, {
        name: formName,
        category: formCategory,
        country: formCountry,
        city: formCity,
        status: formStatus,
      });
    } else {
      addVendor({
        vendor_code: formCode,
        name: formName,
        category: formCategory,
        country: formCountry,
        city: formCity,
        currency: formCountry === "India" ? "INR" : "USD",
        status: formStatus,
      } as any);
    }
    setIsModalOpen(false);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "BLOCKED": return "bg-rose-50 text-rose-700 border-rose-200";
      case "UNDER_REVIEW": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Vendors...</span>
        </div>
      </div>
    );
  }

  // Count high level stats
  const kpiTotal = vendors.length;
  const kpiActive = vendors.filter(v => v.status === "ACTIVE").length;
  const kpiUnderReview = vendors.filter(v => v.status === "UNDER_REVIEW").length;
  const kpiInternational = vendors.filter(v => v.country.toLowerCase() !== "india").length;

  return (
    <div className="page-container fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Building2 className="w-6 h-6 text-dc-blue" />
            Vendor Master
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your supply chain partners and tooling vendors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="btn-primary"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Vendor
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-xl border border-slate-200/60 relative overflow-hidden group hover:border-dc-blue/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Building2 className="w-16 h-16 text-navy" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Vendors</div>
          <div className="text-3xl font-extrabold text-navy">{kpiTotal}</div>
        </div>
        
        <div className="glass-panel p-5 rounded-xl border border-emerald-200/60 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="w-16 h-16 text-emerald-600" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Active Partners</div>
          <div className="text-3xl font-extrabold text-emerald-700">{kpiActive}</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-indigo-200/60 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileSpreadsheet className="w-16 h-16 text-indigo-600" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Under Review</div>
          <div className="text-3xl font-extrabold text-indigo-700">{kpiUnderReview}</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-amber-200/60 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Globe className="w-16 h-16 text-amber-600" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">International</div>
          <div className="text-3xl font-extrabold text-amber-700">{kpiInternational}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:bg-white transition-all"
          />
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue"
          >
            <option value="">All Categories</option>
            <option value="TOOLING">Tooling</option>
            <option value="PCB_FAB">PCB Fab</option>
            <option value="PVD">PVD</option>
            <option value="LOGISTICS">Logistics</option>
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Vendor Code</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-slate-600">No vendors found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {vendor.vendor_code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-navy">{vendor.name}</div>
                      {vendor.contact_person && (
                        <div className="text-xs text-slate-500 mt-0.5">{vendor.contact_person}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wider bg-slate-100 text-slate-600">
                        {vendor.category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{vendor.city}, {vendor.country}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border",
                        getStatusBadgeClass(vendor.status)
                      )}>
                        {vendor.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(vendor)}
                        className="p-1.5 text-slate-400 hover:text-dc-blue hover:bg-blue-50 rounded transition-colors"
                        title="Edit Vendor"
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
                <Building2 className="w-5 h-5 text-dc-blue" />
                {editingVendor ? "Edit Vendor" : "Add New Vendor"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="vendor-form" onSubmit={handleFormSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Vendor Code</label>
                    <input 
                      type="text" 
                      value={formCode}
                      disabled
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 font-mono"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Vendor Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Acme Tooling"
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
                      <option value="PVD">PVD</option>
                      <option value="LOGISTICS">Logistics</option>
                      <option value="SMT">SMT</option>
                      <option value="HARDCOAT">Hardcoat</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    >
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="ACTIVE">Active</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Country</label>
                    <input 
                      type="text" 
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      placeholder="e.g. India"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">City</label>
                    <input 
                      type="text" 
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      placeholder="e.g. Chennai"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
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
                form="vendor-form"
                className="btn-primary"
              >
                {editingVendor ? "Save Changes" : "Add Vendor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
