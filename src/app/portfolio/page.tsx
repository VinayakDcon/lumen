/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";


import React, { useState, useEffect, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useProgrammesQuery } from "@/hooks/use-pmo-queries";
import {
  Plus, Filter, FolderKanban, Briefcase, Calendar, Users,
  BarChart2, Clock, CheckCircle2, AlertOctagon, ArrowUpRight, Search, Trash2, X
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useRouter } from "next/navigation";
import { Programme } from "@/types/pmo";

// Phase Templates Presets
const PHASE_PRESETS: Record<string, { code: string; name: string; start_wk: number; end_wk: number; colour: string }[]> = {
  STD: [
    { code: 'G0', name: 'Concept', start_wk: 1, end_wk: 3, colour: '#9C27B0' },
    { code: 'G1', name: 'Architecture', start_wk: 4, end_wk: 8, colour: '#3F51B5' },
    { code: 'G2', name: 'Design Freeze + Mockup', start_wk: 9, end_wk: 16, colour: '#0B5BAF' },
    { code: 'G3', name: 'Prototype A · Test Plan Final', start_wk: 17, end_wk: 24, colour: '#00695C' },
    { code: 'G4', name: 'DV / B-Sample / Homologation', start_wk: 25, end_wk: 40, colour: '#E65100' },
    { code: 'G5', name: 'PV / PPAP / Cert Receipt', start_wk: 41, end_wk: 48, colour: '#2E7D32' },
    { code: 'G6', name: 'SOP / Series / Closeout', start_wk: 49, end_wk: 56, colour: '#C9A95A' },
  ],
  FAST: [
    { code: 'G0', name: 'Concept', start_wk: 1, end_wk: 3, colour: '#9C27B0' },
    { code: 'G1', name: 'Design', start_wk: 4, end_wk: 9, colour: '#3F51B5' },
    { code: 'G2', name: 'Prototype', start_wk: 10, end_wk: 16, colour: '#00695C' },
    { code: 'G3', name: 'Validation', start_wk: 17, end_wk: 21, colour: '#E65100' },
    { code: 'G4', name: 'Production', start_wk: 22, end_wk: 24, colour: '#2E7D32' },
  ],
  RND: [
    { code: 'TRL1', name: 'Basic Principles (Lit Review)', start_wk: 1, end_wk: 8, colour: '#9C27B0' },
    { code: 'TRL2', name: 'Concept Formulation', start_wk: 9, end_wk: 16, colour: '#7B1FA2' },
    { code: 'TRL3', name: 'Analytical / Experimental Proof', start_wk: 17, end_wk: 32, colour: '#3F51B5' },
    { code: 'TRL4', name: 'Component / Breadboard in Lab', start_wk: 33, end_wk: 48, colour: '#0B5BAF' },
    { code: 'TRL5', name: 'Validation in Relevant Env', start_wk: 49, end_wk: 64, colour: '#00695C' },
    { code: 'TRL6', name: 'Demonstration in Relevant Env', start_wk: 65, end_wk: 80, colour: '#2E7D32' },
    { code: 'TRL7', name: 'Demonstration in Operational Env', start_wk: 81, end_wk: 96, colour: '#E65100' },
    { code: 'TRL8', name: 'System Complete + Qualified', start_wk: 97, end_wk: 108, colour: '#C9A95A' },
    { code: 'TRL9', name: 'Productisation + Deployment', start_wk: 109, end_wk: 120, colour: '#455A64' },
  ],
  EQUIP: [
    { code: 'EQ1', name: 'Spec + Sourcing', start_wk: 1, end_wk: 6, colour: '#9C27B0' },
    { code: 'EQ2', name: 'Vendor PO + Advance Payment', start_wk: 7, end_wk: 8, colour: '#3F51B5' },
    { code: 'EQ3', name: 'Build at Vendor + FAT', start_wk: 9, end_wk: 24, colour: '#0B5BAF' },
    { code: 'EQ4', name: 'Site Prep · Power · Civil', start_wk: 18, end_wk: 24, colour: '#00695C' },
    { code: 'EQ5', name: 'Shipment + Site Receipt', start_wk: 25, end_wk: 27, colour: '#E65100' },
    { code: 'EQ6', name: 'Install · Commission · SAT', start_wk: 28, end_wk: 32, colour: '#2E7D32' },
    { code: 'EQ7', name: 'Operator Training + Handover', start_wk: 33, end_wk: 36, colour: '#C9A95A' },
  ],
  DEP_ACT: [
    { code: 'A1', name: 'Activity Planning & SOW', start_wk: 1, end_wk: 2, colour: '#9C27B0' },
    { code: 'A2', name: 'Alignment & Resource Prep', start_wk: 3, end_wk: 4, colour: '#3F51B5' },
    { code: 'A3', name: 'Execution of Tasks', start_wk: 5, end_wk: 8, colour: '#0B5BAF' },
    { code: 'A4', name: 'Peer Review & Sign-Off', start_wk: 9, end_wk: 10, colour: '#E65100' },
    { code: 'A5', name: 'Closure & Documentation', start_wk: 11, end_wk: 12, colour: '#2E7D32' },
  ],
  TRAINING: [
    { code: 'T1', name: 'Preparation & Analysis', start_wk: 1, end_wk: 2, colour: '#9C27B0' },
    { code: 'T2', name: 'Content & Lab Setup', start_wk: 3, end_wk: 5, colour: '#3F51B5' },
    { code: 'T3', name: 'Delivery & Run', start_wk: 6, end_wk: 8, colour: '#0B5BAF' },
    { code: 'T4', name: 'Assessments & Quizzes', start_wk: 9, end_wk: 10, colour: '#E65100' },
    { code: 'T5', name: 'Evaluation & Certification', start_wk: 11, end_wk: 12, colour: '#2E7D32' },
  ],
  RESEARCH: [
    { code: 'R1', name: 'Charter & Proposal', start_wk: 1, end_wk: 4, colour: '#9C27B0' },
    { code: 'R2', name: 'Literature & Data Search', start_wk: 5, end_wk: 8, colour: '#3F51B5' },
    { code: 'R3', name: 'Experimental Setup & Design', start_wk: 9, end_wk: 14, colour: '#0B5BAF' },
    { code: 'R4', name: 'Execution & Trials', start_wk: 15, end_wk: 24, colour: '#E65100' },
    { code: 'R5', name: 'Thesis / Review & Close', start_wk: 25, end_wk: 28, colour: '#2E7D32' },
  ],
  FORUM: [
    { code: 'F1', name: 'Agenda & Speaker Search', start_wk: 1, end_wk: 2, colour: '#9C27B0' },
    { code: 'F2', name: 'Logistics & Rehearsals', start_wk: 3, end_wk: 4, colour: '#3F51B5' },
    { code: 'F3', name: 'Final Invites & Prep', start_wk: 5, end_wk: 6, colour: '#0B5BAF' },
    { code: 'F4', name: 'Event Delivery', start_wk: 7, end_wk: 7, colour: '#E65100' },
    { code: 'F5', name: 'Retro & Action Items', start_wk: 8, end_wk: 8, colour: '#2E7D32' },
  ],
  IMPROVEMENT: [
    { code: 'I1', name: 'Problem Statement & Scope', start_wk: 1, end_wk: 2, colour: '#9C27B0' },
    { code: 'I2', name: 'RCA & Data Analysis', start_wk: 3, end_wk: 5, colour: '#3F51B5' },
    { code: 'I3', name: 'Modifications & Releases', start_wk: 6, end_wk: 9, colour: '#0B5BAF' },
    { code: 'I4', name: 'Quality Audit & Deploy', start_wk: 10, end_wk: 12, colour: '#E65100' },
    { code: 'I5', name: 'Training & Standardization', start_wk: 13, end_wk: 14, colour: '#2E7D32' },
  ],
};

const DEPT_ORDER = ['BU1', 'BU2', 'BU3', 'H1', 'H2', 'H3', 'H4', 'H5', 'Delkart', 'Company-Wide'];
const DEPT_LABELS: Record<string, string> = {
  'BU1': 'BU1',
  'BU2': 'BU2',
  'BU3': 'BU3',
  'H1': 'H1 – Optics',
  'H2': 'H2 – Mechanical',
  'H3': 'H3 – Electronics',
  'H4': 'H4 – Manufacturing',
  'H5': 'H5 – Software',
  'Delkart': 'Delkart',
  'Company-Wide': 'Company-Wide',
};

export default function PortfolioPage() {
  const router = useRouter();

  const { data: programmes = [], isLoading } = useProgrammesQuery();
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const switchProgramme = usePmoStore((state) => state.switchProgramme);
  const addProgramme = usePmoStore((state) => state.addProgramme);
  const user = usePmoStore((state) => state.user);
  const people = usePmoStore((state) => state.people);

  // Filter states
  const [filterPortfolio, setFilterPortfolio] = useState<string>("");
  const [filterBu, setFilterBu] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const openProgrammeWizard = usePmoStore((state) => state.openProgrammeWizard);
  const isPMO = user?.role === "PMO";



  // Filter programmes based on controls
  const filteredProgrammes = programmes.filter((p) => {
    if (filterPortfolio) {
      const isActiveGroup = ['ACTIVE', 'PLANNING', 'ON_HOLD'].includes(p.status);
      if (filterPortfolio === "ACTIVE" && !isActiveGroup) return false;
      if (filterPortfolio === "RFQ" && p.status !== "RFQ_RESPONSE") return false;
    }
    if (filterBu && p.department !== filterBu) return false;
    if (search) {
      const matchText = `${p.name} ${p.customer || ""} ${p.id}`.toLowerCase();
      if (!matchText.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const departmentsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProgrammes.forEach(p => {
      const dept = p.department || 'BU1';
      counts[dept] = (counts[dept] || 0) + 1;
    });

    return DEPT_ORDER.filter(dept => (counts[dept] || 0) > 0).map(dept => ({
      name: dept,
      count: counts[dept]
    }));
  }, [filteredProgrammes]);

  // Calculate dynamic summaries
  const totalCount = filteredProgrammes.length;
  const activeCount = filteredProgrammes.filter(p => ['PLANNING', 'ACTIVE', 'ON_HOLD'].includes(p.status)).length;
  const rfqCount = filteredProgrammes.filter(p => p.status === 'RFQ_RESPONSE').length;

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium">Loading portfolio...</span>
        </div>
      </div>
    );
  }

  const handleDeleteProgramme = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete programme "${id}"?`)) {
      fetch(`/api/programmes/${id}`, { method: "DELETE" }).then(() => {
        alert(`Deleted programme ${id}`);
        window.location.reload();
      }).catch(() => {
        alert(`Deleted programme ${id} (Mock Action)`);
      });
    }
  };


  // Grouping by Portfolio Type -> Department
  const grouped: Record<string, Record<string, Programme[]>> = {
    ACTIVE: {},
    RFQ: {}
  };

  filteredProgrammes.forEach(p => {
    const type = ['PLANNING', 'ACTIVE', 'ON_HOLD'].includes(p.status) ? 'ACTIVE' : (p.status === 'RFQ_RESPONSE' ? 'RFQ' : 'OTHER');
    if (type === 'OTHER') return;
    const dept = p.department || 'BU1';
    if (!grouped[type][dept]) grouped[type][dept] = [];
    grouped[type][dept].push(p);
  });

  return (
    <div className="page-container space-y-6">

      {/* Portfolio Header Title & Controls */}
      <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-navy flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-dc-blue" />
            <span>Portfolio Overview · All Programmes</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitor state reviews, resource capacities, and deliverables across active and pipeline RFQ workloads.
          </p>
        </div>

        {/* Topbar Page Actions inline */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto shrink-0">
          <select
            value={filterPortfolio}
            onChange={(e) => setFilterPortfolio(e.target.value)}
            className="border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-dc-blue bg-white text-slate-700 w-36 sm:w-40 font-semibold"
          >
            <option value="">All Portfolios</option>
            <option value="ACTIVE">Active Portfolio</option>
            <option value="RFQ">RFQ Portfolio</option>
          </select>

          <select
            value={filterBu}
            onChange={(e) => setFilterBu(e.target.value)}
            className="border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-dc-blue bg-white text-slate-700 w-36 sm:w-40 font-semibold"
          >
            <option value="">All BU / Dept</option>
            {DEPT_ORDER.map(dept => (
              <option key={dept} value={dept}>{DEPT_LABELS[dept] || dept}</option>
            ))}
          </select>

          {isPMO && (
            <button
              onClick={() => openProgrammeWizard("create")}
              className="bg-dc-blue hover:bg-dc-deep text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Programme</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 xl:grid-cols-10 gap-4">
        <div className="bg-white border border-border-base rounded-lg p-4 shadow-sm text-center">
          <span className="text-2xl font-black text-navy block">{totalCount}</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 block">Total Programmes</span>
        </div>
        <div className="bg-white border border-border-base rounded-lg p-4 shadow-sm text-center">
          <span className="text-2xl font-black text-navy block">{activeCount}</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 block">Active Projects</span>
        </div>
        <div className="bg-white border border-border-base rounded-lg p-4 shadow-sm text-center">
          <span className="text-2xl font-black text-navy block">{rfqCount}</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 block">RFQs</span>
        </div>
        {departmentsWithCounts.map(dept => (
          <div key={dept.name} className="bg-white border border-border-base rounded-lg p-4 shadow-sm text-center">
            <span className="text-2xl font-black text-navy block">{dept.count}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 block">{dept.name}</span>
          </div>
        ))}
      </div>


      {/* Search Input Widget */}
      <div className="bg-white border border-border-base rounded-lg p-4 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search programmes by name, customer, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-dc-blue bg-slate-50/50"
          />
        </div>
      </div>

      {/* Grouped Programme List */}
      {filteredProgrammes.length === 0 ? (
        <div className="bg-white border border-border-base rounded-lg p-12 shadow-sm text-center">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-navy mb-1">No programmes match the filter criteria</h4>
          <p className="text-xs text-slate-400">Clear filters or try searching for another term.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {["ACTIVE", "RFQ"].map(type => {
            const hasGroupItems = DEPT_ORDER.some(dept => grouped[type][dept] && grouped[type][dept].length > 0);
            if (!hasGroupItems) return null;

            return (
              <div key={type} className="space-y-6">
                <h2 className="text-sm font-black text-dc-deep tracking-wider border-b border-slate-200 pb-2 uppercase mt-6">
                  {type} PROGRAMMES
                </h2>

                {DEPT_ORDER.map(dept => {
                  const items = grouped[type][dept] || [];
                  if (items.length === 0) return null;

                  return (
                    <div key={dept} className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mt-4">
                        {DEPT_LABELS[dept] || dept}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                        {items.map((p) => {
                          const isActive = p.id === activeProgrammeId;

                          let statusPillClass = "bg-slate-100 text-slate-600";
                          if (p.status === "ACTIVE") {
                            statusPillClass = "bg-green-50 text-success-green border border-green-200";
                          } else if (p.status === "PLANNING") {
                            statusPillClass = "bg-blue-50 text-dc-blue border border-blue-200";
                          } else if (p.status === "ON_HOLD") {
                            statusPillClass = "bg-amber-50 text-warning-amber border border-amber-200";
                          } else if (p.status === "RFQ_RESPONSE") {
                            statusPillClass = "bg-orange-50 text-orange-600 border border-orange-200";
                          }

                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                switchProgramme(p.id);
                                router.push("/");
                              }}
                              className={cn(
                                "bg-white border rounded-lg p-5 shadow-sm hover-lift cursor-pointer flex flex-col justify-between relative transition-all duration-200",
                                isActive ? "ring-2 ring-dc-blue" : "border-slate-200"
                              )}
                              style={{ borderTop: `4px solid ${p.colour || '#0B5BAF'}` }}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-bold text-navy text-sm truncate" title={p.name}>
                                    {p.name}
                                  </h4>
                                  <span className={cn("text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase shrink-0", statusPillClass)}>
                                    {p.status.replace(/_/g, " ")}
                                  </span>
                                </div>

                                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono text-dc-blue bg-blue-50 px-1.5 py-0.5 rounded font-semibold text-[9px]">{p.id}</span>
                                  <span>·</span>
                                  <span>{p.customer || "DContour"}</span>
                                </div>

                                {/* Weeks and Kits counters */}
                                <div className="grid grid-cols-2 gap-4 my-3.5 border-y border-slate-50 py-2.5">
                                  <div>
                                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Weeks</span>
                                    <span className="text-sm font-black text-navy">{p.programme_weeks !== null && p.programme_weeks !== undefined ? p.programme_weeks : "—"}</span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Kits</span>
                                    <span className="text-sm font-black text-navy">{p.total_kits !== null && p.total_kits !== undefined ? p.total_kits : "—"}</span>
                                  </div>
                                </div>

                                {/* Tag lists */}
                                <div className="flex flex-wrap gap-1 mb-4">
                                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                    {p.template_id || "BLANK"}
                                  </span>
                                  {(p.scope_parts || []).map((part, index) => (
                                    <span key={index} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                      {part}
                                    </span>
                                  ))}
                                  {(p.markets || []).length > 0 && (
                                    <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                      {p.markets?.length} markets
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Dates & Actions */}
                              <div className="flex items-center justify-between border-t border-slate-50 pt-2.5 mt-auto">
                                <div className="text-[9px] text-slate-400 font-semibold space-y-0.5">
                                  <div>Kickoff: {p.kickoff_date ? p.kickoff_date : "—"}</div>
                                  <div>SOP: {p.sop_target ? p.sop_target : "—"}</div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {isActive && (
                                    <span className="text-[9px] text-dc-blue font-extrabold flex items-center gap-0.5 uppercase tracking-wide bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                      Active
                                    </span>
                                  )}

                                  {(isPMO || user?.role === "ADMIN") && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProgramme(p.id, e);
                                      }}
                                      className="p-1 rounded text-slate-400 hover:text-danger-red hover:bg-red-50 transition-colors cursor-pointer"
                                      title="Delete project"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}



    </div>
  );
}
