import React from "react";
import { Navbar } from "@/components/navbar";
import { getCurrentProfile } from "@/lib/supabase/auth";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar profile={profile} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} SmartHR Inc. Platform Rekrutmen Cerdas.</span>
          <span className="text-slate-400">AI-Assisted CV Screening Engine</span>
        </div>
      </footer>
    </div>
  );
}
