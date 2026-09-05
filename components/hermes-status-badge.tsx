"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Server,
  Sparkles,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Shield,
  Activity,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface HermesStatusData {
  online: boolean;
  latencyMs: number;
  vpsHost: string;
  vpsPort: number;
  vpsUser: string;
  vpsInstance: string;
  model: string;
  mode: string;
  target: string;
  error?: string;
  timestamp: number;
}

interface HermesStatusBadgeProps {
  variant?: "admin" | "user" | "card";
  className?: string;
}

export function HermesStatusBadge({
  variant = "admin",
  className,
}: HermesStatusBadgeProps) {
  const [data, setData] = useState<HermesStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`/api/hermes/status?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData((prev) =>
          prev
            ? { ...prev, online: false, error: "HTTP error" }
            : null
        );
      }
    } catch (err: any) {
      setData((prev) =>
        prev
          ? { ...prev, online: false, error: err.message }
          : null
      );
    } finally {
      setLoading(false);
      if (isManual) {
        setTimeout(() => setRefreshing(false), 400);
      }
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-polling every 12 seconds for realtime status
    const interval = setInterval(() => {
      fetchStatus();
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const isOnline = data?.online ?? false;
  const host = data?.vpsHost || "103.30.146.87";
  const model = data?.model || "agnes-2.5-flash";
  const latency = data?.latencyMs ?? -1;

  // Card Variant for Admin Dashboard Overview
  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-2xl border bg-white p-5 shadow-xs transition-all relative overflow-hidden",
          isOnline
            ? "border-emerald-200/80 hover:border-emerald-300"
            : "border-slate-200 hover:border-slate-300",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs",
                isOnline
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                  : "bg-gradient-to-br from-slate-400 to-slate-500"
              )}
            >
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  Hermes AI Infrastructure
                </h3>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                    isOnline
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isOnline
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-rose-500"
                    )}
                  />
                  {loading
                    ? "Checking..."
                    : isOnline
                    ? "Live Connected"
                    : "Unreachable"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Node VPS & Evaluator AI Realtime
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            title="Ping ulang server"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw
              className={cn(
                "w-4 h-4",
                refreshing && "animate-spin text-blue-600"
              )}
            />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Target VPS Host
            </span>
            <div className="font-mono text-xs font-bold text-slate-800 flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate">{host}</span>
            </div>
            <span className="text-[10px] text-slate-400">
              Port: {data?.vpsPort || 4422}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Active Hermes Model
            </span>
            <div className="text-xs font-bold text-indigo-700 flex items-center gap-1 truncate">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">{model}</span>
            </div>
            <span className="text-[10px] text-slate-400">
              Mode: {data?.mode || "CLI"} / {data?.target || "VPS"}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Latensi Jaringan
            </span>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{latency >= 0 ? `${latency} ms` : "N/A"}</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">
              Direct TCP Handshake
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Instance Tag
            </span>
            <div className="text-xs font-semibold text-slate-700 truncate">
              {data?.vpsInstance ? (
                <span className="truncate block" title={data.vpsInstance}>
                  {data.vpsInstance}
                </span>
              ) : (
                "Hermes-Node-01"
              )}
            </div>
            <span className="text-[10px] text-slate-400">
              User: {data?.vpsUser || "root"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Admin Topbar or User Navbar Badge
  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-2xs hover:shadow-xs",
          variant === "admin"
            ? isOnline
              ? "bg-white/90 border-emerald-200/90 text-slate-700 hover:border-emerald-300"
              : "bg-white/90 border-rose-200 text-slate-700 hover:border-rose-300"
            : isOnline
            ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-900 hover:bg-emerald-100/70"
            : "bg-rose-50/70 border-rose-200 text-rose-900 hover:bg-rose-100/70"
        )}
        title="Klik untuk detail koneksi VPS & Model Hermes"
      >
        {/* Status Pulse Dot */}
        <span className="relative flex h-2 w-2">
          {isOnline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              loading
                ? "bg-amber-400 animate-pulse"
                : isOnline
                ? "bg-emerald-500"
                : "bg-rose-500"
            )}
          />
        </span>

        {/* Server & Model Label */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] leading-none">
          <span className="font-semibold text-slate-800 flex items-center gap-1">
            <Server className="w-3 h-3 text-blue-500" />
            <span>{host}</span>
          </span>

          <span className="text-slate-300 font-sans">|</span>

          <span className="font-semibold text-indigo-700 font-sans flex items-center gap-1 truncate max-w-[130px] sm:max-w-[160px]">
            <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
            <span className="truncate">{model}</span>
          </span>
        </div>

        {/* Latency Pill */}
        {latency >= 0 && (
          <span className="hidden xl:inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
            <Zap className="w-2.5 h-2.5 text-amber-500" />
            {latency}ms
          </span>
        )}

        <ChevronDown
          className={cn(
            "w-3 h-3 text-slate-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Popover Dropdown Details */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white p-4 shadow-xl border border-slate-200/90 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  isOnline ? "bg-emerald-500" : "bg-rose-500"
                )}
              />
              <span className="text-xs font-bold text-slate-800">
                Infrastruktur Hermes AI
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fetchStatus(true);
              }}
              disabled={refreshing}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw
                className={cn(
                  "w-3 h-3",
                  refreshing && "animate-spin text-blue-600"
                )}
              />
              <span>{refreshing ? "Ping..." : "Tes Ulang"}</span>
            </button>
          </div>

          <div className="py-3 space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Status Node:</span>
              <span
                className={cn(
                  "font-semibold flex items-center gap-1",
                  isOnline ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {isOnline ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Terhubung (Online)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Offline / Gagal Hubung</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">IP VPS & Port:</span>
              <span className="font-mono font-semibold text-slate-800">
                {host}:{data?.vpsPort || 4422}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Hermes Model:</span>
              <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                {model}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Routing Mode:</span>
              <span className="font-medium text-slate-700 capitalize">
                {data?.mode === "cli" ? "CLI Remote via SSH" : "API Router"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Latensi Koneksi:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                {latency >= 0 ? `${latency} ms` : "Timeout"}
              </span>
            </div>

            {data?.vpsInstance && (
              <div className="flex flex-col gap-0.5 py-1">
                <span className="text-[10px] text-slate-400">Instance Tag:</span>
                <span className="font-mono text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-md break-all border border-slate-100">
                  {data.vpsInstance}
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100 flex items-center justify-between">
            <span>Auto-refresh setiap 12 detik</span>
            <span className="text-slate-400">.env.local auto-detect</span>
          </div>
        </div>
      )}
    </div>
  );
}
