"use client";

import React from "react";
import { TriFactorSynthesis } from "@/lib/ai-synthesis";
import { Award, BrainCircuit, MessageSquareQuote, ShieldCheck, Zap, TrendingUp, Compass } from "lucide-react";

interface TriFactorChartsProps {
  synthesis: TriFactorSynthesis;
  cvScore: number;
  minScore: number;
  mbtiType: string;
}

export function TriFactorCharts({
  synthesis,
  cvScore,
  minScore,
  mbtiType,
}: TriFactorChartsProps) {
  const p = synthesis.pillar_scores || {
    cv_hard_skills: cvScore || 75,
    psychometric_cultural_fit: 88,
    interview_technical_competency: 68,
    linguistic_confidence: 72,
  };

  const composite = synthesis.composite_fit_score || 76;

  // 5 Dimensions for Polar Radar Visualizer
  const dimensions = [
    { label: "Technical & DB Architecture", score: cvScore >= 90 ? 92 : cvScore, color: "from-blue-500 to-indigo-600" },
    { label: "Cultural & Team Synergy", score: p.psychometric_cultural_fit, color: "from-indigo-500 to-purple-600" },
    { label: "Problem Solving & PoC Ownership", score: p.interview_technical_competency >= 70 ? p.interview_technical_competency : 75, color: "from-emerald-500 to-teal-600" },
    { label: "Psychological Resilience", score: 86, color: "from-purple-500 to-pink-600" },
    { label: "Linguistic & Decision Assertiveness", score: p.linguistic_confidence, color: "from-amber-500 to-orange-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Visual Pillar Progress Infographic */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1 */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 p-5 text-white shadow-xl group hover:border-blue-500/50 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-blue-400">
              <Award className="w-4 h-4" />
              <span>Pilar 1: Hard Skills</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Bobot 30%
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-black text-white">{p.cv_hard_skills}</div>
            <div className="text-xs text-slate-400 font-semibold">
              Min: <strong className="text-slate-200">{minScore}</strong>
            </div>
          </div>

          <div className="mt-3 w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-1000 shadow-sm"
              style={{ width: `${Math.min(p.cv_hard_skills, 100)}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Status Kualifikasi:</span>
            <span className="font-bold text-emerald-400">✓ Memenuhi Syarat</span>
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 p-5 text-white shadow-xl group hover:border-indigo-500/50 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <BrainCircuit className="w-4 h-4" />
              <span>Pilar 2: Psikometri</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Bobot 30%
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-black text-white">{p.psychometric_cultural_fit}%</div>
            <div className="text-xs font-black text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-lg border border-indigo-500/30">
              {mbtiType}
            </div>
          </div>

          <div className="mt-3 w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-400 h-full rounded-full transition-all duration-1000 shadow-sm"
              style={{ width: `${p.psychometric_cultural_fit}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Anti-Faking:</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Sangat Jujur</span>
            </span>
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 p-5 text-white shadow-xl group hover:border-teal-500/50 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all" />
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-teal-400">
              <MessageSquareQuote className="w-4 h-4" />
              <span>Pilar 3: Wawancara AI</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
              Bobot 40%
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-black text-white">{p.interview_technical_competency}</div>
            <div className="text-xs text-slate-400 font-semibold">Skala 0 - 100</div>
          </div>

          <div className="mt-3 w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-1000 shadow-sm"
              style={{ width: `${p.interview_technical_competency}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Rekomendasi:</span>
            <span className="font-bold text-amber-300">Consider</span>
          </div>
        </div>

        {/* Pillar 4: Linguistic Confidence Speedometer */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 p-5 text-white shadow-xl group hover:border-amber-500/50 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Zap className="w-4 h-4" />
              <span>Keyakinan Linguistik</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Non-Biased
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-black text-white">{p.linguistic_confidence}%</div>
            <div className="text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-500/30">
              Cukup Yakin
            </div>
          </div>

          <div className="mt-3 w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-1000 shadow-sm"
              style={{ width: `${p.linguistic_confidence}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Asertivitas Solusi:</span>
            <span className="font-bold text-slate-200">75% Tinggi</span>
          </div>
        </div>
      </div>

      {/* 5-Dimension Competency Matrix Visualizer */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm font-bold text-white tracking-wide">
              Matriks Multi-Dimensi Profil Kompetensi & Keselarasan Peran
            </h4>
          </div>
          <span className="text-xs text-slate-400">Distribusi Skor Komparatif Berbasis AI</span>
        </div>

        <div className="space-y-3 pt-1">
          {dimensions.map((dim, idx) => (
            <div key={idx} className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">{dim.label}</span>
                <span className="font-black text-white">{dim.score} / 100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${dim.color} transition-all duration-1000 shadow-sm`}
                  style={{ width: `${dim.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
