import fs from "fs";
import path from "path";

// Load .env.local
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

import { runHermesAgent } from "../lib/hermes-runner";

async function main() {
  const num1 = Math.floor(Math.random() * 9000) + 1000;
  const num2 = Math.floor(Math.random() * 900) + 100;
  const expectedSum = num1 + num2;
  const timestamp = new Date().toISOString();

  console.log("======================================================================");
  console.log("LIVE REAL-TIME PROOF: Dynamic Non-Hardcoded Execution via Hermes Agent");
  console.log("======================================================================");
  console.log(`Dynamic Input Token : ${timestamp}`);
  console.log(`Math Problem        : ${num1} + ${num2} (Expected: ${expectedSum})\n`);

  const prompt = `Anda adalah Hermes Agent AI di SmartHR.
Token Verifikasi Dinamis: [${timestamp}]
Tolong selesaikan dua hal:
1. Hitung secara presisi: ${num1} + ${num2} = ?
2. Buatkan 1 baris pantun lucu tentang HRD dan programmer dengan menyertakan kata "SmartHR".`;

  const response = await runHermesAgent({
    userPrompt: prompt,
    temperature: 0.2,
    timeoutMs: 90000,
  });

  console.log("--- RESPONS DARI HERMES AGENT (LIVE) ---");
  console.log(`Source Route : ${response.source}`);
  console.log(`Engine       : ${response.modelUsed}`);
  console.log(`Sukses       : ${response.success}`);
  console.log("\nIsi Jawaban:");
  console.log(response.content);
  console.log("======================================================================");
}

main().catch(console.error);
