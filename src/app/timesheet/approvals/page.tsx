/* eslint-disable */
"use client";

import React, { useState, useEffect } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { CheckSquare, ShieldAlert, Check, X } from "lucide-react";
import { cn } from "@/utils/cn";

export default function ApproveTimesheetsPage() {
  const user = usePmoStore((state) => state.user);
  const programmes = usePmoStore((state) => state.programmes);
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);

  // Role Gate: hide approvals tab content for unauthorized roles
  const isApprover = user?.role && !["ENGINEER", "INTERN_SUPPORT_ENGINEER", "VIEWER", "CUSTOMER"].includes(user.role);

  // Active project helper
  const activeProg = programmes.find((p) => p.id === activeProgrammeId);

  // API state — start with loading=true so we never flash stale/mock data
  const [dbPending, setDbPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchPending = async () => {
    try {
      setLoading(true);
      setFetchError(false);
      const res = await fetch("http://localhost:5000/api/timesheets/pending");
      if (res.ok) {
        const data = await res.json();
        setDbPending(data);
      } else {
        setFetchError(true);
        setDbPending([]);
      }
    } catch (err) {
      setFetchError(true);
      setDbPending([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isApprover) {
      fetchPending();
    } else {
      setLoading(false);
    }
  }, [isApprover]);

  if (!isApprover) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <div className="bg-white border border-border-base rounded-lg p-8 shadow-sm max-w-md text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-danger-red mx-auto animate-pulse" />
          <h3 className="text-base font-black text-navy">Access Denied</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Approval permissions are strictly reserved for PMO, Administrators, and Managers. 
            Please contact your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  // Action handlers
  const handleApprove = async (id: number, personName: string) => {
    if (!confirm(`Are you sure you want to approve the timesheet for ${personName}?`)) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/my/timesheet/${id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", reviewer: user?.name || "Reviewer" })
      });
      if (res.ok) {
        alert(`✓ Timesheet for ${personName} approved successfully.`);
      } else {
        alert("Failed to approve. Please try again.");
      }
    } catch (e) {
      alert("Network error. Please check if the backend is running.");
    }
    fetchPending();
  };

  const handleReject = async (id: number, personName: string) => {
    const notes = prompt(`Reason for rejecting ${personName}'s timesheet?`);
    if (notes === null) return;

    const trimmedNotes = notes.trim();
    if (!trimmedNotes) {
      alert("A rejection reason is required to reject a timesheet.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/my/timesheet/${id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", notes: trimmedNotes, reviewer: user?.name || "Reviewer" })
      });
      if (res.ok) {
        alert(`✕ Timesheet for ${personName} rejected.`);
      } else {
        alert("Failed to reject. Please try again.");
      }
    } catch (e) {
      alert("Network error. Please check if the backend is running.");
    }
    fetchPending();
  };

  return (
    <div className="page-container space-y-6">
      
      {/* Title Header bar */}
      <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-navy flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-dc-blue" />
            <span>Approve Timesheets</span>
            {activeProg && (
              <span className="text-slate-400 font-semibold text-sm">
                · {activeProg.name}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review, approve, or reject weekly timesheet submissions logged by team members under your supervision.
          </p>
        </div>
      </div>

      {/* Pending count banner ribbon */}
      <div className="bg-white border border-border-base rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Awaiting Verification</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Please verify recorded project effort and bench time allocations.</p>
        </div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider self-start sm:self-center">
          {loading ? "Loading…" : `${dbPending.length} pending submissions`}
        </div>
      </div>

      {/* Approvals Table Card */}
      <div className="bg-white border border-border-base rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-navy text-white font-bold">
                <th className="p-3">PERSON</th>
                <th className="p-3">ROLE</th>
                <th className="p-3">WEEK</th>
                <th className="p-3 text-center">TOTAL HOURS</th>
                <th className="p-3 text-center">BILLABLE</th>
                <th className="p-3 text-center">BAU</th>
                <th className="p-3">SUBMITTED</th>
                <th className="p-3 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                /* Loading skeleton rows */
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 animate-pulse">
                    <td className="p-3"><div className="h-3 bg-slate-200 rounded w-28" /></td>
                    <td className="p-3"><div className="h-3 bg-slate-200 rounded w-20" /></td>
                    <td className="p-3"><div className="h-3 bg-slate-200 rounded w-24" /></td>
                    <td className="p-3 text-center"><div className="h-3 bg-slate-200 rounded w-12 mx-auto" /></td>
                    <td className="p-3 text-center"><div className="h-3 bg-slate-200 rounded w-12 mx-auto" /></td>
                    <td className="p-3 text-center"><div className="h-3 bg-slate-200 rounded w-12 mx-auto" /></td>
                    <td className="p-3"><div className="h-3 bg-slate-200 rounded w-32" /></td>
                    <td className="p-3"><div className="h-6 bg-slate-200 rounded w-24 mx-auto" /></td>
                  </tr>
                ))
              ) : fetchError ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    ⚠ Unable to reach the backend. Please ensure the server is running on port 5000.
                  </td>
                </tr>
              ) : dbPending.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    No timesheets awaiting approval.
                  </td>
                </tr>
              ) : (
                dbPending.map((s, idx) => (
                  <tr key={s.id || idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-navy">{s.person_name}</td>
                    <td className="p-3 text-slate-600 font-medium">{s.person_role}</td>
                    <td className="p-3 font-mono text-dc-blue font-semibold">{s.week_start_date}</td>
                    <td className="p-3 text-center font-bold text-slate-800">{Number(s.total_hours).toFixed(1)}h</td>
                    <td className="p-3 text-center font-medium text-slate-700">{Number(s.billable_hours).toFixed(1)}h</td>
                    <td className="p-3 text-center font-medium text-slate-500">{Number(s.bau_hours).toFixed(1)}h</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">
                      {s.submitted_at ? new Date(s.submitted_at).toISOString().slice(0, 16).replace("T", " ") : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleApprove(s.id, s.person_name)}
                          className="px-2.5 py-1 bg-success-green hover:bg-green-700 text-white font-bold text-[10px] rounded transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(s.id, s.person_name)}
                          className="px-2.5 py-1 bg-danger-red hover:bg-red-700 text-white font-bold text-[10px] rounded transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <X className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
