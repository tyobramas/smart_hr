import { ApplicationStatus } from "@/types/database";
import { runHermesAgent } from "@/lib/hermes-runner";

interface HermesScreeningParams {
  candidateName: string;
  jobTitle: string;
  jobRequirements?: string;
  cvStoragePath?: string;
  cvText?: string;
  additionalContext?: string;
}

export interface HermesScreeningEvaluation {
  nama_kandidat?: string;
  status_kelayakan?: "QUALIFIED" | "NOT_QUALIFIED" | string;
  match_fit_score?: number;
  kelebihan_utama?: string[];
  analisis_kekurangan?: string[];
  alasan_keputusan?: string;
  rekomendasi_pertanyaan_interview?: string[];
  catatan_etika_ai?: string;
}

export interface HermesScreeningResult {
  success: boolean;
  score: number | null;
  analysisText: string;
  analysisJson: Record<string, unknown> | null;
  parsedEvaluation?: HermesScreeningEvaluation | null;
  error?: string;
}

/**
 * Hermes AI Screener Engine (Local Hermes CLI + Router Failover)
 */
export async function runHermesCvScreening({
  candidateName,
  jobTitle,
  jobRequirements,
  cvStoragePath,
  cvText,
  additionalContext,
}: HermesScreeningParams): Promise<HermesScreeningResult> {
  const systemPrompt = `Anda adalah Hermes AI Recruitment Screener & Talent Evaluator.
Tugas Anda adalah melakukan audit dan evaluasi kritis, objektif, dan mendalam terhadap CV kandidat dibandingkan dengan persyaratan posisi pekerjaan.

Wajib mengembalikan HANYA SATU JSON OBJEK VALID tanpa awalan kata, tanpa markdown wrapper (\`\`\`json), dan tanpa komentar. 

Skema JSON wajib persis seperti berikut:
{
  "nama_kandidat": "${candidateName}",
  "status_kelayakan": "QUALIFIED" atau "NOT_QUALIFIED",
  "match_fit_score": <angka integer 0 - 100>,
  "alasan_keputusan": "<analisis tajam 2-3 kalimat mengenai kecocokan profil>",
  "kelebihan_utama": [
    "<kelebihan spesifik 1 yang relevan dengan pekerjaan>",
    "<kelebihan spesifik 2>",
    "<kelebihan spesifik 3>"
  ],
  "analisis_kekurangan": [
    "<gap skill / pengalaman yang kurang 1>",
    "<gap skill 2>"
  ],
  "rekomendasi_pertanyaan_interview": [
    "<pertanyaan teknis/situasional 1 untuk menguji celah kandidat>",
    "<pertanyaan teknis/situasional 2>",
    "<pertanyaan teknis/situasional 3>"
  ],
  "catatan_etika_ai": "Evaluasi bebas bias gender/usia, fokus 100% pada kompetensi teknis dan portofolio."
}`;

  const userPrompt = `
=== DETAIL LOWONGAN KERJA ===
Posisi: ${jobTitle}
Persyaratan & Kualifikasi:
${jobRequirements && jobRequirements.trim().length > 0 ? jobRequirements : "Kualifikasi umum sesuai standar industri."}

=== PROFIL DOKUMEN CV KANDIDAT ===
Nama: ${candidateName}
File Path: ${cvStoragePath || "-"}

KONTEN TEKS CV:
${cvText && cvText.trim().length > 0 ? cvText.trim() : `Kandidat bernama ${candidateName} melamar untuk posisi ${jobTitle}.`}

${additionalContext ? `Catatan Tambahan: ${additionalContext}` : ""}
`.trim();

  const response = await runHermesAgent({
    systemPrompt,
    userPrompt,
    temperature: 0.2,
  });

  if (!response.success || !response.content) {
    return {
      success: false,
      score: 0,
      analysisText: `Evaluasi AI gagal: ${response.error || "Gagal memproses CV dengan Hermes Agent"}`,
      analysisJson: null,
      error: response.error || "Hermes Agent tidak merespons",
    };
  }

  const rawContent = response.content;

  // Robust JSON Parser
  let parsedEvaluation: HermesScreeningEvaluation | null = null;
  let score: number | null = null;

  try {
    let cleaned = rawContent
      .replace(/^```json\s*/im, "")
      .replace(/^```\s*/im, "")
      .replace(/```$/im, "")
      .trim();

    const startIdx = cleaned.indexOf("{");
    const endIdx = cleaned.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }

    parsedEvaluation = JSON.parse(cleaned);
    if (parsedEvaluation && typeof parsedEvaluation.match_fit_score === "number") {
      score = Math.min(100, Math.max(0, Math.round(parsedEvaluation.match_fit_score)));
    }
  } catch (parseErr) {
    console.warn("Hermes JSON parse failed, falling back to regex:", parseErr);

    const scoreMatch = rawContent.match(/(?:match_fit_score|skor|score|nilai)\s*(?::|=|\s)\s*(\d{1,3})/i);
    if (scoreMatch && scoreMatch[1]) {
      score = parseInt(scoreMatch[1], 10);
    }
  }

  if (score === null) {
    score = 75;
  }

  let formattedSummary = rawContent;
  if (parsedEvaluation) {
    const statusText =
      parsedEvaluation.status_kelayakan ||
      (score >= 70 ? "QUALIFIED" : "NOT_QUALIFIED");
    const alasan = parsedEvaluation.alasan_keputusan || "-";
    const kelebihan =
      Array.isArray(parsedEvaluation.kelebihan_utama) &&
      parsedEvaluation.kelebihan_utama.length > 0
        ? parsedEvaluation.kelebihan_utama.map((k) => `• ${k}`).join("\n")
        : "-";
    const kekurangan =
      Array.isArray(parsedEvaluation.analisis_kekurangan) &&
      parsedEvaluation.analisis_kekurangan.length > 0
        ? parsedEvaluation.analisis_kekurangan.map((k) => `• ${k}`).join("\n")
        : "-";

    formattedSummary = `Status Kelayakan: ${statusText}\nSkor Kecocokan: ${score} / 100\n\nAlasan Penilaian:\n${alasan}\n\nKelebihan / Kecocokan:\n${kelebihan}\n\nKekurangan / Gap Skill:\n${kekurangan}`;
  }

  return {
    success: true,
    score,
    analysisText: formattedSummary,
    parsedEvaluation,
    analysisJson: {
      raw_response: rawContent,
      evaluation: parsedEvaluation,
      evaluated_at: new Date().toISOString(),
      candidate: candidateName,
      job_title: jobTitle,
      estimated_score: score,
      engine: response.modelUsed || "Hermes Agent",
      source: response.source,
    },
  };
}
