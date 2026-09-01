"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/auth";
import { generateTriFactorSynthesis, TriFactorSynthesis } from "@/lib/ai-synthesis";
import { Job, Profile } from "@/types/database";

export async function getOrGenerateTriFactorSynthesisAction(applicationId: string, forceReanalyze = false) {
  const { profile } = await requireProfile();
  if (profile.role !== "admin") {
    return { success: false, error: "Hanya Admin HRD yang berhak mengakses sintesis analitik." };
  }

  const supabase = createAdminClient();
  const { data: app, error } = await supabase
    .from("applications")
    .select(`
      *,
      job:jobs (*),
      candidate:profiles (*)
    `)
    .eq("id", applicationId)
    .single();

  if (error || !app) {
    return { success: false, error: "Lamaran tidak ditemukan." };
  }

  const existingSynthesis = (app.personality_result_json as any)?.tri_factor_synthesis as TriFactorSynthesis | null;

  if (existingSynthesis && !forceReanalyze) {
    return {
      success: true,
      synthesis: existingSynthesis,
      application: app,
    };
  }

  const jobData = (app as any).job as Job;
  const candidateName = (app as any).candidate?.full_name || app.cv_parsed_name || "Kandidat";

  const synthesis = await generateTriFactorSynthesis({
    candidateName,
    roleTitle: jobData?.title || "Posisi Lamaran",
    minScoreThreshold: Number(jobData?.min_score_threshold || 75),
    cvScore: app.cv_score,
    cvEvaluation: (app.cv_analysis_json as any)?.evaluation || {},
    personalityResult: (app.personality_result_json as any) || {},
    interviewTranscript: (app.interview_transcript_json as any) || {},
  });

  // Save to personality_result_json or application metadata
  const currentPersonalityJson = (app.personality_result_json as any) || {};
  currentPersonalityJson.tri_factor_synthesis = synthesis;

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      personality_result_json: currentPersonalityJson,
    })
    .eq("id", applicationId);

  if (updateError) {
    console.warn("Failed to persist tri-factor synthesis to DB:", updateError);
  }

  revalidatePath("/admin/applications");

  return {
    success: true,
    synthesis,
    application: app,
  };
}
