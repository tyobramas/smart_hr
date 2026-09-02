import { ApplicationStatus } from "@/types/database";

export const SCREENING_BANDS = {
  REJECT_MAX: 50,   // 0-50   -> gagal
  REVIEW_MAX: 70,   // 51-70  -> tinjau manual
  PASS_MIN: 71,     // 71-100 -> lolos
} as const;

export type ScreeningOutcome = "rejected" | "manual_review" | "passed" | "unprocessed";

export interface ScreeningDecision {
  outcome: ScreeningOutcome;
  status: ApplicationStatus;
  label: string;
  effectivePassMin: number;
  canProceedToInterview: boolean;
}

const MIN_CV_TEXT_CHARS = 200;

export function classifyScreening(params: {
  score: number | null;
  aiSucceeded: boolean;
  cvTextLength: number;
  jobMinScoreThreshold?: number | null;
}): ScreeningDecision {
  const effectivePassMin = Math.max(
    SCREENING_BANDS.PASS_MIN,
    Number(params.jobMinScoreThreshold ?? 0)
  );

  const base = { effectivePassMin };

  // Pengaman 1: AI gagal -> jangan pernah menolak otomatis.
  if (!params.aiSucceeded || params.score == null) {
    return {
      ...base,
      outcome: "unprocessed",
      status: "pending",
      label: "Gagal diproses AI — perlu screening manual",
      canProceedToInterview: false,
    };
  }

  // Pengaman 2: ekstraksi CV kosong/gagal -> skor rendah kemungkinan
  // mencerminkan PDF hasil scan, bukan kualitas kandidat.
  if (params.cvTextLength < MIN_CV_TEXT_CHARS) {
    return {
      ...base,
      outcome: "unprocessed",
      status: "pending",
      label: "Teks CV tidak terbaca — perlu screening manual",
      canProceedToInterview: false,
    };
  }

  const s = Math.round(params.score);

  if (s <= SCREENING_BANDS.REJECT_MAX) {
    return {
      ...base,
      outcome: "rejected",
      status: "rejected",
      label: `Tidak memenuhi kualifikasi (${s}/100)`,
      canProceedToInterview: false,
    };
  }

  if (s < effectivePassMin) {
    return {
      ...base,
      outcome: "manual_review",
      status: "pending",
      label: `Perlu tinjauan recruiter (${s}/100)`,
      canProceedToInterview: false,
    };
  }

  return {
    ...base,
    outcome: "passed",
    status: "screened",
    label: `Lolos screening (${s}/100)`,
    canProceedToInterview: true,
  };
}
