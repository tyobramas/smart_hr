import crypto from 'crypto';

interface LangflowScreeningParams {
  candidateName: string;
  jobTitle: string;
  jobRequirements?: string;
  cvStoragePath?: string;
  cvText?: string;
  additionalContext?: string;
}

interface LangflowScreeningResult {
  success: boolean;
  score: number | null;
  analysisText: string;
  analysisJson: Record<string, unknown> | null;
  parsedEvaluation?: {
    nama_kandidat?: string;
    status_kelayakan?: string;
    match_fit_score?: number;
    kelebihan_utama?: string[];
    analisis_kekurangan?: string[];
    alasan_keputusan?: string;
    rekomendasi_pertanyaan_interview?: string[];
    catatan_etika_ai?: string;
  } | null;
  error?: string;
}

/**
 * Helper to call Langflow API flow endpoint
 */
export async function runLangflowScreening({
  candidateName,
  jobTitle,
  jobRequirements,
  cvStoragePath,
  cvText,
  additionalContext,
}: LangflowScreeningParams): Promise<LangflowScreeningResult> {
  const apiUrl =
    process.env.LANGFLOW_API_URL ||
    'http://127.0.0.1:7860/api/v1/run/1e193d8d-6913-4adb-8ec6-2b43bea0c623';
  const apiKey =
    process.env.LANGFLOW_API_KEY ||
    '';

  // Construct structured evaluation prompt
  const promptInput = `
=== POSISI YANG DILAMAR ===
Judul Posisi: ${jobTitle}
Persyaratan & Kualifikasi Lowongan:
${jobRequirements || 'Tidak ada kualifikasi khusus'}

=== DOKUMEN CV KANDIDAT ===
Nama Kandidat: ${candidateName}
File CV Path: ${cvStoragePath || '-'}

ISI DOKUMEN CV:
${cvText && cvText.trim().length > 0 ? cvText.trim() : `Kandidat bernama ${candidateName} melamar untuk posisi ${jobTitle}.`}

${additionalContext ? `Catatan Tambahan: ${additionalContext}` : ''}
`.trim();

  const payload = {
    output_type: 'chat',
    input_type: 'chat',
    input_value: promptInput,
    session_id: crypto.randomUUID(),
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Langflow API error [${response.status}]: ${errText}`);
    }

    const data = await response.json();

    // Extract text output from Langflow response structure
    let extractedText = '';

    if (data?.outputs && Array.isArray(data.outputs)) {
      const firstOutput = data.outputs[0]?.outputs?.[0];
      if (firstOutput?.results?.message?.data?.text) {
        extractedText = firstOutput.results.message.data.text;
      } else if (firstOutput?.results?.message?.text) {
        extractedText = firstOutput.results.message.text;
      } else if (firstOutput?.artifacts?.message) {
        extractedText =
          typeof firstOutput.artifacts.message === 'string'
            ? firstOutput.artifacts.message
            : JSON.stringify(firstOutput.artifacts.message);
      } else if (firstOutput?.messages?.[0]?.message) {
        extractedText = firstOutput.messages[0].message;
      }
    }

    if (!extractedText && typeof data === 'object') {
      extractedText = JSON.stringify(data);
    }

    let parsedScore: number | null = null;
    let parsedEvaluation: any = null;

    // Try parsing JSON structure returned by LLM
    try {
      const jsonStart = extractedText.indexOf('[');
      const jsonEnd = extractedText.lastIndexOf(']');
      const objStart = extractedText.indexOf('{');
      const objEnd = extractedText.lastIndexOf('}');

      let jsonStr = '';
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonStr = extractedText.substring(jsonStart, jsonEnd + 1);
      } else if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
        jsonStr = extractedText.substring(objStart, objEnd + 1);
      }

      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        const evalObj = Array.isArray(parsed) ? parsed[0] : parsed;
        if (evalObj && typeof evalObj === 'object') {
          parsedEvaluation = evalObj;
          if (evalObj.match_fit_score !== undefined && evalObj.match_fit_score !== null) {
            const scoreNum = Number(evalObj.match_fit_score);
            if (!isNaN(scoreNum)) {
              parsedScore = scoreNum;
            }
          }
        }
      }
    } catch (parseErr) {
      console.warn('JSON parsing from Langflow text:', parseErr);
    }

    // Fallback regex score extraction
    if (parsedScore === null) {
      const scoreMatch =
        extractedText.match(/(?:match_fit_score|skor|score|nilai)\s*(?::|=|\s)\s*(\d{1,3}(?:\.\d+)?)/i) ||
        extractedText.match(/(\d{1,3})\s*\/\s*100/i);

      if (scoreMatch && scoreMatch[1]) {
        const num = parseFloat(scoreMatch[1]);
        if (num >= 0 && num <= 100) {
          parsedScore = num;
        }
      }
    }

    if (parsedScore === null) {
      parsedScore = 0;
    }

    let formattedSummary = extractedText;
    if (parsedEvaluation) {
      const statusText = parsedEvaluation.status_kelayakan || (parsedScore >= 70 ? 'QUALIFIED' : 'NOT_QUALIFIED');
      const alasan = parsedEvaluation.alasan_keputusan || '';
      const kelebihan = Array.isArray(parsedEvaluation.kelebihan_utama) && parsedEvaluation.kelebihan_utama.length > 0
        ? parsedEvaluation.kelebihan_utama.map((k: string) => `• ${k}`).join('\n')
        : '-';
      const kekurangan = Array.isArray(parsedEvaluation.analisis_kekurangan) && parsedEvaluation.analisis_kekurangan.length > 0
        ? parsedEvaluation.analisis_kekurangan.map((k: string) => `• ${k}`).join('\n')
        : '-';

      formattedSummary = `Status Kelayakan: ${statusText}\nSkor Kecocokan: ${parsedScore} / 100\n\nAlasan Penilaian:\n${alasan}\n\nKelebihan / Kecocokan:\n${kelebihan}\n\nKekurangan / Area Tidak Sesuai:\n${kekurangan}`;
    }

    return {
      success: true,
      score: parsedScore,
      analysisText: formattedSummary,
      parsedEvaluation,
      analysisJson: {
        raw_response: extractedText,
        evaluation: parsedEvaluation,
        evaluated_at: new Date().toISOString(),
        candidate: candidateName,
        job_title: jobTitle,
        estimated_score: parsedScore,
      },
    };
  } catch (error: any) {
    console.error('Langflow Integration Error:', error);
    return {
      success: false,
      score: 0,
      analysisText: `Evaluasi AI belum dapat diproses: ${error?.message || 'Koneksi ke Langflow terputus.'}`,
      analysisJson: null,
      error: error?.message || 'Gagal menghubungi Langflow API',
    };
  }
}
