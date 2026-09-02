/**
 * Uji generate skrip wawancara Hermes untuk SEMUA lowongan di database.
 * Usage: npx tsx scripts/test-interview-script.ts
 */
import { createClient } from "@supabase/supabase-js";
import { generateInterviewScript } from "../lib/hermes-interview";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (t && !t.startsWith("#") && t.includes("=")) {
      const [k, ...v] = t.split("=");
      process.env[k.trim()] = v.join("=").trim();
    }
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

async function main() {
  const filterArg = process.argv.slice(2).join(" ").trim().toLowerCase();

  const { data: allJobs } = await supabase
    .from("jobs").select("id, title, description, requirements").order("title");

  const jobs = filterArg
    ? (allJobs || []).filter(j => j.title.toLowerCase().includes(filterArg))
    : allJobs;

  if (!jobs?.length) {
    console.log(filterArg ? `Tidak ada lowongan yang cocok dengan filter "${filterArg}".` : "Tidak ada lowongan.");
    return;
  }

  for (const job of jobs) {
    console.log("\n" + "=".repeat(70));
    console.log(`LOWONGAN: ${job.title}`);
    console.log("=".repeat(70));

    const t0 = Date.now();
    const r = await generateInterviewScript({
      roleTitle: job.title,
      jobDescription: job.description || "",
      jobRequirements: job.requirements || "",
    });
    const secs = ((Date.now() - t0) / 1000).toFixed(1);

    if (!r.success) {
      console.log(`GAGAL (${secs}s, ${r.attempts}x): ${r.error}`);
      r.issues.forEach(i => console.log(`   item ${i.index}: ${i.reasons.join(" | ")}`));
      if (r.script?.length) {
        console.log("Pertanyaan yang dihasilkan:");
        r.script.forEach((q, i) => {
          console.log(`   ${i + 1}. [${q.title}] ${q.question_text}`);
        });
      }
      continue;
    }

    console.log(`OK — ${r.script!.length} pertanyaan | ${secs}s | attempt ${r.attempts} | ${r.source}/${r.engine}`);
    if (r.issues.length) {
      console.log("Item yang dibuang:");
      r.issues.forEach(i => console.log(`   item ${i.index}: ${i.reasons.join(" | ")}`));
    }
    r.script!.forEach((q, i) => {
      console.log(`\n${i + 1}. [${q.title}]`);
      console.log(`   Q: ${q.question_text}`);
      console.log(`   Probe: ${q.prepared_probe}`);
    });
  }
}

main().catch(e => { console.error(e); process.exit(1); });
