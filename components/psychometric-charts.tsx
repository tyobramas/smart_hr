"use client";

import React from "react";
import {
  Flame,
  BrainCircuit,
  Activity,
  Compass,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
} from "lucide-react";

interface PsychometricChartsProps {
  scores: {
    dominance?: number;
    influence?: number;
    steadiness?: number;
    conscientiousness?: number;
    big_five_openness?: number;
    big_five_conscientiousness?: number;
    big_five_extraversion?: number;
    big_five_agreeableness?: number;
    big_five_emotional_stability?: number;
    papi_leadership?: number;
    papi_achievement?: number;
    papi_rule_compliance?: number;
    papi_sociability?: number;
    mbti_e_pct?: number;
    mbti_i_pct?: number;
    mbti_s_pct?: number;
    mbti_n_pct?: number;
    mbti_t_pct?: number;
    mbti_f_pct?: number;
    mbti_j_pct?: number;
    mbti_p_pct?: number;
  };
  mbtiType?: string;
  mbtiLabel?: string;
  primaryTrait?: string;
}

export function PsychometricCharts({
  scores,
  mbtiType = "INTJ",
  mbtiLabel = "The Mastermind Strategist",
  primaryTrait = "The Precision Analyst",
}: PsychometricChartsProps) {
  // 1. DISC Scores
  const d = scores.dominance ?? 70;
  const i = scores.influence ?? 60;
  const s = scores.steadiness ?? 75;
  const c = scores.conscientiousness ?? 85;

  // Compute points for DISC SVG Line Graph
  // ViewBox: width = 360, height = 160. Margin X = 45, Spacing = 90
  // Y: 100% -> y = 25, 0% -> y = 135. Formula: y = 135 - (val / 100) * 110
  const getY = (val: number) => Math.round(135 - (val / 100) * 110);
  const pD = { x: 45, y: getY(d) };
  const pI = { x: 135, y: getY(i) };
  const pS = { x: 225, y: getY(s) };
  const pC = { x: 315, y: getY(c) };

  // Smooth bezier path string
  const discLinePath = `M ${pD.x} ${pD.y} C ${(pD.x + pI.x) / 2} ${pD.y}, ${(pD.x + pI.x) / 2} ${pI.y}, ${pI.x} ${pI.y} C ${(pI.x + pS.x) / 2} ${pI.y}, ${(pI.x + pS.x) / 2} ${pS.y}, ${pS.x} ${pS.y} C ${(pS.x + pC.x) / 2} ${pS.y}, ${(pS.x + pC.x) / 2} ${pC.y}, ${pC.x} ${pC.y}`;
  const discAreaPath = `${discLinePath} L ${pC.x} 145 L ${pD.x} 145 Z`;

  // 2. Big Five OCEAN Scores
  const o = scores.big_five_openness ?? 85;
  const bfC = scores.big_five_conscientiousness ?? 90;
  const e = scores.big_five_extraversion ?? 65;
  const a = scores.big_five_agreeableness ?? 80;
  const es = scores.big_five_emotional_stability ?? 85;

  // Big Five Line Curve (5 points: x = 30, 95, 160, 225, 290)
  const pO = { x: 35, y: getY(o) };
  const pBfC = { x: 102, y: getY(bfC) };
  const pE = { x: 170, y: getY(e) };
  const pA = { x: 238, y: getY(a) };
  const pES = { x: 305, y: getY(es) };

  const bfLinePath = `M ${pO.x} ${pO.y} C ${(pO.x + pBfC.x) / 2} ${pO.y}, ${(pO.x + pBfC.x) / 2} ${pBfC.y}, ${pBfC.x} ${pBfC.y} C ${(pBfC.x + pE.x) / 2} ${pBfC.y}, ${(pBfC.x + pE.x) / 2} ${pE.y}, ${pE.x} ${pE.y} C ${(pE.x + pA.x) / 2} ${pE.y}, ${(pE.x + pA.x) / 2} ${pA.y}, ${pA.x} ${pA.y} C ${(pA.x + pES.x) / 2} ${pA.y}, ${(pA.x + pES.x) / 2} ${pES.y}, ${pES.x} ${pES.y}`;
  const bfAreaPath = `${bfLinePath} L ${pES.x} 145 L ${pO.x} 145 Z`;

  // 3. MBTI Dichotomy Breakdown
  const typeStr = (mbtiType || "INTJ").toUpperCase();
  const isE = typeStr.includes("E");
  const isS = typeStr.includes("S");
  const isT = typeStr.includes("T");
  const isJ = typeStr.includes("J");

  const mbtiDimensions = [
    {
      poleA: "Extraversion (E)",
      poleB: "Introversion (I)",
      pctA: isE ? 75 : 25,
      pctB: isE ? 25 : 75,
      active: isE ? "E" : "I",
      color: "bg-indigo-600",
    },
    {
      poleA: "Sensing (S)",
      poleB: "Intuition (N)",
      pctA: isS ? 70 : 30,
      pctB: isS ? 30 : 70,
      active: isS ? "S" : "N",
      color: "bg-blue-600",
    },
    {
      poleA: "Thinking (T)",
      poleB: "Feeling (F)",
      pctA: isT ? 85 : 15,
      pctB: isT ? 15 : 85,
      active: isT ? "T" : "F",
      color: "bg-emerald-600",
    },
    {
      poleA: "Judging (J)",
      poleB: "Perceiving (P)",
      pctA: isJ ? 80 : 20,
      pctB: isJ ? 20 : 80,
      active: isJ ? "J" : "P",
      color: "bg-purple-600",
    },
  ];

  // 4. PAPI Kostick Drives
  const papiData = [
    {
      name: "Leadership Drive",
      desc: "Dorongan Memimpin",
      val: scores.papi_leadership ?? 75,
      color: "text-indigo-600",
      bg: "bg-indigo-50 border-indigo-200",
      bar: "bg-indigo-600",
    },
    {
      name: "Achievement",
      desc: "Orientasi Target",
      val: scores.papi_achievement ?? 90,
      color: "text-rose-600",
      bg: "bg-rose-50 border-rose-200",
      bar: "bg-rose-600",
    },
    {
      name: "Rule Compliance",
      desc: "Kepatuhan Regulasi",
      val: scores.papi_rule_compliance ?? 95,
      color: "text-cyan-600",
      bg: "bg-cyan-50 border-cyan-200",
      bar: "bg-cyan-600",
    },
    {
      name: "Sociability",
      desc: "Integrasi Sosial",
      val: scores.papi_sociability ?? 70,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-200",
      bar: "bg-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 2x2 Grid for 4 Comprehensive Frameworks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ========================================================================= */}
        {/* FRAMEWORK 1: DISC BEHAVIORAL PROFILE - SMOOTH LINE GRAPH                  */}
        {/* ========================================================================= */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  1. DISC Profile (Line Graph)
                </h4>
                <p className="text-[10px] text-slate-400">
                  Kurva Gaya Perilaku & Interaksi Kerja
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              Dominan: {primaryTrait.split(" ")[1] || "Compliance"}
            </span>
          </div>

          {/* SVG Line Graph */}
          <div className="relative pt-1">
            <svg
              viewBox="0 0 360 170"
              className="w-full h-44 overflow-visible select-none"
            >
              <defs>
                <linearGradient id="discGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="25" y1="25" x2="335" y2="25" stroke="#f1f5f9" strokeWidth="1" />
              <text x="18" y="28" fill="#94a3b8" fontSize="8" textAnchor="end">100%</text>

              <line x1="25" y1="80" x2="335" y2="80" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
              <text x="18" y="83" fill="#64748b" fontSize="8" textAnchor="end">50%</text>

              <line x1="25" y1="135" x2="335" y2="135" stroke="#f1f5f9" strokeWidth="1" />
              <text x="18" y="138" fill="#94a3b8" fontSize="8" textAnchor="end">0%</text>

              {/* Vertical Guide Lines */}
              <line x1={pD.x} y1="25" x2={pD.x} y2="135" stroke="#f8fafc" strokeWidth="1" />
              <line x1={pI.x} y1="25" x2={pI.x} y2="135" stroke="#f8fafc" strokeWidth="1" />
              <line x1={pS.x} y1="25" x2={pS.x} y2="135" stroke="#f8fafc" strokeWidth="1" />
              <line x1={pC.x} y1="25" x2={pC.x} y2="135" stroke="#f8fafc" strokeWidth="1" />

              {/* Shaded Area Under Line */}
              <path d={discAreaPath} fill="url(#discGrad)" />

              {/* Primary Curve Line */}
              <path
                d={discLinePath}
                fill="none"
                stroke="#e11d48"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data Points & Score Badges */}
              {/* Point D */}
              <circle cx={pD.x} cy={pD.y} r="5.5" fill="#ffffff" stroke="#e11d48" strokeWidth="3" />
              <rect x={pD.x - 14} y={pD.y - 20} width="28" height="14" rx="4" fill="#e11d48" />
              <text x={pD.x} y={pD.y - 10} fill="#ffffff" fontSize="8.5" fontWeight="bold" textAnchor="middle">{d}%</text>

              {/* Point I */}
              <circle cx={pI.x} cy={pI.y} r="5.5" fill="#ffffff" stroke="#f59e0b" strokeWidth="3" />
              <rect x={pI.x - 14} y={pI.y - 20} width="28" height="14" rx="4" fill="#f59e0b" />
              <text x={pI.x} y={pI.y - 10} fill="#ffffff" fontSize="8.5" fontWeight="bold" textAnchor="middle">{i}%</text>

              {/* Point S */}
              <circle cx={pS.x} cy={pS.y} r="5.5" fill="#ffffff" stroke="#10b981" strokeWidth="3" />
              <rect x={pS.x - 14} y={pS.y - 20} width="28" height="14" rx="4" fill="#10b981" />
              <text x={pS.x} y={pS.y - 10} fill="#ffffff" fontSize="8.5" fontWeight="bold" textAnchor="middle">{s}%</text>

              {/* Point C */}
              <circle cx={pC.x} cy={pC.y} r="5.5" fill="#ffffff" stroke="#2563eb" strokeWidth="3" />
              <rect x={pC.x - 14} y={pC.y - 20} width="28" height="14" rx="4" fill="#2563eb" />
              <text x={pC.x} y={pC.y - 10} fill="#ffffff" fontSize="8.5" fontWeight="bold" textAnchor="middle">{c}%</text>

              {/* X Axis Labels */}
              <text x={pD.x} y="156" fill="#e11d48" fontSize="10.5" fontWeight="bold" textAnchor="middle">D (Dominance)</text>
              <text x={pI.x} y="156" fill="#d97706" fontSize="10.5" fontWeight="bold" textAnchor="middle">I (Influence)</text>
              <text x={pS.x} y="156" fill="#059669" fontSize="10.5" fontWeight="bold" textAnchor="middle">S (Steadiness)</text>
              <text x={pC.x} y="156" fill="#2563eb" fontSize="10.5" fontWeight="bold" textAnchor="middle">C (Compliance)</text>
            </svg>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FRAMEWORK 2: MBTI COGNITIVE SPECTRUM (DUAL-POLE SPECTRUM BAR)             */}
        {/* ========================================================================= */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  2. MBTI Cognitive Spectrum
                </h4>
                <p className="text-[10px] text-slate-400">
                  Preferensi Kognitif & Pengambilan Keputusan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded font-black text-xs tracking-wider">
                {typeStr}
              </span>
            </div>
          </div>

          {/* 4 Dichotomy Dual-Pole Center-Diverging Spectrum Bars */}
          <div className="space-y-3.5 pt-1">
            {mbtiDimensions.map((dim, idx) => {
              const isLeftDominant = dim.active === dim.poleA[0];
              const domPct = isLeftDominant ? dim.pctA : dim.pctB;

              return (
                <div key={idx} className="space-y-1.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  {/* Labels */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={isLeftDominant ? "font-black text-slate-900" : "text-slate-400 font-normal"}>
                        {dim.poleA}
                      </span>
                      {isLeftDominant && (
                        <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded font-black text-[10px]">
                          {dim.pctA}%
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isLeftDominant && (
                        <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded font-black text-[10px]">
                          {dim.pctB}%
                        </span>
                      )}
                      <span className={!isLeftDominant ? "font-black text-slate-900" : "text-slate-400 font-normal"}>
                        {dim.poleB}
                      </span>
                    </div>
                  </div>

                  {/* Dual-Pole Center-Diverging Track */}
                  <div className="grid grid-cols-2 gap-1 items-center">
                    {/* Left Track (Pole A) */}
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-l-full overflow-hidden flex justify-end">
                      {isLeftDominant ? (
                        <div
                          className={`h-full ${dim.color} rounded-l-full transition-all duration-500`}
                          style={{ width: `${dim.pctA}%` }}
                        />
                      ) : (
                        <div
                          className="h-full bg-slate-300 rounded-l-full opacity-40 transition-all duration-500"
                          style={{ width: `${dim.pctA}%` }}
                        />
                      )}
                    </div>

                    {/* Right Track (Pole B) */}
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-r-full overflow-hidden flex justify-start">
                      {!isLeftDominant ? (
                        <div
                          className={`h-full ${dim.color} rounded-r-full transition-all duration-500`}
                          style={{ width: `${dim.pctB}%` }}
                        />
                      ) : (
                        <div
                          className="h-full bg-slate-300 rounded-r-full opacity-40 transition-all duration-500"
                          style={{ width: `${dim.pctB}%` }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FRAMEWORK 3: BIG FIVE (OCEAN) - MULTI-POINT AREA CURVE                     */}
        {/* ========================================================================= */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  3. Big Five / OCEAN (Curve Graph)
                </h4>
                <p className="text-[10px] text-slate-400">
                  5 Dimensi Karakter Inti & Stabilitas Mental
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              5 Dimensi Inti
            </span>
          </div>

          {/* SVG Big Five Curve */}
          <div className="relative pt-1">
            <svg
              viewBox="0 0 340 170"
              className="w-full h-44 overflow-visible select-none"
            >
              <defs>
                <linearGradient id="bfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9333ea" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="25" x2="320" y2="25" stroke="#f1f5f9" strokeWidth="1" />
              <text x="14" y="28" fill="#94a3b8" fontSize="8" textAnchor="end">100%</text>

              <line x1="20" y1="80" x2="320" y2="80" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
              <text x="14" y="83" fill="#64748b" fontSize="8" textAnchor="end">50%</text>

              <line x1="20" y1="135" x2="320" y2="135" stroke="#f1f5f9" strokeWidth="1" />
              <text x="14" y="138" fill="#94a3b8" fontSize="8" textAnchor="end">0%</text>

              {/* Shaded Area */}
              <path d={bfAreaPath} fill="url(#bfGrad)" />

              {/* Curve Line */}
              <path
                d={bfLinePath}
                fill="none"
                stroke="#9333ea"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Points */}
              {/* O */}
              <circle cx={pO.x} cy={pO.y} r="5" fill="#ffffff" stroke="#9333ea" strokeWidth="3" />
              <text x={pO.x} y={pO.y - 10} fill="#9333ea" fontSize="8" fontWeight="bold" textAnchor="middle">{o}%</text>

              {/* C */}
              <circle cx={pBfC.x} cy={pBfC.y} r="5" fill="#ffffff" stroke="#2563eb" strokeWidth="3" />
              <text x={pBfC.x} y={pBfC.y - 10} fill="#2563eb" fontSize="8" fontWeight="bold" textAnchor="middle">{bfC}%</text>

              {/* E */}
              <circle cx={pE.x} cy={pE.y} r="5" fill="#ffffff" stroke="#f59e0b" strokeWidth="3" />
              <text x={pE.x} y={pE.y - 10} fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">{e}%</text>

              {/* A */}
              <circle cx={pA.x} cy={pA.y} r="5" fill="#ffffff" stroke="#10b981" strokeWidth="3" />
              <text x={pA.x} y={pA.y - 10} fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="middle">{a}%</text>

              {/* ES */}
              <circle cx={pES.x} cy={pES.y} r="5" fill="#ffffff" stroke="#0d9488" strokeWidth="3" />
              <text x={pES.x} y={pES.y - 10} fill="#0d9488" fontSize="8" fontWeight="bold" textAnchor="middle">{es}%</text>

              {/* X Labels */}
              <text x={pO.x} y="156" fill="#7c3aed" fontSize="9" fontWeight="bold" textAnchor="middle">Openness</text>
              <text x={pBfC.x} y="156" fill="#2563eb" fontSize="9" fontWeight="bold" textAnchor="middle">Conscient.</text>
              <text x={pE.x} y="156" fill="#d97706" fontSize="9" fontWeight="bold" textAnchor="middle">Extravers.</text>
              <text x={pA.x} y="156" fill="#059669" fontSize="9" fontWeight="bold" textAnchor="middle">Agreeable.</text>
              <text x={pES.x} y="156" fill="#0d9488" fontSize="9" fontWeight="bold" textAnchor="middle">Emot. Stab.</text>
            </svg>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FRAMEWORK 4: PAPI KOSTICK WORKPLACE DRIVES                                */}
        {/* ========================================================================= */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  4. PAPI Kostick Drives
                </h4>
                <p className="text-[10px] text-slate-400">
                  Motivasi Peran & Pola Eksekusi Pekerjaan
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              Forced-Choice
            </span>
          </div>

          {/* 4 Cards with Progress Bars */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {papiData.map((item, idx) => (
              <div key={idx} className={`p-3 rounded-xl border ${item.bg} space-y-1.5`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 truncate">
                    {item.name}
                  </span>
                  <span className={`text-xs font-black ${item.color}`}>
                    {item.val}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                  <div className={`h-full ${item.bar} rounded-full`} style={{ width: `${item.val}%` }} />
                </div>
                <div className="text-[9px] text-slate-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
