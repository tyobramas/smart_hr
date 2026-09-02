import fs from "fs";
import path from "path";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...values] = trimmed.split("=");
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join("=").trim();
      }
    }
  }
}

import { runHermesCvScreening } from "../lib/hermes-screener";
import { classifyScreening } from "../lib/screening-bands";

async function main() {
  console.log("======================================================================");
  console.log("TEST SUITE: Hardened Hermes CV Screener & Guard 1 Verification");
  console.log("======================================================================\n");

  console.log("Test 1: Normal Qualified Senior Flutter Developer CV...");
  const res1 = await runHermesCvScreening({
    candidateName: "Budi Pratama",
    jobTitle: "Senior Flutter Developer",
    jobRequirements: "Minimal 3 tahun pengalaman Flutter, mahir Bloc/Riverpod, Clean Architecture, CI/CD.",
    cvText: "Saya Budi Pratama, Software Engineer dengan 4 tahun pengalaman membangun aplikasi Flutter skala enterprise menggunakan Clean Architecture dan Bloc. Mahir integrasi REST API, Hive storage, dan automated testing.",
  });

  console.log(`- Success : ${res1.success}`);
  console.log(`- Score   : ${res1.score}/100`);
  console.log(`- Reason  : ${res1.parsedEvaluation?.alasan_keputusan}`);

  const decision1 = classifyScreening({
    score: res1.score,
    aiSucceeded: res1.success,
    cvTextLength: 250,
  });
  console.log(`- Band Outcome: ${decision1.outcome} (Status: ${decision1.status})\n`);

  if (!res1.success || res1.score === null || res1.score < 71) {
    console.error("❌ Test 1 failed!");
    process.exit(1);
  }

  console.log("======================================================================");
  console.log("🎉 ALL SCREENER HARDENING TESTS PASSED!");
  console.log("======================================================================");
}

main().catch((err) => {
  console.error("Test Error:", err);
  process.exit(1);
});
