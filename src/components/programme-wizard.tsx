/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useProgrammesQuery } from "@/hooks/use-pmo-queries";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

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

export function ProgrammeWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const isWizOpen = usePmoStore((state) => state.isProgrammeWizardOpen);
  const wizardMode = usePmoStore((state) => state.programmeWizardMode);
  const editId = usePmoStore((state) => state.programmeWizardEditId);
  const closeProgrammeWizard = usePmoStore((state) => state.closeProgrammeWizard);
  const addProgramme = usePmoStore((state) => state.addProgramme);
  const updateProgramme = usePmoStore((state) => state.updateProgramme);
  const switchProgramme = usePmoStore((state) => state.switchProgramme);
  const user = usePmoStore((state) => state.user);
  const people = usePmoStore((state) => state.people);

  const { data: programmes = [] } = useProgrammesQuery();

  const [wizStep, setWizStep] = useState(1);
  const [wizTemplate, setWizTemplate] = useState("BLANK");
  const [wizPhases, setWizPhases] = useState<any[]>([]);
  const [wizSelectedTeam, setWizSelectedTeam] = useState<Set<string>>(new Set());
  const [wizForm, setWizForm] = useState({
    id: "",
    name: "",
    customer: "",
    department: "BU1",
    category: "Customer Project",
    activity_type: "",
    sponsor_owner: "",
    objective: "",
    status: "PLANNING",
    kickoff_date: "",
    sop_target: "",
    total_kits: "",
    programme_weeks: "56",
    colour: "#0B5BAF",
    notes: "",
    parts: "SFH,RL,BEZEL",
    markets: "EU,USA,CN,IN",
    variants: "ECE,SAE",
    cloned_from: ""
  });

  const isPMO = user?.role === "PMO";
  const isCustomerProject = wizForm.category === "Customer Project";

  // Load selected project data if in edit mode
  useEffect(() => {
    if (isWizOpen && wizardMode === "edit" && editId) {
      const prog = programmes.find(p => p.id === editId);
      if (prog) {
        setWizForm({
          id: prog.id,
          name: prog.name,
          customer: prog.customer || "",
          department: prog.department || "BU1",
          category: prog.category || "Customer Project",
          activity_type: prog.activity_type || "",
          sponsor_owner: prog.sponsor_owner || "",
          objective: prog.objective || "",
          status: prog.status || "PLANNING",
          kickoff_date: prog.kickoff_date || "",
          sop_target: prog.sop_target || "",
          total_kits: prog.total_kits != null ? String(prog.total_kits) : "",
          programme_weeks: prog.programme_weeks != null ? String(prog.programme_weeks) : "56",
          colour: prog.colour || "#0B5BAF",
          notes: prog.notes || "",
          parts: Array.isArray(prog.scope_parts) ? prog.scope_parts.join(",") : (prog.scope_parts || ""),
          markets: Array.isArray(prog.markets) ? prog.markets.join(",") : (prog.markets || ""),
          variants: Array.isArray(prog.variants) ? prog.variants.join(",") : (prog.variants || ""),
          cloned_from: ""
        });
        setWizSelectedTeam(new Set(prog.team_members || []));
        setWizTemplate(prog.template_id || "BLANK");
        setWizStep(1);

        // Fetch phases from DB
        fetch(`http://localhost:5000/api/programmes/${prog.id}/phases`)
          .then(res => {
            if (!res.ok) throw new Error("Failed to load phases");
            return res.json();
          })
          .then(phasesData => {
            if (Array.isArray(phasesData)) {
              setWizPhases(phasesData);
            }
          })
          .catch(err => {
            console.error("Failed to load phases, falling back to empty:", err);
            setWizPhases([]);
          });
      }
    } else if (isWizOpen && wizardMode === "create") {
      // Create mode: reset wizard
      setWizStep(1);
      setWizTemplate("BLANK");
      setWizPhases(JSON.parse(JSON.stringify(PHASE_PRESETS.STD)));
      setWizSelectedTeam(new Set());
      setWizForm({
        id: "",
        name: "",
        customer: "",
        department: "BU1",
        category: "Customer Project",
        activity_type: "",
        sponsor_owner: "",
        objective: "",
        status: "PLANNING",
        kickoff_date: "",
        sop_target: "",
        total_kits: "",
        programme_weeks: "56",
        colour: "#0B5BAF",
        notes: "",
        parts: "SFH,RL,BEZEL",
        markets: "EU,USA,CN,IN",
        variants: "ECE,SAE",
        cloned_from: programmes[0]?.id || ""
      });
    }
  }, [isWizOpen, wizardMode, editId, programmes]);

  // Modal Listener for archetype/template selection from other pages
  useEffect(() => {
    const handleOpenWizardEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const tpl = customEvent.detail?.template || "BLANK";
      
      usePmoStore.getState().openProgrammeWizard("create");
      
      const archetypeToTemplate: Record<string, string> = {
        'TIER1_OEM': 'LIGHTING_PREMIUM',
        'TIER1_AFTERMARKET': 'LIGHTING_AFTERMARKET',
        'PARTNERSHIP': 'PARTNERSHIP',
        'RND_TECHNOLOGY': 'RND',
        'PRODUCT_ROADMAP': 'MODULE',
        'CAPABILITY_GROWTH': 'EQUIPMENT',
        'MICRO_PROJECT': 'BLANK',
        'RECURRING': 'BLANK'
      };
      
      const mappedTpl = archetypeToTemplate[tpl] || "BLANK";
      setWizTemplate(mappedTpl);
      
      const archetypeToPreset: Record<string, string> = {
        'TIER1_OEM': 'STD',
        'TIER1_AFTERMARKET': 'FAST',
        'PARTNERSHIP': 'STD',
        'RND_TECHNOLOGY': 'RND',
        'PRODUCT_ROADMAP': 'STD',
        'CAPABILITY_GROWTH': 'EQUIP',
        'MICRO_PROJECT': 'STD',
        'RECURRING': 'STD'
      };
      
      const presetKey = archetypeToPreset[tpl] || "STD";
      
      const archetypeToCategory: Record<string, string> = {
        'TIER1_OEM': 'Customer Project',
        'TIER1_AFTERMARKET': 'Customer Project',
        'PARTNERSHIP': 'Customer Project',
        'RND_TECHNOLOGY': 'Research',
        'PRODUCT_ROADMAP': 'Customer Project',
        'CAPABILITY_GROWTH': 'Department Activity',
        'MICRO_PROJECT': 'Customer Project',
        'RECURRING': 'Department Activity'
      };
      
      const cat = archetypeToCategory[tpl] || 'Customer Project';
      
      setWizForm(prev => ({
        ...prev,
        category: cat,
        template_id: mappedTpl,
        programme_weeks: String(Math.max(...(PHASE_PRESETS[presetKey] || PHASE_PRESETS.STD).map(p => p.end_wk)))
      }));
      
      setWizPhases(JSON.parse(JSON.stringify(PHASE_PRESETS[presetKey] || PHASE_PRESETS.STD)));
    };
    window.addEventListener("open-programme-wizard", handleOpenWizardEvent);
    return () => window.removeEventListener("open-programme-wizard", handleOpenWizardEvent);
  }, [programmes]);


  // Recalculate weeks when kickoff or SOP target changes
  useEffect(() => {
    if (wizForm.kickoff_date && wizForm.sop_target) {
      const kickoff = new Date(wizForm.kickoff_date);
      const sop = new Date(wizForm.sop_target);
      if (sop > kickoff) {
        const diffMs = sop.getTime() - kickoff.getTime();
        const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
        setWizForm(prev => ({ ...prev, programme_weeks: String(diffWeeks) }));
      }
    }
  }, [wizForm.kickoff_date, wizForm.sop_target]);

  const handleApplyPhasePreset = (key: string) => {
    const presetPhases = PHASE_PRESETS[key] || [];
    setWizPhases(JSON.parse(JSON.stringify(presetPhases)));
    if (presetPhases.length > 0) {
      const maxWk = Math.max(...presetPhases.map(p => p.end_wk));
      setWizForm(prev => ({ ...prev, programme_weeks: String(maxWk) }));
    }
  };

  const handleAddPhase = () => {
    const last = wizPhases[wizPhases.length - 1];
    const nextStart = last ? last.end_wk + 1 : 1;
    setWizPhases(prev => [
      ...prev,
      { code: `G${prev.length}`, name: "New Phase", start_wk: nextStart, end_wk: nextStart + 3, colour: "#0B5BAF" }
    ]);
  };

  const handleRemovePhase = (idx: number) => {
    setWizPhases(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePhaseChange = (idx: number, field: string, val: any) => {
    setWizPhases(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  };

  const toggleTeamMember = (personId: string) => {
    const copy = new Set(wizSelectedTeam);
    if (copy.has(personId)) {
      copy.delete(personId);
    } else {
      copy.add(personId);
    }
    setWizSelectedTeam(copy);
  };

  const handleWizNext = () => {
    if (wizStep === 1) {
      const trimmedId = wizForm.id.trim();
      const trimmedName = wizForm.name.trim();
      if (!trimmedId || !/^[A-Z0-9_]+$/.test(trimmedId)) {
        alert("Programme ID must be UPPERCASE_NO_SPACES (Alphanumeric and underscores only)");
        return;
      }
      if (!trimmedName) {
        alert("Programme Name is required");
        return;
      }
      if (wizardMode === "create" && programmes.some(p => p.id === trimmedId)) {
        alert(`Programme ID "${trimmedId}" already exists`);
        return;
      }
    }
    const maxSteps = wizardMode === "edit" ? 4 : 5;
    if (wizStep < maxSteps) {
      setWizStep(prev => prev + 1);
    }
  };

  const handleWizBack = () => {
    if (wizStep > 1) {
      setWizStep(prev => prev - 1);
    }
  };

  const handleWizSubmit = async () => {
    const csv = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);
    const isCustomer = wizForm.category === "Customer Project";
    
    const payload = {
      id: wizForm.id.trim(),
      name: wizForm.name.trim(),
      customer: isCustomer ? wizForm.customer.trim() : "Internal",
      department: wizForm.department,
      category: wizForm.category,
      activity_type: isCustomer ? null : wizForm.activity_type.trim(),
      sponsor_owner: isCustomer ? null : wizForm.sponsor_owner.trim(),
      objective: isCustomer ? null : wizForm.objective.trim(),
      status: wizForm.status as any,
      kickoff_date: wizForm.kickoff_date || null,
      sop_target: wizForm.sop_target || null,
      total_kits: parseInt(wizForm.total_kits) || null,
      programme_weeks: parseInt(wizForm.programme_weeks) || 56,
      scope_parts: isCustomer ? csv(wizForm.parts) : [],
      markets: isCustomer ? csv(wizForm.markets) : [],
      variants: isCustomer ? csv(wizForm.variants) : [],
      colour: wizForm.colour,
      notes: wizForm.notes,
      template_id: wizTemplate,
      cloned_from: wizTemplate === "CLONED" ? wizForm.cloned_from : null,
      phases: wizPhases,
      team_members: Array.from(wizSelectedTeam)
    };

    if (wizardMode === "edit") {
      try {
        const res = await fetch(`http://localhost:5000/api/programmes/${payload.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updated = await res.json();
          updateProgramme(payload.id, updated);
          queryClient.invalidateQueries({ queryKey: ["programmes"] });
          queryClient.invalidateQueries({ queryKey: ["programme", payload.id] });
          queryClient.invalidateQueries({ queryKey: ["journey", payload.id] });
          queryClient.invalidateQueries({ queryKey: ["charter", payload.id] });
          alert(`✓ Programme "${payload.name}" updated successfully`);
          closeProgrammeWizard();
          window.location.reload();
        } else {
          alert(`Failed to update programme: ${res.statusText}`);
        }
      } catch (err) {
        console.error("Error updating programme:", err);
        updateProgramme(payload.id, payload as any);
        alert(`✓ Programme "${payload.name}" updated (Local Preview Mode)`);
        closeProgrammeWizard();
      }
    } else {
      // Create mode
      try {
        const res = await fetch("http://localhost:5000/api/programmes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const newProg = await res.json();
          addProgramme(newProg);
          queryClient.invalidateQueries({ queryKey: ["programmes"] });
        } else {
          addProgramme(payload as any);
        }
        closeProgrammeWizard();
        localStorage.removeItem("dc_wizard_draft");
        switchProgramme(payload.id);
        alert(`✓ Programme "${payload.name}" created successfully`);
        router.push("/");
        window.location.reload();
      } catch (e: any) {
        addProgramme(payload as any);
        closeProgrammeWizard();
        localStorage.removeItem("dc_wizard_draft");
        switchProgramme(payload.id);
        alert(`✓ Programme "${payload.name}" created (Local Preview Mode)`);
        router.push("/");
        window.location.reload();
      }
    }
  };

  if (!isWizOpen) return null;

  const maxSteps = wizardMode === "edit" ? 4 : 5;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Modal Title Banner */}
        <div className="bg-navy text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
              {wizardMode === "edit" ? "Programme Settings" : "New Project"}
            </span>
            <h3 className="text-base font-black tracking-tight" id="wiz-title">
              {wizardMode === "edit" ? `Edit ${wizForm.name || "Programme"} · Step ${wizStep} of 4` : `Create Programme · Step ${wizStep} of 5`}
            </h3>
          </div>
          <button 
            onClick={closeProgrammeWizard}
            className="p-1 border border-slate-800 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step navigation tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 shrink-0">
          {[
            { s: 1, label: "1. Basics" },
            { s: 2, label: isCustomerProject ? "2. Scope" : "2. Activity Details" },
            { s: 3, label: "3. Phases" },
            { s: 4, label: "4. Team" },
            ...(wizardMode === "create" ? [{ s: 5, label: "5. Starter" }] : [])
          ].map(tab => (
            <button
              key={tab.s}
              disabled={wizStep < tab.s}
              onClick={() => setWizStep(tab.s)}
              className={cn(
                "flex-1 py-3 text-xs font-bold text-center border-b-2 cursor-pointer transition-colors",
                wizStep === tab.s 
                  ? "border-dc-blue text-dc-blue bg-white" 
                  : "border-transparent text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Step body content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[40vh]">
          
          {/* STEP 1: BASICS */}
          {wizStep === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-navy">Programme Basics</h4>
                <p className="text-xs text-slate-500">Define the high-level identity of your project.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Programme ID <span className="text-danger-red">*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g., BG_AUTO_2026"
                    value={wizForm.id}
                    disabled={wizardMode === "edit"}
                    onChange={(e) => setWizForm(prev => ({ ...prev, id: e.target.value }))}
                    className={cn(
                      "w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-dc-blue uppercase font-bold",
                      wizardMode === "edit" ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200" : ""
                    )}
                  />
                  {wizardMode === "create" ? (
                    <span className="text-[9px] text-slate-400 block mt-0.5">UPPERCASE_NO_SPACES, alphanumeric and underscores only.</span>
                  ) : (
                    <span className="text-[9px] text-slate-400 block mt-0.5">Programme ID cannot be changed once created.</span>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Programme Name <span className="text-danger-red">*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g., UST FEWOFF26 · Custom Lamp Family"
                    value={wizForm.name}
                    onChange={(e) => setWizForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-dc-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Programme Category</label>
                  <select 
                    value={wizForm.category}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWizForm(prev => ({ ...prev, category: val }));
                      // Apply template auto presets for internal categories (in Create mode only)
                      if (wizardMode === "create") {
                        let newTpl = "BLANK";
                        let presetKey = "STD";
                        if (val === 'Department Activity') { newTpl = 'DEP_ACT'; presetKey = 'DEP_ACT'; }
                        else if (val === 'Training') { newTpl = 'TRAINING'; presetKey = 'TRAINING'; }
                        else if (val === 'Research') { newTpl = 'RESEARCH'; presetKey = 'RESEARCH'; }
                        else if (val === 'Forum / Workshop') { newTpl = 'FORUM'; presetKey = 'FORUM'; }
                        else if (val === 'Improvement Initiative') { newTpl = 'IMPROVEMENT'; presetKey = 'IMPROVEMENT'; }
                        setWizTemplate(newTpl);
                        setWizPhases(JSON.parse(JSON.stringify(PHASE_PRESETS[presetKey] || PHASE_PRESETS.STD)));
                      }
                    }}
                    className="w-full border border-slate-200 rounded px-3 py-2 bg-white text-xs focus:outline-none focus:border-dc-blue font-semibold"
                  >
                    <option value="Customer Project">Customer Project</option>
                    <option value="Department Activity">Department Activity</option>
                    <option value="Training">Training</option>
                    <option value="Research">Research</option>
                    <option value="Forum / Workshop">Forum / Workshop</option>
                    <option value="Improvement Initiative">Improvement Initiative</option>
                    <option value="Internal Operations">Internal Operations</option>
                    <option value="Strategic Growth">Strategic Growth</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Department</label>
                  <select 
                    value={wizForm.department}
                    onChange={(e) => setWizForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 bg-white text-xs focus:outline-none focus:border-dc-blue font-semibold"
                  >
                    {DEPT_ORDER.map(dept => (
                      <option key={dept} value={dept}>{DEPT_LABELS[dept] || dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Status</label>
                  <select 
                    value={wizForm.status}
                    onChange={(e) => setWizForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 bg-white text-xs focus:outline-none focus:border-dc-blue font-semibold"
                  >
                    <option value="PLANNING">PLANNING</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ON_HOLD">ON HOLD</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              {/* Customer specific basics */}
              {isCustomerProject && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Customer</label>
                    <input 
                      type="text" 
                      placeholder="e.g., UST · Vazirani"
                      value={wizForm.customer}
                      onChange={(e) => setWizForm(prev => ({ ...prev, customer: e.target.value }))}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-dc-blue"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Total Prototype Kits</label>
                    <input 
                      type="number" 
                      placeholder="e.g., 53"
                      value={wizForm.total_kits}
                      onChange={(e) => setWizForm(prev => ({ ...prev, total_kits: e.target.value }))}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-dc-blue"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Kickoff Date</label>
                  <input 
                    type="date" 
                    value={wizForm.kickoff_date}
                    onChange={(e) => setWizForm(prev => ({ ...prev, kickoff_date: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-dc-blue"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">SOP Target Date</label>
                  <input 
                    type="date" 
                    value={wizForm.sop_target}
                    onChange={(e) => setWizForm(prev => ({ ...prev, sop_target: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-dc-blue"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Duration Weeks</label>
                  <input 
                    type="number" 
                    value={wizForm.programme_weeks}
                    onChange={(e) => setWizForm(prev => ({ ...prev, programme_weeks: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-dc-blue"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Brand Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={wizForm.colour}
                      onChange={(e) => setWizForm(prev => ({ ...prev, colour: e.target.value }))}
                      className="w-12 h-8 border border-slate-200 rounded cursor-pointer p-0.5"
                    />
                    <span className="text-xs font-mono text-slate-400">{wizForm.colour}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Notes</label>
                <textarea 
                  rows={3} 
                  placeholder="Contextual notes on strategy or milestones..."
                  value={wizForm.notes}
                  onChange={(e) => setWizForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-dc-blue"
                />
              </div>
            </div>
          )}

          {/* STEP 2: SCOPE DEFINITION / ACTIVITY DETAILS */}
          {wizStep === 2 && (
            <div className="space-y-4">
              {isCustomerProject ? (
                <>
                  <div>
                    <h4 className="text-sm font-black text-navy">Scope Definition</h4>
                    <p className="text-xs text-slate-500">What parts, markets, and variants are included?</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Parts in Scope (comma-separated)</label>
                      <input 
                        type="text" 
                        placeholder="SFH,RL,BEZEL"
                        value={wizForm.parts}
                        onChange={(e) => setWizForm(prev => ({ ...prev, parts: e.target.value }))}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-dc-blue"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Target Markets (comma-separated)</label>
                      <input 
                        type="text" 
                        placeholder="EU,USA,CN,IN,JP,KR,TW,RoW"
                        value={wizForm.markets}
                        onChange={(e) => setWizForm(prev => ({ ...prev, markets: e.target.value }))}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-dc-blue"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Variants (comma-separated)</label>
                      <input 
                        type="text" 
                        placeholder="ECE,SAE"
                        value={wizForm.variants}
                        onChange={(e) => setWizForm(prev => ({ ...prev, variants: e.target.value }))}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-dc-blue"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h4 className="text-sm font-black text-navy">Activity Details</h4>
                    <p className="text-xs text-slate-500">Define the type, objective, and sponsor of the activity.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Activity Type</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Optics Benchmarking, Kaizen, Internal Training"
                        value={wizForm.activity_type}
                        onChange={(e) => setWizForm(prev => ({ ...prev, activity_type: e.target.value }))}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-dc-blue"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Sponsor / Owner</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Department Head, PMO, or Sponsor Name"
                        value={wizForm.sponsor_owner}
                        onChange={(e) => setWizForm(prev => ({ ...prev, sponsor_owner: e.target.value }))}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-dc-blue"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Objective</label>
                      <textarea 
                        rows={3} 
                        placeholder="Describe the goal / objective of this activity"
                        value={wizForm.objective}
                        onChange={(e) => setWizForm(prev => ({ ...prev, objective: e.target.value }))}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-dc-blue"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: PHASE STRUCTURE */}
          {wizStep === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-navy">Phase Structure</h4>
                <p className="text-xs text-slate-500">Edit gate milestones or apply presets based on the project type.</p>
              </div>

              {/* Preset Action Strip */}
              <div className="flex flex-wrap gap-2 py-2 border-y border-slate-100">
                <button onClick={() => handleApplyPhasePreset("STD")} type="button" className="text-[10px] bg-slate-100 hover:bg-slate-200 font-bold px-2 py-1.5 rounded transition-colors text-slate-700 cursor-pointer">📄 Standard G0-G6 (56 wk)</button>
                <button onClick={() => handleApplyPhasePreset("FAST")} type="button" className="text-[10px] bg-slate-100 hover:bg-slate-200 font-bold px-2 py-1.5 rounded transition-colors text-slate-700 cursor-pointer">⚡ Fast 4-gate (24 wk)</button>
                <button onClick={() => handleApplyPhasePreset("DEP_ACT")} type="button" className="text-[10px] bg-slate-100 hover:bg-slate-200 font-bold px-2 py-1.5 rounded transition-colors text-slate-700 cursor-pointer">📋 A1-A5 Internal (12 wk)</button>
                <button onClick={() => handleApplyPhasePreset("RND")} type="button" className="text-[10px] bg-slate-100 hover:bg-slate-200 font-bold px-2 py-1.5 rounded transition-colors text-slate-700 cursor-pointer">🔬 TRL 1-9 R&D (120 wk)</button>
                <button onClick={() => handleApplyPhasePreset("TRAINING")} type="button" className="text-[10px] bg-slate-100 hover:bg-slate-200 font-bold px-2 py-1.5 rounded transition-colors text-slate-700 cursor-pointer">🎓 T1-T5 Training (12 wk)</button>
                <button onClick={() => handleApplyPhasePreset("FORUM")} type="button" className="text-[10px] bg-slate-100 hover:bg-slate-200 font-bold px-2 py-1.5 rounded transition-colors text-slate-700 cursor-pointer">📢 F1-F5 Forum (8 wk)</button>
                <button onClick={() => handleApplyPhasePreset("IMPROVEMENT")} type="button" className="text-[10px] bg-slate-100 hover:bg-slate-200 font-bold px-2 py-1.5 rounded transition-colors text-slate-700 cursor-pointer">📈 I1-I5 Improvement (14 wk)</button>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <th className="p-3">CODE</th>
                      <th className="p-3">NAME</th>
                      <th className="p-3">START WEEK</th>
                      <th className="p-3">END WEEK</th>
                      <th className="p-3 text-center">COLOR</th>
                      <th className="p-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {wizPhases.map((p, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={p.code} 
                            onChange={(e) => handlePhaseChange(idx, "code", e.target.value)}
                            className="border border-slate-200 rounded px-2 py-1 w-16"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={p.name} 
                            onChange={(e) => handlePhaseChange(idx, "name", e.target.value)}
                            className="border border-slate-200 rounded px-2 py-1 w-full"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={p.start_wk} 
                            onChange={(e) => handlePhaseChange(idx, "start_wk", parseInt(e.target.value) || 1)}
                            className="border border-slate-200 rounded px-2 py-1 w-16"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={p.end_wk} 
                            onChange={(e) => handlePhaseChange(idx, "end_wk", parseInt(e.target.value) || 1)}
                            className="border border-slate-200 rounded px-2 py-1 w-16"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input 
                            type="color" 
                            value={p.colour} 
                            onChange={(e) => handlePhaseChange(idx, "colour", e.target.value)}
                            className="w-8 h-6 border border-slate-200 rounded cursor-pointer"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <button 
                            onClick={() => handleRemovePhase(idx)}
                            className="p-1 text-slate-400 hover:text-danger-red hover:bg-red-50 rounded cursor-pointer"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button 
                onClick={handleAddPhase}
                className="border border-dashed border-dc-blue text-dc-blue hover:bg-blue-50 px-3 py-1.5 rounded font-bold text-xs cursor-pointer transition-colors"
              >
                + Add Phase
              </button>
            </div>
          )}

          {/* STEP 4: PROJECT TEAM SELECTOR */}
          {wizStep === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-navy">Project Team</h4>
                <p className="text-xs text-slate-500">Select people from your global roster. These members will appear in timesheets and picker filters.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2">
                {people.filter(p => p.active !== 0).map(p => {
                  const isChecked = wizSelectedTeam.has(p.id);
                  return (
                    <label 
                      key={p.id}
                      className={cn(
                        "border rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 select-none transition-all",
                        isChecked ? "border-dc-blue bg-blue-50/20" : "border-slate-200"
                      )}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => toggleTeamMember(p.id)}
                        className="w-4 h-4 rounded text-dc-blue border-slate-300 focus:ring-dc-blue cursor-pointer"
                      />
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-xs shrink-0"
                        style={{ backgroundColor: p.avatar_color || "#1e90e8" }}
                      >
                        {(p.name || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-navy block truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {p.role || "—"} {p.email && `· ${p.email}`}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: STARTER CONTENT */}
          {wizStep === 5 && wizardMode === "create" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-black text-navy">Starter Content</h4>
                <p className="text-xs text-slate-500">Choose how you want to populate your WBS task list.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: "BLANK", title: "Blank", desc: "Empty programme - build WBS from scratch." },
                  { id: "LIGHTING_PREMIUM", title: "Tier-1 Lighting", desc: "Full WBS · 7 disciplines · UST FEWOFF25-style." },
                  { id: "LIGHTING_AFTERMARKET", title: "Aftermarket Lighting", desc: "Slimmer · 3 tasks/workstream · retrofit." },
                  { id: "RND", title: "R&D / TRL", desc: "TRL 1-9 phases · Research-style." },
                  { id: "EQUIPMENT", title: "Equipment / Capex", desc: "Spec → PO → FAT → install → handover." },
                  { id: "MODULE", title: "Module Platform", desc: "Apex Series · multi-customer · catalogue." },
                  { id: "PARTNERSHIP", title: "Partnership / JV", desc: "Shared engineering · IP allocation." },
                  { id: "SAMPLE", title: "Sample / Prototype", desc: "4-week win-business cycle." },
                  { id: "CLONED", title: "Clone Existing", desc: "Copy tasks and settings from another programme." }
                ].map(tpl => {
                  const isSelected = wizTemplate === tpl.id;
                  return (
                    <div 
                      key={tpl.id}
                      onClick={() => setWizTemplate(tpl.id)}
                      className={cn(
                        "border rounded-lg p-4 cursor-pointer hover:bg-slate-50 transition-all duration-150 flex flex-col justify-between",
                        isSelected ? "border-dc-blue ring-2 ring-dc-blue bg-blue-50/10" : "border-slate-200"
                      )}
                    >
                      <div>
                        <span className="text-xs font-black text-navy block mb-1">{tpl.title}</span>
                        <span className="text-[11px] text-slate-500 leading-normal block">{tpl.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {wizTemplate === "CLONED" && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Copy From Project</label>
                  <select 
                    value={wizForm.cloned_from}
                    onChange={(e) => setWizForm(prev => ({ ...prev, cloned_from: e.target.value }))}
                    className="border border-slate-200 rounded px-3 py-2 bg-white text-xs focus:outline-none focus:border-dc-blue font-semibold w-full"
                  >
                    {programmes.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Dialog Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
          <button 
            onClick={handleWizBack}
            disabled={wizStep === 1}
            className="border border-slate-200 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            ← Back
          </button>

          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Step {wizStep} of {maxSteps}
          </div>

          {wizStep === maxSteps ? (
            <button 
              onClick={handleWizSubmit}
              className="bg-success-green hover:bg-green-700 text-white px-5 py-2 rounded text-xs font-bold cursor-pointer transition-colors shadow-sm"
            >
              {wizardMode === "edit" ? "Update Programme" : "Create Programme"}
            </button>
          ) : (
            <button 
              onClick={handleWizNext}
              className="bg-dc-blue hover:bg-dc-deep text-white px-5 py-2 rounded text-xs font-bold cursor-pointer transition-colors shadow-sm"
            >
              Next →
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
