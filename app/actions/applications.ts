"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireAdmin } from "@/lib/supabase/auth";
import { ApplicationStatus } from "@/types/database";
import { runHermesCvScreening } from "@/lib/hermes-screener";
import { extractTextFromCvFile } from "@/lib/cv-parser";

export interface ApplyJobResult {
  success: boolean;
  applicationId?: string;
  score?: number | null;
  minScoreThreshold?: number;
  analysisText?: string;
  status?: ApplicationStatus;
  error?: string;
}

export async function applyJobAction(formData: FormData): Promise<ApplyJobResult> {
  const { profile } = await requireProfile();

  const jobId = formData.get("job_id") as string;
  const cvParsedName = (formData.get("cv_parsed_name") as string) || profile.full_name;
  let cvStoragePath = (formData.get("cv_storage_path") as string) || "";
  const cvFile = formData.get("cv_file") as File | null;

  if (!jobId) {
    return { success: false, error: "Job ID tidak valid." };
  }

  const supabase = await createClient();

  // =========================================================================
  // GUARD: CANDIDATE CANNOT APPLY TO THE SAME JOB MORE THAN ONCE
  // =========================================================================
  const { data: existingApp } = await supabase
    .from("applications")
    .select("id, status, cv_score")
    .eq("candidate_id", profile.id)
    .eq("job_id", jobId)
    .maybeSingle();

  if (existingApp) {
    return {
      success: false,
      error: "Anda sudah pernah mengirimkan lamaran untuk posisi ini. Kandidat hanya diperbolehkan melamar 1 kali untuk setiap lowongan pekerjaan.",
    };
  }

  // 1. Extract plain text content from the uploaded CV file for Langflow RAG analysis
  let cvTextContent = "";
  if (cvFile && cvFile.size > 0) {
    cvTextContent = await extractTextFromCvFile(cvFile);
  }

  // 2. Upload file to Supabase Storage
  if (cvFile && cvFile.size > 0 && typeof cvFile.name === "string") {
    const fileExt = cvFile.name.split(".").pop() || "pdf";
    const sanitizedName = cvFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${profile.id}/${Date.now()}_${sanitizedName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(filePath, cvFile, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.warn("Storage upload warning, fallback to path:", uploadError);
      cvStoragePath = `cvs/${profile.id}/${sanitizedName}`;
    } else if (uploadData?.path) {
      cvStoragePath = `cvs/${uploadData.path}`;
    }
  }

  if (!cvStoragePath || cvStoragePath.trim() === "") {
    cvStoragePath = `cvs/${profile.id}/resume.pdf`;
  }

  // 3. Fetch Job info for Langflow AI Context
  const { data: jobData } = await supabase
    .from("jobs")
    .select("title, requirements, min_score_threshold")
    .eq("id", jobId)
    .single();

  let initialStatus: ApplicationStatus = "screened";
  let initialScore: number | null = null;
  let initialAnalysisJson: Record<string, unknown> | null = null;
  let analysisOutputText = "";

  // 4. Execute Hermes AI Screening Immediately with extracted CV Text
  if (jobData) {
    try {
      const aiResult = await runHermesCvScreening({
        candidateName: cvParsedName,
        jobTitle: jobData.title,
        jobRequirements: jobData.requirements,
        cvStoragePath: cvStoragePath,
        cvText: cvTextContent,
      });

      if (aiResult.success) {
        initialScore = aiResult.score;
        initialAnalysisJson = aiResult.analysisJson;
        analysisOutputText = aiResult.analysisText;
        initialStatus = "screened";
      }
    } catch (aiErr) {
      console.error("Hermes screening execution error:", aiErr);
    }
  }

  // 5. Insert Application with Hermes Output directly into Database
  const { data: insertedApp, error: insertErr } = await supabase
    .from("applications")
    .insert({
      candidate_id: profile.id,
      job_id: jobId,
      cv_storage_path: cvStoragePath,
      cv_parsed_name: cvParsedName,
      status: initialStatus,
      cv_score: initialScore,
      cv_analysis_json: initialAnalysisJson,
    })
    .select("id")
    .single();

  if (insertErr) {
    return { success: false, error: insertErr.message };
  }

  revalidatePath("/applications");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/applications");
  revalidatePath(`/jobs/${jobData?.title}`);

  return {
    success: true,
    applicationId: insertedApp?.id,
    score: initialScore,
    minScoreThreshold: jobData?.min_score_threshold ?? 70,
    analysisText: analysisOutputText,
    status: initialStatus,
  };
}

export async function triggerLangflowScreeningAction(applicationId: string) {
  await requireAdmin();

  const supabase = await createClient();

  const { data: app, error } = await supabase
    .from("applications")
    .select(`
      *,
      job:jobs (title, requirements, min_score_threshold),
      candidate:profiles (full_name)
    `)
    .eq("id", applicationId)
    .single();

  if (error || !app) {
    return { error: "Data lamaran tidak ditemukan." };
  }

  const candidateName = app.candidate?.full_name || app.cv_parsed_name || "Kandidat";
  const jobTitle = app.job?.title || "Posisi";
  const jobRequirements = app.job?.requirements || "";

  let cvTextContent = "";
  if (app.cv_storage_path) {
    try {
      const cleanPath = app.cv_storage_path.replace(/^cvs\//, "");
      const { data: fileBlob } = await supabase.storage.from("cvs").download(cleanPath);
      if (fileBlob) {
        const fileObj = new File([fileBlob], cleanPath, { type: fileBlob.type });
        cvTextContent = await extractTextFromCvFile(fileObj);
      }
    } catch (dlErr) {
      console.warn("Could not download CV for text extraction:", dlErr);
    }
  }

  const aiResult = await runHermesCvScreening({
    candidateName,
    jobTitle,
    jobRequirements,
    cvStoragePath: app.cv_storage_path,
    cvText: cvTextContent,
  });

  if (!aiResult.success) {
    return { error: aiResult.error || "Gagal menghubungi Hermes / Nara Router API." };
  }

  const score = aiResult.score ?? 75;
  const newStatus: ApplicationStatus = "screened";

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      cv_score: score,
      cv_analysis_json: aiResult.analysisJson,
      status: newStatus,
    })
    .eq("id", applicationId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/applications");
  revalidatePath("/applications");

  return {
    success: true,
    score,
    analysisText: aiResult.analysisText,
  };
}

export async function updateApplicationStatusAction(
  applicationId: string,
  status: ApplicationStatus,
  cvScore?: number,
  cvAnalysisJson?: Record<string, unknown>
) {
  await requireAdmin();

  const supabase = await createClient();

  const updateData: {
    status: ApplicationStatus;
    cv_score?: number;
    cv_analysis_json?: Record<string, unknown>;
  } = { status };

  if (cvScore !== undefined) {
    updateData.cv_score = cvScore;
  }
  if (cvAnalysisJson !== undefined) {
    updateData.cv_analysis_json = cvAnalysisJson;
  }

  const { error } = await supabase
    .from("applications")
    .update(updateData)
    .eq("id", applicationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/applications");
  revalidatePath("/applications");
  return { success: true };
}
