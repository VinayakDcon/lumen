"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, usePaymentsQuery } from "@/hooks/use-pmo-queries";
import { 
  CircleDollarSign, Search, Plus, Edit3, X, RefreshCw, HandCoins, Building2, CalendarCheck
} from "lucide-react";
import { Payment } from "@/types/pmo";

export default function PaymentsPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addPayment = usePmoStore((state) => state.addPayment);
  const updatePayment = usePmoStore((state) => state.updatePayment);
  
  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: payments = [], isLoading: isPaymentsLoading } = usePaymentsQuery(activeProgrammeId);

  const isLoading = isProgLoading || isPaymentsLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // Form states
  const [formVendorName, setFormVendorName] = useState("");
  const [formInvoiceNumber, setFormInvoiceNumber] = useState("");
  const [formAmount, setFormAmount] = useState(0);
  const [formCurrency, setFormCurrency] = useState("INR");
  const [formPaymentDate, setFormPaymentDate] = useState("");
  const [formMethod, setFormMethod] = useState("BANK_TRANSFER");
  const [formRef, setFormRef] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments
      .filter((pay) => {
        const matchesSearch = 
          (pay.transaction_ref || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (pay.vendor_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (pay.invoice_number || "").toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => b.id - a.id);
  }, [payments, searchQuery]);

  // Open modal
  const handleOpenModal = (pay?: Payment) => {
    if (pay) {
      setEditingPayment(pay);
      setFormVendorName(pay.vendor_name || "");
      setFormInvoiceNumber(pay.invoice_number || "");
      setFormAmount(pay.amount);
      setFormCurrency(pay.currency);
      setFormPaymentDate(pay.payment_date);
      setFormMethod(pay.payment_method);
      setFormRef(pay.transaction_ref || "");
      setFormNotes(pay.notes || "");
    } else {
      setEditingPayment(null);
      setFormVendorName("");
      setFormInvoiceNumber("");
      setFormAmount(0);
      setFormCurrency("INR");
      setFormPaymentDate(new Date().toISOString().split("T")[0]);
      setFormMethod("BANK_TRANSFER");
      setFormRef("");
      setFormNotes("");
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPayment) {
      updatePayment(editingPayment.id, {
        vendor_name: formVendorName,
        invoice_number: formInvoiceNumber,
        amount: Number(formAmount),
        currency: formCurrency,
        payment_date: formPaymentDate,
        payment_method: formMethod,
        transaction_ref: formRef || null,
        notes: formNotes || null,
      });
    } else {
      addPayment({
        programme_id: activeProgrammeId,
        vendor_id: 0, 
        vendor_name: formVendorName,
        invoice_id: 0,
        invoice_number: formInvoiceNumber,
        amount: Number(formAmount),
        currency: formCurrency,
        payment_date: formPaymentDate,
        payment_method: formMethod,
        transaction_ref: formRef || null,
        notes: formNotes || null,
        approved_by: "System",
      });
    }
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Payments...</span>
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
          Please select a programme to view and manage payments.
        </p>
      </div>
    );
  }

  // Count high level stats
  const kpiTotal = payments.length;
  const kpiTotalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  // Group by vendor (unique count)
  const uniqueVendors = new Set(payments.map(p => p.vendor_name)).size;

  return (
    <div className="page-container fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <CircleDollarSign className="w-6 h-6 text-dc-blue" />
            Payments Log
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Record and trace all external outgoing payments to vendors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="btn-primary"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Log Payment
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-xl border border-slate-200/60 relative overflow-hidden group hover:border-dc-blue/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CircleDollarSign className="w-16 h-16 text-navy" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Transactions</div>
          <div className="text-3xl font-extrabold text-navy">{kpiTotal}</div>
        </div>
        
        <div className="glass-panel p-5 rounded-xl border border-emerald-200/60 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <HandCoins className="w-16 h-16 text-emerald-600" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Amount Disbursed</div>
          <div className="text-3xl font-extrabold text-emerald-700">₹ {(kpiTotalPaid / 100000).toFixed(2)}L</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-indigo-200/60 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Building2 className="w-16 h-16 text-indigo-600" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Vendors Paid</div>
          <div className="text-3xl font-extrabold text-indigo-700">{uniqueVendors}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by vendor, invoice or ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Transaction Ref</th>
                <th className="px-6 py-4">Vendor & Invoice</th>
                <th className="px-6 py-4">Amount Paid</th>
                <th className="px-6 py-4">Method & Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <CircleDollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-slate-600">No payments found</p>
                    <p className="text-sm mt-1">Try adjusting your search.</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {pay.transaction_ref || `PAY-${pay.id.toString().padStart(4, "0")}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-navy">{pay.vendor_name || "Unknown"}</div>
                      {pay.invoice_number && (
                        <div className="text-xs text-slate-500 mt-0.5">Inv: {pay.invoice_number}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-emerald-700">
                        {pay.currency} {pay.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="text-xs font-bold">{pay.payment_method.replace("_", " ")}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <CalendarCheck className="w-3.5 h-3.5" />
                        {new Date(pay.payment_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(pay)}
                        className="p-1.5 text-slate-400 hover:text-dc-blue hover:bg-blue-50 rounded transition-colors"
                        title="Edit Payment"
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
                <CircleDollarSign className="w-5 h-5 text-dc-blue" />
                {editingPayment ? "Edit Payment Record" : "Log Payment"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="payment-form" onSubmit={handleFormSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Invoice Number</label>
                    <input 
                      type="text" 
                      value={formInvoiceNumber}
                      onChange={(e) => setFormInvoiceNumber(e.target.value)}
                      placeholder="e.g. INV-10023"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Amount Paid <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500 sm:text-sm">₹</span>
                      </div>
                      <input 
                        type="number" 
                        value={formAmount}
                        onChange={(e) => setFormAmount(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Payment Method</label>
                    <select
                      value={formMethod}
                      onChange={(e) => setFormMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer / Wire</option>
                      <option value="NEFT">NEFT / RTGS</option>
                      <option value="LC">Letter of Credit (LC)</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Transaction Ref</label>
                    <input 
                      type="text" 
                      value={formRef}
                      onChange={(e) => setFormRef(e.target.value)}
                      placeholder="e.g. UTR Number"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Payment Date <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={formPaymentDate}
                      onChange={(e) => setFormPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notes</label>
                  <textarea 
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Any internal notes or remarks regarding this payment..."
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
                form="payment-form"
                className="btn-primary"
              >
                {editingPayment ? "Save Changes" : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
