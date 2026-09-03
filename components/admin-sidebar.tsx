"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  PlusCircle,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const pathname = usePathname();

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Kelola Lowongan",
      href: "/admin/jobs",
      icon: Briefcase,
      exact: false,
    },
    {
      name: "Buat Lowongan",
      href: "/admin/jobs/new",
      icon: PlusCircle,
      exact: true,
    },
    {
      name: "Semua Pelamar",
      href: "/admin/applications",
      icon: Users,
      exact: true,
    },
    {
      name: "Log Komunikasi",
      href: "/admin/communications",
      icon: Mail,
      exact: false,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-bold text-slate-900 leading-tight">
            <span>Smart<span className="text-blue-600">HR</span></span>
            <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/70 rounded-md">
              Admin
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Recruitment Console</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-5 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menu Utama
        </div>
        {navigation.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href) && pathname !== "/admin/jobs/new");
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-50/90 text-blue-700 font-semibold shadow-xs border border-blue-200/50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105",
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "icon-chip-3d text-slate-500"
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Bottom Footer Section */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="text-[11px] text-slate-600 leading-tight">
            <span className="font-semibold text-slate-800">RLS Secured:</span> Superuser/Admin Access Mode
          </div>
        </div>

        <Link
          href="/jobs"
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Portal Kandidat
        </Link>
      </div>
    </aside>
  );
}
