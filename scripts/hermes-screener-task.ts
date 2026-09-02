/**
 * Autonomous Hermes Agent CLI Task Runner
 *
 * This script allows the Hermes Agent (or developer) to run autonomous batch audits
 * on pending candidate applications directly from the terminal/CLI.
 *
 * Usage:
 *   npx tsx scripts/hermes-screener-task.ts
 */

import { createClient } from "@supabase/supabase-js";
import { runHermesCvScreening } from "../lib/hermes-screener";
import { extractTextFromCvFile } from "../lib/cv-parser";
import { classifyScreening, SCREENING_BANDS } from "../lib/screening-bands";
import fs from "fs";
import path from "path";

// Load .env.local natively
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [k, ...v] = trimmed.split("=");
      process.env[k.trim()] = v.join("=").trim();
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is missing in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("==================================================");
  console.log("🤖 HERMES AUTONOMOUS CANDIDATE SCREENER AGENT");
  console.log("==================================================");
  console.log(`Target Supabase: ${supabaseUrl}`);
  console.log(`Target Model:    ${process.env.HERMES_MODEL || process.env.NARA_ROUTER_MODEL || "mistral-medium-3-5"}`);
  console.log(`Router Base URL: ${process.env.HERMES_BASE_URL || process.env.NARA_ROUTER_BASE_URL || "https://router.bynara.id/v1"}\n`);

  // Fetch pending / unscored applications
  const { data: apps, error } = await supabase
    .from("applications")
    .select(`
      id,
      candidate_id,
      cv_parsed_name,
      cv_storage_path,
      status,
      cv_score,
      created_at,
      job:jobs (id, title, requirements),
      candidate:profiles (full_name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Failed to query applications:", error.message);
    process.exit(1);
  }

  if (!apps || apps.length === 0) {
    console.log("ℹ️ Tidak ada data lamaran di database.");
    return;
  }

  console.log(`📋 Ditemukan total ${apps.length} lamaran dalam pipeline.\n`);

  let processedCount = 0;

  for (const app of apps) {
    const candidateName =
      (app.candidate as any)?.full_name || app.cv_parsed_name || "Kandidat";
    const jobTitle = (app.job as any)?.title || "Posisi Terkait";
    const jobRequirements = (app.job as any)?.requirements || "";

    console.log(`🔍 [${app.id}] Mengevaluasi: ${candidateName} -> ${jobTitle}...`);

    // Download and extract CV text if exists
    let cvText = "";
    if (app.cv_storage_path) {
      try {
        const cleanPath = app.cv_storage_path.replace(/^cvs\//, "");
        const { data: fileBlob } = await supabase.storage.from("cvs").download(cleanPath);
        if (fileBlob) {
          const fileObj = new File([fileBlob], cleanPath, { type: fileBlob.type || "application/pdf" });
          cvText = await extractTextFromCvFile(fileObj);
        }
      } catch (err: any) {
        console.warn(`  ⚠️ Could not extract CV text: ${err.message}`);
      }
    }

    const result = await runHermesCvScreening({
      candidateName,
      jobTitle,
      jobRequirements,
      cvStoragePath: app.cv_storage_path,
      cvText,
    });

    const decision = classifyScreening({
      score: result.success ? result.score ?? null : null,
      aiSucceeded: result.success,
      cvTextLength: cvText.trim().length,
      jobMinScoreThreshold: (app as any).job?.min_score_threshold,
    });

    if (result.success && result.score !== null) {
      console.log(`  ✅ Evaluasi Selesai! Skor: ${result.score}/100 | Outcome: ${decision.outcome} -> Status: ${decision.status}`);

      const analysisJson = {
        ...(result.analysisJson || (app as any).cv_analysis_json || {}),
        screening_outcome: decision.outcome,
        screening_label: decision.label,
        effective_pass_min: decision.effectivePassMin,
        bands: SCREENING_BANDS,
        cv_text_length: cvText.trim().length,
      };

      const { error: updateErr } = await supabase
        .from("applications")
        .update({
          cv_score: result.score,
          cv_analysis_json: analysisJson,
          status: decision.status,
        })
        .eq("id", app.id);

      if (updateErr) {
        console.error(`  ❌ Gagal update status di database: ${updateErr.message}`);
      } else {
        console.log(`  💾 Berhasil diperbarui di Supabase! (Status: ${decision.status})`);
        processedCount++;
      }
    } else {
      console.error(`  ❌ Evaluasi gagal: ${result.error}`);
    }

    console.log("--------------------------------------------------");
  }

  console.log(`\n🎉 Audit Selesai. ${processedCount} lamaran berhasil diproses oleh Hermes Agent.`);
}

main().catch((err) => {
  console.error("Fatal Error in Hermes Task:", err);
  process.exit(1);
});
