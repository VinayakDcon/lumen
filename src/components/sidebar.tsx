"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePmoStore } from "@/store/use-pmo-store";
import { 
  FolderKanban, LayoutTemplate, Clock, Users2, CheckSquare, BarChart3,
  LayoutDashboard, ScrollText, Compass, Trophy, Network, Calendar, Kanban,
  TrendingUp, Map, UserCheck, History, Award, Flag, Package, AlertTriangle,
  TestTube, RefreshCw, Phone, Navigation, ClipboardList, Mail, Building2,
  FileSpreadsheet, CreditCard, Receipt, CircleDollarSign, LineChart,
  FolderOpen, BookOpen, Wrench, FlaskConical, Users, BrainCircuit, Settings2, Key,
  ChevronDown, ChevronLeft, ChevronRight, Search
} from "lucide-react";
import { useProgrammesQuery } from "@/hooks/use-pmo-queries";
import { cn } from "@/utils/cn"; // Small utility to join tailwind classes
import { canAccessRoute } from "@/lib/roles";

export function Sidebar() {
  const pathname = usePathname();
  const { data: programmes = [] } = useProgrammesQuery();
  
  const user = usePmoStore((state) => state.user);
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const switchProgramme = usePmoStore((state) => state.switchProgramme);
  const sidebarCollapsed = usePmoStore((state) => state.sidebarCollapsed);
  const toggleSidebar = usePmoStore((state) => state.toggleSidebar);
  const mobileSidebarOpen = usePmoStore((state) => state.mobileSidebarOpen);
  const closeMobileSidebar = usePmoStore((state) => state.closeMobileSidebar);
  const searchQuery = usePmoStore((state) => state.searchQuery);
  const setSearchQuery = usePmoStore((state) => state.setSearchQuery);
  
  const [showProgDropdown, setShowProgDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Restore scroll position on mount & pathname changes
  useEffect(() => {
    const savedScrollPos = sessionStorage.getItem("sidebar-scroll");
    if (savedScrollPos && navRef.current) {
      navRef.current.scrollTop = parseInt(savedScrollPos, 10);
    }
  }, [pathname]);

  const handleScroll = () => {
    if (navRef.current) {
      sessionStorage.setItem("sidebar-scroll", String(navRef.current.scrollTop));
    }
  };

  const activeProgramme = programmes.find(p => p.id === activeProgrammeId);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProgDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navGroups = [
    {
      title: "PORTFOLIO",
      items: [
        { label: "All Programmes", href: "/portfolio", icon: FolderKanban },
        { label: "Templates & Workflows", href: "/templates", icon: LayoutTemplate },
      ]
    },
    {
      title: "MY HOURS",
      items: [
        { label: "My Timesheet (Daily)", href: "/timesheet/mine", icon: Clock },
        { label: "Team Hours", href: "/timesheet/team", icon: Users2 },
        { label: "Approve Timesheets", href: "/timesheet/approvals", icon: CheckSquare },
        { label: "Resource Hours", href: "/timesheet/resources", icon: BarChart3 },
        { label: "Hours Analytics", href: "/timesheet/analytics", icon: LineChart },
      ]
    },
    {
      title: "PROGRAMME",
      items: [
        { label: "Dashboard", href: `/`, icon: LayoutDashboard },
        { label: "Project Charter", href: "/programme/charter", icon: ScrollText },
        { label: "Journey", href: "/programme/journey", icon: Compass },
        { label: "DPDS Gates", href: "/programme/dpds", icon: Trophy },
        { label: "WBS", href: "/programme/wbs", icon: Network },
        { label: "Gantt", href: "/programme/gantt", icon: Calendar },
        { label: "Kanban", href: "/programme/kanban", icon: Kanban },
      ]
    },
    {
      title: "TRACK",
      items: [
        { label: "Reports / EVM", href: "/track/reports", icon: TrendingUp },
        { label: "Resource Heatmap", href: "/track/heatmap", icon: Map },
        { label: "Approvals", href: "/track/approvals", icon: UserCheck },
        { label: "Audit", href: "/track/audit", icon: History },
      ]
    },
    {
      title: "DELIVER",
      items: [
        { label: "Deliverables", href: "/deliver/deliverables", icon: Award },
        { label: "Milestones", href: "/deliver/milestones", icon: Flag },
        { label: "Shipments", href: "/deliver/shipments", icon: Package },
        { label: "Risks", href: "/deliver/risks", icon: AlertTriangle },
        { label: "DFMEA", href: "/deliver/dfmea", icon: TestTube },
        { label: "Change Requests", href: "/deliver/changes", icon: RefreshCw },
        { label: "Customer Comms", href: "/deliver/custcomms", icon: Phone },
      ]
    },
    {
      title: "RECORDS",
      items: [
        { label: "Decisions", href: "/records/decisions", icon: Navigation },
        { label: "Meeting Minutes", href: "/records/meetings", icon: ClipboardList },
        { label: "Email Queue", href: "/records/emails", icon: Mail },
      ]
    },
    {
      title: "FINANCE & VENDORS",
      items: [
        { label: "Vendors", href: "/finance/vendors", icon: Building2 },
        { label: "Quotes (Compare)", href: "/finance/quotes", icon: FileSpreadsheet },
        { label: "Purchase Orders", href: "/finance/po", icon: CreditCard },
        { label: "Invoices", href: "/finance/invoices", icon: Receipt },
        { label: "Payments", href: "/finance/payments", icon: CircleDollarSign },
        { label: "Budget vs Actual", href: "/finance/budget", icon: LineChart },
      ]
    },
    {
      title: "LIBRARY",
      items: [
        { label: "Documents", href: "/library/documents", icon: FolderOpen },
        { label: "Standards", href: "/library/standards", icon: BookOpen },
        { label: "Tooling", href: "/library/tooling", icon: Wrench },
        { label: "Lab Equipment", href: "/library/lab", icon: FlaskConical },
      ]
    },
    {
      title: "MANAGE",
      items: [
        { label: "Team", href: "/manage/team", icon: Users },
        { label: "Skills Matrix", href: "/manage/skills", icon: BrainCircuit },
        { label: "Resources", href: "/manage/resources", icon: Settings2 },
        { label: "Users", href: "/manage/users", icon: Key },
      ]
    }
  ];

  return (
    <>
      {/* Backdrop for mobile overlays */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-200"
          onClick={closeMobileSidebar}
        />
      )}

      <aside 
        className={cn(
          "fixed top-0 bottom-0 bg-navy text-white flex flex-col border-r border-slate-800 z-50 transition-all duration-300",
          // Desktop positioning
          "lg:translate-x-0",
          sidebarCollapsed ? "lg:w-16" : "lg:w-60",
          // Mobile positioning
          mobileSidebarOpen ? "translate-x-0 w-60" : "-translate-x-full w-60"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800 h-16 shrink-0">
          <div className="w-9 h-9 bg-gold text-navy rounded flex items-center justify-center font-extrabold text-sm shrink-0">
            DC
          </div>
          {!sidebarCollapsed && (
            <div className="truncate">
              <div className="font-bold text-sm tracking-wide">DContour PM</div>
              <div className="text-[9px] text-slate-400 tracking-wider uppercase font-medium">Program Mgmt</div>
            </div>
          )}
        </div>

        {/* Active Programme Switcher */}
        <div className="px-3 py-3 shrink-0 relative" ref={dropdownRef}>
          <button 
            onClick={() => !sidebarCollapsed && setShowProgDropdown(!showProgDropdown)}
            className={cn(
              "w-full text-left rounded-md transition-colors border border-slate-800 bg-slate-900/40 text-white shrink-0",
              sidebarCollapsed ? "p-1.5 flex items-center justify-center" : "p-3 hover:bg-slate-800/40"
            )}
            title={sidebarCollapsed ? activeProgramme?.name : undefined}
          >
            {sidebarCollapsed ? (
              <span className="text-[10px] font-bold text-gold">
                {activeProgramme?.id.slice(0, 3)}
              </span>
            ) : (
              <div className="relative pr-4">
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Active Programme</div>
                <div className="text-xs font-bold truncate mt-0.5 text-slate-200">
                  {activeProgramme?.name || "Select Project..."}
                </div>
                <ChevronDown className="absolute right-0 bottom-1 w-3.5 h-3.5 text-slate-400" />
              </div>
            )}
          </button>

          {/* Dropdown menu */}
          {showProgDropdown && !sidebarCollapsed && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-white text-slate-900 rounded-md shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="bg-navy text-white text-[10px] font-bold tracking-wider px-3.5 py-2 border-b border-slate-800 uppercase">
                Switch Programme
              </div>
              <div className="max-h-60 overflow-y-auto">
                {programmes.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchProgramme(p.id);
                      setShowProgDropdown(false);
                    }}
                    className={cn(
                      "w-full text-left px-3.5 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors flex flex-col gap-0.5",
                      p.id === activeProgrammeId && "bg-blue-50/50 border-l-4 border-l-dc-blue"
                    )}
                  >
                    <span className="text-xs font-bold text-navy truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-500">{p.customer} · {p.programme_weeks}w</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Global Search Bar */}
        {!sidebarCollapsed && (
          <div className="px-3 pb-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Quick search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/40 border border-slate-800 rounded px-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold focus:bg-slate-800/60"
              />
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav 
          ref={navRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-2 pb-6 space-y-4"
        >
          {navGroups.map((group, gIdx) => {
            // Filter items by role
            const visibleItems = group.items.filter(
              (item) => canAccessRoute(user?.role, item.href)
            );
            // Hide entire group if no visible items
            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                {!sidebarCollapsed ? (
                  <div className="text-[9px] font-extrabold tracking-widest text-slate-500 px-3 py-1 uppercase">
                    {group.title}
                  </div>
                ) : (
                  <div className="border-t border-slate-800/40 my-2" />
                )}
                
                {visibleItems.map((item, iIdx) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={iIdx}
                      href={item.href}
                      onClick={closeMobileSidebar}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-xs font-medium rounded transition-colors relative",
                        isActive 
                          ? "bg-dc-blue text-white font-bold" 
                          : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Collapse Toggle Footer */}
        <div className="p-3 border-t border-slate-800 items-center justify-between shrink-0 bg-slate-900/20 hidden lg:flex">
          <button 
            onClick={toggleSidebar} 
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
