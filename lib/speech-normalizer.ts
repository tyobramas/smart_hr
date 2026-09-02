/**
 * Auto-correct common Indonesian Speech-to-Text phonetic mistranscriptions for tech & workplace terms
 */
export function normalizeSpeechTranscript(rawText: string, jobContext?: string): string {
  if (!rawText) return "";

  let cleaned = rawText;

  const dictionary: [RegExp, string][] = [
    [/\b(roh|ro|row)\s*sql\b/gi, "Raw SQL"],
    [/\bproof\s*(off?|of)\s*(konsep|concept)\b/gi, "Proof of Concept (PoC)"],
    [/\btrade\s*of\b/gi, "trade-off"],
    [/\b(kueri|query)\s*(bider|bild?er)\b/gi, "query builder"],
    [/\bintergritas\b/gi, "integritas"],
    [/\b(posgres|postgre|posgresql)\b/gi, "PostgreSQL"],
    [/\b(nek\s*je\s*es|next\s*js|nextjs)\b/gi, "Next.js"],
    [/\b(si\s*ai\s*si\s*di|ci\s*cd)\b/gi, "CI/CD"],
    [/\b(taim\s*out|time\s*out)\b/gi, "timeout"],
    [/\b(dibaging|di\s*baging|de\s*bugging)\b/gi, "debugging"],
    [/\b(rut\s*kos|root\s*kos|root\s*caus?e)\b/gi, "root cause"],
    [/\b(a\s*pe\s*i|a\s*pi|e\s*pi\s*ai)\b/gi, "API"],
    [/\b(kros|cross)\s*join\b/gi, "CROSS JOIN"],
    [/\bo\s*r\s*m\b/gi, "ORM"],
    [/\b(pull\s*rekues|pol\s*rekues|pull\s*request)\b/gi, "Pull Request (PR)"],
    [/\b(bac?k\s*end|beken)\b/gi, "backend"],
    [/\b(front\s*end|fronen)\b/gi, "frontend"],
    [/\b(full\s*stac?k|fulstek)\b/gi, "fullstack"],
    [/\b(kod\s*revi[ew]+|code\s*repiu)\b/gi, "code review"],
  ];

  for (const [regex, replacement] of dictionary) {
    cleaned = cleaned.replace(regex, replacement);
  }

  return cleaned.trim();
}
