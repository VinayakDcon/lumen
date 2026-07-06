"use client";

import React, { Suspense } from "react";
import { signIn } from "next-auth/react";

function SignInForm() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-sm w-full text-center border border-slate-200">
        <h2 className="text-xl font-black text-navy mb-4">DContour PMO</h2>
        <p className="text-slate-500 mb-8 text-xs leading-relaxed">
          Please sign in using your DContour Microsoft account to access the Program Management Platform.
        </p>
        <button
          onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/" })}
          className="w-full bg-[#0067b8] text-white py-2.5 px-4 rounded text-xs font-bold hover:bg-[#005da6] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          {/* Microsoft SVG Icon */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="11" height="11" fill="#F25022"/>
            <rect x="12" width="11" height="11" fill="#7FBA00"/>
            <rect y="12" width="11" height="11" fill="#00A4EF"/>
            <rect x="12" y="12" width="11" height="11" fill="#FFB900"/>
          </svg>
          <span>Sign in with Microsoft</span>
        </button>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
