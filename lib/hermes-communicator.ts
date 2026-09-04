import { runHermesAgent } from "./hermes-runner";
import { CommunicationEventType, CommunicationContext } from "@/types/database";

export interface EmailContent {
  subject: string;
  body_html: string;
  body_text: string;
  internal_tone_notes?: string;
  modelUsed?: string;
  durationMs: number;
  hermes_model: string;
  hermes_duration_ms: number;
  hermes_error?: string | null;
}

export type GeneratedEmailResult = EmailContent;

export type EmailContext = CommunicationContext;
export type { CommunicationContext };

function resolveDefaultActionUrl(eventType: CommunicationEventType, applicationId?: string, baseUrl?: string): string {
  const cleanBase = (baseUrl || "https://smarthr.my.id").replace(/\/+$/, "");
  const appId = applicationId || "test-app-uuid-12345";
  switch (eventType) {
    case "screening_passed":
    case "personality_reminder":
      return `${cleanBase}/applications/${appId}/personality-test`;

    case "interview_invitation":
    case "interview_reminder_48h":
    case "interview_reminder_24h":
      return `${cleanBase}/applications/${appId}/interview`;

    default:
      return `${cleanBase}/applications/${appId}`;
  }
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
10. JANGAN PERNAH memotong, mengubah, atau mengarang path URL. Gunakan ACTION_URL yang diberikan secara utuh dan persis pada link atau tombol Call-to-Action (CTA).
11. Format body_html harus berupa dokumen HTML bersih dengan inline CSS yang ramah email client (menggunakan container putih, font sans-serif, border halus, tombol tautan yang jelas).

FORMAT OUTPUT WAJIB:
Kembalikan HANYA dokumen JSON valid tanpa pembuka teks lain dengan format persis:
{
  "subject": "Subjek email (maksimal 80 karakter)",
  "body_html": "<div style=\\"...\\">...konten HTML lengkap...</div>",
  "body_text": "Versi teks biasa dari email...",
  "internal_tone_notes": "Catatan singkat tentang nada komunikasi"
}`;

function buildUserMessage(eventType: CommunicationEventType, ctx: EmailContext): string {
  const baseUrl = (ctx.appBaseUrl || process.env.APP_BASE_URL || "https://smarthr.my.id").replace(/\/+$/, "");
  const actionUrl = ctx.actionUrl || resolveDefaultActionUrl(eventType, ctx.applicationId, baseUrl);
  const locationText = ctx.jobLocation ? ` di ${ctx.jobLocation}` : "";

  const linkInstruction = `ACTION_URL: ${actionUrl}
Instruksi Khusus Tautan: Gunakan ACTION_URL ini secara persis pada tombol Call-to-Action (CTA) atau hyperlink di badan email: ${actionUrl}`;

  switch (eventType) {
    case "application_received":
      return `EVENT: application_received (Konfirmasi Penerimaan Lamaran)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
TANGGAL: ${ctx.applicationDate || "Hari ini"}
${linkInstruction}

Instruksi: Tuliskan konfirmasi bahwa berkas lamaran telah berhasil diterima oleh sistem SmartHR. Sampaikan bahwa CV mereka sedang diproses dan ditinjau secara saksama. Berikan tombol/tautan CTA menggunakan ACTION_URL untuk melihat status lamaran.`;

    case "screening_passed":
      return `EVENT: screening_passed (Lolos Tahap Screening Berkas)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
${linkInstruction}

Instruksi: Sampaikan kabar baik bahwa berkas lamaran kandidat berhasil memenuhi kualifikasi awal. Ajak kandidat untuk melanjutkan ke tahap berikutnya, yaitu asesmen kepribadian (personality assessment). WAJIB sertakan tombol Call-to-Action "Mulai Asesmen Kepribadian" dengan tautan persis ke ACTION_URL: ${actionUrl}.`;

    case "screening_rejected":
      return `EVENT: screening_rejected (Tidak Lolos Screening Berkas)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}

Instruksi: Sampaikan dengan empati bahwa untuk saat ini kami belum dapat melanjutkan lamaran mereka ke tahap berikutnya karena persaingan yang ketat. Berikan apresiasi mendalam dan doakan kesuksesan pencarian kerja mereka. Jangan sertakan alasan teknis atau skor.`;

    case "screening_review":
      return `EVENT: screening_review (Lamaran Sedang Ditinjau Manual)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
${linkInstruction}

Instruksi: Sampaikan bahwa profil mereka saat ini sedang dalam peninjauan mendalam oleh tim rekruter kami dan kami akan segera mengabari kembali perkembangan selanjutnya. Berikan tombol/tautan CTA menggunakan ACTION_URL.`;

    case "personality_reminder":
      return `EVENT: personality_reminder (Pengingat Asesmen Kepribadian)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
${linkInstruction}

Instruksi: Ingatkan kandidat secara ramah bahwa mereka belum menyelesaikan asesmen kepribadian untuk posisi ${ctx.jobTitle}. Tekankan pentingnya tahap ini agar proses rekrutmen dapat berlanjut. WAJIB sertakan tombol Call-to-Action "Lanjutkan Asesmen Kepribadian" dengan tautan persis ke ACTION_URL: ${actionUrl}.`;

    case "personality_completed":
      return `EVENT: personality_completed (Asesmen Kepribadian Berhasil Selesai)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
${linkInstruction}

Instruksi: Ucapkan terima kasih dan selamat atas penyelesaian asesmen kepribadian. Sampaikan bahwa tim kami sedang meninjau hasilnya untuk penentuan langkah wawancara selanjutnya. Berikan tombol/tautan CTA menggunakan ACTION_URL untuk melihat status lamaran.`;

    case "interview_invitation":
      return `EVENT: interview_invitation (Undangan Wawancara AI)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
BATAS WAKTU: ${ctx.interviewDeadline || "Dalam 3 hari kerja"}
${linkInstruction}

Instruksi: Sampaikan selamat karena kandidat diundang untuk sesi wawancara berbasis AI interaktif SmartHR. Jelaskan bahwa sesi dapat diakses fleksibel sebelum batas waktu dan berikan tips singkat (tempat tenang, koneksi stabil). WAJIB sertakan tombol Call-to-Action "Mulai Wawancara AI" dengan tautan persis ke ACTION_URL: ${actionUrl}.`;

    case "interview_reminder_48h":
      return `EVENT: interview_reminder_48h (Pengingat Wawancara: 48 Jam Tersisa)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
BATAS WAKTU: ${ctx.interviewDeadline || "48 jam ke depan"}
${linkInstruction}

Instruksi: Ingatkan bahwa waktu penyelesaian wawancara tersisa 48 jam lagi. Dorong kandidat untuk meluangkan waktu sesegera mungkin dengan tombol Call-to-Action yang mengarah persis ke ACTION_URL: ${actionUrl}.`;

    case "interview_reminder_24h":
      return `EVENT: interview_reminder_24h (Pengingat Penting: 24 Jam Terakhir)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
BATAS WAKTU: ${ctx.interviewDeadline || "24 jam ke depan"}
${linkInstruction}

Instruksi: Berikan pengingat mendesak namun tetap santun bahwa hari ini adalah hari terakhir untuk menyelesaikan sesi wawancara AI sebelum sesi ditutup otomatis. Gunakan tombol Call-to-Action yang mengarah persis ke ACTION_URL: ${actionUrl}.`;

    case "interview_completed":
      return `EVENT: interview_completed (Wawancara Selesai Dilakukan)
KANDIDAT: ${ctx.candidateName} (Nama Depan: ${ctx.candidateFirstName})
POSISI: ${ctx.jobTitle}${locationText}
${linkInstruction}

Instruksi: Ucapkan apresiasi tinggi karena telah menyelesaikan seluruh rangkaian wawancara AI. Beritahu kandidat bahwa hasil wawancara sedang dianalisis secara komprehensif oleh tim rekruter. Berikan tautan CTA ke ACTION_URL.`;

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
      return `EVENT: ${eventType} untuk kandidat ${ctx.candidateName} posisi ${ctx.jobTitle}. ${linkInstruction}`;
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
    try {
      const sanitized = jsonStr
        .replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, "\\n")
        .replace(/(?<=:\s*"[^"]*)\r(?=[^"]*")/g, "\\r")
        .replace(/(?<=:\s*"[^"]*)\t(?=[^"]*")/g, "\\t");
      parsed = JSON.parse(sanitized);
    } catch {
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

  if (parsed.subject.length > 100) {
    parsed.subject = parsed.subject.slice(0, 97) + "...";
  }

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
  const baseUrl = (ctx.appBaseUrl || process.env.APP_BASE_URL || "https://smarthr.my.id").replace(/\/+$/, "");
  const actionUrl = ctx.actionUrl || resolveDefaultActionUrl(eventType, ctx.applicationId, baseUrl);

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
          actionUrl
        ),
        body_text: `Halo ${ctx.candidateFirstName},\n\nLamaran Anda untuk posisi ${ctx.jobTitle} telah berhasil kami terima. Kami akan mengabarkan perkembangan selanjutnya.\n\nLihat status: ${actionUrl}\n\nTim SmartHR`,
        internal_tone_notes: "Fallback template: application_received",
      };

    case "screening_passed":
      return {
        subject: `Kabar Baik: Lolos Screening Berkas ${ctx.jobTitle}`,
        body_html: wrapHtml(
          "Selamat! Anda Lolos Tahap Screening Awal",
          `Kami senang memberitahukan bahwa kualifikasi Anda untuk posisi <strong>${ctx.jobTitle}</strong> telah lolos tahap peninjauan awal. Langkah berikutnya adalah menyelesaikan asesmen kepribadian singkat kami.`,
          "Mulai Asesmen Kepribadian",
          actionUrl
        ),
        body_text: `Halo ${ctx.candidateFirstName},\n\nSelamat! Anda berhasil lolos tahap screening awal untuk posisi ${ctx.jobTitle}. Silakan lanjutkan ke asesmen kepribadian melalui: ${actionUrl}\n\nTim SmartHR`,
        internal_tone_notes: "Fallback template: screening_passed",
      };

    case "screening_rejected":
      return {
        subject: `Pembaruan Status Lamaran: ${ctx.jobTitle}`,
        body_html: wrapHtml(
          "Pembaruan Proses Rekrutmen",
          `Terima kasih atas minat dan waktu yang Anda luangkan untuk melamar posisi <strong>${ctx.jobTitle}</strong> di SmartHR. Setelah peninjauan saksama, saat ini kami memutuskan untuk melanjutkan proses dengan kandidat lain yang profilnya lebih mendekati kebutuhan spesifik kami saat ini. Kami mendoakan yang terbaik untuk perjalanan karier Anda ke depan.`
        ),
        body_text: `Halo ${ctx.candidateFirstName},\n\nTerima kasih telah melamar posisi ${ctx.jobTitle}. Setelah peninjauan, kami memutuskan untuk melanjutkan proses dengan kandidat lain. Kami mendoakan kesuksesan karier Anda ke depan.\n\nTim SmartHR`,
        internal_tone_notes: "Fallback template: screening_rejected",
      };

    case "screening_review":
      return {
        subject: `Lamaran Sedang Ditinjau: ${ctx.jobTitle}`,
        body_html: wrapHtml(
          "Lamaran Anda Sedang Ditinjau Tim Rekruter",
          `Terima kasih telah melamar posisi <strong>${ctx.jobTitle}</strong>. Berkas lamaran Anda saat ini sedang dalam peninjauan mendalam oleh tim rekruter kami. Kami akan mengabari kembali perkembangan selanjutnya.`,
          "Lihat Status Lamaran",
          actionUrl
        ),
        body_text: `Halo ${ctx.candidateFirstName},\n\nLamaran Anda untuk posisi ${ctx.jobTitle} sedang ditinjau mendalam oleh tim rekruter kami.\n\nPantau status: ${actionUrl}\n\nTim SmartHR`,
        internal_tone_notes: "Fallback template: screening_review",
      };

    case "personality_reminder":
      return {
        subject: `Pengingat: Asesmen Kepribadian ${ctx.jobTitle}`,
        body_html: wrapHtml(
          "Pengingat: Selesaikan Asesmen Kepribadian Anda",
          `Kami mengingatkan bahwa Anda belum menyelesaikan asesmen kepribadian untuk posisi <strong>${ctx.jobTitle}</strong>. Tahap ini sangat penting agar kami dapat melanjutkan proses lamaran Anda ke tahap berikutnya.`,
          "Lanjutkan Asesmen Kepribadian",
          actionUrl
        ),
        body_text: `Halo ${ctx.candidateFirstName},\n\nJangan lupa untuk menyelesaikan asesmen kepribadian posisi ${ctx.jobTitle}.\n\nAkses di: ${actionUrl}\n\nTim SmartHR`,
        internal_tone_notes: "Fallback template: personality_reminder",
      };

    case "personality_completed":
      return {
        subject: `Konfirmasi: Asesmen Kepribadian Selesai - ${ctx.jobTitle}`,
        body_html: wrapHtml(
          "Asesmen Kepribadian Berhasil Diselesaikan",
          `Terima kasih telah menyelesaikan asesmen kepribadian untuk posisi <strong>${ctx.jobTitle}</strong>. Tim kami sedang meninjau profil Anda untuk penjadwalan tahap wawancara selanjutnya.`,
          "Lihat Status Lamaran",
          actionUrl
        ),
        body_text: `Halo ${ctx.candidateFirstName},\n\nAsesmen kepribadian Anda untuk posisi ${ctx.jobTitle} telah kami terima. Kami akan mengabari perkembangan berikutnya.\n\nStatus: ${actionUrl}\n\nTim SmartHR`,
        internal_tone_notes: "Fallback template: personality_completed",
      };

    case "interview_invitation":
      return {
        subject: `Undangan Wawancara AI: ${ctx.jobTitle} - SmartHR`,
        body_html: wrapHtml(
          "Undangan Sesi Wawancara AI SmartHR",
          `Selamat! Anda diundang untuk mengikuti sesi wawancara berbasis AI interaktif untuk posisi <strong>${ctx.jobTitle}</strong>. Sesi ini dapat Anda akses secara fleksibel sebelum batas waktu yang ditentukan (${ctx.interviewDeadline || "3 hari kerja"}). Pastikan Anda berada di tempat yang tenang dengan koneksi internet stabil.`,
          "Mulai Wawancara AI",
          actionUrl
        ),
        body_text: `Halo ${ctx.candidateFirstName},\n\nSelamat! Anda diundang untuk sesi wawancara AI posisi ${ctx.jobTitle}. Batas waktu: ${ctx.interviewDeadline || "3 hari kerja"}.\n\nMulai wawancara: ${actionUrl}\n\nTim SmartHR`,
        internal_tone_notes: "Fallback template: interview_invitation",
      };

    case "interview_reminder_48h":
      return {
        subject: `Pengingat (48 Jam Tersisa): Wawancara AI ${ctx.jobTitle}`,
        body_html: wrapHtml(
          "Pengingat: 48 Jam Tersisa untuk Wawancara AI",
          `Waktu penyelesaian sesi wawancara AI Anda untuk posisi <strong>${ctx.jobTitle}</strong> tersisa 48 jam lagi (${ctx.interviewDeadline || "segera"}). Silakan luangkan waktu sekitar 15-20 menit untuk menyelesaikannya.`,
          "Mulai Wawancara AI",
          actionUrl
        ),
        body_text: `Halo ${ctx.candidateFirstName},\n\nWawancara AI posisi ${ctx.jobTitle} tersisa 48 jam lagi (${ctx.interviewDeadline || "segera"}).\n\nMulai: ${actionUrl}\n\nTim SmartHR`,
        internal_tone_notes: "Fallback template: interview_reminder_48h",
      };

    case "interview_reminder_24h":
      return {
        subject: `PENTING: 24 Jam Terakhir untuk Wawancara AI ${ctx.jobTitle}`,
        body_html: wrapHtml(
          "PENTING: 24 Jam Terakhir untuk Wawancara AI",
          `Hari ini adalah hari terakhir untuk menyelesaikan sesi wawancara AI posisi <strong>${ctx.jobTitle}</strong> (${ctx.interviewDeadline || "hari ini"}). Sesi akan ditutup otomatis setelah batas waktu terlewati.`,
          "Mulai Wawancara Sekarang",
          actionUrl
        ),
        body_text: `Halo ${ctx.candidateFirstName},\n\nHari ini adalah hari terakhir wawancara AI posisi ${ctx.jobTitle}.\n\nAkses segera: ${actionUrl}\n\nTim SmartHR`,
        internal_tone_notes: "Fallback template: interview_reminder_24h",
      };

    case "interview_completed":
      return {
        subject: `Konfirmasi: Wawancara AI Selesai - ${ctx.jobTitle}`,
        body_html: wrapHtml(
          "Terima Kasih Telah Menyelesaikan Wawancara AI",
          `Terima kasih banyak atas waktu dan partisipasi Anda dalam sesi wawancara AI untuk posisi <strong>${ctx.jobTitle}</strong>. Tim rekruter kami saat ini sedang meninjau transkrip dan analisis wawancara Anda secara menyeluruh.`,
          "Pantau Status Lamaran",
          actionUrl
        ),
        body_text: `Halo ${ctx.candidateFirstName},\n\nTerima kasih telah menyelesaikan wawancara AI posisi ${ctx.jobTitle}. Tim kami sedang meninjau hasilnya.\n\nPantau status: ${actionUrl}\n\nTim SmartHR`,
        internal_tone_notes: "Fallback template: interview_completed",
      };

    case "interview_expired":
      return {
        subject: `Pemberitahuan: Batas Waktu Wawancara Telah Berakhir - ${ctx.jobTitle}`,
        body_html: wrapHtml(
          "Batas Waktu Wawancara Telah Berakhir",
          `Kami menginformasikan bahwa batas waktu pengerjaan wawancara AI untuk posisi <strong>${ctx.jobTitle}</strong> telah berakhir, sehingga status lamaran Anda telah ditutup otomatis. Jika terdapat kendala mendesak, silakan hubungi tim rekrutmen kami.`
        ),
        body_text: `Halo ${ctx.candidateFirstName},\n\nBatas waktu wawancara AI posisi ${ctx.jobTitle} telah berakhir dan status lamaran telah ditutup.\n\nTim SmartHR`,
        internal_tone_notes: "Fallback template: interview_expired",
      };

    case "final_rejection":
      return {
        subject: `Pembaruan Hasil Seleksi: ${ctx.jobTitle}`,
        body_html: wrapHtml(
          "Pembaruan Hasil Seleksi Akhir",
          `Terima kasih atas seluruh waktu, dedikasi, dan usaha yang Anda berikan dalam rangkaian rekrutmen posisi <strong>${ctx.jobTitle}</strong>. Setelah pertimbangan mendalam dari seluruh tahapan seleksi, saat ini kami memutuskan untuk melanjutkan proses dengan kandidat lain. Kami sangat menghargai minat Anda dan mendoakan kesuksesan terbaik dalam perjalanan karier Anda ke depan.`
        ),
        body_text: `Halo ${ctx.candidateFirstName},\n\nTerima kasih atas partisipasi Anda dalam seleksi posisi ${ctx.jobTitle}. Kami memutuskan untuk melanjutkan proses dengan kandidat lain. Sukses selalu untuk karier Anda ke depan.\n\nTim SmartHR`,
        internal_tone_notes: "Fallback template: final_rejection",
      };

    default:
      return {
        subject: `Pembaruan Lamaran: ${ctx.jobTitle} - SmartHR`,
        body_html: wrapHtml(
          "Informasi Terkait Lamaran Anda",
          `Terdapat pembaruan pada proses lamaran Anda untuk posisi <strong>${ctx.jobTitle}</strong>. Silakan kunjungi portal kandidat untuk melihat informasi selengkapnya.`,
          "Buka Portal Kandidat",
          actionUrl
        ),
        body_text: `Halo ${ctx.candidateFirstName},\n\nTerdapat pembaruan pada lamaran posisi ${ctx.jobTitle}. Kunjungi portal kandidat: ${actionUrl}\n\nTim SmartHR`,
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
      maxTokens: 1000,
      modelOverride: "mistral-medium-3-5",
      timeoutMs: 300000, // 5 minutes timeout
    });

    const elapsed = Date.now() - startTime;

    if (hermesResponse.success && hermesResponse.content) {
      const parsed = parseHermesResponse(hermesResponse.content);
      const modelName = hermesResponse.modelUsed || "mistral-medium-3-5";
      return {
        ...parsed,
        modelUsed: modelName,
        durationMs: elapsed,
        hermes_model: modelName,
        hermes_duration_ms: elapsed,
        hermes_error: null,
      };
    } else {
      const errMsg = hermesResponse.error || "No content returned from Hermes Agent";
      console.error("[HermesCommunicator] Error generating email via Hermes:", errMsg);
      const fallback = getFallbackContent(eventType, context);
      return {
        ...fallback,
        modelUsed: "fallback-template",
        durationMs: elapsed,
        hermes_model: "fallback-template",
        hermes_duration_ms: elapsed,
        hermes_error: errMsg,
      };
    }
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error("[HermesCommunicator] Error generating email via Hermes:", error);
    const fallback = getFallbackContent(eventType, context);
    return {
      ...fallback,
      modelUsed: "fallback-template",
      durationMs: elapsed,
      hermes_model: "fallback-template",
      hermes_duration_ms: elapsed,
      hermes_error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Strips HTML tags and normalizes styling into WhatsApp markdown (*bold*, _italic_).
 */
function cleanWhatsAppText(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "*$1*")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "*$1*")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "_$1_")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "_$1_")
    .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "$2: $1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Clean fallback plain-text templates for WhatsApp notifications without any HTML tags.
 */
function getWhatsAppFallbackContent(eventType: CommunicationEventType, ctx: CommunicationContext): string {
  const baseUrl = ctx.appBaseUrl || "https://smarthr.my.id";
  const appId = ctx.applicationId || "test-app-uuid-12345";
  const actionUrl = ctx.actionUrl || resolveDefaultActionUrl(eventType, appId, baseUrl);
  const name = ctx.candidateFirstName || ctx.candidateName.trim().split(/\s+/)[0] || "Kandidat";
  const job = ctx.jobTitle;

  switch (eventType) {
    case "application_received":
      return `Halo *${name}*, 👋\n\nTerima kasih telah melamar posisi *${job}* di *SmartHR*. Berkas Anda telah berhasil kami terima dan saat ini sedang dalam proses peninjauan oleh tim rekrutmen.\n\nPantau status lamaran Anda di:\n${actionUrl}\n\nSalam hangat,\n*Tim Rekrutmen SmartHR*`;

    case "screening_passed":
      return `Halo *${name}*, 🎉\n\nSelamat! Berkas lamaran Anda untuk posisi *${job}* telah *lolos tahap screening awal*.\n\nLangkah berikutnya adalah menyelesaikan *Asesmen Kepribadian* (~20 menit). Silakan mulai melalui tautan berikut:\n👉 ${actionUrl}\n\nSemoga sukses!\n*Tim Rekrutmen SmartHR*`;

    case "screening_rejected":
      return `Halo *${name}*,\n\nTerima kasih atas minat Anda melamar posisi *${job}* di *SmartHR*.\n\nSetelah peninjauan berkas secara saksama, saat ini kami belum dapat melanjutkan proses ke tahap berikutnya. Profil Anda akan tetap tersimpan dalam talent database kami untuk peluang mendatang.\n\nSukses selalu untuk karier Anda!\n*Tim Rekrutmen SmartHR*`;

    case "screening_review":
      return `Halo *${name}*,\n\nBerkas lamaran Anda untuk posisi *${job}* saat ini sedang dalam peninjauan mendalam oleh tim rekrutmen kami. Kami akan mengabari Anda setelah evaluasi selesai.\n\nPantau status lamaran Anda:\n${actionUrl}\n\n*Tim Rekrutmen SmartHR*`;

    case "personality_completed":
      return `Halo *${name}*, ✅\n\nTerima kasih telah menyelesaikan *Asesmen Kepribadian* untuk posisi *${job}*. Hasil asesmen Anda telah tercatat dan sedang dipelajari oleh tim rekrutmen.\n\nPantau perkembangan seleksi Anda:\n${actionUrl}\n\n*Tim Rekrutmen SmartHR*`;

    case "interview_invitation":
      return `Halo *${name}*, 🎯\n\nSelamat! Anda diundang mengikuti *Wawancara AI* untuk posisi *${job}*.\n\nSesi wawancara simulasi interaktif dapat Anda akses kapan saja sebelum batas waktu melalui tautan ini:\n👉 ${actionUrl}\n\nPersiapkan diri dengan baik dan semoga sukses!\n*Tim Rekrutmen SmartHR*`;

    case "interview_reminder_48h":
      return `Halo *${name}*, ⏰\n\nPengingat ramah: Wawancara AI untuk posisi *${job}* memiliki sisa waktu sekitar *48 jam*.\n\nSilakan mulai wawancara Anda di sini:\n👉 ${actionUrl}\n\n*Tim Rekrutmen SmartHR*`;

    case "interview_reminder_24h":
      return `Halo *${name}*, ⚠️\n\nPengingat penting: Tenggat waktu Wawancara AI untuk posisi *${job}* berakhir dalam waktu kurang dari *24 jam*.\n\nSegera selesaikan wawancara Anda melalui link berikut:\n👉 ${actionUrl}\n\n*Tim Rekrutmen SmartHR*`;

    case "interview_completed":
      return `Halo *${name}*, 🌟\n\nSelamat! Anda telah menyelesaikan sesi *Wawancara AI* untuk posisi *${job}*. Tim kami sedang meninjau transkrip dan hasil evaluasi secara menyeluruh.\n\nPantau status lamaran Anda:\n${actionUrl}\n\n*Tim Rekrutmen SmartHR*`;

    case "interview_expired":
      return `Halo *${name}*,\n\nKami menginformasikan bahwa batas waktu pelaksanaan Wawancara AI untuk posisi *${job}* telah berakhir. Status lamaran Anda telah diperbarui menjadi kedaluwarsa.\n\nTerima kasih atas partisipasi Anda di *SmartHR*.\n*Tim Rekrutmen SmartHR*`;

    case "personality_reminder":
      return `Halo *${name}*, 📋\n\nPengingat ramah: Anda telah lolos tahap screening untuk posisi *${job}*, namun belum menyelesaikan *Asesmen Kepribadian*.\n\nSilakan luangkan waktu ~20 menit untuk menyelesaikannya:\n👉 ${actionUrl}\n\n*Tim Rekrutmen SmartHR*`;

    case "final_rejection":
      return `Halo *${name}*,\n\nTerima kasih telah mengikuti seluruh rangkaian proses seleksi untuk posisi *${job}* di *SmartHR*.\n\nSetelah evaluasi mendalam, kami memutuskan untuk belum dapat menawarkan posisi tersebut pada kesempatan ini. Kami sangat mengapresiasi waktu dan usaha yang telah Anda berikan.\n\nSemoga sukses dalam perjalanan karier Anda selanjutnya!\n*Tim Rekrutmen SmartHR*`;

    default:
      return `Halo *${name}*,\n\nTerdapat pembaruan pada status lamaran Anda untuk posisi *${job}* di *SmartHR*. Silakan akses portal kandidat:\n👉 ${actionUrl}\n\n*Tim Rekrutmen SmartHR*`;
  }
}

/**
 * Generate personalized WhatsApp recruitment notification message using Hermes Agent.
 * Strict formatting: pure text with WhatsApp styling (*bold*, _italic_), no HTML tags, actionUrl included.
 */
export async function generateWhatsAppContent(
  eventType: CommunicationEventType,
  context: CommunicationContext
): Promise<{
  message: string;
  hermes_duration_ms: number;
  hermes_model: string;
  hermes_error?: string | null;
}> {
  const startTime = Date.now();
  const firstName = context.candidateFirstName || context.candidateName.trim().split(/\s+/)[0] || "Kandidat";
  const appId = context.applicationId || "test-app-uuid-12345";
  const baseUrl = (context.appBaseUrl || process.env.APP_BASE_URL || "https://smarthr.my.id").replace(/\/+$/, "");
  const actionUrl = context.actionUrl || resolveDefaultActionUrl(eventType, appId, baseUrl);

  const waPrompt = `Anda adalah Asisten Rekrutmen SmartHR yang bertugas menyusun pesan notifikasi WhatsApp resmi, ramah, dan profesional untuk kandidat.
KANDIDAT: ${context.candidateName} (panggilan: ${firstName})
POSISI: ${context.jobTitle}${context.jobLocation ? ` (${context.jobLocation})` : ""}
TAHAPAN / EVENT: ${eventType}
ACTION_URL: ${actionUrl}

ATURAN PESAN WHATSAPP:
1. Tulis pesan dalam Bahasa Indonesia yang hangat, sopan, dan jelas.
2. Gunakan styling khas WhatsApp: *bold* untuk penekanan, nama, dan posisi; emoji yang relevan (👋, 🎉, 🎯, ⏰, ✅).
3. DILARANG MENGGUNAKAN TAG HTML APA PUN (<p>, <br>, <b>, <a>, dll). Gunakan baris baru biasa.
4. WAJIB MENYERTAKAN ACTION_URL secara persis dan utuh: ${actionUrl}
5. Dilarang membocorkan skor angka numerik, persentase, atau rubrik internal.
6. Panjang pesan maksimal 3-4 paragraf singkat, cocok untuk layar WhatsApp.
Kembalikan HANYA teks pesan WhatsApp yang siap dikirim tanpa format JSON atau tag pembungkus lainnya.`;

  try {
    const hermesResponse = await runHermesAgent({
      systemPrompt: "Anda adalah sistem pengirim pesan WhatsApp resmi SmartHR. Tulis pesan teks langsung tanpa tag HTML.",
      userPrompt: waPrompt,
      temperature: 0.3,
      maxTokens: 1000,
      modelOverride: "mistral-medium-3-5",
      timeoutMs: 300000,
    });

    const elapsed = Date.now() - startTime;

    if (hermesResponse.success && hermesResponse.content?.trim()) {
      let cleaned = cleanWhatsAppText(hermesResponse.content);
      if (!cleaned.includes(actionUrl)) {
        cleaned += `\n\n👉 ${actionUrl}`;
      }
      const modelName = hermesResponse.modelUsed || "mistral-medium-3-5";
      return {
        message: cleaned,
        hermes_duration_ms: elapsed,
        hermes_model: modelName,
        hermes_error: null,
      };
    } else {
      const errMsg = hermesResponse.error || "Hermes returned empty response";
      console.error("[HermesCommunicator] WhatsApp generation error:", errMsg);
      return {
        message: getWhatsAppFallbackContent(eventType, { ...context, actionUrl }),
        hermes_duration_ms: elapsed,
        hermes_model: "fallback-template",
        hermes_error: errMsg,
      };
    }
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error("[HermesCommunicator] Exception during WhatsApp generation:", error);
    return {
      message: getWhatsAppFallbackContent(eventType, { ...context, actionUrl }),
      hermes_duration_ms: elapsed,
      hermes_model: "fallback-template",
      hermes_error: error instanceof Error ? error.message : String(error),
    };
  }
}
