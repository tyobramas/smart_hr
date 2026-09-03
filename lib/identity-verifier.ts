/**
 * Fast & Robust Candidate Identity Verification Guard
 * Checks whether the uploaded CV document matches the logged-in candidate profile name.
 * Prevents CV fraud, impersonation, and unauthorized proxy submissions.
 */

const COMMON_TITLES_AND_PREFIXES = new Set([
  "dr",
  "dra",
  "drs",
  "ir",
  "prof",
  "mr",
  "mrs",
  "ms",
  "skom",
  "st",
  "se",
  "ssi",
  "sh",
  "spd",
  "spsi",
  "ssos",
  "mkom",
  "mt",
  "mm",
  "msc",
  "mba",
  "phd",
  "bsc",
  "beng",
]);

/**
 * Clean and normalize a full name into a list of significant word tokens
 */
export function extractNameTokens(name: string): string[] {
  if (!name || typeof name !== "string") return [];

  return name
    .toLowerCase()
    .replace(/[.,\-_/\\()]/g, " ") // replace punctuation with spaces
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !COMMON_TITLES_AND_PREFIXES.has(t));
}

export interface IdentityVerificationResult {
  isMatch: boolean;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "MISMATCH";
  matchedTokens: string[];
  missingTokens: string[];
  matchRatio: number;
  reason?: string;
}

/**
 * Verify if the logged-in candidate's name is present in the extracted CV text content.
 * Executes deterministically in < 1 millisecond.
 */
export function verifyCvIdentity(
  candidateFullName: string,
  cvTextContent: string
): IdentityVerificationResult {
  // If CV text is empty or too short (< 40 chars), we cannot verify deterministically
  if (!cvTextContent || cvTextContent.trim().length < 40) {
    return {
      isMatch: true, // Let downstream screener / parsing inspect or reject for unreadable file
      confidence: "LOW",
      matchedTokens: [],
      missingTokens: [],
      matchRatio: 1,
    };
  }

  const normalizedCvText = cvTextContent
    .toLowerCase()
    .replace(/[.,\-_/\\()]/g, " ");

  const nameTokens = extractNameTokens(candidateFullName);

  if (nameTokens.length === 0) {
    return {
      isMatch: true,
      confidence: "MEDIUM",
      matchedTokens: [],
      missingTokens: [],
      matchRatio: 1,
    };
  }

  const matchedTokens: string[] = [];
  const missingTokens: string[] = [];

  for (const token of nameTokens) {
    // Check whole word or substring occurrence
    const regex = new RegExp(`\\b${token}\\b`, "i");
    if (regex.test(normalizedCvText)) {
      matchedTokens.push(token);
    } else {
      missingTokens.push(token);
    }
  }

  const matchRatio = matchedTokens.length / nameTokens.length;

  // Decision rule:
  // - If single-word name (e.g. "Budi"), must match 100%
  // - If multi-word name (e.g. "Budi Santoso"): at least 1 significant token (e.g. 50%+) must match
  // - If 0 tokens match (e.g. "Budi Santoso" vs CV of "Dimas Aditya Pratama"), it is a 100% MISMATCH
  let isMatch = false;
  let confidence: IdentityVerificationResult["confidence"] = "MISMATCH";

  if (nameTokens.length === 1) {
    isMatch = matchedTokens.length === 1;
    confidence = isMatch ? "HIGH" : "MISMATCH";
  } else {
    if (matchedTokens.length >= 2 || matchRatio >= 0.5) {
      isMatch = true;
      confidence = matchRatio === 1 ? "HIGH" : "MEDIUM";
    } else if (matchedTokens.length === 1 && nameTokens.length === 2 && nameTokens[0].length >= 4) {
      // e.g. "Budi" matched in "Budi Santoso"
      isMatch = true;
      confidence = "MEDIUM";
    } else {
      isMatch = false;
      confidence = "MISMATCH";
    }
  }

  return {
    isMatch,
    confidence,
    matchedTokens,
    missingTokens,
    matchRatio,
    reason: isMatch
      ? "Nama akun pelamar terkonfirmasi selaras dengan berkas CV."
      : `Nama pada dokumen CV tidak cocok dengan akun profil Anda (${candidateFullName}). Berkas teridentifikasi milik pihak lain.`,
  };
}
