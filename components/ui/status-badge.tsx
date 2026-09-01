import React from "react";
import { ApplicationStatus } from "@/types/database";
import { Clock, CheckCircle2, XCircle, UserCheck, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const configs: Record<
    ApplicationStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    pending: {
      label: "Pending Review",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
    },
    screened: {
      label: "Screened (AI)",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />,
    },
    invited_interview: {
      label: "Diundang Wawancara",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      icon: <UserCheck className="w-3.5 h-3.5 text-blue-600" />,
    },
    interview_in_progress: {
      label: "Wawancara Berlangsung",
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
      icon: <Clock className="w-3.5 h-3.5 text-indigo-600" />,
    },
    interview_completed: {
      label: "Wawancara Selesai",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    },
    withdrawn_expired: {
      label: "Mengundurkan Diri (Expired)",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
    },
    rejected: {
      label: "Rejected",
      bg: "bg-slate-100",
      text: "text-slate-600",
      border: "border-slate-200",
      icon: <XCircle className="w-3.5 h-3.5 text-slate-500" />,
    },
  };

  const config = configs[status] || configs.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-xs",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
