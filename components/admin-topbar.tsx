"use client";

import React from "react";
import { Profile } from "@/types/database";
import { LogOut, Shield } from "lucide-react";

interface AdminTopbarProps {
  profile: Profile;
}

export function AdminTopbar({ profile }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-400">Workspace /</span>
        <span className="text-sm font-semibold text-slate-800">Recruitment Dashboard</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Admin Tag */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>Role: Admin</span>
        </div>

        {/* User Avatar & Name */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {profile.full_name
              ? profile.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              : "AD"}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800 leading-tight">
              {profile.full_name}
            </span>
            <span className="text-[10px] text-slate-400">Recruiter</span>
          </div>
        </div>

        {/* Sign Out Button */}
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            title="Keluar dari Admin"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
