"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/auth";
import {
  Application,
  Job,
  InterviewMessage,
  InterviewSessionTranscript,
  InterviewScriptItem,
} from "@/types/database";
import {
  generateInterviewScript,
  generateFollowUp,
  evaluateInterviewSessionHermes,
} from "@/lib/hermes-interview";
import { normalizeSpeechTranscript } from "@/lib/speech-normalizer";

const FOLLOW_UPS_PER_COMPETENCY = 1;

async function loadOrGenerateScript(
  supabase: any,
  jobData: Job,
): Promise<{ script: InterviewScriptItem[] | null; error?: string }> {
  const existing = (jobData as any)?.interview_blueprints_json as
    | InterviewScriptItem[]
    | null;

  if (Array.isArray(existing) && existing.length >= 3) {
    return { script: existing };
  }

  const gen = await generateInterviewScript({
    roleTitle: jobData?.title || "",
    jobDescription: jobData?.description || "",
    jobRequirements: jobData?.requirements || "",
  });

  if (!gen.success || !gen.script) {
    return {
      script: null,
      error:
        "Hermes belum dapat menyusun kerangka wawancara untuk lowongan ini. Silakan coba beberapa saat lagi.",
    };
  }

  await supabase
    .from("jobs")
    .update({ interview_blueprints_json: gen.script })
    .eq("id", jobData.id);

  return { script: gen.script };
}

function jobTextOf(job: Job | null): string {
  return `${job?.title || ""} ${job?.description || ""} ${job?.requirements || ""}`;
}

// 1. START INTERVIEW ACTION
export async function startInterviewAction(applicationId: string) {
  const { profile } = await requireProfile();
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

  // Authorization check
  if (profile.role !== "admin" && app.candidate_id !== profile.id) {
    return { success: false, error: "Anda tidak memiliki akses ke sesi wawancara ini." };
  }

  const outcome = (app.cv_analysis_json as any)?.screening_outcome;

  if (profile.role !== "admin" && outcome !== "passed") {
    return {
      success: false,
      error:
        outcome === "rejected"
          ? "Lamaran Anda belum memenuhi kualifikasi minimum untuk posisi ini."
          : "Lamaran Anda masih dalam proses tinjauan recruiter.",
    };
  }

  const now = new Date();

  // Check deadline expiration rule
  if (app.interview_deadline && new Date(app.interview_deadline) < now && app.status !== "interview_completed") {
    await supabase
      .from("applications")
      .update({ status: "withdrawn_expired" })
      .eq("id", applicationId);

    revalidatePath("/applications");
    revalidatePath(`/applications/${applicationId}/interview`);
    return {
      success: false,
      isExpired: true,
      error: "Batas waktu wawancara telah berakhir. Status lamaran Anda ditandai sebagai Mengundurkan Diri.",
    };
  }

  // If already completed
  if (app.status === "interview_completed" && app.interview_transcript_json) {
    return {
      success: true,
      isAlreadyCompleted: true,
      transcript: app.interview_transcript_json as InterviewSessionTranscript,
      application: app,
    };
  }

  // If already in progress, resume
  const existingTranscript = app.interview_transcript_json as InterviewSessionTranscript | null;
  if (existingTranscript && existingTranscript.messages?.length > 0) {
    return {
      success: true,
      isResumed: true,
      transcript: existingTranscript,
      application: app,
    };
  }

  const jobData = (app as any).job as Job;

  const { script, error: scriptErr } = await loadOrGenerateScript(supabase, jobData);
  if (!script) {
    return { success: false, error: scriptErr };
  }

  const firstItem = script[0];
  const firstMessage: InterviewMessage = {
    id: `msg_ai_${Date.now()}`,
    sender: "ai",
    text: firstItem.question_text,
    timestamp: new Date().toISOString(),
    competency_tag: firstItem.tag,
    question_type: "core",
    question_source: "script",
    reason: firstItem.scenario_context,
  };

  const initialTranscript: InterviewSessionTranscript = {
    session_id: `sess_${applicationId}_${Date.now()}`,
    started_at: new Date().toISOString(),
    duration_seconds: 0,
    competencies_tested: script.map((s) => s.tag),
    blueprints: script,
    messages: [firstMessage],
  };

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      status: "interview_in_progress",
      interview_started_at: initialTranscript.started_at,
      interview_transcript_json: initialTranscript,
    })
    .eq("id", applicationId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/applications");
  revalidatePath(`/applications/${applicationId}/interview`);

  return {
    success: true,
    transcript: initialTranscript,
    application: app,
  };
}

// 2. SUBMIT CANDIDATE ANSWER & GET NEXT QUESTION / COMPLETE
export async function submitAnswerAndGetNextAction(
  applicationId: string,
  rawAnswerText: string,
  elapsedDurationSeconds: number
) {
  const { profile } = await requireProfile();
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

  if (profile.role !== "admin" && app.candidate_id !== profile.id) {
    return { success: false, error: "Tidak memiliki akses." };
  }

  // Check deadline
  if (app.interview_deadline && new Date(app.interview_deadline) < new Date()) {
    await supabase
      .from("applications")
      .update({ status: "withdrawn_expired" })
      .eq("id", applicationId);

    return {
      success: false,
      isExpired: true,
      error: "Batas waktu pengerjaan wawancara telah berakhir.",
    };
  }

  const transcript = (app.interview_transcript_json as InterviewSessionTranscript) || {
    session_id: `sess_${applicationId}_${Date.now()}`,
    started_at: new Date().toISOString(),
    duration_seconds: elapsedDurationSeconds,
    competencies_tested: [],
    messages: [],
  };
  const jobData = (app as any).job as Job;
  const jobText = jobTextOf(jobData);

  const script: InterviewScriptItem[] =
    transcript.blueprints ||
    ((jobData as any)?.interview_blueprints_json as InterviewScriptItem[]) ||
    [];

  if (script.length === 0) {
    return { success: false, error: "Kerangka wawancara tidak ditemukan pada sesi ini." };
  }

  const messages = [...(transcript.messages || [])];

  const candidateAnswerText = normalizeSpeechTranscript(rawAnswerText, jobText);
  messages.push({
    id: `msg_cand_${Date.now()}`,
    sender: "candidate",
    text: candidateAnswerText,
    timestamp: new Date().toISOString(),
  });

  // Posisi kompetensi saat ini = jumlah core question yang sudah diajukan - 1
  const coreAsked = messages.filter(
    (m) => m.sender === "ai" && m.question_type === "core"
  ).length;
  const currentIndex = Math.max(0, coreAsked - 1);
  const currentItem = script[currentIndex];

  const followUpsForCurrent = messages.filter(
    (m) =>
      m.sender === "ai" &&
      m.question_type === "follow_up" &&
      m.competency_tag === currentItem.tag
  ).length;

  const previousAiQuestions = messages
    .filter((m) => m.sender === "ai")
    .map((m) => m.text);

  const lastAiQuestion =
    [...messages].reverse().find((m) => m.sender === "ai")?.text || "";

  let nextAiMessage: InterviewMessage | null = null;
  let isInterviewDone = false;

  if (followUpsForCurrent < FOLLOW_UPS_PER_COMPETENCY) {
    // Tahap follow-up untuk kompetensi ini
    const fu = await generateFollowUp({
      roleTitle: jobData?.title || "Posisi",
      jobText,
      competencyTitle: currentItem.title,
      requiredTopics: currentItem.required_topics,
      lastQuestion: lastAiQuestion,
      lastAnswer: candidateAnswerText,
      previousQuestions: previousAiQuestions,
      preparedProbe: currentItem.prepared_probe,
    });

    nextAiMessage = {
      id: `msg_ai_${Date.now()}`,
      sender: "ai",
      text: fu.question,
      timestamp: new Date().toISOString(),
      competency_tag: currentItem.tag,
      question_type: "follow_up",
      question_source: fu.source,
      quoted_span: fu.quotedSpan,
      gap_targeted: fu.gapType,
      reason: fu.reason,
    };
  } else if (currentIndex + 1 < script.length) {
    // Pindah ke kompetensi berikutnya
    const nextItem = script[currentIndex + 1];
    nextAiMessage = {
      id: `msg_ai_${Date.now()}`,
      sender: "ai",
      text: nextItem.question_text,
      timestamp: new Date().toISOString(),
      competency_tag: nextItem.tag,
      question_type: "core",
      question_source: "script",
      reason: nextItem.scenario_context,
    };
  } else {
    isInterviewDone = true;
  }

  if (nextAiMessage) messages.push(nextAiMessage);

  let evaluation: any = transcript.overall_evaluation;

  if (isInterviewDone) {
    // Evaluate full interview transcript via Hermes
    evaluation = await evaluateInterviewSessionHermes({
      candidateName: (app as any).candidate?.full_name || app.cv_parsed_name || profile.full_name || "Kandidat",
      roleTitle: jobData?.title || "",
      jobDescription: jobData?.description || "",
      jobRequirements: jobData?.requirements || "",
      blueprints: script,
      durationSeconds: elapsedDurationSeconds,
      messages,
    });
  }

  const finalTranscript: InterviewSessionTranscript = {
    ...transcript,
    duration_seconds: elapsedDurationSeconds,
    completed_at: isInterviewDone ? new Date().toISOString() : undefined,
    messages,
    blueprints: script,
    ...(evaluation
      ? { overall_evaluation: evaluation, evaluation_status: "completed" }
      : isInterviewDone
      ? { evaluation_status: "pending" }
      : {}),
  };

  const updatePayload: any = {
    interview_transcript_json: finalTranscript,
    interview_duration_seconds: elapsedDurationSeconds,
  };

  if (isInterviewDone) {
    updatePayload.status = "interview_completed";
    updatePayload.interview_completed_at = finalTranscript.completed_at;
  }

  await supabase
    .from("applications")
    .update(updatePayload)
    .eq("id", applicationId);

  revalidatePath("/applications");
  revalidatePath(`/applications/${applicationId}/interview`);
  revalidatePath("/admin/applications");

  return {
    success: true,
    isInterviewDone,
    transcript: finalTranscript,
    evaluation: evaluation || undefined,
    durationSeconds: elapsedDurationSeconds,
  };
}

// 3. RE-EVALUATE INTERVIEW SESSION (Admin On-Demand Action)
export async function reEvaluateInterviewAction(applicationId: string) {
  const { profile } = await requireProfile();
  if (profile.role !== "admin") {
    return { success: false, error: "Hanya Admin HRD yang dapat melakukan evaluasi ulang." };
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

  const transcript = app.interview_transcript_json as InterviewSessionTranscript;
  if (!transcript || !transcript.messages || transcript.messages.length === 0) {
    return { success: false, error: "Transkrip wawancara belum tersedia." };
  }

  const jobData = (app as any).job as Job;
  const candidateName = (app as any).candidate?.full_name || app.cv_parsed_name || "Kandidat";

  const script: InterviewScriptItem[] =
    transcript.blueprints ||
    ((jobData as any)?.interview_blueprints_json as InterviewScriptItem[]) ||
    [];

  const durationSec = app.interview_duration_seconds || transcript.duration_seconds || 120;

  const newEvaluation = await evaluateInterviewSessionHermes({
    candidateName,
    roleTitle: jobData?.title || "Posisi",
    jobDescription: jobData?.description || "",
    jobRequirements: jobData?.requirements || "",
    blueprints: script,
    durationSeconds: durationSec,
    messages: transcript.messages,
  });

  const updatedTranscript: InterviewSessionTranscript = {
    ...transcript,
    blueprints: script,
    ...(newEvaluation
      ? { overall_evaluation: newEvaluation, evaluation_status: "completed" }
      : { evaluation_status: "pending" }),
  };

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      interview_transcript_json: updatedTranscript,
    })
    .eq("id", applicationId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/admin/applications");
  revalidatePath(`/applications/${applicationId}/interview`);

  return {
    success: !!newEvaluation,
    evaluation: newEvaluation,
    error: newEvaluation ? undefined : "Hermes belum dapat mengevaluasi transkrip ini. Silakan coba sesaat lagi.",
  };
}
