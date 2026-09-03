import { createAdminClient } from "./supabase/server";
import { generateEmailContent, EmailContext } from "./hermes-communicator";
import { sendEmail } from "./email-transport";
import { CommunicationEventType, Application, Job, Profile } from "@/types/database";

export interface SendRecruitmentEmailParams {
  eventType: CommunicationEventType;
  applicationId: string;
  // Optional pre-fetched entities to minimize database roundtrips
  application?: Application;
  job?: Job;
  candidate?: Profile;
  candidateEmailOverride?: string;
  interviewDeadline?: string;
}

export interface CommunicationResult {
  success: boolean;
  skipped?: boolean;
  reason?: string;
  messageId?: string;
  error?: string;
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

/**
 * Check whether an email is eligible to be sent under anti-spam and deduplication policies.
 */
export async function checkCommunicationEligibility(
  applicationId: string,
  candidateId: string,
  eventType: CommunicationEventType
): Promise<EligibilityResult> {
  const supabase = createAdminClient();

  // 1. Deduplication check: Has this event already been queued or sent for this application?
  const { data: existingEvent, error: dedupErr } = await supabase
    .from("communication_logs")
    .select("id, status, created_at")
    .eq("application_id", applicationId)
    .eq("event_type", eventType)
    .in("status", ["queued", "sent"])
    .maybeSingle();

  if (dedupErr) {
    // If table doesn't exist yet or connection failed, log warning but allow flow
    console.warn(`[CommEngine] Deduplication check query warning: ${dedupErr.message}`);
  } else if (existingEvent) {
    return {
      eligible: false,
      reason: `duplicate: event '${eventType}' already recorded with status '${existingEvent.status}'.`,
    };
  }

  // 2. Global candidate cooldown: Has any email been sent to this candidate in the last 10 minutes?
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: recentCandidateEmails } = await supabase
    .from("communication_logs")
    .select("id, created_at")
    .eq("candidate_id", candidateId)
    .gte("created_at", tenMinutesAgo)
    .eq("status", "sent")
    .limit(1);

  if (recentCandidateEmails && recentCandidateEmails.length > 0) {
    return {
      eligible: false,
      reason: "global_cooldown: candidate received an email within the last 10 minutes.",
    };
  }

  // 3. Lifetime cap per application: Maximum 8 emails across entire lifecycle
  const { count: totalSentCount } = await supabase
    .from("communication_logs")
    .select("id", { count: "exact", head: true })
    .eq("application_id", applicationId)
    .in("status", ["queued", "sent"]);

  if (totalSentCount !== null && totalSentCount >= 8) {
    return {
      eligible: false,
      reason: "lifetime_cap: application has reached the maximum cap of 8 lifecycle emails.",
    };
  }

  return { eligible: true };
}

/**
 * Assemble full communication context by resolving application, job, and candidate email.
 */
async function assembleContext(params: SendRecruitmentEmailParams): Promise<{
  context: EmailContext;
  emailTo: string;
  candidateId: string;
  jobId: string;
} | null> {
  const supabase = createAdminClient();

  let app = params.application;
  let job = params.job;
  let candidate = params.candidate;

  if (!app || !job || !candidate) {
    const { data: fetchedApp, error: fetchErr } = await supabase
      .from("applications")
      .select(`
        *,
        job:jobs (*),
        candidate:profiles (*)
      `)
      .eq("id", params.applicationId)
      .single();

    if (fetchErr || !fetchedApp) {
      console.error(`[CommEngine] Failed to resolve application ${params.applicationId}:`, fetchErr);
      return null;
    }

    app = fetchedApp as unknown as Application;
    job = (fetchedApp as any).job as Job;
    candidate = (fetchedApp as any).candidate as Profile;
  }

  if (!candidate || !job) {
    console.error(`[CommEngine] Candidate or job record missing for application ${params.applicationId}`);
    return null;
  }

  let emailTo = params.candidateEmailOverride;
  if (!emailTo && candidate.user_id) {
    try {
      const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(candidate.user_id);
      if (userErr || !userData?.user?.email) {
        console.warn(`[CommEngine] Unable to fetch user email for user_id ${candidate.user_id}: ${userErr?.message}`);
      } else {
        emailTo = userData.user.email;
      }
    } catch (authLookupErr) {
      console.warn(`[CommEngine] Auth admin lookup exception:`, authLookupErr);
    }
  }

  if (!emailTo) {
    console.error(`[CommEngine] Target candidate email address could not be resolved for candidate ${candidate.id}`);
    return null;
  }

  const fullName = candidate.full_name || app.cv_parsed_name || "Kandidat";
  const firstName = fullName.trim().split(/\s+/)[0] || "Kandidat";

  const context: EmailContext = {
    candidateName: fullName,
    candidateFirstName: firstName,
    jobTitle: job.title || "Posisi Rekrutmen",
    jobLocation: job.location,
    applicationId: app.id,
    applicationDate: app.created_at ? new Date(app.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : undefined,
    interviewDeadline: params.interviewDeadline || (app.interview_deadline ? new Date(app.interview_deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : undefined),
    appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  };

  return {
    context,
    emailTo,
    candidateId: candidate.id,
    jobId: job.id,
  };
}

/**
 * Orchestrate end-to-end recruitment email communication:
 * 1. Eligibility & Deduplication
 * 2. Context Assembly
 * 3. Hermes AI Content Generation
 * 4. communication_logs Persistence (queued)
 * 5. Email Transport Dispatch
 * 6. Status Update (sent / failed)
 */
export async function sendRecruitmentEmail(params: SendRecruitmentEmailParams): Promise<CommunicationResult> {
  const { eventType, applicationId } = params;

  try {
    const assembled = await assembleContext(params);
    if (!assembled) {
      return {
        success: false,
        error: "Failed to assemble candidate or application context for email dispatch.",
      };
    }

    const { context, emailTo, candidateId, jobId } = assembled;

    // 1. Eligibility check
    const eligibility = await checkCommunicationEligibility(applicationId, candidateId, eventType);
    if (!eligibility.eligible) {
      console.log(`[CommEngine] Skipped email '${eventType}' for app ${applicationId}: ${eligibility.reason}`);
      return {
        success: true,
        skipped: true,
        reason: eligibility.reason,
      };
    }

    // 2. Content generation with Hermes
    const generated = await generateEmailContent(eventType, context);

    const supabase = createAdminClient();

    // 3. Insert initial log record (status: queued)
    let logId: string | null = null;
    const { data: insertedLog, error: logInsertErr } = await supabase
      .from("communication_logs")
      .insert({
        application_id: applicationId,
        candidate_id: candidateId,
        job_id: jobId,
        event_type: eventType,
        email_to: emailTo,
        email_subject: generated.subject,
        email_body_html: generated.body_html,
        email_body_text: generated.body_text,
        status: "queued",
        hermes_model: generated.modelUsed,
        hermes_duration_ms: generated.durationMs,
      })
      .select("id")
      .maybeSingle();

    if (logInsertErr) {
      console.warn(`[CommEngine] communication_logs insert warning: ${logInsertErr.message}`);
    } else if (insertedLog) {
      logId = insertedLog.id;
    }

    // 4. Dispatch email via Transport
    const transportResult = await sendEmail({
      to: emailTo,
      subject: generated.subject,
      html: generated.body_html,
      text: generated.body_text,
      tags: [
        { name: "event_type", value: eventType },
        { name: "application_id", value: applicationId },
      ],
    });

    // 5. Update log record with final dispatch status
    if (logId) {
      if (transportResult.success) {
        await supabase
          .from("communication_logs")
          .update({
            status: "sent",
            provider_message_id: transportResult.messageId || null,
            sent_at: new Date().toISOString(),
          })
          .eq("id", logId);
      } else {
        await supabase
          .from("communication_logs")
          .update({
            status: "failed",
            error_message: transportResult.error || "Unknown transport error",
          })
          .eq("id", logId);
      }
    }

    return {
      success: transportResult.success,
      messageId: transportResult.messageId,
      error: transportResult.error,
    };
  } catch (error: any) {
    const errMsg = error?.message || "Unhandled exception in sendRecruitmentEmail";
    console.error(`[CommEngine] Exception during email process for app ${applicationId}:`, errMsg);
    return {
      success: false,
      error: errMsg,
    };
  }
}

