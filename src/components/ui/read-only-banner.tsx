"use client";

import React from "react";
import { ShieldOff } from "lucide-react";

/**
 * ReadOnlyBanner — shown at the top of pages when the user has view-only access.
 */
export function ReadOnlyBanner() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-xs font-medium mb-4">
      <ShieldOff className="w-3.5 h-3.5 shrink-0" />
      <span>You are viewing this page in <strong>read-only mode</strong>. Contact your Project Manager to request edit access.</span>
    </div>
  );
}
