import { runHermesAgent } from "./hermes-runner";
import { CommunicationEventType } from "@/types/database";

export interface EmailContent {
  subject: string;
  body_html: string;
  body_text: string;
  internal_tone_notes: string;
  modelUsed?: string;
  durationMs: number;
}

export interface EmailContext {
  candidateName: string;
  candidateFirstName: string;
  jobTitle: string;
  jobLocation?: string;
  applicationId: string;
  applicationDate?: string;
  interviewDeadline?: string;
  appBaseUrl?: string;
}

const SYSTEM_PROMPT = `Kamu adalah Recruitment Communication Specialist profesional untuk platform SmartHR.
Tugas utamamu adalah menyusun email rekrutmen personal, hangat, dan bernada profesional untuk para kandidat dalam Bahasa Indonesia.

ATURAN WAJIB & KETAT:
1. Selalu gunakan Bahasa Indonesia yang baik, santun, dan profesional.
2. Selalu sapa kandidat dengan nama depan mereka secara personal.
3. Sebutkan posisi lowongan pekerjaan secara spesifik.
4. Berikan instruksi atau langkah selanjutnya (call to action) yang jelas.
5. JANGAN PERNAH menyertakan skor numerik, persentase nilai, atau evaluasi internal apapun (misal: "CV score 85/100").
6. JANGAN PERNAH menyertakan kode program, tag template yang belum terisi (seperti {variable}), atau teks teknis internal.
7. Untuk email penolakan: sampaikan dengan empati yang tulus, jelas, berterima kasih atas waktu mereka, dan doakan kesuksesan karier mereka.
8. Untuk email undangan/lolos: sampaikan dengan antusiasme yang membangun, berikan tenggat waktu dan tautan yang jelas.
9. Untuk pengingat (reminder): sampaikan dengan sopan namun jelas mengenai sisa batas waktu.
10. Format body_html harus berupa dokumen HTML bersih dengan inline CSS yang ramah email client (menggunakan container putih, font sans-serif, border halus, tombol tautan yang jelas).

FORMAT OUTPUT WAJIB:
Kembalikan HANYA dokumen JSON valid tanpa pembuka teks lain dengan format persis:
{
  "subject": "Subjek email (maksimal 80 karakter)",
  "body_html": "<div style=\\"...\\">...konten HTML lengkap...</div>",
  "body_text": "Versi teks biasa dari email...",
  "internal_tone_notes": "Catatan singkat tentang nada komunikasi"
}`;

function buildUserMessage(eventType: CommunicationEventType, ctx: EmailContext): string {
  const baseUrl = ctx.appBaseUrl || process.env.APP_BASE_URL || "http://localhost:3000";
  const appLink = `${baseUrl}/applications/${ctx.applicationId}`;
  const locationText = ctx.jobLocation ? ` di ${ctx.jobLocation}` : "";

  switch (eventType) {
    case "application_received":
      return `EVENT: application_received (Konfirmasi Penerimaan Lamaran)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
TANGGAL: ${ctx.applicationDate || "Hari ini"}
TAUTAN APLIKASI: ${appLink}

Instruksi: Tuliskan konfirmasi bahwa berkas lamaran telah berhasil diterima oleh sistem SmartHR. Sampaikan bahwa CV mereka sedang diproses dan ditinjau secara saksama.`;

    case "screening_passed":
      return `EVENT: screening_passed (Lolos Tahap Screening Berkas)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
TAUTAN TES: ${appLink}

Instruksi: Sampaikan kabar baik bahwa berkas lamaran kandidat berhasil memenuhi kualifikasi awal. Ajak kandidat untuk melanjutkan ke tahap berikutnya, yaitu asesmen kepribadian (personality assessment) melalui tautan aplikasi.`;

    case "screening_rejected":
      return `EVENT: screening_rejected (Tidak Lolos Screening Berkas)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}

Instruksi: Sampaikan dengan empati bahwa untuk saat ini kami belum dapat melanjutkan lamaran mereka ke tahap berikutnya karena persaingan yang ketat. Berikan apresiasi mendalam dan doakan kesuksesan pencarian kerja mereka. Jangan sertakan alasan teknis atau skor.`;

    case "screening_review":
      return `EVENT: screening_review (Lamaran Sedang Ditinjau Manual)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
TAUTAN STATUS: ${appLink}

Instruksi: Sampaikan bahwa profil mereka saat ini sedang dalam peninjauan mendalam oleh tim rekruter kami dan kami akan segera mengabari kembali perkembangan selanjutnya.`;

    case "personality_reminder":
      return `EVENT: personality_reminder (Pengingat Asesmen Kepribadian)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
TAUTAN ASESMEN: ${appLink}

Instruksi: Ingatkan kandidat secara ramah bahwa mereka belum menyelesaikan asesmen kepribadian untuk posisi ${ctx.jobTitle}. Tekankan pentingnya tahap ini agar proses rekrutmen dapat berlanjut.`;

    case "personality_completed":
      return `EVENT: personality_completed (Asesmen Kepribadian Berhasil Selesai)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
TAUTAN: ${appLink}

Instruksi: Ucapkan terima kasih dan selamat atas penyelesaian asesmen kepribadian. Sampaikan bahwa tim kami sedang meninjau hasilnya untuk penentuan langkah wawancara selanjutnya.`;

    case "interview_invitation":
      return `EVENT: interview_invitation (Undangan Wawancara AI)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
BATAS WAKTU: ${ctx.interviewDeadline || "Dalam 3 hari kerja"}
TAUTAN WAWANCARA: ${appLink}/interview

Instruksi: Sampaikan selamat karena kandidat diundang untuk sesi wawancara berbasis AI interaktif SmartHR. Jelaskan bahwa sesi dapat diakses fleksibel sebelum batas waktu dan berikan tips singkat (tempat tenang, koneksi stabil).`;

    case "interview_reminder_48h":
      return `EVENT: interview_reminder_48h (Pengingat Wawancara: 48 Jam Tersisa)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
BATAS WAKTU: ${ctx.interviewDeadline || "48 jam ke depan"}
TAUTAN: ${appLink}/interview

Instruksi: Ingatkan bahwa waktu penyelesaian wawancara tersisa 48 jam lagi. Dorong kandidat untuk meluangkan waktu sesegera mungkin.`;

    case "interview_reminder_24h":
      return `EVENT: interview_reminder_24h (Pengingat Penting: 24 Jam Terakhir)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
BATAS WAKTU: ${ctx.interviewDeadline || "24 jam ke depan"}
TAUTAN: ${appLink}/interview

Instruksi: Berikan pengingat mendesak namun tetap santun bahwa hari ini adalah hari terakhir untuk menyelesaikan sesi wawancara AI sebelum sesi ditutup otomatis.`;

    case "interview_completed":
      return `EVENT: interview_completed (Wawancara Selesai Dilakukan)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
TAUTAN: ${appLink}

Instruksi: Ucapkan apresiasi tinggi karena telah menyelesaikan seluruh rangkaian wawancara AI. Beritahu kandidat bahwa hasil wawancara sedang dianalisis secara komprehensif oleh tim rekruter.`;

    case "interview_expired":
      return `EVENT: interview_expired (Batas Waktu Wawancara Telah Berakhir)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}

Instruksi: Beritahukan dengan sopan bahwa jendela waktu wawancara telah berakhir dan status lamaran telah ditutup. Sampaikan jika ada kendala mendesak, kandidat dapat membalas email ini untuk konfirmasi.`;

    case "final_rejection":
      return `EVENT: final_rejection (Hasil Akhir: Belum Berhasil Lolos)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}

Instruksi: Sampaikan terima kasih yang sebesar-besarnya atas komitmen dan waktu yang diberikan selama proses asesmen dan wawancara. Beritahukan bahwa setelah pertimbangan matang, manajemen memutuskan untuk melanjutkan dengan kandidat lain. Doakan yang terbaik untuk perjalanan karier mereka.`;

    default:
      return `EVENT: ${eventType} untuk kandidat ${ctx.candidateName} posisi ${ctx.jobTitle}.`;
  }
}

function parseHermesResponse(raw: string): { subject: string; body_html: string; body_text: string; internal_tone_notes: string } {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Hermes response does not contain a JSON object.");
  }

  const jsonStr = jsonMatch[0];
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (initialErr) {
    // Sanitize unescaped newlines/tabs inside JSON strings if LLM produced them
    try {
      const sanitized = jsonStr
        .replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, "\\n")
        .replace(/(?<=:\s*"[^"]*)\r(?=[^"]*")/g, "\\r")
        .replace(/(?<=:\s*"[^"]*)\t(?=[^"]*")/g, "\\t");
      parsed = JSON.parse(sanitized);
    } catch {
      // Fallback: replace any unescaped control chars
      const sanitized2 = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => {
        if (c === "\n") return "\\n";
        if (c === "\r") return "\\r";
        if (c === "\t") return "\\t";
        return "";
      });
      parsed = JSON.parse(sanitized2);
    }
  }

  if (!parsed.subject || !parsed.body_html || !parsed.body_text) {
    throw new Error("Hermes JSON is missing required fields (subject, body_html, body_text).");
  }

  // Content safety validation
  if (parsed.subject.length > 100) {
    parsed.subject = parsed.subject.slice(0, 97) + "...";
  }

  // Guard against unparsed raw JSON leaks in body
  if (parsed.body_html.includes('{"') || parsed.body_html.includes('"score"')) {
    throw new Error("Hermes generated body contains internal JSON / score structures.");
  }

  return {
    subject: parsed.subject.trim(),
    body_html: parsed.body_html.trim(),
    body_text: parsed.body_text.trim(),
    internal_tone_notes: parsed.internal_tone_notes || "Normal",
  };
}

/**
 * Fallback template generator in case AI connection is unreachable
 */
function getFallbackContent(eventType: CommunicationEventType, ctx: EmailContext): { subject: string; body_html: string; body_text: string; internal_tone_notes: string } {
  const baseUrl = ctx.appBaseUrl || process.env.APP_BASE_URL || "http://localhost:3000";
  const appLink = `${baseUrl}/applications/${ctx.applicationId}`;

  const wrapHtml = (heading: string, message: string, buttonText?: string, buttonUrl?: string) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #1e1b4b; margin: 0; font-size: 20px;">SmartHR Recruitment</h2>
      </div>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">Halo <strong>${ctx.candidateFirstName}</strong>,</p>
      <h3 style="color: #0f172a; margin-top: 16px; font-size: 18px;">${heading}</h3>
      <p style="color: #475569; font-size: 15px; line-height: 1.6;">${message}</p>
      ${buttonText && buttonUrl ? `
        <div style="margin: 28px 0; text-align: center;">
          <a href="${buttonUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">${buttonText}</a>
        </div>
      ` : ""}
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.4;">Email ini dikirim secara otomatis oleh SmartHR untuk posisi <strong>${ctx.jobTitle}</strong>. Harap tidak membalas langsung ke alamat ini.</p>
    </div>
  `;

  switch (eventType) {
    case "application_received":
      return {
        subject: `Lamaran Diterima: ${ctx.jobTitle} - SmartHR`,
        body_html: wrapHtml(
          "Lamaran Anda Telah Berhasil Diterima",
          `Terima kasih telah melamar posisi <strong>${ctx.jobTitle}</strong>. Kami telah menerima berkas lamaran Anda dan saat ini tim kami sedang melakukan peninjauan awal. Anda dapat memantau status lamaran secara berkala melalui tautan di bawah ini.`,
          "Lihat Status Lamaran",
          appLink
        ),
        body_text: `Halo ${ctx.candidateFirstName},\n\nLamaran Anda untuk posisi ${ctx.jobTitle} telah berhasil kami terima. Kami akan mengabarkan perkembangan selanjutnya.\n\nLihat status: ${appLink}\n\nTim SmartHR`,
        internal_tone_notes: "Fallback template: application_received",
      };

    case "screening_passed":
      return {
        subject: `Kabar Baik: Lolos Screening Berkas ${ctx.jobTitle}`,
        body_html: wrapHtml(
          "Selamat! Anda Lolos Tahap Screening Awal",
          `Kami senang memberitahukan bahwa kualifikasi Anda untuk posisi <strong>${ctx.jobTitle}</strong> telah lolos tahap peninjauan awal. Langkah berikutnya adalah menyelesaikan asesmen kepribadian singkat kami.`,
          "Mulai Asesmen Kepribadian",
          appLink
        ),
        body_text: `Halo ${ctx.candidateFirstName},\n\nSelamat! Anda berhasil lolos tahap screening awal untuk posisi ${ctx.jobTitle}. Silakan lanjutkan ke asesmen kepribadian melalui: ${appLink}\n\nTim SmartHR`,
        internal_tone_notes: "Fallback template: screening_passed",
      };

    case "screening_rejected":
      return {
        subject: `Pembaruan Status Lamaran: ${ctx.jobTitle}`,
        body_html: wrapHtml(
          "Pembaruan Proses Rekrutmen",
          `Terima kasih atas minat dan waktu yang Anda luangkan untuk melamar posisi <strong>${ctx.jobTitle}</strong> di SmartHR. Setelah peninjauan saksama, saat ini kami memutuskan untuk melanjutkan proses dengan kandidat lain yang profilnya lebih mendekati kebutuhan spesifik kami saat ini. Kami mendoakan yang terbaik untuk perjalanan karier Anda ke depan.`,
        ),
        body_text: `Halo ${ctx.candidateFirstName},\n\nTerima kasih telah melamar posisi ${ctx.jobTitle}. Setelah peninjauan, kami memutuskan untuk melanjutkan proses dengan kandidat lain. Kami mendoakan kesuksesan karier Anda ke depan.\n\nTim SmartHR`,
        internal_tone_notes: "Fallback template: screening_rejected",
      };

    default:
      return {
        subject: `Pembaruan Lamaran: ${ctx.jobTitle} - SmartHR`,
        body_html: wrapHtml(
          "Informasi Terkait Lamaran Anda",
          `Terdapat pembaruan pada proses lamaran Anda untuk posisi <strong>${ctx.jobTitle}</strong>. Silakan kunjungi portal kandidat untuk melihat informasi selengkapnya.`,
          "Buka Portal Kandidat",
          appLink
        ),
        body_text: `Halo ${ctx.candidateFirstName},\n\nTerdapat pembaruan pada lamaran posisi ${ctx.jobTitle}. Kunjungi portal kandidat: ${appLink}\n\nTim SmartHR`,
        internal_tone_notes: "Fallback generic template",
      };
  }
}

/**
 * Generate personalized recruitment email content using Hermes Agent.
 */
export async function generateEmailContent(
  eventType: CommunicationEventType,
  context: EmailContext
): Promise<EmailContent> {
  const startTime = Date.now();
  const userMessage = buildUserMessage(eventType, context);

  try {
    const hermesResponse = await runHermesAgent({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: userMessage,
      temperature: 0.4,
      maxTokens: 2000,
    });

    const elapsed = Date.now() - startTime;

    if (hermesResponse.success && hermesResponse.content) {
      const parsed = parseHermesResponse(hermesResponse.content);
      return {
        ...parsed,
        modelUsed: hermesResponse.modelUsed || "hermes-agent",
        durationMs: elapsed,
      };
    } else {
      console.warn(`[HermesCommunicator] Hermes call failed or empty (${hermesResponse.error || "no content"}). Using fallback template.`);
      const fallback = getFallbackContent(eventType, context);
      return {
        ...fallback,
        modelUsed: "fallback-template",
        durationMs: elapsed,
      };
    }
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[HermesCommunicator] Exception during email generation (${error.message}). Using fallback template.`);
    const fallback = getFallbackContent(eventType, context);
    return {
      ...fallback,
      modelUsed: "fallback-template",
      durationMs: elapsed,
    };
  }
}
