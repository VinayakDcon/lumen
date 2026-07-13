"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { ProgrammeWizard } from "./programme-wizard";
import { usePmoStore } from "@/store/use-pmo-store";
import { cn } from "@/utils/cn";

import { usePathname } from "next/navigation";
import { canAccessRoute } from "@/lib/roles";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = usePmoStore((state) => state.sidebarCollapsed);
  const user = usePmoStore((state) => state.user);
  const pathname = usePathname();
  
  const isAuthPage = pathname === "/auth/signin";

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full relative bg-bg-base">
        {children}
      </div>
    );
  }

  const isAllowed = !user || canAccessRoute(user.role, pathname);

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base p-6">
        <div className="max-w-md w-full bg-white border border-border-base rounded-xl p-8 text-center shadow-lg animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-navy mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Your account role (<strong className="text-navy">{user?.role}</strong>) does not have permission to access the section <code className="bg-slate-50 px-2 py-1 rounded text-red-600 font-bold font-mono text-xs">{pathname}</code>.
          </p>
          <Link href="/" className="inline-flex items-center justify-center px-6 py-2.5 bg-dc-blue hover:bg-navy text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
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

