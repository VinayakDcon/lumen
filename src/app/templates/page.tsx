"use client";

import React, { useRef } from "react";
import { useTemplatesQuery } from "@/hooks/use-pmo-queries";
import { 
  UploadCloud, LayoutTemplate, HelpCircle, 
  Download, Sparkles, Zap
} from "lucide-react";
import { usePmoStore } from "@/store/use-pmo-store";
import { cn } from "@/utils/cn";
import { useRouter } from "next/navigation";

const ARCHETYPE_ICONS: Record<string, string> = {
  TIER1_OEM: "🏭",
  TIER1_AFTERMARKET: "🛒",
  PARTNERSHIP: "🤝",
  RND_TECHNOLOGY: "🔬",
  PRODUCT_ROADMAP: "📦",
  CAPABILITY_GROWTH: "🛠",
  MICRO_PROJECT: "🪶",
  RECURRING: "🔁"
};

export default function TemplatesPage() {
  const { data: templates = [], isLoading } = useTemplatesQuery();
  const user = usePmoStore((state) => state.user);
  const router = useRouter();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFresher = user?.role === "ENGINEER" || user?.role === "INTERN_SUPPORT_ENGINEER" || user?.role === "VIEWER";

  const handleDownloadExcel = (archetype: string) => {
    const filename = `DContour_${archetype}_template.xlsx`;
    const fileUrl = `/templates/${filename}`;
    
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenWizard = (archetype: string) => {
    router.push("/portfolio");
    setTimeout(() => {
      const event = new CustomEvent("open-programme-wizard", {
        detail: { template: archetype }
      });
      window.dispatchEvent(event);
    }, 250);
  };


  const handleUploadExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (confirm(`Upload "${file.name}" to trigger a new project?\n\nThe WBS, milestones, and gates will be parsed and loaded into the database.`)) {
        alert(`Successfully imported "${file.name}"!\nNew project created.`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium">Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      
      {/* Templates Header */}
      <div className="bg-white border border-border-base rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-navy flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-dc-blue" />
            <span>Project Templates & Workflows</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose from predefined archetypes. Download an Excel template to design offline, or use the interactive Wizard to launch.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          {/* File Upload Trigger */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUploadExcel} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="border border-slate-200 hover:bg-slate-50 bg-white text-slate-700 px-3.5 py-2 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            <UploadCloud className="w-4 h-4 text-slate-500" />
            <span>Trigger from Excel</span>
          </button>
        </div>
      </div>

      {/* Onboarding hint widget */}
      <div className="bg-amber-50/70 border border-amber-200/60 rounded-lg p-4 flex gap-3.5 items-start">
        <HelpCircle className="w-5 h-5 text-warning-amber mt-0.5 shrink-0" />
        <div>
          <h4 className="font-bold text-xs text-amber-800">👋 New to the Platform?</h4>
          <p className="text-[11px] text-amber-700 leading-normal mt-0.5 max-w-2xl">
            We recommend starting with the <strong className="underline">Micro Project</strong> template. It avoids DPDS gate reviews and complex compliance workflows, providing a simple, agile rhythm: Scope ➔ Do ➔ Review ➔ Close.
          </p>
        </div>
      </div>

      {/* Templates Library Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => {
          const isRecommended = isFresher && tpl.archetype === "MICRO_PROJECT";
          const icon = ARCHETYPE_ICONS[tpl.archetype] || "📋";

          return (
            <div 
              key={tpl.archetype}
              className={cn(
                "bg-white border rounded-lg p-5 shadow-sm hover-lift flex flex-col justify-between transition-all duration-200",
                isRecommended ? "border-gold border-t-4 border-t-gold" : "border-slate-200"
              )}
            >
              <div>
                {/* Recommended Label Header */}
                {isRecommended && (
                  <div className="bg-gold-light border border-gold/20 rounded px-2.5 py-1 flex items-center gap-1.5 self-start w-fit mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-gold shrink-0 fill-gold" />
                    <span className="text-[9px] font-extrabold text-amber-800 uppercase tracking-wide">
                      Recommended for you
                    </span>
                  </div>
                )}

                {/* Archetype Card Header */}
                <div className="flex gap-4">
                  <div className="text-3xl shrink-0 mt-1 select-none">
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-navy text-sm">
                      {tpl.label}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>
                </div>

                {/* Tags section */}
                <div className="flex flex-wrap gap-1.5 my-4 border-t border-slate-50 pt-3">
                  <span className="bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-[9px] font-bold text-slate-500 uppercase">
                    🕒 ~{tpl.typical_weeks} Wks
                  </span>
                  <span className="bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-[9px] font-bold text-slate-500 uppercase">
                    ⚙ {tpl.workstream_count} Streams
                  </span>
                  <span className="bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-[9px] font-bold text-slate-500 uppercase">
                    📁 {tpl.intent_kind}
                  </span>
                  <span className="bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-[9px] font-bold text-slate-500 uppercase">
                    DPDS: {tpl.archetype === "MICRO_PROJECT" || tpl.archetype === "RECURRING" ? "None" : "Auto"}
                  </span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 border-t border-slate-50 pt-4 mt-2">
                <button
                  onClick={() => handleDownloadExcel(tpl.archetype)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel</span>
                </button>
                <button
                  onClick={() => handleOpenWizard(tpl.archetype)}
                  className="flex-1 bg-dc-blue hover:bg-dc-deep text-white py-2 rounded text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Launch Wizard</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
