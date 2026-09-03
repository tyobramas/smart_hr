"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireAdmin } from "@/lib/supabase/auth";
import { ApplicationStatus } from "@/types/database";
import { runHermesCvScreening } from "@/lib/hermes-screener";
import { extractTextFromCvFile } from "@/lib/cv-parser";
import { verifyCvIdentity } from "@/lib/identity-verifier";
import {
  classifyScreening,
  SCREENING_BANDS,
  ScreeningOutcome,
} from "@/lib/screening-bands";
import { sendRecruitmentEmail } from "@/lib/communication-engine";
import { CommunicationEventType } from "@/types/database";

export interface ApplyJobResult {
  success: boolean;
  applicationId?: string;
  score?: number | null;
  minScoreThreshold?: number;
  analysisText?: string;
  status?: ApplicationStatus;
  outcome?: ScreeningOutcome;
  label?: string;
  error?: string;
}

export async function applyJobAction(formData: FormData): Promise<ApplyJobResult> {
  const { profile } = await requireProfile();

  const jobId = formData.get("job_id") as string;
  const cvParsedName = profile.full_name || (formData.get("cv_parsed_name") as string) || "Kandidat";
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

  // =========================================================================
  // FAST ANTI-FRAUD GUARD: IDENTITY & NAME VERIFICATION (< 1ms execution)
  // Ensures CV belongs to the logged-in candidate. Archives evidence to HRD database.
  // =========================================================================
  const identityCheck = verifyCvIdentity(profile.full_name, cvTextContent);

  if (!identityCheck.isMatch) {
    const rejectionReason = `Diskrepansi Identitas: Berkas CV teridentifikasi milik pihak lain dan tidak memuat nama akun pelamar (${profile.full_name}). Sesuai ketentuan integritas, proses seleksi dibatalkan otomatis dan pengajuan diblokir.`;

    const fraudAnalysisJson = {
      screening_outcome: "REJECTED_INTEGRITY_MISMATCH",
      screening_label: "Dibatalkan: Ketidaksesuaian Identitas Dokumen",
      status_kelayakan: "NOT_QUALIFIED",
      match_fit_score: 0,
      alasan_keputusan: rejectionReason,
      fraud_flag: true,
      flag_type: "IDENTITY_MISMATCH",
      matched_tokens: identityCheck.matchedTokens,
      missing_tokens: identityCheck.missingTokens,
      audit_disclaimer: "Berkas CV telah tersimpan dan diarsipkan ke storage database HRD untuk keperluan rekam jejak integritas.",
    };

    // Insert blocked/rejected application record to database so HRD has the forensic evidence
    await supabase.from("applications").insert({
      candidate_id: profile.id,
      job_id: jobId,
      cv_storage_path: cvStoragePath,
      cv_parsed_name: profile.full_name,
      status: "rejected",
      cv_score: 0,
      cv_analysis_json: fraudAnalysisJson,
    });

    revalidatePath("/applications");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/applications");

    return {
      success: false,
      score: 0,
      status: "rejected",
      outcome: "rejected",
      label: "Dibatalkan: Ketidaksesuaian Identitas Dokumen",
      error: `Diskrepansi Identitas: Berkas CV telah tersimpan ke database HRD. Namun karena nama pada dokumen CV tidak cocok dengan akun profil Anda (${profile.full_name}), pengajuan lamaran otomatis dibatalkan dan diblokir demi integritas seleksi.`,
    };
  }

  // 3. Fetch Job info for Langflow AI Context
  const { data: jobData } = await supabase
    .from("jobs")
    .select("title, requirements, min_score_threshold")
    .eq("id", jobId)
    .single();

  let initialScore: number | null = null;
  let initialAnalysisJson: Record<string, unknown> | null = null;
  let analysisOutputText = "";
  let aiSucceeded = false;

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
        aiSucceeded = true;
        initialScore = aiResult.score;
        initialAnalysisJson = aiResult.analysisJson;
        analysisOutputText = aiResult.analysisText;
      }
    } catch (aiErr) {
      console.error("Hermes screening execution error:", aiErr);
    }
  }

  const decision = classifyScreening({
    score: initialScore,
    aiSucceeded,
    cvTextLength: cvTextContent.trim().length,
    jobMinScoreThreshold: jobData?.min_score_threshold,
  });

  const analysisJson = {
    ...(initialAnalysisJson || {}),
    screening_outcome: decision.outcome,
    screening_label: decision.label,
    effective_pass_min: decision.effectivePassMin,
    bands: SCREENING_BANDS,
    cv_text_length: cvTextContent.trim().length,
  };

  // 5. Insert Application with Hermes Output directly into Database
  const { data: insertedApp, error: insertErr } = await supabase
    .from("applications")
    .insert({
      candidate_id: profile.id,
      job_id: jobId,
      cv_storage_path: cvStoragePath,
      cv_parsed_name: cvParsedName,
      status: decision.status,
      cv_score: initialScore,
      cv_analysis_json: analysisJson,
    })
    .select("id")
    .single();

  if (insertErr) {
    return { success: false, error: insertErr.message };
  }

  // 6. Proactive Candidate Communication (Asynchronous / Non-blocking)
  if (insertedApp?.id) {
    const createdAppId = insertedApp.id;

    // Trigger EVT_APPLICATION_RECEIVED
    sendRecruitmentEmail({
      eventType: "application_received",
      applicationId: createdAppId,
      candidate: profile,
      job: jobData as any,
    }).catch((err) =>
      console.error("[CommEngine] application_received email error:", err)
    );

    // Trigger Screening Outcome Email
    let outcomeEventType: CommunicationEventType = "screening_review";
    if (decision.outcome === "passed" || decision.status === "screened") {
      outcomeEventType = "screening_passed";
    } else if (decision.outcome === "rejected" || decision.status === "rejected") {
      outcomeEventType = "screening_rejected";
    }

    sendRecruitmentEmail({
      eventType: outcomeEventType,
      applicationId: createdAppId,
      candidate: profile,
      job: jobData as any,
    }).catch((err) =>
      console.error(`[CommEngine] ${outcomeEventType} email error:`, err)
    );
  }

  revalidatePath("/applications");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/applications");
  revalidatePath(`/jobs/${jobData?.title}`);

  return {
    success: true,
    applicationId: insertedApp?.id,
    score: initialScore,
    minScoreThreshold: decision.effectivePassMin,
    analysisText: analysisOutputText,
    status: decision.status,
    outcome: decision.outcome,
    label: decision.label,
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

  const decision = classifyScreening({
    score: aiResult.score ?? null,
    aiSucceeded: aiResult.success,
    cvTextLength: cvTextContent.trim().length,
    jobMinScoreThreshold: app.job?.min_score_threshold,
  });

  const analysisJson = {
    ...(aiResult.analysisJson || (app.cv_analysis_json as any) || {}),
    screening_outcome: decision.outcome,
    screening_label: decision.label,
    effective_pass_min: decision.effectivePassMin,
    bands: SCREENING_BANDS,
    cv_text_length: cvTextContent.trim().length,
  };

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      cv_score: aiResult.score ?? null,
      cv_analysis_json: analysisJson,
      status: decision.status,
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
    score: aiResult.score,
    analysisText: aiResult.analysisText,
    status: decision.status,
    outcome: decision.outcome,
    label: decision.label,
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

  // Communication Trigger for status transitions
  if (status === "invited_interview") {
    sendRecruitmentEmail({
      eventType: "interview_invitation",
      applicationId,
    }).catch((err) =>
      console.error("[CommEngine] interview_invitation trigger error:", err)
    );
  } else if (status === "rejected") {
    sendRecruitmentEmail({
      eventType: "final_rejection",
      applicationId,
    }).catch((err) =>
      console.error("[CommEngine] final_rejection trigger error:", err)
    );
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/applications");
  revalidatePath("/applications");
  return { success: true };
}
