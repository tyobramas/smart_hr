import fs from "fs";
import path from "path";

// Load .env.local manually without external deps
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
  console.log("\n=======================================================");
  console.log("🔍 TESTING HERMES AGENT LOCAL CONNECTION");
  console.log("=======================================================");
  console.log(`Config HERMES_MODE : ${process.env.HERMES_MODE || "cli"}`);
  console.log(`Config HERMES_CLI  : ${process.env.HERMES_CLI_PATH || "/Users/bramastyokusumo/.local/bin/hermes"}\n`);

  console.log("Mengirim pesan uji coba ke Hermes Agent...");
  const result = await runHermesAgent({
    systemPrompt: "Anda adalah AI evaluator rekrutmen profesional.",
    userPrompt: "Jawab dalam 1 kalimat bahasa Indonesia: Siapakah Anda dan bagaimana status kesiapan Anda?",
    temperature: 0.2,
  });

  console.log("\n--- HASIL RESPON ---");
  console.log(`Status Sukses : ${result.success ? "✅ BERHASIL" : "❌ GAGAL"}`);
  console.log(`Sumber Engine : ${result.modelUsed} (${result.source})`);
  console.log(`Jawaban AI    :\n"${result.content}"`);
  console.log("=======================================================\n");
}

main().catch((err) => {
  console.error("Test Error:", err);
});
