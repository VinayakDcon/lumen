"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { ProgrammeWizard } from "./programme-wizard";
import { usePmoStore } from "@/store/use-pmo-store";
import { cn } from "@/utils/cn";

export function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = usePmoStore((state) => state.sidebarCollapsed);
  
  return (
    <div className="min-h-screen flex bg-bg-base">
      {/* Navigation Sidebar */}
      <Sidebar />
      
      {/* Content Area */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-60",
          "pl-0"
        )}
      >
        {/* App Header Bar */}
        <Header />
        
        {/* Scrollable Page Wrapper */}
        <main className="flex-1 w-full relative">
          {children}
        </main>
      </div>

      {/* Global Programme Create/Edit Wizard */}
      <ProgrammeWizard />
    </div>
  );
}

