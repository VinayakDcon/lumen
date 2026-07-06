"use client";

import React, { useState, useMemo, useRef } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useConsignmentsQuery } from "@/hooks/use-pmo-queries";
import { 
  Package, Search, Plus, FileSpreadsheet, Edit3, X, File, Upload, Trash2, ArrowUpRight, CheckCircle2, AlertCircle, HelpCircle
} from "lucide-react";
import { cn } from "@/utils/cn";
import { ConsignmentKit, KitAttachment } from "@/types/pmo";

export default function ShipmentsPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addConsignment = usePmoStore((state) => state.addConsignment);
  const updateConsignment = usePmoStore((state) => state.updateConsignment);
  const deleteConsignment = usePmoStore((state) => state.deleteConsignment);
  const toggleConsignmentField = usePmoStore((state) => state.toggleConsignmentField);
  const cycleConsignmentStatus = usePmoStore((state) => state.cycleConsignmentStatus);
  const addConsignmentAttachment = usePmoStore((state) => state.addConsignmentAttachment);
  const deleteConsignmentAttachment = usePmoStore((state) => state.deleteConsignmentAttachment);
  const currentUser = usePmoStore((state) => state.user);

  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: consignments = [], isLoading: isShipmentsLoading } = useConsignmentsQuery(activeProgrammeId);

  const isLoading = isProgLoading || isShipmentsLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals state
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeKit, setActiveKit] = useState<ConsignmentKit | null>(null);

  // Add shipment form states
  const [formKitNum, setFormKitNum] = useState("");
  const [formKind, setFormKind] = useState<"KIT" | "SPARE">("KIT");
  const [formBuildWk, setFormBuildWk] = useState(8);
  const [formShipWk, setFormShipWk] = useState(9);
  const [formShipDate, setFormShipDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Tracking editor form states
  const [formCarrier, setFormCarrier] = useState("");
  const [formAwb, setFormAwb] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formCustoms, setFormCustoms] = useState("");
  const [formDispDate, setFormDispDate] = useState("");

  // Mock Upload states
  const [uploadKind, setUploadKind] = useState<KitAttachment["kind"]>("RECEIPT");
  const [uploadCaption, setUploadCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered consignments
  const filteredConsignments = useMemo(() => {
    return consignments
      .filter((c) => {
        const matchesSearch = 
          (c.carrier || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.awb_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesKind = !kindFilter || c.kind === kindFilter;
        const matchesStatus = !statusFilter || c.status === statusFilter;
        return matchesSearch && matchesKind && matchesStatus;
      })
      .sort((a, b) => a.kit_number - b.kit_number);
  }, [consignments, searchQuery, kindFilter, statusFilter]);

  // KPIs
  const kpiShipped = consignments.filter(c => c.status === "SHIPPED").length;
  const kpiInProgress = consignments.filter(c => ["BUILDING", "EOL TEST", "PACKED"].includes(c.status)).length;
  const kpiPending = consignments.filter(c => c.status === "NOT STARTED").length;

  const handleOpenTracker = (k: ConsignmentKit) => {
    setActiveKit(k);
    setFormCarrier(k.carrier || "");
    setFormAwb(k.awb_number || "");
    setFormUrl(k.tracking_url || "");
    setFormCustoms(k.customs_status || "");
    setFormDispDate(k.dispatched_at ? k.dispatched_at.slice(0, 10) : "");
    setSelectedFile(null);
    setUploadCaption("");
    setIsTrackOpen(true);
  };

  const handleSaveTracker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKit) return;

    updateConsignment(activeKit.kit_number, {
      carrier: formCarrier || null,
      awb_number: formAwb || null,
      tracking_url: formUrl || null,
      customs_status: formCustoms || null,
      dispatched_at: formDispDate ? `${formDispDate}T12:00:00Z` : null
    });

    setIsTrackOpen(false);
  };

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    const num = formKitNum ? Number(formKitNum) : undefined;
    addConsignment({
      programme_id: activeProgrammeId,
      kit_number: num,
      kind: formKind,
      build_wk: formBuildWk,
      ship_wk: formShipWk,
      ship_date: formShipDate || null,
      status: "NOT STARTED",
      eol_test_pass: 0,
      imds_packet: 0,
      invoice_sent: 0,
      notes: formNotes
    });
    setIsAddOpen(false);
  };

  const handleDeleteShipment = (kitNum: number) => {
    if (confirm(`Are you sure you want to delete shipment #${kitNum}?`)) {
      deleteConsignment(kitNum);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleMockUpload = () => {
    if (!activeKit || !selectedFile) {
      alert("Please select a file first.");
      return;
    }

    addConsignmentAttachment(activeKit.kit_number, {
      kit_number: activeKit.kit_number,
      kind: uploadKind,
      filename: selectedFile.name.toLowerCase().replace(/\s+/g, "_"),
      original_name: selectedFile.name,
      mime_type: selectedFile.type || "application/octet-stream",
      size_bytes: selectedFile.size,
      uploaded_by: currentUser?.name || "User",
      caption: uploadCaption
    });

    // Reset input fields
    setSelectedFile(null);
    setUploadCaption("");
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Refresh active kit layout
    const freshKit = usePmoStore.getState().consignments.find(c => c.kit_number === activeKit.kit_number);
    if (freshKit) setActiveKit(freshKit);
  };

  const handleDeleteAttachment = (attId: number) => {
    if (!activeKit) return;
    if (confirm("Delete this document from this shipment?")) {
      deleteConsignmentAttachment(activeKit.kit_number, attId);
      const freshKit = usePmoStore.getState().consignments.find(c => c.kit_number === activeKit.kit_number);
      if (freshKit) setActiveKit(freshKit);
    }
  };

  // CSV Export helper
  const handleExportCSV = () => {
    const headers = ["Kit Number", "Type", "Build Week", "Ship Week", "Ship Date", "EOL Test Pass", "IMDS Packet", "Invoice Sent", "Status", "Carrier", "AWB Number", "Customs Status", "Notes"];
    const rows = filteredConsignments.map((c) => [
      c.kind === "SPARE" ? `Spare ${c.kit_number - 100}` : `Kit ${c.kit_number}`,
      c.kind,
      c.build_wk,
      c.ship_wk,
      c.ship_date || "—",
      c.eol_test_pass ? "YES" : "NO",
      c.imds_packet ? "YES" : "NO",
      c.invoice_sent ? "YES" : "NO",
      c.status,
      c.carrier || "—",
      c.awb_number || "—",
      c.customs_status || "—",
      c.notes || "—"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `consignments_${activeProgrammeId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusClass = (status: ConsignmentKit["status"]) => {
    switch (status) {
      case "SHIPPED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PACKED": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "EOL TEST": return "bg-sky-50 text-sky-700 border-sky-200";
      case "BUILDING": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100 hover:border-slate-350";
    }
  };

  const getCustomsClass = (status: string | null) => {
    switch (status) {
      case "DELIVERED": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "CLEARED": return "bg-teal-100 text-teal-800 border-teal-200";
      case "HOLD": return "bg-rose-100 text-rose-800 border-rose-200 animate-pulse";
      case "PENDING": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-slate-100 text-slate-400 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Shipments...</span>
        </div>
      </div>
    );
  }

  if (!activeProgramme) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Package className="w-16 h-16 text-slate-350 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Active Programme</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select a programme to track shipping consignments and kits.
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
            <Package className="w-6 h-6 text-dc-blue" />
            <span>Consignment kits & Shipment Dispatch</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Manage EOL test passing, commercial invoice releases, IMDS chemical tracking packets, and custom logistics tracking.
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
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 bg-dc-blue hover:bg-dc-blue-dark text-white font-bold px-3 py-1.5 rounded-md transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Shipment Kit</span>
          </button>
        </div>
      </div>

      {/* KPI stats tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Shipped (Delivered)</span>
          <span className="text-xl font-black text-emerald-600 block mt-2">{kpiShipped}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-dc-blue">In Sourcing / Building</span>
          <span className="text-xl font-black text-dc-blue block mt-2">{kpiInProgress}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pending Build / Backlog</span>
          <span className="text-xl font-black text-navy block mt-2">{kpiPending}</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search shipments by carrier, AWB, notes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs w-full focus:outline-none placeholder-slate-400"
          />
        </div>
        
        <select 
          value={kindFilter} 
          onChange={(e) => setKindFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer font-medium"
        >
          <option value="">All Types</option>
          <option value="KIT">KIT (Production / Prototype)</option>
          <option value="SPARE">SPARE (Service Parts)</option>
        </select>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-dc-blue cursor-pointer font-medium"
        >
          <option value="">All Statuses</option>
          <option value="NOT STARTED">NOT STARTED</option>
          <option value="BUILDING">BUILDING</option>
          <option value="EOL TEST">EOL TEST</option>
          <option value="PACKED">PACKED</option>
          <option value="SHIPPED">SHIPPED</option>
        </select>
      </div>

      {/* Consignment Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1 min-h-[400px]">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] select-none">
              <th className="px-4 py-3">Kit/Spare #</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Build Wk</th>
              <th className="px-4 py-3">Ship Wk</th>
              <th className="px-4 py-3">Ship Date</th>
              <th className="px-4 py-3 text-center">EOL Pass</th>
              <th className="px-4 py-3 text-center">IMDS Packet</th>
              <th className="px-4 py-3 text-center">Invoice Sent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Carrier</th>
              <th className="px-4 py-3">AWB / Tracking</th>
              <th className="px-4 py-3">Customs</th>
              <th className="px-4 py-3">Dispatched Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredConsignments.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-16 text-center text-slate-400 italic">
                  No kits or spare shipments found matching filters.
                </td>
              </tr>
            ) : (
              filteredConsignments.map((c) => {
                const label = c.kind === "SPARE" ? `Spare ${c.kit_number - 100}` : `Kit ${c.kit_number}`;
                const docsCount = c.attachments?.length || 0;
                return (
                  <tr key={c.kit_number} className="hover:bg-slate-50/50 group transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{label}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase border",
                        c.kind === "SPARE" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-teal-50 text-teal-700 border-teal-200"
                      )}>
                        {c.kind}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">Wk {c.build_wk}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">Wk {c.ship_wk}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{c.ship_date || "—"}</td>
                    
                    {/* EOL pass boolean toggle */}
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => toggleConsignmentField(c.kit_number, "eol_test_pass")}
                        className={cn(
                          "inline-flex items-center justify-center w-6 h-6 rounded border font-bold text-xs select-none shadow-3xs cursor-pointer transition-colors",
                          c.eol_test_pass 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100" 
                            : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                        )}
                      >
                        {c.eol_test_pass ? "✓" : "✗"}
                      </button>
                    </td>

                    {/* IMDS packet boolean toggle */}
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => toggleConsignmentField(c.kit_number, "imds_packet")}
                        className={cn(
                          "inline-flex items-center justify-center w-6 h-6 rounded border font-bold text-xs select-none shadow-3xs cursor-pointer transition-colors",
                          c.imds_packet 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100" 
                            : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                        )}
                      >
                        {c.imds_packet ? "✓" : "✗"}
                      </button>
                    </td>

                    {/* Invoice sent boolean toggle */}
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => toggleConsignmentField(c.kit_number, "invoice_sent")}
                        className={cn(
                          "inline-flex items-center justify-center w-6 h-6 rounded border font-bold text-xs select-none shadow-3xs cursor-pointer transition-colors",
                          c.invoice_sent 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100" 
                            : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                        )}
                      >
                        {c.invoice_sent ? "✓" : "✗"}
                      </button>
                    </td>

                    {/* Shipments Status cycles */}
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => cycleConsignmentStatus(c.kit_number)}
                        className={cn("inline-block border rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wide select-none cursor-pointer transition-all shadow-3xs", getStatusClass(c.status))}
                      >
                        {c.status}
                      </button>
                    </td>
                    
                    <td className="px-4 py-3 font-medium">{c.carrier || "—"}</td>
                    
                    <td className="px-4 py-3 font-mono">
                      {c.awb_number ? (
                        c.tracking_url ? (
                          <a 
                            href={c.tracking_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-dc-blue hover:text-dc-blue-dark hover:underline font-bold inline-flex items-center gap-0.5"
                          >
                            <span>{c.awb_number}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        ) : (
                          <span>{c.awb_number}</span>
                        )
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {c.customs_status ? (
                        <span className={cn("inline-block border rounded px-1.5 py-0.5 text-[9px] font-bold uppercase", getCustomsClass(c.customs_status))}>
                          {c.customs_status}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-500">
                      {c.dispatched_at ? c.dispatched_at.slice(0, 10) : "—"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleOpenTracker(c)}
                          className="p-1 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded text-slate-600 hover:text-slate-900 transition-all font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>📦 Track</span>
                          {docsCount > 0 && (
                            <span className="bg-dc-blue text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black leading-none">
                              {docsCount}
                            </span>
                          )}
                        </button>
                        <button 
                          onClick={() => handleDeleteShipment(c.kit_number)}
                          className="p-1 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded text-slate-400 hover:text-rose-700 transition-all inline-flex items-center cursor-pointer"
                          title="Delete Shipment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 📦 Shipment Tracker & Document Uploads Modal */}
      {isTrackOpen && activeKit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Package className="w-4 h-4 text-sky-400" />
                <span>Shipment & Sourcing Track · {activeKit.kind === "SPARE" ? `Spare #${activeKit.kit_number - 100}` : `Kit #${activeKit.kit_number}`}</span>
              </h3>
              <button 
                onClick={() => setIsTrackOpen(false)}
                className="hover:bg-slate-800 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-slate-700">
              {/* Form specs */}
              <form onSubmit={handleSaveTracker} className="space-y-4 border-b border-slate-100 pb-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Carrier Service
                    </label>
                    <select 
                      value={formCarrier}
                      onChange={(e) => setFormCarrier(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-medium"
                    >
                      <option value="">— Choose Carrier —</option>
                      <option value="DHL Express">DHL Express</option>
                      <option value="FedEx">FedEx</option>
                      <option value="Blue Dart">Blue Dart</option>
                      <option value="UPS">UPS</option>
                      <option value="TNT">TNT</option>
                      <option value="DTDC">DTDC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      AWB / Tracking Number
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. AWB-7729910"
                      value={formAwb}
                      onChange={(e) => setFormAwb(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Tracking Link URL
                    </label>
                    <input 
                      type="url" 
                      placeholder="https://www.dhl.com/track..."
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Customs Status
                    </label>
                    <select 
                      value={formCustoms}
                      onChange={(e) => setFormCustoms(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-bold"
                    >
                      <option value="">— None —</option>
                      <option value="PENDING">PENDING</option>
                      <option value="CLEARED">CLEARED</option>
                      <option value="HOLD">HOLD</option>
                      <option value="DELIVERED">DELIVERED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Dispatched Date
                    </label>
                    <input 
                      type="date" 
                      value={formDispDate}
                      onChange={(e) => setFormDispDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit"
                    className="bg-slate-900 hover:bg-black text-white font-bold px-4 py-1.5 rounded transition-colors text-xs cursor-pointer shadow-xs"
                  >
                    Save Logistics Tracking Info
                  </button>
                </div>
              </form>

              {/* Sourcing attachments uploads widget */}
              <div className="space-y-4">
                <h4 className="font-bold text-navy text-xs border-l-2 border-dc-blue pl-2 uppercase tracking-wide">
                  📎 Shipment Documents & File Uploads
                </h4>
                
                {/* Upload Form */}
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">Doc Type</label>
                      <select 
                        value={uploadKind}
                        onChange={(e) => setUploadKind(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none text-[11px] font-semibold cursor-pointer"
                      >
                        <option value="AWB">AWB / Airway bill scan</option>
                        <option value="RECEIPT">Dispatch receipt</option>
                        <option value="POD">Proof of delivery (POD)</option>
                        <option value="INVOICE">Commercial invoice</option>
                        <option value="PHOTO">Packaging Photo</option>
                        <option value="OTHER">Other document</option>
                      </select>
                    </div>

                    <div className="flex-[2] min-w-[200px]">
                      <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">Caption note</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Scanned receipt from customs agent"
                        value={uploadCaption}
                        onChange={(e) => setUploadCaption(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 focus:outline-none text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        id="ship-file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <File className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedFile ? selectedFile.name : "Choose document..."}</span>
                      </button>
                      {selectedFile && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({Math.round(selectedFile.size / 1024)} KB)
                        </span>
                      )}
                    </div>
                    
                    <button 
                      type="button"
                      onClick={handleMockUpload}
                      disabled={!selectedFile}
                      className={cn(
                        "bg-dc-blue text-white font-bold px-3 py-1.5 rounded transition-all inline-flex items-center gap-1.5",
                        selectedFile ? "hover:bg-dc-blue-dark cursor-pointer shadow-sm" : "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File</span>
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400">
                    Supports PDF, Excel, ZIP, Word documents, and photos up to 25 MB.
                  </p>
                </div>

                {/* Attachments List */}
                <div className="space-y-2">
                  {!activeKit.attachments || activeKit.attachments.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-slate-400 italic">
                      No documents uploaded yet. Upload receipt notes, AWB printouts, or proof of delivery scans.
                    </div>
                  ) : (
                    activeKit.attachments.map((a) => {
                      const sizeKb = Math.round(a.size_bytes / 1024);
                      return (
                        <div key={a.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="w-9 h-9 bg-sky-50 text-dc-blue rounded-lg border border-sky-100 flex items-center justify-center font-bold text-lg select-none">
                            📄
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-sky-100 text-sky-800 border border-sky-200 text-[8px] font-black uppercase rounded px-1 tracking-wider leading-none py-0.5">
                                {a.kind}
                              </span>
                              <span className="font-bold text-slate-800 truncate block text-[11px]" title={a.original_name}>
                                {a.original_name}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {sizeKb} KB · by {a.uploaded_by} · {a.uploaded_at.slice(0, 10)} {a.caption ? `· "${a.caption}"` : ""}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            <a 
                              href="#" 
                              onClick={(e) => { e.preventDefault(); alert(`Download started for ${a.original_name} (simulated)`); }}
                              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-2 py-1 rounded transition-colors text-[10px] cursor-pointer inline-block"
                            >
                              Download
                            </a>
                            <button 
                              onClick={() => handleDeleteAttachment(a.id)}
                              className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded transition-all cursor-pointer"
                              title="Delete file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end shrink-0">
              <button 
                onClick={() => setIsTrackOpen(false)}
                className="bg-slate-900 hover:bg-black text-white font-bold px-4 py-2 rounded text-xs cursor-pointer"
              >
                Close Tracker Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Shipment Kit Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-sky-400" />
                <span>Initialize Consignment Kit</span>
              </h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="hover:bg-slate-800 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateShipment} className="p-6 space-y-4 text-slate-700">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Kit Number (Optional, Auto-increments if blank)
                </label>
                <input 
                  type="number" 
                  min={1}
                  placeholder="e.g. 3, 4 (Spares start above 100)"
                  value={formKitNum}
                  onChange={(e) => setFormKitNum(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Shipment Kind
                </label>
                <select 
                  value={formKind}
                  onChange={(e) => setFormKind(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs cursor-pointer font-bold"
                >
                  <option value="KIT">KIT (Consignment Unit)</option>
                  <option value="SPARE">SPARE (Service / Calibration parts)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Build Week
                  </label>
                  <input 
                    type="number" 
                    min={1}
                    value={formBuildWk}
                    onChange={(e) => setFormBuildWk(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Ship Week
                  </label>
                  <input 
                    type="number" 
                    min={1}
                    value={formShipWk}
                    onChange={(e) => setFormShipWk(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Target Ship Date
                </label>
                <input 
                  type="date" 
                  value={formShipDate}
                  onChange={(e) => setFormShipDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Consignment Notes
                </label>
                <textarea 
                  placeholder="Gasket seal validation requirements, specialized delivery constraints..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-dc-blue text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-white border border-slate-200 rounded px-4 py-2 hover:bg-slate-50 text-slate-700 font-bold transition-colors text-xs cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-slate-900 hover:bg-black text-white font-bold px-4 py-2 rounded transition-colors text-xs cursor-pointer shadow-sm"
                >
                  Initialize Kit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
