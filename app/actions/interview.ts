"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/auth";
import {
  Application,
  Job,
  InterviewMessage,
  InterviewSessionTranscript,
  AIInterviewQuestionCore,
  AIInterviewQuestionFollowUp,
} from "@/types/database";
import {
  runAIInterviewGenerator,
  evaluateInterviewSession,
  normalizeSpeechTranscript,
} from "@/lib/deepseek-interview";

// Competencies to assess for the interview
const INTERVIEW_COMPETENCY_BLUEPRINTS = [
  {
    tag: "problem_solving_and_debugging",
    title: "Pemecahan Masalah & Penanganan Krisis",
    required_topics: ["debugging production issues", "analisis akar masalah (root cause)", "penyelesaian insiden kritis"],
    avoided_topics: ["gaji sebelumnya", "keluarga", "agama", "kehidupan pribadi"],
    max_follow_ups: 1,
  },
  {
    tag: "technical_tradeoffs_and_architecture",
    title: "Pengambilan Keputusan & Arsitektur Teknis",
    required_topics: ["trade-off keputusan teknis", "pertimbangan skalabilitas dan clean code", "standar kualitas arsitektur"],
    avoided_topics: ["usia", "status menikah", "orientasi seksual"],
    max_follow_ups: 1,
  },
  {
    tag: "collaboration_and_ownership",
    title: "Kepemilikan Tugas & Kolaborasi Tim",
    required_topics: ["komunikasi teknis antartim", "kepemilikan mandiri atas tugas", "resolusi silang pendapat teknis"],
    avoided_topics: ["kondisi kesehatan", "alamat rumah", "kehamilan"],
    max_follow_ups: 1,
  },
];

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

  // Validate CV Screening Score: Non-passed candidates are NOT allowed to take the interview
  const minScore = Number((app as any).job?.min_score_threshold || 0);
  const cvScore = Number(app.cv_score || 0);
  if (cvScore < minScore && profile.role !== "admin") {
    return {
      success: false,
      error: "Nilai screening CV belum memenuhi batas kualifikasi minimum lowongan ini untuk mengikuti sesi wawancara AI.",
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
  const candidateName = (app as any).candidate?.full_name || profile.full_name || "Kandidat";
  const firstBlueprint = INTERVIEW_COMPETENCY_BLUEPRINTS[0];

  const fullJobContext = `Posisi: ${jobData?.title || "Lowongan"}
Kandidat: ${candidateName}
Deskripsi Pekerjaan:
${jobData?.description || "Tanggung jawab teknis & operasional posisi ini."}

Kualifikasi & Persyaratan:
${jobData?.requirements || "Standar keahlian dan pengalaman kerja."}`;

  // Generate first core question with full context
  const aiQuestion = (await runAIInterviewGenerator({
    mode: "core",
    role_title: jobData?.title || "Posisi Lamaran",
    job_description: fullJobContext,
    competency_tag: firstBlueprint.tag,
    required_topics: firstBlueprint.required_topics,
    avoided_topics: firstBlueprint.avoided_topics,
    previous_questions: [],
  })) as AIInterviewQuestionCore;

  const firstMessage: InterviewMessage = {
    id: `msg_ai_${Date.now()}`,
    sender: "ai",
    text: aiQuestion?.question_text || `Ceritakan pengalaman nyata Anda dalam menyelesaikan masalah teknis paling menantang pada posisi ${jobData?.title}.`,
    timestamp: new Date().toISOString(),
    competency_tag: firstBlueprint.tag,
    question_type: "core",
    reason: aiQuestion?.reason,
  };

  const initialTranscript: InterviewSessionTranscript = {
    session_id: `session_${Date.now()}`,
    started_at: new Date().toISOString(),
    duration_seconds: 0,
    competencies_tested: [firstBlueprint.tag],
    messages: [firstMessage],
  };

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      interview_started_at: new Date().toISOString(),
      interview_transcript_json: initialTranscript,
      status: "interview_in_progress",
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
  candidateAnswerText: string,
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

  const jobData = (app as any).job as Job;
  const candidateName = (app as any).candidate?.full_name || profile.full_name || "Kandidat";

  const fullJobContext = `Posisi: ${jobData?.title || "Lowongan"}
Kandidat: ${candidateName}
Deskripsi Pekerjaan:
${jobData?.description || "Tanggung jawab teknis & operasional posisi ini."}

Kualifikasi & Persyaratan:
${jobData?.requirements || "Standar keahlian dan pengalaman kerja."}`;

  const currentTranscript = (app.interview_transcript_json as InterviewSessionTranscript) || {
    session_id: `session_${Date.now()}`,
    started_at: new Date().toISOString(),
    duration_seconds: elapsedDurationSeconds,
    competencies_tested: [],
    messages: [],
  };

  const messages = currentTranscript.messages || [];
  const lastAiMessage = [...messages].reverse().find((m) => m.sender === "ai");
  const currentCompetencyTag = lastAiMessage?.competency_tag || INTERVIEW_COMPETENCY_BLUEPRINTS[0].tag;
  const currentBlueprint =
    INTERVIEW_COMPETENCY_BLUEPRINTS.find((b) => b.tag === currentCompetencyTag) ||
    INTERVIEW_COMPETENCY_BLUEPRINTS[0];

  // Clean and normalize speech-to-text transcript
  const normalizedAnswer = normalizeSpeechTranscript(candidateAnswerText);

  // Append candidate message
  const candidateMessage: InterviewMessage = {
    id: `msg_cand_${Date.now()}`,
    sender: "candidate",
    text: normalizedAnswer,
    timestamp: new Date().toISOString(),
    competency_tag: currentCompetencyTag,
  };
  messages.push(candidateMessage);

  // Count how many follow-ups have been asked for this competency
  const followUpsForThisComp = messages.filter(
    (m) => m.sender === "ai" && m.competency_tag === currentCompetencyTag && m.question_type === "follow_up"
  ).length;

  const previousAiQuestions = messages
    .filter((m) => m.sender === "ai")
    .map((m) => m.text);

  let nextAiMessage: InterviewMessage | null = null;
  let isInterviewDone = false;

  // If we haven't reached max follow-ups for this competency, evaluate follow-up
  if (followUpsForThisComp < currentBlueprint.max_follow_ups) {
    const followUpRes = (await runAIInterviewGenerator({
      mode: "follow_up",
      role_title: jobData?.title || "Posisi",
      job_description: fullJobContext,
      competency_tag: currentCompetencyTag,
      required_topics: currentBlueprint.required_topics,
      avoided_topics: currentBlueprint.avoided_topics,
      previous_questions: previousAiQuestions,
      last_answer_transcript: candidateAnswerText,
      max_follow_ups_for_this_competency: currentBlueprint.max_follow_ups,
      already_asked_follow_ups_count: followUpsForThisComp,
    })) as AIInterviewQuestionFollowUp;

    if (followUpRes && followUpRes.need_follow_up && followUpRes.follow_up_question) {
      nextAiMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: "ai",
        text: followUpRes.follow_up_question,
        timestamp: new Date().toISOString(),
        competency_tag: currentCompetencyTag,
        question_type: "follow_up",
        gap_targeted: followUpRes.gap_targeted,
        reason: followUpRes.reason,
      };
      messages.push(nextAiMessage);
    }
  }

  // If no follow-up needed (or max follow-up reached), transition to next competency
  if (!nextAiMessage) {
    const currentCompIndex = INTERVIEW_COMPETENCY_BLUEPRINTS.findIndex(
      (b) => b.tag === currentCompetencyTag
    );
    const nextBlueprint = INTERVIEW_COMPETENCY_BLUEPRINTS[currentCompIndex + 1];

    if (nextBlueprint) {
      // Generate Next Core Question
      const nextCoreQuestion = (await runAIInterviewGenerator({
        mode: "core",
        role_title: jobData?.title || "Posisi",
        job_description: fullJobContext,
        competency_tag: nextBlueprint.tag,
        required_topics: nextBlueprint.required_topics,
        avoided_topics: nextBlueprint.avoided_topics,
        previous_questions: previousAiQuestions,
      })) as AIInterviewQuestionCore;

      nextAiMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: "ai",
        text: nextCoreQuestion?.question_text || `Bagaimana pendekatan Anda terkait ${nextBlueprint.title}?`,
        timestamp: new Date().toISOString(),
        competency_tag: nextBlueprint.tag,
        question_type: "core",
        reason: nextCoreQuestion?.reason,
      };
      messages.push(nextAiMessage);

      if (!currentTranscript.competencies_tested.includes(nextBlueprint.tag)) {
        currentTranscript.competencies_tested.push(nextBlueprint.tag);
      }
    } else {
      // ALL COMPETENCIES ARE COMPLETED!
      isInterviewDone = true;
    }
  }

  let finalEvaluation = currentTranscript.overall_evaluation;

  if (isInterviewDone) {
    // Generate overall evaluation
    finalEvaluation = await evaluateInterviewSession({
      candidateName: (app as any).candidate?.full_name || profile.full_name || "Kandidat",
      roleTitle: jobData?.title || "Posisi Lowongan",
      durationSeconds: elapsedDurationSeconds,
      messages,
      competenciesTested: currentTranscript.competencies_tested,
    });
  }

  const updatedTranscript: InterviewSessionTranscript = {
    ...currentTranscript,
    duration_seconds: elapsedDurationSeconds,
    completed_at: isInterviewDone ? new Date().toISOString() : undefined,
    messages,
    overall_evaluation: finalEvaluation,
  };

  const updatePayload: any = {
    interview_transcript_json: updatedTranscript,
    interview_duration_seconds: elapsedDurationSeconds,
  };

  if (isInterviewDone) {
    updatePayload.status = "interview_completed";
    updatePayload.interview_completed_at = new Date().toISOString();
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
    transcript: updatedTranscript,
    evaluation: finalEvaluation,
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
  const candidateName = (app as any).candidate?.full_name || "Kandidat";

  const newEvaluation = await evaluateInterviewSession({
    candidateName,
    roleTitle: jobData?.title || "Posisi",
    durationSeconds: app.interview_duration_seconds || transcript.duration_seconds || 120,
    messages: transcript.messages,
    competenciesTested: transcript.competencies_tested || ["technical_problem_solving"],
  });

  const updatedTranscript: InterviewSessionTranscript = {
    ...transcript,
    overall_evaluation: newEvaluation,
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
    success: true,
    evaluation: newEvaluation,
  };
}
