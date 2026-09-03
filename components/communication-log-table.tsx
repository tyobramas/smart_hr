"use client";

import React, { useState, useMemo } from "react";
import { CommunicationLog, CommunicationEventType, CommunicationStatus } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  X,
  Filter,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface EnrichedCommunicationLog extends CommunicationLog {
  candidate_name?: string;
  job_title?: string;
}

interface CommunicationLogTableProps {
  logs: EnrichedCommunicationLog[];
}

const EVENT_LABELS: Record<CommunicationEventType, { label: string; variant: "default" | "secondary" | "success" | "warning" | "danger" | "info" }> = {
  application_received: { label: "Lamaran Diterima", variant: "info" },
  screening_passed: { label: "Lolos Screening", variant: "success" },
  screening_rejected: { label: "Screening Ditolak", variant: "danger" },
  screening_review: { label: "Review Manual", variant: "warning" },
  personality_reminder: { label: "Pengingat Kepribadian", variant: "warning" },
  personality_completed: { label: "Kepribadian Selesai", variant: "success" },
  interview_invitation: { label: "Undangan Wawancara", variant: "info" },
  interview_reminder_48h: { label: "Pengingat Wawancara (48j)", variant: "warning" },
  interview_reminder_24h: { label: "Pengingat Wawancara (24j)", variant: "danger" },
  interview_completed: { label: "Wawancara Selesai", variant: "success" },
  interview_expired: { label: "Wawancara Kedaluwarsa", variant: "danger" },
  final_rejection: { label: "Penolakan Akhir", variant: "danger" },
};

export function CommunicationLogTable({ logs }: CommunicationLogTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [previewLog, setPreviewLog] = useState<EnrichedCommunicationLog | null>(null);
  const [previewMode, setPreviewMode] = useState<"html" | "text">("html");

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        searchTerm === "" ||
        log.email_to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.email_subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.candidate_name && log.candidate_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.job_title && log.job_title.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === "all" || log.status === statusFilter;
      const matchesEvent = eventFilter === "all" || log.event_type === eventFilter;

      return matchesSearch && matchesStatus && matchesEvent;
    });
  }, [logs, searchTerm, statusFilter, eventFilter]);

  const getStatusBadge = (status: CommunicationStatus) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> Terkirim
          </Badge>
        );
      case "queued":
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="w-3 h-3" /> Antrean
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="danger" className="gap-1">
            <AlertCircle className="w-3 h-3" /> Gagal
          </Badge>
        );
      case "bounced":
        return (
          <Badge variant="danger" className="gap-1">
            <AlertCircle className="w-3 h-3" /> Bounced
          </Badge>
        );
      case "opened":
        return (
          <Badge variant="info" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> Dibuka
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kandidat, email, atau posisi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="sent">Terkirim</option>
              <option value="queued">Dalam Antrean</option>
              <option value="failed">Gagal</option>
              <option value="bounced">Bounced</option>
              <option value="opened">Dibuka</option>
            </select>
          </div>

          {/* Event Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Event:</span>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 max-w-[170px] truncate"
            >
              <option value="all">Semua Event</option>
              {Object.entries(EVENT_LABELS).map(([evtKey, conf]) => (
                <option key={evtKey} value={evtKey}>
                  {conf.label}
                </option>
              ))}
            </select>
          </div>

          {(searchTerm || statusFilter !== "all" || eventFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setEventFilter("all");
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">Kandidat</th>
                <th className="py-3 px-4">Posisi</th>
                <th className="py-3 px-4">Tipe Event</th>
                <th className="py-3 px-4">Subjek</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">AI Engine</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Mail className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                    <p className="font-medium">Belum ada riwayat komunikasi yang sesuai</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Email otomatis akan tercatat di sini saat proses rekrutmen berjalan.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const eventConfig = EVENT_LABELS[log.event_type] || {
                    label: log.event_type,
                    variant: "secondary",
                  };

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {log.created_at ? formatDate(log.created_at) : "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">
                          {log.candidate_name || "Kandidat"}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {log.email_to}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {log.job_title || "-"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant={eventConfig.variant}>
                          {eventConfig.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <span className="truncate block text-slate-700" title={log.email_subject}>
                          {log.email_subject}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="text-[11px]">
                            {log.hermes_model || "Hermes Agent"}
                          </span>
                        </div>
                        {log.hermes_duration_ms ? (
                          <span className="text-[10px] text-slate-400">
                            {(log.hermes_duration_ms / 1000).toFixed(1)}s
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setPreviewLog(log)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Lihat</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Preview Modal */}
      {previewLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div className="space-y-1 pr-6">
                <div className="flex items-center gap-2">
                  <Badge variant={EVENT_LABELS[previewLog.event_type]?.variant || "secondary"}>
                    {EVENT_LABELS[previewLog.event_type]?.label || previewLog.event_type}
                  </Badge>
                  {getStatusBadge(previewLog.status)}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {previewLog.email_subject}
                </h3>
                <p className="text-xs text-slate-500">
                  Kepada: <span className="font-semibold text-slate-700">{previewLog.candidate_name || previewLog.email_to}</span> ({previewLog.email_to})
                </p>
              </div>
              <button
                onClick={() => setPreviewLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setPreviewMode("html")}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    previewMode === "html"
                      ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  HTML Preview
                </button>
                <button
                  onClick={() => setPreviewMode("text")}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    previewMode === "text"
                      ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Plain Text
                </button>
              </div>

              <div className="text-[11px] text-slate-500">
                Engine: <span className="font-medium text-slate-700">{previewLog.hermes_model || "Hermes Agent"}</span>
                {previewLog.provider_message_id && (
                  <span className="ml-2 text-slate-400 font-mono">ID: {previewLog.provider_message_id.slice(0, 12)}...</span>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
              {previewLog.error_message && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span><strong>Detail Error:</strong> {previewLog.error_message}</span>
                </div>
              )}

              {previewMode === "html" ? (
                <div
                  className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs"
                  dangerouslySetInnerHTML={{ __html: previewLog.email_body_html }}
                />
              ) : (
                <pre className="bg-white p-5 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-xs">
                  {previewLog.email_body_text || "Versi teks biasa tidak tersedia."}
                </pre>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white text-xs text-slate-400">
              <span>Tercatat pada {previewLog.created_at ? formatDate(previewLog.created_at) : "-"}</span>
              <button
                onClick={() => setPreviewLog(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

