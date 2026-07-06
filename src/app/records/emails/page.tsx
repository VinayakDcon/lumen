"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useEmailsQuery } from "@/hooks/use-pmo-queries";
import { 
  Mail, Search, Plus, Send, RefreshCw, X, Calendar, User, Eye, AlertCircle, CheckCircle2, ChevronRight
} from "lucide-react";
import { cn } from "@/utils/cn";
import { EmailQueueItem } from "@/types/pmo";

export default function EmailsPage() {
  const addEmailQueueItem = usePmoStore((state) => state.addEmailQueueItem);
  const sendEmail = usePmoStore((state) => state.sendEmail);
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);

  const { data: emails = [], isLoading, refetch } = useEmailsQuery();

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal / Detail states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailQueueItem | null>(null);

  // Form states
  const [formTo, setFormTo] = useState("");
  const [formCc, setFormCc] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formKind, setFormKind] = useState("NOTIFICATION");

  // Sending status
  const [sendingId, setSendingId] = useState<number | null>(null);

  // Filtered email queue
  const filteredEmails = useMemo(() => {
    return emails
      .filter((e) => {
        const matchesSearch = 
          e.to_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.cc_email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.body || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || e.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.id - a.id);
  }, [emails, searchQuery, statusFilter]);

  const handleCreateEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTo.trim() || !formSubject.trim()) {
      alert("Please fill in recipient email and subject.");
      return;
    }

    addEmailQueueItem({
      to_email: formTo,
      cc_email: formCc || null,
      subject: formSubject,
      body: formBody || null,
      kind: formKind,
      programme_id: activeProgrammeId || null
    });

    setIsModalOpen(false);
    setFormTo("");
    setFormCc("");
    setFormSubject("");
    setFormBody("");
    setFormKind("NOTIFICATION");
    refetch();
  };

  const handleSendEmail = async (id: number) => {
    setSendingId(id);
    try {
      await sendEmail(id);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setSendingId(null);
    }
  };

  const getStatusBadgeClass = (status: EmailQueueItem["status"]) => {
    switch (status) {
      case "SENT": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "FAILED": return "bg-rose-50 text-rose-700 border-rose-200";
      case "CANCELLED": return "bg-slate-100 text-slate-500 border-slate-300";
      default: return "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
    }
  };

  // KPIs
  const kpiTotal = emails.length;
  const kpiSent = emails.filter(e => e.status === "SENT").length;
  const kpiQueued = emails.filter(e => e.status === "QUEUED").length;
  const kpiFailed = emails.filter(e => e.status === "FAILED").length;

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Email Queue...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col p-6 overflow-y-auto bg-bg-base font-sans text-xs space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-navy flex items-center gap-2">
            <Mail className="w-6 h-6 text-dc-blue" />
            <span>Email Delivery Queue & Logs</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Monitor background mailings, report broadcasts, purchase orders, and stakeholder task alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-dc-blue hover:bg-dc-blue-dark text-white font-bold px-3 py-1.5 rounded-md transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Draft Email</span>
          </button>
        </div>
      </div>

      {/* KPI statistics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Mails In Queue</span>
          <span className="text-xl font-black text-navy block mt-2">{kpiTotal}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-emerald-600">Successfully Dispatched</span>
          <span className="text-xl font-black text-emerald-600 block mt-2">{kpiSent}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-amber-600">Queued / Retrying</span>
          <span className="text-xl font-black text-amber-600 block mt-2">{kpiQueued}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-rose-600">Delivery Failures</span>
          <span className="text-xl font-black text-rose-600 block mt-2">{kpiFailed}</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search email logs by subject, recipient, body text..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs w-full focus:outline-none placeholder-slate-400"
          />
        </div>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer font-medium"
        >
          <option value="">All Statuses</option>
          <option value="QUEUED">QUEUED</option>
          <option value="SENT">SENT</option>
          <option value="FAILED">FAILED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Table Registry */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] select-none">
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">To Recipient</th>
              <th className="px-4 py-3">Classification</th>
              <th className="px-4 py-3">Queued By</th>
              <th className="px-4 py-3">Queued At</th>
              <th className="px-4 py-3">Sent At</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredEmails.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-slate-400 italic">
                  No emails in the delivery log.
                </td>
              </tr>
            ) : (
              filteredEmails.map((e) => {
                const isSending = sendingId === e.id;
                return (
                  <tr key={e.id} className="hover:bg-slate-50/50 group transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{e.subject}</td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">
                      <div>{e.to_email}</div>
                      {e.cc_email && <div className="text-[9px] text-slate-400">CC: {e.cc_email}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-650 border border-slate-200 rounded px-1.5 py-0.2 font-bold text-[9px]">
                        {e.kind || "GENERAL"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{e.queued_by || "System"}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{new Date(e.queued_at).toLocaleString().replace(/\//g, "-")}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {e.sent_at ? new Date(e.sent_at).toLocaleString().replace(/\//g, "-") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-block border rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", getStatusBadgeClass(e.status))}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => setSelectedEmail(e)}
                        className="p-1 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded text-slate-600 hover:text-slate-900 transition-all font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      {e.status === "QUEUED" && (
                        <button 
                          onClick={() => handleSendEmail(e.id)}
                          disabled={isSending}
                          className="bg-slate-900 hover:bg-black text-white font-bold px-2 py-1 rounded transition-all text-[10px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isSending ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Send Now</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* View Email Content Details Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-sky-400" />
                <span>Email Message Diagnostics</span>
              </h3>
              <button 
                onClick={() => setSelectedEmail(null)}
                className="hover:bg-slate-800 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-slate-700">
              
              {/* Metadata block */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 font-mono text-[10px]">
                <div>
                  <span className="text-slate-400 font-sans font-bold uppercase tracking-wider block text-[8px]">From address</span>
                  <span className="font-bold text-slate-900">{selectedEmail.from_email}</span>
                </div>
                <div className="border-t border-slate-250/30 pt-1.5">
                  <span className="text-slate-400 font-sans font-bold uppercase tracking-wider block text-[8px]">To recipient</span>
                  <span className="font-bold text-slate-900">{selectedEmail.to_email}</span>
                </div>
                {selectedEmail.cc_email && (
                  <div className="border-t border-slate-250/30 pt-1.5">
                    <span className="text-slate-400 font-sans font-bold uppercase tracking-wider block text-[8px]">Cc address</span>
                    <span className="font-bold text-slate-900">{selectedEmail.cc_email}</span>
                  </div>
                )}
                <div className="border-t border-slate-250/30 pt-1.5">
                  <span className="text-slate-400 font-sans font-bold uppercase tracking-wider block text-[8px]">Subject</span>
                  <span className="font-black text-slate-950 font-sans text-xs">{selectedEmail.subject}</span>
                </div>
              </div>

              {/* Email Body text */}
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Message Body</span>
                <div className="bg-slate-50/50 border border-slate-150 rounded-lg p-4 font-sans text-[11px] whitespace-pre-line leading-relaxed text-slate-800 min-h-[120px]">
                  {selectedEmail.body || "— No message text content —"}
                </div>
              </div>

              {/* Error messages block if FAILED */}
              {selectedEmail.status === "FAILED" && selectedEmail.error_msg && (
                <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 flex items-start gap-2 text-rose-850">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <b className="text-[9px] uppercase tracking-wide block mb-0.5">SMTP Protocol Error Diagnostics:</b>
                    <p className="font-mono text-[10px] leading-relaxed">{selectedEmail.error_msg}</p>
                  </div>
                </div>
              )}

              {/* Actions footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button 
                  onClick={() => setSelectedEmail(null)}
                  className="bg-slate-900 hover:bg-black text-white font-bold px-4 py-2 rounded transition-colors text-xs cursor-pointer shadow-sm"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Draft Email Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-sky-400" />
                <span>Draft New Email Queue Item</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="hover:bg-slate-800 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateEmail} className="p-6 overflow-y-auto space-y-4 text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                
                {/* To Recipient */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    To Recipient Email Address *
                  </label>
                  <input 
                    type="email" 
                    placeholder="Stakeholder or supplier address..."
                    required
                    value={formTo}
                    onChange={(e) => setFormTo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono font-bold"
                  />
                </div>

                {/* CC Recipient */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    CC Copy Email Address
                  </label>
                  <input 
                    type="text" 
                    placeholder="Comma-separated copy addresses..."
                    value={formCc}
                    onChange={(e) => setFormCc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono"
                  />
                </div>

                {/* Classification Kind */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Email Category Classification
                  </label>
                  <select 
                    value={formKind}
                    onChange={(e) => setFormKind(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-bold"
                  >
                    <option value="NOTIFICATION">NOTIFICATION (WBS alerts)</option>
                    <option value="REPORT">REPORT (Milestone/EVM digests)</option>
                    <option value="PROCUREMENT">PROCUREMENT (RFQ/Purchase order logs)</option>
                    <option value="OTHER">OTHER GENERAL</option>
                  </select>
                </div>

                {/* Subject */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Email Subject Header *
                  </label>
                  <input 
                    type="text" 
                    placeholder="Subject line of the email..."
                    required
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-semibold"
                  />
                </div>

                {/* Body Text */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Email Message Content Text
                  </label>
                  <textarea 
                    placeholder="Provide full email message details..."
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-sans"
                  />
                </div>

              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white border border-slate-200 rounded px-4 py-2 hover:bg-slate-50 text-slate-700 font-bold transition-colors text-xs cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-slate-900 hover:bg-black text-white font-bold px-4 py-2 rounded transition-colors text-xs cursor-pointer shadow-sm"
                >
                  Queue Draft Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
