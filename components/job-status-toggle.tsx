"use client";

import React, { useState } from "react";
import { toggleJobActiveAction } from "@/app/actions/jobs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface JobStatusToggleProps {
  jobId: string;
  isActive: boolean;
}

export function JobStatusToggle({ jobId, isActive }: JobStatusToggleProps) {
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(isActive);

  async function handleToggle() {
    setLoading(true);
    const result = await toggleJobActiveAction(jobId, active);
    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      setActive(!active);
      toast.success(
        !active
          ? "Lowongan berhasil diaktifkan."
          : "Lowongan dinonaktifkan."
      );
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
        active
          ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100"
          : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
      }`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            active ? "bg-emerald-500" : "bg-slate-400"
          }`}
        />
      )}
      <span>{active ? "Aktif" : "Nonaktif"}</span>
    </button>
  );
}
