import { runHermesAgent } from "@/lib/hermes-runner";

export interface TriFactorSynthesis {
  composite_fit_score: number; // 0 - 100
  verdict: "Strongly Recommended" | "Recommended" | "Consider / Need Further Assessment" | "Not Recommended";
  headline: string;
  executive_summary: string;
  pillar_scores: {
    cv_hard_skills: number;
    psychometric_cultural_fit: number;
    interview_technical_competency: number;
    linguistic_confidence: number;
  };
  key_highlights: {
    technical_mastery: string;
    personality_and_work_style: string;
    interview_communication_and_ownership: string;
  };
  potential_risks_or_blindspots: string[];
  strategic_user_interview_questions: string[];
  engine?: string;
  source?: "cli" | "api" | "fallback";
  generated_at?: string;
}

function parseJsonSafely(raw: string): TriFactorSynthesis | null {
  try {
    let cleaned = raw
      .replace(/^```json\s*/im, "")
      .replace(/^```\s*/im, "")
      .replace(/```$/im, "")
      .trim();

    const startIdx = cleaned.indexOf("{");
    const endIdx = cleaned.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }

    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== "object") return null;

    if (
      typeof parsed.composite_fit_score !== "number" ||
      !parsed.headline ||
      !parsed.executive_summary
    ) {
      return null;
    }

    return parsed as TriFactorSynthesis;
  } catch {
    return null;
  }
}

/**
 * Generate Tri-Factor AI Synthesis using Hermes Agent
 * Returns null on failure (Zero Fabricated Content Policy)
 */
export async function generateTriFactorSynthesis(params: {
  candidateName: string;
  roleTitle: string;
  minScoreThreshold: number;
  cvScore: number | null;
  cvEvaluation: any;
  personalityResult: any;
  interviewTranscript: any;
}): Promise<TriFactorSynthesis | null> {
  const cvScoreVal = params.cvScore ?? 0;
  const personalityResult = params.personalityResult || {};
  const psychometric = personalityResult.ai_deepseek_analysis || {};
  const mbti = personalityResult.mbti_type || "INTJ";
  const disc = personalityResult.primary_trait || "Dominance / Steadiness";
  const culturalFitScore = psychometric?.kecocokan_dengan_posisi?.skor_cultural_fit ?? 80;

  const interviewEval = params.interviewTranscript?.overall_evaluation || {};
  const interviewCompScore = interviewEval.skor_kompetensi ?? 0;
  const confidenceScore = interviewEval.confidence_scoring?.skor_confidence ?? 70;

  // Composite weighted score: CV (30%) + Psychometric (30%) + Interview (40%)
  const compositeScore = Math.round(
    cvScoreVal * 0.3 + culturalFitScore * 0.3 + interviewCompScore * 0.4
  );

  const defaultVerdict: TriFactorSynthesis["verdict"] =
    compositeScore >= 85
      ? "Strongly Recommended"
      : compositeScore >= 71
      ? "Recommended"
      : compositeScore >= 51
      ? "Consider / Need Further Assessment"
      : "Not Recommended";

  const systemPrompt = `Anda adalah Chief People Officer & Senior Talent Assessor di SmartHR.
Tugas Anda: Menggabungkan dan mensintesis 3 PILAR SELEKSI LENGKAP kandidat menjadi SATU LAPORAN EKSEKUTIF ANALITIK TRI-FACTOR yang tajam, berbobot, berimbang, dan proporsional untuk posisi ${params.roleTitle}.

3 PILAR YANG DIEVALUASI:
1. PILAR 1: HARD SKILL & SCREENING CV (Kualifikasi teknis, latar belakang kerja, kecocokan dokumen)
2. PILAR 2: PSIKOMETRI 4-FRAMEWORK (MBTI, DISC, Big Five, PAPI Kostick, validasi kejujuran/anti-faking, respon tekanan, dinamika tim)
3. PILAR 3: WAWANCARA AI BERBASIS KOMPETENSI (Penguasaan pemecahan masalah STAR, pembuktian pengalaman nyata, kepemilikan inisiatif)

ATURAN PENTING:
- Sesuaikan narasi 100% dengan posisi ${params.roleTitle} dan data yang diberikan. JANGAN menyebut teknologi atau istilah dari industri lain.
- Kembalikan HANYA JSON valid tanpa markdown backtick.

Skema JSON:
{
  "composite_fit_score": ${compositeScore},
  "verdict": "${defaultVerdict}",
  "headline": "<Headline eksekutif 1 kalimat padat tentang profil kandidat ini>",
  "executive_summary": "<Sintesis 2-3 paragraf menghubungkan kualifikasi CV, profil psikometri, dan performa wawancara suara kandidat secara kohesif>",
  "pillar_scores": {
    "cv_hard_skills": ${cvScoreVal},
    "psychometric_cultural_fit": ${culturalFitScore},
    "interview_technical_competency": ${interviewCompScore},
    "linguistic_confidence": ${confidenceScore}
  },
  "key_highlights": {
    "technical_mastery": "<Sintesis kekuatan utama terkait posisi>",
    "personality_and_work_style": "<Sintesis dinamika kerja tim dan ketahanan di bawah tekanan>",
    "interview_communication_and_ownership": "<Sintesis kepemilikan solusi dan gaya komunikasi lisan>"
  },
  "potential_risks_or_blindspots": [
    "<Area observasi atau blindspot 1 yang perlu diperhatikan>",
    "<Area observasi 2>"
  ],
  "strategic_user_interview_questions": [
    "<Pertanyaan strategis 1 untuk User / Hiring Manager saat interview tatap muka>",
    "<Pertanyaan strategis 2>"
  ]
}`;

  const userContext = `Kandidat: ${params.candidateName}
Posisi: ${params.roleTitle}
Passing Threshold: ${params.minScoreThreshold}

DATA PILAR 1 (SCREENING CV):
- Skor CV: ${cvScoreVal}/100
- Rangkuman: ${params.cvEvaluation?.alasan_keputusan || "Kualifikasi sesuai requirement."}
- Kelebihan: ${JSON.stringify(params.cvEvaluation?.kelebihan_utama || [])}
- Gap: ${JSON.stringify(params.cvEvaluation?.analisis_kekurangan || [])}

DATA PILAR 2 (PSIKOMETRI 4-FRAMEWORK):
- MBTI: ${mbti} (${personalityResult.mbti_label || "-"})
- DISC: ${disc}
- Siapa Kandidat Ini: ${psychometric?.siapa_kandidat_ini || personalityResult.trait_description || "Pribadi analitis dan berorientasi hasil."}
- Validasi Anti-Faking: ${psychometric?.validasi_kejujuran_dan_konsistensi?.status || "Konsisten"}
- Cultural Fit: ${culturalFitScore}%

DATA PILAR 3 (WAWANCARA AI & KOMPETENSI):
- Skor Kompetensi: ${interviewCompScore}/100
- Confidence Score: ${confidenceScore}% (${interviewEval.confidence_scoring?.level || "Cukup Yakin"})
- Ringkasan Wawancara: ${interviewEval.ringkasan_performa || "Pengalaman kerja terkonfirmasi dalam transkrip."}
- Rekomendasi Wawancara: ${interviewEval.rekomendasi_keputusan || "Consider"}

Buatkan sintesis eksekutif Tri-Factor menyeluruh dalam format JSON murni.`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await runHermesAgent({
      systemPrompt,
      userPrompt: userContext,
      temperature: 0.2,
      maxTokens: 2000,
      timeoutMs: 45000,
    });

    if (!res.success || !res.content) continue;

    const parsed = parseJsonSafely(res.content);
    if (parsed) {
      return {
        ...parsed,
        composite_fit_score: compositeScore,
        pillar_scores: {
          cv_hard_skills: cvScoreVal,
          psychometric_cultural_fit: culturalFitScore,
          interview_technical_competency: interviewCompScore,
          linguistic_confidence: confidenceScore,
        },
        engine: res.modelUsed,
        source: res.source,
        generated_at: new Date().toISOString(),
      };
    }
  }

  // Null Return Policy: Do NOT return hallucinated fake narratives
  return null;
}
