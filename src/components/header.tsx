"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { 
  Bell,
  Eye, EyeOff, LogOut, Settings, Menu, Sun, Moon
} from "lucide-react";
import { cn } from "@/utils/cn";
import { usePathname } from "next/navigation";
import { useActiveProgrammeQuery } from "@/hooks/use-pmo-queries";
import { signOut } from "next-auth/react";

export function Header() {
  const pathname = usePathname();
  
  const user = usePmoStore((state) => state.user);
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const hideCommercials = usePmoStore((state) => state.hideCommercials);
  const toggleHideCommercials = usePmoStore((state) => state.toggleHideCommercials);
  const notifications = usePmoStore((state) => state.notifications);
  const markAllNotificationsRead = usePmoStore((state) => state.markAllNotificationsRead);
  const markNotificationRead = usePmoStore((state) => state.markNotificationRead);
  const toggleSidebar = usePmoStore((state) => state.toggleSidebar);
  const toggleMobileSidebar = usePmoStore((state) => state.toggleMobileSidebar);
  const openProgrammeWizard = usePmoStore((state) => state.openProgrammeWizard);




  const { data: activeProgramme } = useActiveProgrammeQuery(activeProgrammeId);

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth >= 1024) {
        toggleSidebar();
      } else {
        toggleMobileSidebar();
      }
    }
  };

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine page title based on path
  const getPageTitle = () => {
    switch (pathname) {
      case "/portfolio":
        return "All Programmes";
      case "/templates":
        return "Templates & Workflows";
      case "/":
        return "Dashboard";
      case "/programme/charter":
        return "Project Charter";
      case "/programme/journey":
        return "Journey";
      case "/programme/dpds":
        return "DPDS Gates";
      case "/programme/wbs":
        return "Work Breakdown Structure";
      case "/programme/gantt":
        return "Gantt Chart";
      case "/programme/kanban":
        return "Kanban Board";
      case "/track/reports":
        return "Reports / EVM";
      case "/track/heatmap":
        return "Resource Heatmap";
      case "/track/approvals":
        return "Approvals";
      default:
        // Capitalize subpaths
        const sub = pathname?.split("/").pop();
        if (sub) {
          return sub.charAt(0).toUpperCase() + sub.slice(1).replace(/-/g, " ");
        }
        return "PMO Platform";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 right-0 z-30 flex items-center justify-between px-6 shrink-0">
      {/* Topbar Left - Collapsible Trigger & Titles */}
      <div className="flex items-center gap-4 min-w-0">
        <button 
          onClick={handleToggleSidebar}
          className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 text-slate-600 cursor-pointer"
          title="Toggle Sidebar Menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex items-baseline gap-2">
          <h1 className="font-bold text-sm sm:text-base text-navy truncate leading-none">
          {getPageTitle()}
          </h1>
          {(pathname?.startsWith("/programme") || pathname?.startsWith("/track")) && activeProgramme && (
            <span className="text-xs sm:text-sm text-slate-500 font-semibold truncate leading-none">
              {activeProgramme.name}
            </span>
          )}
        </div>
      </div>

      {/* Topbar Right - Actions and Profile */}
      <div className="flex items-center gap-3">
        {(user?.role === "PMO" || user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER") && (
          <button 
            onClick={() => openProgrammeWizard("create")}
            className="bg-dc-blue hover:bg-dc-deep text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm mr-1"
          >
            <span>+ New Project</span>
          </button>
        )}

        {/* Financial Visibility Toggle */}
        {/* <button
          onClick={toggleHideCommercials}
          className={cn(
            "text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-colors cursor-pointer",
            hideCommercials 
              ? "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200" 
              : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
          )}
          title={hideCommercials ? "Show financial metrics" : "Hide financial metrics"}
        >
          {hideCommercials ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Commercials Hidden</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Commercials Visible</span>
            </>
          )}
        </button> */}



        {/* Notification Bell Panel */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 border border-slate-200 rounded hover:bg-slate-50 text-slate-600 hover:text-navy relative cursor-pointer transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-danger-red text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-md shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="bg-navy text-white text-[10px] font-bold tracking-wider px-4 py-2 flex items-center justify-between border-b border-slate-800">
                <span>NOTIFICATIONS</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllNotificationsRead}
                    className="text-[9px] underline text-slate-300 hover:text-white cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No notifications yet.</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        setShowNotifMenu(false);
                      }}
                      className={cn(
                        "p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col gap-1 text-left",
                        !n.read && "bg-blue-50/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-dc-blue uppercase tracking-wider">{n.kind}</span>
                        <span className="text-[9px] text-slate-400">{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-xs font-bold text-navy">{n.title}</h4>
                      {n.body && <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">{n.body}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center text-white font-extrabold text-xs shrink-0"
                style={{ backgroundColor: user.avatar_color || "#1E90E8" }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex items-center gap-1.5 pr-2">
                <span className="text-xs font-bold text-navy leading-none">
                  {user.name}
                </span>
                <span className="text-[9px] bg-yellow-400 text-yellow-950 font-extrabold px-1 rounded uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-md shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 divide-y divide-slate-100">
                <div className="p-3 text-left">
                  <div className="text-xs font-bold text-navy truncate">{user.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
                </div>
                <div className="py-1">
                  <button 
                    onClick={() => {
                      if (activeProgrammeId) {
                        openProgrammeWizard("edit", activeProgrammeId);
                        setShowUserMenu(false);
                      } else {
                        alert("Please select a programme first.");
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Programme Settings</span>
                  </button>
                </div>
                <div className="py-1">
                  <button 
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    className="w-full text-left px-4 py-2 text-xs text-danger-red hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
