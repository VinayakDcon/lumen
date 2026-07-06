"use client";

import React from "react";

interface ProtectedActionProps {
  /** If true, renders children. If false, renders nothing (or a disabled fallback). */
  allowed: boolean;
  /** Optional: render a disabled placeholder instead of hiding entirely. */
  showDisabled?: boolean;
  children: React.ReactNode;
}

/**
 * ProtectedAction — conditionally renders action buttons/controls based on permission.
 *
 * Usage:
 *   <ProtectedAction allowed={canEdit}>
 *     <button onClick={handleAdd}>+ Add Risk</button>
 *   </ProtectedAction>
 */
export function ProtectedAction({ allowed, showDisabled = false, children }: ProtectedActionProps) {
  if (allowed) return <>{children}</>;
  if (showDisabled) {
    return (
      <div className="opacity-40 pointer-events-none select-none" title="You do not have permission for this action">
        {children}
      </div>
    );
  }
  return null;
}
