"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useInvoicesQuery } from "@/hooks/use-pmo-queries";
import { 
  Receipt, Search, Plus, Edit3, X, RefreshCw, AlertTriangle, CheckCircle2, Clock
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Invoice } from "@/types/pmo";

export default function InvoicesPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addInvoice = usePmoStore((state) => state.addInvoice);
  const updateInvoice = usePmoStore((state) => state.updateInvoice);
  
  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: invoices = [], isLoading: isInvoicesLoading } = useInvoicesQuery(activeProgrammeId);

  const isLoading = isProgLoading || isInvoicesLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Form states
  const [formInvNumber, setFormInvNumber] = useState("");
  const [formVendorName, setFormVendorName] = useState("");
  const [formPoNumber, setFormPoNumber] = useState("");
  const [formAmount, setFormAmount] = useState(0);
  const [formCurrency, setFormCurrency] = useState("INR");
  const [formTax, setFormTax] = useState(0);
  const [formStatus, setFormStatus] = useState<Invoice["status"]>("RECEIVED");
  const [formInvoiceDate, setFormInvoiceDate] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formDesc, setFormDesc] = useState("");

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const matchesSearch = 
          inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (inv.vendor_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (inv.po_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (inv.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.id - a.id);
  }, [invoices, searchQuery, statusFilter]);

  // Open modal
  const handleOpenModal = (inv?: Invoice) => {
    if (inv) {
      setEditingInvoice(inv);
      setFormInvNumber(inv.invoice_number);
      setFormVendorName(inv.vendor_name || "");
      setFormPoNumber(inv.po_number || "");
      setFormAmount(inv.amount);
      setFormCurrency(inv.currency);
      setFormTax(inv.tax_amount);
      setFormStatus(inv.status);
      setFormInvoiceDate(inv.invoice_date);
      setFormDueDate(inv.due_date || "");
      setFormDesc(inv.description || "");
    } else {
      setEditingInvoice(null);
      setFormInvNumber("");
      setFormVendorName("");
      setFormPoNumber("");
      setFormAmount(0);
      setFormCurrency("INR");
      setFormTax(0);
      setFormStatus("RECEIVED");
      setFormInvoiceDate("");
      setFormDueDate("");
      setFormDesc("");
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInvNumber.trim()) {
      alert("Please fill in Invoice Number.");
      return;
    }

    if (editingInvoice) {
      updateInvoice(editingInvoice.id, {
        invoice_number: formInvNumber,
        vendor_name: formVendorName,
        po_number: formPoNumber || undefined,
        amount: Number(formAmount),
        currency: formCurrency,
        tax_amount: Number(formTax),
        status: formStatus,
        invoice_date: formInvoiceDate,
        due_date: formDueDate || null,
        description: formDesc || null,
      });
    } else {
      addInvoice({
        programme_id: activeProgrammeId,
        invoice_number: formInvNumber,
        vendor_id: 0, 
        vendor_name: formVendorName,
        po_id: null,
        po_number: formPoNumber || undefined,
        amount: Number(formAmount),
        currency: formCurrency,
        tax_amount: Number(formTax),
        status: formStatus,
        invoice_date: formInvoiceDate,
        due_date: formDueDate || null,
        description: formDesc || null,
        received_at: new Date().toISOString(),
      } as any);
    }
    setIsModalOpen(false);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PAID": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "APPROVED": return "bg-sky-50 text-sky-700 border-sky-200";
      case "UNDER_REVIEW": return "bg-amber-50 text-amber-700 border-amber-200";
      case "RECEIVED": return "bg-slate-100 text-slate-700 border-slate-300";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Invoices...</span>
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
          Please select a programme to view and manage vendor invoices.
        </p>
      </div>
    );
  }

  // Count high level stats
  const kpiTotal = invoices.length;
  const kpiUnderReview = invoices.filter(i => i.status === "UNDER_REVIEW").length;
  const kpiApproved = invoices.filter(i => i.status === "APPROVED").length;
  
  // Calculate total unpaid value
  const totalUnpaidValue = invoices
    .filter(i => i.status !== "PAID")
    .reduce((sum, i) => sum + (i.amount + i.tax_amount), 0);

  return (
    <div className="page-container fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Receipt className="w-6 h-6 text-dc-blue" />
            Invoices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track vendor invoices, approvals, and pending payments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="btn-primary"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Log Invoice
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-xl border border-slate-200/60 relative overflow-hidden group hover:border-dc-blue/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Receipt className="w-16 h-16 text-navy" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Invoices</div>
          <div className="text-3xl font-extrabold text-navy">{kpiTotal}</div>
        </div>
        
        <div className="glass-panel p-5 rounded-xl border border-amber-200/60 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-16 h-16 text-amber-600" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Under Review</div>
          <div className="text-3xl font-extrabold text-amber-700">{kpiUnderReview}</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-sky-200/60 relative overflow-hidden group hover:border-sky-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="w-16 h-16 text-sky-600" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Approved to Pay</div>
          <div className="text-3xl font-extrabold text-sky-700">{kpiApproved}</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-rose-200/60 relative overflow-hidden group hover:border-rose-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="w-16 h-16 text-rose-600" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Unpaid</div>
          <div className="text-3xl font-extrabold text-rose-700">₹ {(totalUnpaidValue / 100000).toFixed(2)}L</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search invoices..."
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
            <option value="RECEIVED">Received</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Invoice No.</th>
                <th className="px-6 py-4">Vendor & PO</th>
                <th className="px-6 py-4">Total Amount (inc Tax)</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-slate-600">No invoices found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {inv.invoice_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-navy">{inv.vendor_name || "Unknown Vendor"}</div>
                      {inv.po_number && (
                        <div className="text-xs text-slate-500 mt-0.5">PO: {inv.po_number}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">
                        {inv.currency} {(inv.amount + inv.tax_amount).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Base: {inv.amount.toLocaleString()} + Tax: {inv.tax_amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="text-xs">
                        <span className="text-slate-400">Inv:</span> {new Date(inv.invoice_date).toLocaleDateString()}
                      </div>
                      {inv.due_date && (
                        <div className="text-xs mt-0.5 font-medium text-rose-600">
                          <span className="text-slate-400">Due:</span> {new Date(inv.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border",
                        getStatusBadgeClass(inv.status)
                      )}>
                        {inv.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(inv)}
                        className="p-1.5 text-slate-400 hover:text-dc-blue hover:bg-blue-50 rounded transition-colors"
                        title="Edit Invoice"
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
                <Receipt className="w-5 h-5 text-dc-blue" />
                {editingInvoice ? "Edit Invoice" : "Log New Invoice"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="invoice-form" onSubmit={handleFormSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Invoice Number <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formInvNumber}
                      onChange={(e) => setFormInvNumber(e.target.value)}
                      placeholder="e.g. INV-10023"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Vendor Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formVendorName}
                      onChange={(e) => setFormVendorName(e.target.value)}
                      placeholder="e.g. Acme Tooling"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">PO Number (Optional)</label>
                    <input 
                      type="text" 
                      value={formPoNumber}
                      onChange={(e) => setFormPoNumber(e.target.value)}
                      placeholder="e.g. PO-24-0001"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    >
                      <option value="RECEIVED">Received</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="APPROVED">Approved to Pay</option>
                      <option value="PAID">Paid</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Base Amount (ex Tax)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500 sm:text-sm">₹</span>
                      </div>
                      <input 
                        type="number" 
                        value={formAmount}
                        onChange={(e) => setFormAmount(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tax Amount</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500 sm:text-sm">₹</span>
                      </div>
                      <input 
                        type="number" 
                        value={formTax}
                        onChange={(e) => setFormTax(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Invoice Date <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={formInvoiceDate}
                      onChange={(e) => setFormInvoiceDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Due Date</label>
                    <input 
                      type="date" 
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description / Items</label>
                  <textarea 
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Briefly describe what this invoice covers..."
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
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="invoice-form"
                className="btn-primary"
              >
                {editingInvoice ? "Save Changes" : "Log Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
