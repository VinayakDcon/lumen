"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, usePurchaseOrdersQuery } from "@/hooks/use-pmo-queries";
import { 
  CreditCard, Search, Plus, Edit3, X, RefreshCw, Send, CheckSquare, DollarSign, Ban
} from "lucide-react";
import { cn } from "@/utils/cn";
import { PurchaseOrder } from "@/types/pmo";

export default function PurchaseOrdersPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addPurchaseOrder = usePmoStore((state) => state.addPurchaseOrder);
  const updatePurchaseOrder = usePmoStore((state) => state.updatePurchaseOrder);
  const currentUser = usePmoStore((state) => state.user);
  
  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: pos = [], isLoading: isPosLoading } = usePurchaseOrdersQuery(activeProgrammeId);

  const isLoading = isProgLoading || isPosLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);

  // Form states
  const [formPoNum, setFormPoNum] = useState("");
  const [formVendor, setFormVendor] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formValue, setFormValue] = useState(0);
  const [formCurrency, setFormCurrency] = useState("INR");
  const [formStatus, setFormStatus] = useState<PurchaseOrder["status"]>("RAISED");
  const [formAdvance, setFormAdvance] = useState(0);

  // Filtered POs
  const filteredPos = useMemo(() => {
    return pos
      .filter((p) => {
        const matchesSearch = 
          p.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || p.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.id - a.id);
  }, [pos, searchQuery, statusFilter]);

  // Open modal
  const handleOpenModal = (po?: PurchaseOrder) => {
    if (po) {
      setEditingPo(po);
      setFormPoNum(po.po_number);
      setFormVendor(po.vendor);
      setFormDesc(po.description || "");
      setFormValue(po.value_inr);
      setFormCurrency(po.currency);
      setFormStatus(po.status);
      setFormAdvance(po.advance_paid_inr || 0);
    } else {
      setEditingPo(null);
      const nextNum = pos.length + 1;
      setFormPoNum(`PO-24-${String(nextNum).padStart(4, "0")}`);
      setFormVendor("");
      setFormDesc("");
      setFormValue(0);
      setFormCurrency("INR");
      setFormStatus("RAISED");
      setFormAdvance(0);
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVendor.trim()) {
      alert("Please fill in Vendor Name.");
      return;
    }

    if (editingPo) {
      updatePurchaseOrder(editingPo.id, {
        vendor: formVendor,
        description: formDesc || null,
        value_inr: Number(formValue),
        currency: formCurrency,
        status: formStatus,
        advance_paid_inr: Number(formAdvance),
      });
    } else {
      addPurchaseOrder({
        programme_id: activeProgrammeId,
        po_number: formPoNum,
        vendor_id: 0, // In a real app, this would be a lookup
        vendor: formVendor,
        vendor_country: "India",
        description: formDesc || null,
        value_inr: Number(formValue),
        currency: formCurrency,
        status: formStatus,
        advance_paid_inr: Number(formAdvance),
        balance_paid_inr: 0,
        raised_by: currentUser?.name || "System"
      } as any);
    }
    setIsModalOpen(false);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PAID": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CANCELLED": return "bg-rose-50 text-rose-700 border-rose-200";
      case "INVOICED": return "bg-sky-50 text-sky-700 border-sky-200";
      case "IN_FAB": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "RECEIVED": return "bg-purple-50 text-purple-700 border-purple-200";
      case "SENT": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200"; // RAISED
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Purchase Orders...</span>
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
          Please select a programme to view and manage Purchase Orders.
        </p>
      </div>
    );
  }

  // Count high level stats
  const kpiTotal = pos.length;
  const kpiInFab = pos.filter(p => p.status === "IN_FAB" || p.status === "SENT").length;
  const kpiTotalValue = pos
    .filter(p => p.status !== "CANCELLED")
    .reduce((sum, p) => sum + (p.value_inr || 0), 0);
  const kpiPaid = pos
    .filter(p => p.status === "PAID")
    .length;

  return (
    <div className="page-container fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-dc-blue" />
            Purchase Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track and manage purchase orders issued to vendors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="btn-primary"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Raise PO
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-xl border border-slate-200/60 relative overflow-hidden group hover:border-dc-blue/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard className="w-16 h-16 text-navy" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total POs</div>
          <div className="text-3xl font-extrabold text-navy">{kpiTotal}</div>
        </div>
        
        <div className="glass-panel p-5 rounded-xl border border-emerald-200/60 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16 text-emerald-600" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Committed</div>
          <div className="text-3xl font-extrabold text-emerald-700">₹ {(kpiTotalValue / 100000).toFixed(2)}L</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-indigo-200/60 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Send className="w-16 h-16 text-indigo-600" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">In Fab / Sent</div>
          <div className="text-3xl font-extrabold text-indigo-700">{kpiInFab}</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-sky-200/60 relative overflow-hidden group hover:border-sky-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckSquare className="w-16 h-16 text-sky-600" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Paid & Closed</div>
          <div className="text-3xl font-extrabold text-sky-700">{kpiPaid}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search POs..."
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
            <option value="RAISED">Raised</option>
            <option value="SENT">Sent to Vendor</option>
            <option value="IN_FAB">In Fabrication</option>
            <option value="RECEIVED">Goods Received</option>
            <option value="INVOICED">Invoiced</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* POs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">PO Number</th>
                <th className="px-6 py-4">Vendor & Details</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Advance Paid</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-slate-600">No POs found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredPos.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {po.po_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-navy">{po.vendor}</div>
                      {po.description && (
                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{po.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">
                        {po.currency} {po.value_inr.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {po.advance_paid_inr > 0 ? (
                        <div className="text-xs font-bold text-emerald-600">
                          {po.currency} {po.advance_paid_inr.toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">—</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border",
                        getStatusBadgeClass(po.status)
                      )}>
                        {po.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(po)}
                        className="p-1.5 text-slate-400 hover:text-dc-blue hover:bg-blue-50 rounded transition-colors"
                        title="Edit PO"
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
                <CreditCard className="w-5 h-5 text-dc-blue" />
                {editingPo ? "Edit Purchase Order" : "Raise Purchase Order"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="po-form" onSubmit={handleFormSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">PO Number</label>
                    <input 
                      type="text" 
                      value={formPoNum}
                      disabled
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 font-mono"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Vendor <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formVendor}
                      onChange={(e) => setFormVendor(e.target.value)}
                      placeholder="e.g. Acme Tooling"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Value (INR)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500 sm:text-sm">₹</span>
                      </div>
                      <input 
                        type="number" 
                        value={formValue}
                        onChange={(e) => setFormValue(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    >
                      <option value="RAISED">Raised</option>
                      <option value="SENT">Sent to Vendor</option>
                      <option value="IN_FAB">In Fabrication</option>
                      <option value="RECEIVED">Goods Received</option>
                      <option value="INVOICED">Invoiced</option>
                      <option value="PAID">Paid</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                  
                  {editingPo && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Advance Paid (INR)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-slate-500 sm:text-sm">₹</span>
                        </div>
                        <input 
                          type="number" 
                          value={formAdvance}
                          onChange={(e) => setFormAdvance(Number(e.target.value))}
                          className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description</label>
                  <textarea 
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Provide details about the purchase order items..."
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
                form="po-form"
                className="btn-primary"
              >
                {editingPo ? "Save Changes" : "Raise PO"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
