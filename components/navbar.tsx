"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, FileText, LogOut, Shield, User, Sparkles } from "lucide-react";
import { Profile } from "@/types/database";
import { cn } from "@/lib/utils";

interface NavbarProps {
  profile: Profile | null;
}

export function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();

  const navLinks = [
    {
      label: "Lowongan Kerja",
      href: "/jobs",
      icon: Briefcase,
    },
    {
      label: "Lamaran Saya",
      href: "/applications",
      icon: FileText,
      requireAuth: true,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/jobs" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(37,99,235,0.28)] transition-transform group-hover:scale-105">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                Smart<span className="text-blue-600">HR</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Talent & Recruitment
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.requireAuth && !profile) return null;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-blue-50/80 text-blue-700 font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-slate-400")} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {profile ? (
            <div className="flex items-center gap-3">
              {profile.role === "admin" && (
                <Link
                  href="/admin/dashboard"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-100 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  Admin Panel
                </Link>
              )}

              {/* Profile Info */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700 shadow-xs">
                  {profile.full_name
                    ? profile.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "U"}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 leading-tight">
                    {profile.full_name}
                  </span>
                  <span className="text-[11px] text-slate-400 capitalize">{profile.role}</span>
                </div>
              </div>

              {/* Sign Out Form */}
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  title="Sign Out"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/sign-in"
                className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/sign-up"
                className="btn-primary-3d text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Daftar Akun
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
