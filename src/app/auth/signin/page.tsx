"use client";

import React, { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Lock, Loader2, AlertCircle } from "lucide-react";

function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("microsoft-entra-id", { callbackUrl: "/" });
    } catch (error) {
      console.error("Sign-in failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-slate-50">
      {/* Left Side: Premium Car Headlamp Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-slate-900 border-r border-slate-200/50">
        <img
          src="/car_headlamp.png"
          alt="DContour PM Premium Headlamp"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90 transition-transform duration-[10000ms] ease-out hover:scale-105"
        />
        {/* Soft elegant gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/10" />
      </div>

      {/* Right Side: Login Content */}
      <div className="relative flex-1 lg:w-1/2 flex items-center justify-center p-8 overflow-hidden">
        {/* Decorative Grid Background */}
        <div 
          className="absolute inset-0 z-0 opacity-40 pointer-events-none" 
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, var(--border-color) 1.5px, transparent 0),
              radial-gradient(circle at 100% 0%, rgba(201, 169, 90, 0.05) 0%, transparent 40%),
              radial-gradient(circle at 0% 100%, rgba(30, 144, 232, 0.05) 0%, transparent 45%)
            `,
            backgroundSize: "24px 24px, 100% 100%, 100% 100%"
          }}
        />

        {/* Main Glassmorphic Card */}
        <div className="relative z-10 w-full max-w-[420px] transition-all duration-300 hover:-translate-y-1">
          {/* Soft Background Glow Behind Card */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-gold/5 to-dc-blue/5 rounded-2xl blur-2xl" />

          <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
            {/* Logo Container */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-full max-w-[280px] h-[150px] flex items-center justify-center overflow-hidden">
                <img
                  src="/logo.png"
                  alt="DContour PM Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.01)]"
                />
              </div>
              <div className="w-16 h-[2px] bg-gradient-to-r from-dc-blue/40 via-gold/50 to-dc-blue/40 mt-1 rounded-full" />
            </div>

            {/* Error Alert Box */}
            {error && (
              <div className="mb-6 p-4 bg-red-50/85 border border-red-200/80 text-red-800 text-xs rounded-xl flex items-start gap-2.5 font-medium leading-relaxed shadow-sm">
                <AlertCircle className="w-4.5 h-4.5 text-red-550 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-red-900">Access Denied</span>
                  <span className="text-[11px] text-red-700/90 font-medium">Your email is not registered or active on DconPM. Please contact your system administrator.</span>
                </div>
              </div>
            )}

            {/* Prompt Description */}
            <p className="text-slate-500 text-center mb-8 text-[12px] leading-relaxed max-w-[320px] mx-auto font-medium">
              Please sign in using your corporate Microsoft account to access the <span className="font-bold text-slate-700">DContour PM</span> Program Management Platform.
            </p>

            {/* Microsoft Sign-In Button (Gradient blue to black) */}
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="group relative w-full bg-gradient-to-r from-dc-blue to-black hover:from-dc-deep hover:to-slate-950 text-white py-3 px-4 rounded-xl text-xs font-semibold disabled:from-slate-800 disabled:to-slate-900 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.98] overflow-hidden"
            >
              {/* Hover reflection animation effect */}
              <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-20deg] translate-x-[-150%] group-hover:translate-x-[250%] transition-transform duration-1000 ease-out" />
              
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
              ) : (
                <svg className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="11" height="11" fill="#F25022"/>
                  <rect x="12" width="11" height="11" fill="#7FBA00"/>
                  <rect y="12" width="11" height="11" fill="#00A4EF"/>
                  <rect x="12" y="12" width="11" height="11" fill="#FFB900"/>
                </svg>
              )}
              
              <span>{isLoading ? "Connecting to Microsoft..." : "Sign in with Microsoft"}</span>
            </button>

            {/* Security Notice Footer */}
            <div className="flex items-center justify-center gap-1.5 mt-8 text-[10px] text-slate-400 font-bold">
              <Lock className="w-3.5 h-3.5 text-slate-300" />
              <span>Secure Enterprise Single Sign-On</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
          <span className="text-[11px] text-slate-400 font-medium tracking-wide animate-pulse">Loading DContour PM...</span>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
