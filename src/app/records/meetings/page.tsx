"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useMeetingsQuery } from "@/hooks/use-pmo-queries";
import { 
  ClipboardList, Search, Plus, FileSpreadsheet, Edit3, Trash2, X, Calendar, User, BookOpen, AlertCircle, Users
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Meeting } from "@/types/pmo";

export default function MeetingsPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addMeeting = usePmoStore((state) => state.addMeeting);
  const updateMeeting = usePmoStore((state) => state.updateMeeting);
  const deleteMeeting = usePmoStore((state) => state.deleteMeeting);

  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: meetings = [], isLoading: isMtgLoading } = useMeetingsQuery(activeProgrammeId);

  const isLoading = isProgLoading || isMtgLoading;

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Selected meeting state (defaults to first in list)
  const [selectedMtgId, setSelectedMtgId] = useState<number | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMtg, setEditingMtg] = useState<Meeting | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<Meeting["meeting_type"]>("STATUS");
  const [formDate, setFormDate] = useState("");
  const [formAttendees, setFormAttendees] = useState("");
  const [formAgenda, setFormAgenda] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formActionItems, setFormActionItems] = useState("");
  const [formNextDate, setFormNextDate] = useState("");

  // Filtered meetings list
  const filteredMtgs = useMemo(() => {
    return meetings
      .filter((m) => {
        const matchesSearch = 
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.agenda || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.notes || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.attendees || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = !typeFilter || m.meeting_type === typeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime());
  }, [meetings, searchQuery, typeFilter]);

  // Set default selection when data loads
  const activeSelectedMtg = useMemo(() => {
    if (selectedMtgId !== null) {
      const match = meetings.find(m => m.id === selectedMtgId);
      if (match) return match;
    }
    return filteredMtgs[0] || null;
  }, [filteredMtgs, meetings, selectedMtgId]);

  // Open modal helper
  const handleOpenModal = (m?: Meeting) => {
    if (m) {
      setEditingMtg(m);
      setFormTitle(m.title);
      setFormType(m.meeting_type);
      setFormDate(m.meeting_date);
      setFormAttendees(m.attendees || "");
      setFormAgenda(m.agenda || "");
      setFormNotes(m.notes || "");
      setFormActionItems(m.action_items || "");
      setFormNextDate(m.next_meeting_date || "");
    } else {
      setEditingMtg(null);
      setFormTitle("");
      setFormType("STATUS");
      setFormDate(new Date().toISOString().slice(0, 10));
      setFormAttendees("");
      setFormAgenda("");
      setFormNotes("");
      setFormActionItems("");
      setFormNextDate("");
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) {
      alert("Please fill in Meeting Date and Title.");
      return;
    }

    const payload = {
      programme_id: activeProgrammeId,
      meeting_type: formType,
      meeting_date: formDate,
      title: formTitle,
      attendees: formAttendees || null,
      agenda: formAgenda || null,
      notes: formNotes || null,
      action_items: formActionItems || null,
      next_meeting_date: formNextDate || null,
      logged_by: editingMtg?.logged_by || usePmoStore.getState().user?.name || "Vinayak Chouhan"
    };

    if (editingMtg) {
      updateMeeting(editingMtg.id, payload);
    } else {
      addMeeting(payload);
    }
    setIsModalOpen(false);
  };

  const handleDeleteMtg = (id: number) => {
    if (confirm("Are you sure you want to delete this meeting registry entry?")) {
      deleteMeeting(id);
      if (selectedMtgId === id) {
        setSelectedMtgId(null);
      }
    }
  };

  // CSV Export helper
  const handleExportCSV = () => {
    const headers = ["Meeting Date", "Meeting Type", "Title", "Attendees", "Agenda", "Discussion Notes", "Action Items", "Next Meeting Target", "Logged By"];
    const rows = filteredMtgs.map((m) => [
      m.meeting_date,
      m.meeting_type,
      m.title,
      m.attendees || "—",
      m.agenda || "—",
      m.notes || "—",
      m.action_items || "—",
      m.next_meeting_date || "—",
      m.logged_by
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `meeting_minutes_${activeProgrammeId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeBadgeClass = (type: Meeting["meeting_type"]) => {
    switch (type) {
      case "KICKOFF": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "DESIGN_REVIEW": return "bg-sky-50 text-sky-700 border-sky-200";
      case "DAILY": return "bg-slate-100 text-slate-700 border-slate-300";
      default: return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Meeting Minutes...</span>
        </div>
      </div>
    );
  }

  if (!activeProgramme) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ClipboardList className="w-16 h-16 text-slate-350 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Active Programme</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select a programme to view and log meeting minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col p-6 overflow-hidden bg-bg-base font-sans text-xs space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-navy flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-dc-blue" />
            <span>Meeting Minutes (MoM)</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Maintain agendas, discussions, participant logs, and key action directives from weekly syncs.
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
            <span>New Meeting</span>
          </button>
        </div>
      </div>

      {/* Main split-panel area */}
      <div className="flex-1 flex gap-5 overflow-hidden min-h-0">
        
        {/* Left Side: Meetings List Panel */}
        <div className="w-80 bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden shrink-0 shadow-sm">
          
          {/* List Toolbar filters */}
          <div className="p-3 border-b border-slate-150 space-y-2 bg-slate-50/55 shrink-0">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded px-2.5 py-1.5 w-full">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search meeting titles..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-[11px] w-full focus:outline-none placeholder-slate-400"
              />
            </div>
            
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none w-full cursor-pointer text-[10px]"
            >
              <option value="">All Meeting Formats</option>
              <option value="KICKOFF">KICKOFF</option>
              <option value="STATUS">STATUS SYNC</option>
              <option value="DESIGN_REVIEW">DESIGN REVIEW</option>
              <option value="DAILY">DAILY STANDUP</option>
            </select>
          </div>

          {/* Scrollable list content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredMtgs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic">
                No meetings found.
              </div>
            ) : (
              filteredMtgs.map((m) => {
                const isSelected = activeSelectedMtg?.id === m.id;
                return (
                  <div 
                    key={m.id}
                    onClick={() => setSelectedMtgId(m.id)}
                    className={cn(
                      "p-3.5 cursor-pointer transition-all hover:bg-slate-50/60 select-none text-left relative",
                      isSelected ? "bg-indigo-50/40 border-l-4 border-dc-blue" : "border-l-4 border-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("inline-block border rounded px-1.5 py-0.2 text-[8px] font-bold uppercase", getTypeBadgeClass(m.meeting_type))}>
                        {m.meeting_type}
                      </span>
                      <span className="text-[10px] font-mono text-slate-450">{m.meeting_date}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 mt-2 line-clamp-2 text-[11px]">{m.title}</h4>
                    <span className="text-[9px] text-slate-400 block mt-1 truncate">Logged by: {m.logged_by}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Selected Meeting Minutes details */}
        <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          {activeSelectedMtg ? (
            <React.Fragment>
              
              {/* Detail Header block */}
              <div className="bg-slate-900 text-white p-5 flex items-start justify-between gap-4 shrink-0">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-white/10 text-sky-350 border border-white/15 rounded px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                      {activeSelectedMtg.meeting_type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Date: {activeSelectedMtg.meeting_date}</span>
                  </div>
                  <h2 className="text-sm font-black tracking-wide leading-snug">{activeSelectedMtg.title}</h2>
                  <span className="text-[10px] text-slate-400 block font-mono">Logged by: {activeSelectedMtg.logged_by}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={() => handleOpenModal(activeSelectedMtg)}
                    className="bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 rounded-md font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit MoM</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteMtg(activeSelectedMtg.id)}
                    className="bg-white/5 hover:bg-rose-900 border border-white/10 p-2 rounded-md text-slate-400 hover:text-white transition-all cursor-pointer"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Scrollable details panel */}
              <div className="flex-1 p-6 overflow-y-auto space-y-5 text-slate-700">
                
                {/* Agenda Box */}
                <div className="space-y-1.5">
                  <h3 className="font-black text-navy uppercase text-[9px] tracking-wider flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span>Meeting Agenda</span>
                  </h3>
                  <div className="bg-slate-50 border border-slate-150 rounded-lg p-4 font-sans leading-relaxed text-[11px] whitespace-pre-line">
                    {activeSelectedMtg.agenda || "No agenda listed."}
                  </div>
                </div>

                {/* Discussion details */}
                <div className="space-y-1.5">
                  <h3 className="font-black text-navy uppercase text-[9px] tracking-wider flex items-center gap-1">
                    <ClipboardList className="w-4 h-4 text-slate-400" />
                    <span>Discussion Minutes & Notes</span>
                  </h3>
                  <div className="bg-slate-50 border border-slate-155 rounded-lg p-4 font-sans leading-relaxed text-[11px] whitespace-pre-line text-slate-800">
                    {activeSelectedMtg.notes || "No discussion notes recorded."}
                  </div>
                </div>

                {/* Direct Action Directives */}
                {activeSelectedMtg.action_items && (
                  <div className="space-y-1.5">
                    <h3 className="font-black text-indigo-900 uppercase text-[9px] tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-indigo-400" />
                      <span>Action Directives & Task Allocations</span>
                    </h3>
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 font-sans leading-relaxed text-indigo-950 font-medium">
                      {activeSelectedMtg.action_items}
                    </div>
                  </div>
                )}

                {/* Attendees list */}
                {activeSelectedMtg.attendees && (
                  <div className="flex items-center gap-2 bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 w-max max-w-full">
                    <Users className="w-4 h-4 text-slate-455 shrink-0" />
                    <span className="font-bold text-slate-655 shrink-0">Attendees:</span>
                    <span className="truncate font-sans font-medium text-slate-700">{activeSelectedMtg.attendees}</span>
                  </div>
                )}

                {/* Next Sync Date */}
                {activeSelectedMtg.next_meeting_date && (
                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 w-max">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Next Planned Sync Date: <b>{activeSelectedMtg.next_meeting_date}</b></span>
                  </div>
                )}

              </div>

            </React.Fragment>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-16 text-slate-400 italic">
              Please choose a meeting minutes log from the list.
            </div>
          )}
        </div>

      </div>

      {/* Log Meeting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-sky-400" />
                <span>{editingMtg ? "Edit Meeting Minutes" : "Register Meeting & Agendas"}</span>
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
                
                {/* Meeting Date */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Meeting Date *
                  </label>
                  <input 
                    type="date" 
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono"
                  />
                </div>

                {/* Meeting Type */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Meeting Classification
                  </label>
                  <select 
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-semibold"
                  >
                    <option value="STATUS">STATUS SYNC (Weekly Program Meeting)</option>
                    <option value="KICKOFF">KICKOFF (Phase Initialization)</option>
                    <option value="DESIGN_REVIEW">DESIGN REVIEW (Specs Signoff)</option>
                    <option value="DAILY">DAILY STANDUP (Over-the-shoulder check)</option>
                  </select>
                </div>

                {/* Title */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Meeting Subject Title *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Design Gate G1 Review & PCB Assembly sign-off"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-semibold"
                  />
                </div>

                {/* Attendees */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Participants List
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Umar Sharif, Aditya Verma, Client QA manager"
                    value={formAttendees}
                    onChange={(e) => setFormAttendees(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-medium"
                  />
                </div>

                {/* Agenda */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Meeting Agenda
                  </label>
                  <textarea 
                    placeholder="1. Review tool arrival status&#10;2. Align on IMDS documentation requirements..."
                    value={formAgenda}
                    onChange={(e) => setFormAgenda(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                  />
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Discussion Minutes & Critical Agreements
                  </label>
                  <textarea 
                    placeholder="Provide details on mechanical simulations discussed, team alignments, and technical signoffs..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                  />
                </div>

                {/* Action Items */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
                    Action Directives & Task Allocations
                  </label>
                  <textarea 
                    placeholder="E.g. Vishal to complete outer bezel models. Ankit to audit EPDM compressibility test logs..."
                    value={formActionItems}
                    onChange={(e) => setFormActionItems(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                  />
                </div>

                {/* Next Sync Date */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Next Sync Date
                  </label>
                  <input 
                    type="date" 
                    value={formNextDate}
                    onChange={(e) => setFormNextDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono"
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
                  Register Minutes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
