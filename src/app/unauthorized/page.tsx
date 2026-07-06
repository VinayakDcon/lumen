"use client";

import React from "react";
import Link from "next/link";
import { ShieldX } from "lucide-react";
import { useRole } from "@/hooks/use-role";

export default function UnauthorizedPage() {
  const { roleDisplayName } = useRole();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="flex flex-col items-center gap-6 max-w-md text-center px-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <ShieldX className="w-8 h-8 text-danger-red" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Access Denied</h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Your current role (<strong className="text-navy">{roleDisplayName}</strong>) does not have permission to view this page.
            Please contact your Administrator or Project Manager if you believe this is a mistake.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="bg-dc-blue hover:bg-dc-deep text-white px-5 py-2.5 rounded text-sm font-bold transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/portfolio"
            className="border border-slate-200 hover:bg-slate-50 text-navy px-5 py-2.5 rounded text-sm font-semibold transition-colors"
          >
            All Programmes
          </Link>
        </div>
      </div>
    </div>
  );
}
