import * as fs from "fs";
import * as path from "path";
import { evaluateInterviewSessionHermes } from "../lib/hermes-interview";
import { InterviewMessage, InterviewScriptItem } from "../types/database";

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

async function runEvaluatorTests() {
  console.log("======================================================================");
  console.log("TEST EVALUATOR: Senior Flutter Developer Interview Transcript");
  console.log("======================================================================");

  const flutterBlueprints: InterviewScriptItem[] = [
    {
      tag: "state_management_modern",
      title: "Penguasaan State Management Modern",
      required_topics: ["migrasi Provider ke Bloc", "mengatasi lag re-render"],
      question_text: "Ceritakan momen nyata ketika Anda pernah mendesain ulang state management sebuah aplikasi Flutter yang awalnya menggunakan Provider menjadi Bloc.",
      scenario_context: "Aplikasi e-commerce skala menengah mengalami lag render",
      what_good_looks_like: ["Mampu memecah state secara modular", "Menjelaskan event-driven architecture", "Mengukur dampak penurunan frame drop"],
      prepared_probe: "Bagaimana struktur Cubit atau Bloc yang Anda rancang untuk mengisolasi state checkout?",
    },
    {
      tag: "offline_first_storage",
      title: "Integrasi Database Offline-First",
      required_topics: ["Hive / Isar storage", "sinkronisasi background"],
      question_text: "Deskripsikan pengalaman Anda saat pernah mengimplementasikan strategi offline-first dalam aplikasi Flutter menggunakan Hive atau Isar.",
      scenario_context: "Koneksi lapangan tidak stabil",
      what_good_looks_like: ["Menjelaskan skema TypeAdapter Hive", "Menangani conflict resolution saat reconnect", "Menjaga integritas data lokal"],
      prepared_probe: "Bagaimana Anda menangani schema migration pada Hive jika ada perubahan model data?",
    },
  ];

  const flutterMessages: InterviewMessage[] = [
    {
      id: "m1",
      sender: "ai",
      question_type: "core",
      competency_tag: "state_management_modern",
      text: flutterBlueprints[0].question_text,
      timestamp: new Date().toISOString(),
    },
    {
      id: "m2",
      sender: "candidate",
      text: "Waktu itu aplikasi e-commerce kami mengalami lag parah saat checkout karena Provider me-rebuild seluruh widget tree. Saya memimpin migrasi ke Flutter Bloc dengan memecah state checkout menjadi CartBloc dan PaymentBloc terpisah, sehingga hanya button checkout dan list item yang di-rebuild.",
      timestamp: new Date().toISOString(),
    },
    {
      id: "m3",
      sender: "ai",
      question_type: "follow_up",
      competency_tag: "state_management_modern",
      text: "Seberapa parah lag yang Anda alami, dan bagaimana Anda mengukurnya sebelum melakukan migrasi?",
      timestamp: new Date().toISOString(),
    },
    {
      id: "m4",
      sender: "candidate",
      text: "Kami mengukur frame render time menggunakan Flutter DevTools Timeline. Frame rate sempat drop hingga 22 FPS saat cart berisi lebih dari 20 item. Setelah memecah CartBloc dengan selector BlocBuilder, frame rate stabil di 58-60 FPS tanpa jank.",
      timestamp: new Date().toISOString(),
    },
    {
      id: "m5",
      sender: "ai",
      question_type: "core",
      competency_tag: "offline_first_storage",
      text: flutterBlueprints[1].question_text,
      timestamp: new Date().toISOString(),
    },
    {
      id: "m6",
      sender: "candidate",
      text: "Di proyek kurir logistik sebelumnya, kurir sering kehilangan sinyal di basement gedung. Saya mengimplementasikan Hive Box dengan TypeAdapter untuk menyimpan antrean paket offline. Saat online kembali, sync service mengirim batch request dengan idempotency key untuk menghindari data duplikat.",
      timestamp: new Date().toISOString(),
    },
  ];

  const evalResult = await evaluateInterviewSessionHermes({
    candidateName: "Budi Pratama",
    roleTitle: "Senior Flutter Developer",
    jobDescription: "Membangun aplikasi mobile Flutter performa tinggi dengan Clean Architecture, state management Bloc/Riverpod, dan offline sync.",
    jobRequirements: "Minimal 3 tahun pengalaman Flutter, mahir Bloc/Riverpod, Hive/Isar, dan CI/CD Play Store.",
    blueprints: flutterBlueprints,
    durationSeconds: 720,
    messages: flutterMessages,
  });

  console.log("Evaluation Result 1 (Strong Candidate):\n", JSON.stringify(evalResult, null, 2));

  console.log("\n======================================================================");
  console.log("TEST EVALUATOR: Driver Interview with Vague/Superficial Answers");
  console.log("======================================================================");

  const driverBlueprints: InterviewScriptItem[] = [
    {
      tag: "kerahasiaan_dan_etika",
      title: "Etika Pelayanan VIP dan Kerahasiaan",
      required_topics: ["kerahasiaan percakapan direksi", "etika sopan santun"],
      question_text: "Ceritakan momen nyata ketika Anda pernah melayani penumpang VIP yang sedang membicarakan topik rahasia di dalam mobil.",
      scenario_context: "Menjaga kerahasiaan percakapan penting direksi",
      what_good_looks_like: ["Menjaga fokus menyetir tanpa menyela", "Tidak membocorkan obrolan", "Menjaga sikap profesional"],
      prepared_probe: "Bagaimana tindakan Anda saat penumpang meminta Anda tidak mendengarkan percakapan mereka?",
    },
  ];

  const driverMessages: InterviewMessage[] = [
    {
      id: "d1",
      sender: "ai",
      question_type: "core",
      competency_tag: "kerahasiaan_dan_etika",
      text: driverBlueprints[0].question_text,
      timestamp: new Date().toISOString(),
    },
    {
      id: "d2",
      sender: "candidate",
      text: "Ya kami pokoknya selalu menjaga rahasia perusahaan dan kami bekerja dengan baik bersama tim pengemudi lain.",
      timestamp: new Date().toISOString(),
    },
    {
      id: "d3",
      sender: "ai",
      question_type: "follow_up",
      competency_tag: "kerahasiaan_dan_etika",
      text: "Bisa Anda jelaskan langkah konkret yang pernah Anda ambil secara pribadi saat menghadapi situasi tersebut?",
      timestamp: new Date().toISOString(),
    },
    {
      id: "d4",
      sender: "candidate",
      text: "Pokoknya saya diam saja dan mengantar sampai tujuan.",
      timestamp: new Date().toISOString(),
    },
  ];

  const vagueEvalResult = await evaluateInterviewSessionHermes({
    candidateName: "Joko",
    roleTitle: "Executive Corporate Driver",
    jobDescription: "Pengemudi Direksi yang bertanggung jawab mengemudikan kendaraan mewah dan menjaga kerahasiaan.",
    jobRequirements: "Pengalaman minimal 3 tahun sebagai supir direksi, menjaga kerahasiaan.",
    blueprints: driverBlueprints,
    durationSeconds: 300,
    messages: driverMessages,
  });

  console.log("\nEvaluation Result 2 (Vague/Normative Candidate):\n", JSON.stringify(vagueEvalResult, null, 2));
}

runEvaluatorTests().catch(console.error);
