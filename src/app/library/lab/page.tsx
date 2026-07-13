"use client";

import React, { useState } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useLabEquipmentQuery, useLabBookingsQuery } from "@/hooks/use-pmo-queries";
import { 
  Beaker, Search, Plus, Calendar, Clock, RefreshCw, X, ShieldAlert
} from "lucide-react";
import { cn } from "@/utils/cn";
import { LabBooking } from "@/types/pmo";

export default function LabEquipmentPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addLabBooking = usePmoStore((state) => state.addLabBooking);
  
  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: equipmentList = [], isLoading: isEqLoading } = useLabEquipmentQuery();
  const { data: bookings = [], isLoading: isBkLoading } = useLabBookingsQuery(activeProgrammeId);

  const isLoading = isProgLoading || isEqLoading || isBkLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEqId, setSelectedEqId] = useState<number | "">("");

  // Form states
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formBookedBy, setFormBookedBy] = useState("");
  const [formPurpose, setFormPurpose] = useState("");

  // Filtered Equipment
  const filteredEq = equipmentList
    .filter((eq) => {
      const query = searchQuery.toLowerCase();
      return (
        eq.name.toLowerCase().includes(query) ||
        eq.type.toLowerCase().includes(query) ||
        eq.location.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Open modal
  const handleOpenModal = (eqId?: number) => {
    setSelectedEqId(eqId || "");
    setFormStartDate("");
    setFormEndDate("");
    setFormBookedBy(usePmoStore.getState().user?.name || "");
    setFormPurpose("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEqId) return;

    addLabBooking({
      equipment_id: Number(selectedEqId),
      programme_id: activeProgrammeId,
      start_date: formStartDate,
      end_date: formEndDate,
      booked_by: formBookedBy,
      purpose: formPurpose,
      status: "CONFIRMED"
    });
    
    setIsModalOpen(false);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "MAINTENANCE": return "bg-amber-50 text-amber-700 border-amber-200";
      case "DECOMMISSIONED": return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getBookingStatusBadgeClass = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "bg-dc-blue/10 text-dc-blue border-dc-blue/20";
      case "COMPLETED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CANCELLED": return "bg-rose-50 text-rose-700 border-rose-200";
      case "PENDING": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Lab Database...</span>
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
          Please select a programme to view and manage lab equipment bookings.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Beaker className="w-6 h-6 text-dc-blue" />
            Lab Equipment & Bookings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage test lab resources, view inventory, and schedule validation tests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="btn-primary"
            onClick={() => handleOpenModal()}
          >
            <Calendar className="w-4 h-4 mr-1.5" />
            Book Equipment
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left Column: Equipment Master */}
        <div className="xl:w-2/3 flex flex-col gap-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h3 className="font-bold text-navy flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              Equipment Inventory
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-navy text-white font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Equipment</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Capacity</th>
                    <th className="px-6 py-4">Rate / Hr (₹)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEq.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        <Beaker className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-base font-medium text-slate-600">No equipment found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredEq.map((eq) => (
                      <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-navy">{eq.name}</div>
                          {eq.notes && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">{eq.notes}</div>}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{eq.type}</td>
                        <td className="px-6 py-4 text-slate-600 text-xs">{eq.capacity}</td>
                        <td className="px-6 py-4 font-medium text-slate-700">{eq.rate_per_hr.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border",
                            getStatusBadgeClass(eq.status)
                          )}>
                            {eq.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{eq.location}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleOpenModal(eq.id)}
                            className="p-1.5 text-dc-blue hover:bg-blue-50 rounded transition-colors"
                            title="Book This Equipment"
                            disabled={eq.status !== "AVAILABLE"}
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Bookings Log */}
        <div className="xl:w-1/3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-navy flex items-center gap-2">
                <Clock className="w-4 h-4 text-dc-blue" />
                Upcoming Bookings
              </h3>
              <span className="text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded-full text-slate-500">
                {bookings.length} Bookings
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm font-medium">No bookings for this programme.</p>
                  </div>
                ) : (
                  bookings.sort((a,b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map(b => {
                    const eq = equipmentList.find(e => e.id === b.equipment_id);
                    return (
                      <div key={b.id} className="p-4 border border-slate-200 rounded-xl bg-white hover:border-dc-blue/30 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-navy">{eq?.name || "Unknown Equipment"}</div>
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border",
                            getBookingStatusBadgeClass(b.status)
                          )}>
                            {b.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex flex-col gap-1">
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-400">Date</span>
                            <span className="text-slate-700 font-mono">{b.start_date} to {b.end_date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-400">Booked By</span>
                            <span className="text-slate-700">{b.booked_by}</span>
                          </div>
                          <div className="flex justify-between mt-1 pt-1 border-t border-slate-100">
                            <span className="text-slate-700 italic truncate" title={b.purpose}>{b.purpose}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-lg text-navy flex items-center gap-2">
                <Calendar className="w-5 h-5 text-dc-blue" />
                Book Lab Equipment
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="booking-form" onSubmit={handleFormSubmit} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Equipment <span className="text-red-500">*</span></label>
                  <select
                    value={selectedEqId}
                    onChange={(e) => setSelectedEqId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    required
                  >
                    <option value="" disabled>Select Equipment...</option>
                    {equipmentList.filter(e => e.status === "AVAILABLE").map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.location})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Start Date <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">End Date <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Booked By <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formBookedBy}
                    onChange={(e) => setFormBookedBy(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Purpose of Test <span className="text-red-500">*</span></label>
                  <textarea 
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    placeholder="e.g. Thermal cycle validation for B-Sample"
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    required
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
                form="booking-form"
                className="btn-primary"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
