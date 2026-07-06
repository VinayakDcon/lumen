"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useCustomerCommsQuery } from "@/hooks/use-pmo-queries";
import { 
  Phone, Search, Plus, FileSpreadsheet, Edit3, Trash2, X, Calendar, User, MessageSquare, ArrowDownLeft, ArrowUpRight, Smile, HeartCrack, AlertCircle
} from "lucide-react";
import { cn } from "@/utils/cn";
import { CustomerComm } from "@/types/pmo";

export default function CustomerCommsPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addCustomerComm = usePmoStore((state) => state.addCustomerComm);
  const updateCustomerComm = usePmoStore((state) => state.updateCustomerComm);
  const deleteCustomerComm = usePmoStore((state) => state.deleteCustomerComm);

  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: customerComms = [], isLoading: isCommsLoading } = useCustomerCommsQuery(activeProgrammeId);

  const isLoading = isProgLoading || isCommsLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComm, setEditingComm] = useState<CustomerComm | null>(null);

  // Form states
  const [formDate, setFormDate] = useState("");
  const [formType, setFormType] = useState<CustomerComm["comm_type"]>("CALL");
  const [formDirection, setFormDirection] = useState<CustomerComm["direction"]>("OUT");
  const [formSubject, setFormSubject] = useState("");
  const [formAttendees, setFormAttendees] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formActions, setFormActions] = useState("");
  const [formSentiment, setFormSentiment] = useState<CustomerComm["sentiment"]>("NEUTRAL");
  const [formFollowUp, setFormFollowUp] = useState("");
  const [formStatus, setFormStatus] = useState("LOGGED");

  // Filtered customer comms
  const filteredComms = useMemo(() => {
    return customerComms
      .filter((cc) => {
        const matchesSearch = 
          cc.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (cc.summary || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (cc.attendees || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (cc.action_items || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = !typeFilter || cc.comm_type === typeFilter;
        const matchesDirection = !directionFilter || cc.direction === directionFilter;
        const matchesSentiment = !sentimentFilter || cc.sentiment === sentimentFilter;
        return matchesSearch && matchesType && matchesDirection && matchesSentiment;
      })
      .sort((a, b) => new Date(b.comm_date).getTime() - new Date(a.comm_date).getTime());
  }, [customerComms, searchQuery, typeFilter, directionFilter, sentimentFilter]);

  // Open modal helper
  const handleOpenModal = (cc?: CustomerComm) => {
    if (cc) {
      setEditingComm(cc);
      setFormDate(cc.comm_date);
      setFormType(cc.comm_type);
      setFormDirection(cc.direction);
      setFormSubject(cc.subject);
      setFormAttendees(cc.attendees || "");
      setFormSummary(cc.summary || "");
      setFormActions(cc.action_items || "");
      setFormSentiment(cc.sentiment);
      setFormFollowUp(cc.follow_up_date || "");
      setFormStatus(cc.status || "LOGGED");
    } else {
      setEditingComm(null);
      setFormDate(new Date().toISOString().slice(0, 10));
      setFormType("CALL");
      setFormDirection("OUT");
      setFormSubject("");
      setFormAttendees("");
      setFormSummary("");
      setFormActions("");
      setFormSentiment("NEUTRAL");
      setFormFollowUp("");
      setFormStatus("LOGGED");
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formDate) {
      alert("Please fill in Comm Date and Subject.");
      return;
    }

    const payload = {
      programme_id: activeProgrammeId,
      comm_date: formDate,
      comm_type: formType,
      direction: formDirection,
      subject: formSubject,
      attendees: formAttendees || null,
      summary: formSummary || null,
      action_items: formActions || null,
      sentiment: formSentiment,
      follow_up_date: formFollowUp || null,
      status: formStatus
    };

    if (editingComm) {
      updateCustomerComm(editingComm.id, payload);
    } else {
      addCustomerComm(payload);
    }
    setIsModalOpen(false);
  };

  const handleDeleteComm = (id: number) => {
    if (confirm("Are you sure you want to delete this communication entry?")) {
      deleteCustomerComm(id);
    }
  };

  // CSV Export helper
  const handleExportCSV = () => {
    const headers = ["Comm Date", "Comm Type", "Direction", "Subject", "Attendees", "Summary", "Action Items", "Sentiment", "Logged By", "Follow Up Date", "Status"];
    const rows = filteredComms.map((cc) => [
      cc.comm_date,
      cc.comm_type,
      cc.direction,
      cc.subject,
      cc.attendees || "—",
      cc.summary || "—",
      cc.action_items || "—",
      cc.sentiment,
      cc.logged_by,
      cc.follow_up_date || "—",
      cc.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customer_comms_${activeProgrammeId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI calculations
  const kpiTotal = customerComms.length;
  const kpiPositive = customerComms.filter(cc => cc.sentiment === "POSITIVE").length;
  const kpiConcerned = customerComms.filter(cc => cc.sentiment === "CONCERNED").length;
  const kpiIncoming = customerComms.filter(cc => cc.direction === "IN").length;

  const getSentimentIcon = (sentiment: CustomerComm["sentiment"]) => {
    switch (sentiment) {
      case "POSITIVE": return <Smile className="w-4 h-4 text-emerald-600" />;
      case "CONCERNED": return <HeartCrack className="w-4 h-4 text-rose-600" />;
      default: return <MessageSquare className="w-4 h-4 text-slate-550" />;
    }
  };

  const getSentimentClass = (sentiment: CustomerComm["sentiment"]) => {
    switch (sentiment) {
      case "POSITIVE": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CONCERNED": return "bg-rose-50 text-rose-700 border-rose-200 animate-pulse";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Communications...</span>
        </div>
      </div>
    );
  }

  if (!activeProgramme) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Phone className="w-16 h-16 text-slate-350 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Active Programme</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select a programme to view and log customer communications.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col p-6 overflow-y-auto bg-bg-base font-sans text-xs space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy flex items-center gap-2">
            <Phone className="w-6 h-6 text-dc-blue" />
            <span>Customer Communications Timeline</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Log client interactions, emails, site visits, and calls to track sentiment and follows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50 font-bold transition-colors shadow-xs cursor-pointer text-slate-700"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 bg-dc-blue hover:bg-dc-blue-dark text-white font-bold px-3 py-1.5 rounded-md transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Communication</span>
          </button>
        </div>
      </div>

      {/* KPI stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Interactions</span>
          <span className="text-xl font-black text-navy block mt-2">{kpiTotal}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-emerald-600">Client Approvals / Positive</span>
          <span className="text-xl font-black text-emerald-600 block mt-2">{kpiPositive}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-rose-600">Concern / Risk Flagged</span>
          <span className="text-xl font-black text-rose-600 block mt-2">{kpiConcerned}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-dc-blue">Client Request Incoming</span>
          <span className="text-xl font-black text-dc-blue block mt-2">{kpiIncoming} IN</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search comm logs by subject, summary, action items..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs w-full focus:outline-none placeholder-slate-400"
          />
        </div>

        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer font-medium"
        >
          <option value="">All Formats</option>
          <option value="CALL">CALL</option>
          <option value="EMAIL">EMAIL</option>
          <option value="MEETING">MEETING</option>
          <option value="VISIT">VISIT</option>
        </select>

        <select 
          value={directionFilter} 
          onChange={(e) => setDirectionFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer font-medium"
        >
          <option value="">All Directions</option>
          <option value="IN">IN (Client Incoming)</option>
          <option value="OUT">OUT (To Client)</option>
        </select>

        <select 
          value={sentimentFilter} 
          onChange={(e) => setSentimentFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer font-medium"
        >
          <option value="">All Sentiment Ratings</option>
          <option value="POSITIVE">POSITIVE</option>
          <option value="NEUTRAL">NEUTRAL</option>
          <option value="CONCERNED">CONCERNED</option>
        </select>
      </div>

      {/* Timeline display */}
      <div className="space-y-4 flex-1">
        {filteredComms.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-16 text-center text-slate-400 italic shadow-sm">
            No customer communications logged.
          </div>
        ) : (
          filteredComms.map((cc) => {
            const isIncoming = cc.direction === "IN";
            return (
              <div 
                key={cc.id} 
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-start gap-4"
              >
                {/* Form indicator / Date */}
                <div className="flex md:flex-col items-center md:items-start gap-2 md:w-36 shrink-0 border-r border-slate-100 pr-2">
                  <div className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border select-none",
                    isIncoming ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-sky-50 text-sky-700 border-sky-200"
                  )}>
                    {isIncoming ? (
                      <React.Fragment>
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>Incoming</span>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Outgoing</span>
                      </React.Fragment>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-mono mt-1 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{cc.comm_date}</span>
                  </div>
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-bold px-1.5 py-0.2 mt-1">
                    {cc.comm_type}
                  </span>
                </div>

                {/* Content main block */}
                <div className="flex-1 space-y-3 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-navy">{cc.subject}</h3>
                    <span className={cn("inline-flex items-center gap-1 border rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase", getSentimentClass(cc.sentiment))}>
                      {getSentimentIcon(cc.sentiment)}
                      <span>{cc.sentiment}</span>
                    </span>
                  </div>

                  <p className="text-slate-650 leading-relaxed text-[11px] whitespace-pre-line bg-slate-50/50 p-3 rounded-lg border border-slate-150">
                    {cc.summary || "No summary notes recorded."}
                  </p>

                  {/* Attendees */}
                  {cc.attendees && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-550 bg-slate-50 border border-slate-200/60 rounded px-2.5 py-1 w-max max-w-full">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-600 shrink-0">Attendees:</span>
                      <span className="truncate">{cc.attendees}</span>
                    </div>
                  )}

                  {/* Action items box */}
                  {cc.action_items && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3">
                      <b className="text-indigo-800 text-[10px] uppercase tracking-wide block mb-1">Direct Action Directives:</b>
                      <p className="text-indigo-950 font-medium leading-relaxed font-sans">{cc.action_items}</p>
                    </div>
                  )}

                  {/* Footer details */}
                  <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-450 font-mono pt-2 border-t border-slate-50">
                    <span>Logged by: <b>{cc.logged_by}</b></span>
                    {cc.follow_up_date && (
                      <span className="text-rose-600 font-bold flex items-center gap-1 bg-rose-50 px-2 py-0.5 border border-rose-100 rounded">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Follow Up target: {cc.follow_up_date}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* CRUD button options */}
                <div className="flex md:flex-col items-center justify-end gap-1.5 md:self-start shrink-0">
                  <button 
                    onClick={() => handleOpenModal(cc)}
                    className="p-1.5 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded text-slate-650 hover:text-slate-950 transition-all font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteComm(cc.id)}
                    className="p-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded text-slate-400 hover:text-rose-700 transition-all inline-flex items-center cursor-pointer"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Log Comm Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-sky-400" />
                <span>{editingComm ? "Edit Communication Log" : "Log Client Interaction"}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="hover:bg-slate-800 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Comm Date */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Interaction Date *
                  </label>
                  <input 
                    type="date" 
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono"
                  />
                </div>

                {/* Comm Format Type */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Communication Channel
                  </label>
                  <select 
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-semibold"
                  >
                    <option value="CALL">CALL (Telephone/VoIP)</option>
                    <option value="EMAIL">EMAIL (Audit exchange)</option>
                    <option value="MEETING">MEETING (Formal review)</option>
                    <option value="VISIT">VISIT (Site/Lab delegation)</option>
                  </select>
                </div>

                {/* Direction */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Direction
                  </label>
                  <select 
                    value={formDirection}
                    onChange={(e) => setFormDirection(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-bold"
                  >
                    <option value="OUT">OUTGOING (To Customer)</option>
                    <option value="IN">INCOMING (From Customer)</option>
                  </select>
                </div>

                {/* Sentiment */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Client Sentiment Rating
                  </label>
                  <select 
                    value={formSentiment}
                    onChange={(e) => setFormSentiment(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-bold"
                  >
                    <option value="POSITIVE">😊 POSITIVE (Alignment/Approval)</option>
                    <option value="NEUTRAL">😐 NEUTRAL (Status check)</option>
                    <option value="CONCERNED">⚠️ CONCERNED (Technical Risk/Issue)</option>
                  </select>
                </div>

                {/* Subject */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Subject Heading *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Design review feedback for inner lens bezel"
                    required
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-semibold"
                  />
                </div>

                {/* Attendees */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Attendees List
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Aditya Verma, John Doe (Client PM)"
                    value={formAttendees}
                    onChange={(e) => setFormAttendees(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-medium"
                  />
                </div>

                {/* Summary */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Interaction Summary Notes
                  </label>
                  <textarea 
                    placeholder="Briefly state discussions, feedback, changes, or engineering alignments..."
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                  />
                </div>

                {/* Actions */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Action Directives & Next Steps
                  </label>
                  <textarea 
                    placeholder="E.g. Aditya to release modified LDO layouts; Umar to update Gantt week 12..."
                    value={formActions}
                    onChange={(e) => setFormActions(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                  />
                </div>

                {/* Follow Up Date */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Follow Up Target Date
                  </label>
                  <input 
                    type="date" 
                    value={formFollowUp}
                    onChange={(e) => setFormFollowUp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Log Status
                  </label>
                  <input 
                    type="text" 
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
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
                  Save Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
