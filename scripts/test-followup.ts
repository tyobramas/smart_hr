import * as fs from "fs";
import * as path from "path";
import { generateFollowUp } from "../lib/hermes-interview";

// Load .env.local manually
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.warn("Could not load .env.local file");
}

async function runTests() {
  console.log("======================================================================");
  console.log("TEST 1: Short candidate answer (< 12 words) -> Fallback to prepared_probe");
  console.log("======================================================================");
  const shortResult = await generateFollowUp({
    roleTitle: "Executive Corporate Driver",
    jobText: "Pengemudi Direksi yang bertanggung jawab mengemudikan kendaraan mewah dan menjaga kerahasiaan.",
    competencyTitle: "Kerahasiaan dan Etika VIP",
    requiredTopics: ["menjaga rahasia percakapan direksi", "etika sopan santun"],
    lastQuestion: "Ceritakan momen nyata ketika Anda pernah melayani penumpang VIP yang sedang membicarakan topik rahasia di dalam mobil?",
    lastAnswer: "Saya selalu diam dan fokus menyetir saja.",
    previousQuestions: [],
    preparedProbe: "Bisa Anda jelaskan langkah konkret yang Anda ambil saat penumpang meminta Anda tidak mendengarkan percakapan mereka?",
  });
  console.log("Result 1:", shortResult);

  console.log("\n======================================================================");
  console.log("TEST 2: Detailed candidate answer -> Live quote-based follow-up via Hermes");
  console.log("======================================================================");
  const detailedResult = await generateFollowUp({
    roleTitle: "Senior Flutter Developer",
    jobText: "Senior Flutter Developer dengan pengalaman state management Bloc/Riverpod, Clean Architecture, dan database offline Hive/Isar.",
    competencyTitle: "Penguasaan State Management Modern",
    requiredTopics: ["refactoring Provider ke Bloc", "mengatasi lag performa"],
    lastQuestion: "Ceritakan momen nyata ketika Anda pernah mendesain ulang state management sebuah aplikasi Flutter yang awalnya menggunakan Provider menjadi Bloc.",
    lastAnswer: "Waktu itu aplikasi e-commerce kami mengalami lag parah saat checkout karena Provider me-rebuild seluruh widget tree. Saya memimpin migrasi ke Flutter Bloc dengan memecah state checkout menjadi CartBloc dan PaymentBloc terpisah, sehingga hanya button checkout yang di-rebuild.",
    previousQuestions: [],
    preparedProbe: "Bagaimana struktur Cubit atau Notifier yang Anda buat untuk mengelola state yang saling bergantung dalam kasus tersebut?",
  });
  console.log("Result 2:", detailedResult);

  console.log("\n======================================================================");
  console.log("TEST 3: Tax specialist detailed answer -> Quote-based follow-up");
  console.log("======================================================================");
  const taxResult = await generateFollowUp({
    roleTitle: "Senior Corporate Tax & Accounting Specialist",
    jobText: "Bertanggung jawab atas kepatuhan pajak korporasi, rekonsiliasi fiskal SPT Tahunan PPh Badan, dan pendampingan audit pemeriksaan DJP.",
    competencyTitle: "Kepatuhan dan Akurasi Pelaporan Pajak",
    requiredTopics: ["rekonsiliasi fiskal PPh Badan", "koreksi positif dan negatif"],
    lastQuestion: "Ceritakan momen nyata ketika Anda pernah menemukan ketidaksesuaian data antara laporan keuangan internal dengan persyaratan pelaporan SPT Tahunan PPh Badan.",
    lastAnswer: "Pada audit akhir tahun 2023, saya menemukan selisih biaya promosi sebesar 450 juta rupiah yang belum memiliki daftar nominatif sesuai PMK. Saya segera mengumpulkan bukti pendukung dari tim marketing dan melakukan koreksi fiskal positif pada SPT Badan agar terhindar dari denda pemeriksaan.",
    previousQuestions: [],
    preparedProbe: "Bagaimana Anda memvalidasi keabsahan faktur pajak masukan dari vendor sebelum dikreditkan?",
  });
  console.log("Result 3:", taxResult);
}

runTests().catch(console.error);
