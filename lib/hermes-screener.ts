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

function parseJsonSafely(raw: string): HermesScreeningEvaluation | null {
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
      typeof parsed.match_fit_score !== "number" ||
      parsed.match_fit_score < 0 ||
      parsed.match_fit_score > 100
    ) {
      return null;
    }

    if (
      typeof parsed.alasan_keputusan !== "string" ||
      parsed.alasan_keputusan.trim().length < 15
    ) {
      return null;
    }

    return {
      nama_kandidat: parsed.nama_kandidat,
      status_kelayakan: parsed.status_kelayakan,
      match_fit_score: Math.round(parsed.match_fit_score),
      kelebihan_utama: Array.isArray(parsed.kelebihan_utama) ? parsed.kelebihan_utama : [],
      analisis_kekurangan: Array.isArray(parsed.analisis_kekurangan) ? parsed.analisis_kekurangan : [],
      alasan_keputusan: parsed.alasan_keputusan,
      rekomendasi_pertanyaan_interview: Array.isArray(parsed.rekomendasi_pertanyaan_interview)
        ? parsed.rekomendasi_pertanyaan_interview
        : [],
      catatan_etika_ai: parsed.catatan_etika_ai,
    };
  } catch {
    return null;
  }
}

/**
 * Hermes AI Screener Engine (Local Hermes CLI + Router Failover + Hardened Validation)
 */
export async function runHermesCvScreening({
  candidateName,
  jobTitle,
  jobRequirements,
  cvStoragePath,
  cvText,
  additionalContext,
}: HermesScreeningParams): Promise<HermesScreeningResult> {
  const systemPrompt = `Anda adalah Hermes AI Recruitment Screener & Talent Evaluator di SmartHR.
Tugas Anda adalah melakukan audit dan evaluasi kritis, objektif, dan mendalam terhadap CV kandidat dibandingkan dengan persyaratan posisi pekerjaan.

ATURAN INTEGRITAS IDENTITAS & ANTI-FRAUD:
- Verifikasi keselarasan identitas: Periksa apakah isi berkas CV konsisten dengan nama kandidat pelamar "${candidateName}".
- Jika isi dokumen CV secara eksplisit terbukti milik orang lain yang berbeda jauh dari "${candidateName}" (indikasi pemalsuan berkas / joki CV), Anda WAJIB menetapkan: "status_kelayakan": "NOT_QUALIFIED", "match_fit_score": 0, dan cantumkan diskrepansi identitas pada "alasan_keputusan".

Wajib mengembalikan HANYA SATU JSON OBJEK VALID tanpa awalan kata, tanpa markdown backtick (\`\`\`json), dan tanpa komentar. 

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

  const userPrompt = `=== DETAIL LOWONGAN KERJA ===
Posisi: ${jobTitle}
Persyaratan & Kualifikasi:
${jobRequirements && jobRequirements.trim().length > 0 ? jobRequirements : "Kualifikasi umum sesuai standar industri."}

=== PROFIL DOKUMEN CV KANDIDAT ===
Nama: ${candidateName}
File Path: ${cvStoragePath || "-"}

KONTEN TEKS CV:
${cvText && cvText.trim().length > 0 ? cvText.trim() : `Kandidat bernama ${candidateName} melamar untuk posisi ${jobTitle}.`}

${additionalContext ? `Catatan Tambahan: ${additionalContext}` : ""}`.trim();

  // Retry loop: up to 2 attempts
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await runHermesAgent({
      systemPrompt:
        attempt === 0
          ? systemPrompt
          : `${systemPrompt}\n\nPERINGATAN: Output sebelumnya tidak valid. Pastikan mengembalikan JSON valid murni dengan field match_fit_score (0-100) dan alasan_keputusan.`,
      userPrompt,
      temperature: 0.2,
      timeoutMs: 90000,
    });

    if (!response.success || !response.content) {
      continue;
    }

    const parsed = parseJsonSafely(response.content);
    if (!parsed || parsed.match_fit_score === undefined) {
      console.warn(`[Hermes Screener] Parse JSON gagal pada attempt ${attempt + 1}`);
      continue;
    }

    const score = parsed.match_fit_score;
    const statusText =
      parsed.status_kelayakan || (score >= 71 ? "QUALIFIED" : "NOT_QUALIFIED");
    const alasan = parsed.alasan_keputusan || "-";
    const kelebihan =
      parsed.kelebihan_utama && parsed.kelebihan_utama.length > 0
        ? parsed.kelebihan_utama.map((k) => `• ${k}`).join("\n")
        : "-";
    const kekurangan =
      parsed.analisis_kekurangan && parsed.analisis_kekurangan.length > 0
        ? parsed.analisis_kekurangan.map((k) => `• ${k}`).join("\n")
        : "-";

    const formattedSummary = `Status Kelayakan: ${statusText}\nSkor Kecocokan: ${score} / 100\n\nAlasan Penilaian:\n${alasan}\n\nKelebihan / Kecocokan:\n${kelebihan}\n\nKekurangan / Gap Skill:\n${kekurangan}`;

    return {
      success: true,
      score,
      analysisText: formattedSummary,
      parsedEvaluation: parsed,
      analysisJson: {
        raw_response: response.content,
        evaluation: parsed,
        evaluated_at: new Date().toISOString(),
        candidate: candidateName,
        job_title: jobTitle,
        estimated_score: score,
        engine: response.modelUsed || "Hermes Agent",
        source: response.source,
      },
    };
  }

  // Strict Fail-Safe: JANGAN kembalikan skor default/karangan (seperti 75)
  return {
    success: false,
    score: null,
    analysisText: "Evaluasi AI tidak dapat diproses secara terstruktur oleh Hermes Agent.",
    analysisJson: null,
    parsedEvaluation: null,
    error: "Gagal memproses dan memvalidasi respon evaluasi CV Hermes.",
  };
}
