import { createAdminClient } from "./supabase/server";
import {
  generateEmailContent,
  generateWhatsAppContent,
  EmailContext,
  CommunicationContext,
} from "./hermes-communicator";
import { sendEmail } from "./email-transport";
import { sendWhatsAppViaHermes, normalizePhoneNumber } from "./hermes-whatsapp-transport";
import {
  CommunicationEventType,
  CommunicationChannel,
  CommunicationStatus,
  Application,
  Job,
  Profile,
} from "@/types/database";

export interface SendRecruitmentEmailParams {
  eventType: CommunicationEventType;
  applicationId: string;
  // Optional pre-fetched entities to minimize database roundtrips
  application?: Application;
  job?: Job;
  candidate?: Profile;
  candidateEmailOverride?: string;
  candidatePhoneOverride?: string;
  interviewDeadline?: string;
}

export interface RecruitmentNotificationParams extends SendRecruitmentEmailParams {
  channels?: CommunicationChannel[]; // e.g. ['email', 'whatsapp']
}

export interface CommunicationResult {
  success: boolean;
  skipped?: boolean;
  reason?: string;
  messageId?: string;
  error?: string;
}

export interface MultiChannelCommunicationResult {
  email?: CommunicationResult;
  whatsapp?: CommunicationResult;
  success: boolean;
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

export interface PhoneResolutionResult {
  phone: string | null;
  source: "override" | "profile" | "auth_metadata" | "cv_extraction" | "none";
  rawPhone?: string | null;
}

/**
 * Resolves candidate phone number using a multi-tier fallback cascade:
 *
 * Tier 0: Direct explicit parameter override (candidatePhoneOverride)
 * Tier 1: Candidate Profile & Supabase Auth
 *         - profiles.phone (if column/field present)
 *         - auth.users (phone or user_metadata.phone / user_metadata.phone_number / mobile / contact)
 * Tier 2: Document CV analysis extraction
 *         - applications.cv_analysis_json (candidate_phone, phone, contact_number, kontak, contact_phone, etc.)
 *         - applications.cv_analysis_json.personal_info?.phone, personal_details?.phone, etc.
 * Tier 3: Direct application column (if applications.phone / candidate_phone exists)
 */
export async function resolveCandidatePhoneNumber(
  supabase: any,
  params: {
    candidatePhoneOverride?: string;
    candidate?: Profile;
    candidateId?: string;
    application?: Application | any;
    applicationId?: string;
  }
): Promise<PhoneResolutionResult> {
  // Tier 0: Explicit Override
  if (params.candidatePhoneOverride) {
    const normalized = normalizePhoneNumber(params.candidatePhoneOverride);
    if (normalized && normalized.length >= 9) {
      return {
        phone: normalized,
        source: "override",
        rawPhone: params.candidatePhoneOverride,
      };
    }
  }

  let rawFound: string | null = null;
  let source: PhoneResolutionResult["source"] = "none";

  const candidateId = params.candidateId || params.candidate?.id;
  let userId = params.candidate?.user_id;

  // Tier 1: Profile & Supabase Auth
  // 1a. Check profile.phone
  if (params.candidate?.phone) {
    rawFound = params.candidate.phone;
    source = "profile";
  } else if (candidateId) {
    try {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("id, user_id, phone")
        .eq("id", candidateId)
        .maybeSingle();

      if (profileRow?.phone) {
        rawFound = profileRow.phone;
        source = "profile";
      }
      if (!userId && profileRow?.user_id) {
        userId = profileRow.user_id;
      }
    } catch (profErr) {
      console.warn("[CommEngine:PhoneResolution] Profile lookup warning:", profErr);
    }
  }

  // 1b. Check auth.users if not found in profile
  if (!rawFound && userId) {
    try {
      const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(userId);
      if (!userErr && userData?.user) {
        const user = userData.user;
        if (user.phone) {
          rawFound = user.phone;
          source = "auth_metadata";
        } else if (user.user_metadata) {
          const meta = user.user_metadata;
          const metaPhone =
            meta.phone ||
            meta.phone_number ||
            meta.mobile ||
            meta.contact ||
            meta.contact_number ||
            meta.whatsapp ||
            meta.whatsapp_number;
          if (metaPhone && typeof metaPhone === "string") {
            rawFound = metaPhone;
            source = "auth_metadata";
          }
        }
      }
    } catch (authErr) {
      console.warn("[CommEngine:PhoneResolution] Auth user metadata lookup warning:", authErr);
    }
  }

  // Tier 2: Document CV analysis extraction
  if (!rawFound) {
    let cvAnalysis = params.application?.cv_analysis_json;
    if (!cvAnalysis && params.applicationId) {
      try {
        const { data: appRow } = await supabase
          .from("applications")
          .select("cv_analysis_json")
          .eq("id", params.applicationId)
          .maybeSingle();
        cvAnalysis = appRow?.cv_analysis_json;
      } catch (appErr) {
        console.warn("[CommEngine:PhoneResolution] Application CV lookup warning:", appErr);
      }
    }

    if (cvAnalysis && typeof cvAnalysis === "object") {
      const candidatePhoneKeys = [
        "candidate_phone",
        "phone",
        "contact_number",
        "kontak",
        "contact_phone",
        "nomor_telepon",
        "no_hp",
        "no_wa",
        "whatsapp",
        "handphone",
        "mobile",
        "telephone",
      ];

      for (const key of candidatePhoneKeys) {
        if (
          cvAnalysis[key] &&
          typeof cvAnalysis[key] === "string" &&
          cvAnalysis[key].trim().length >= 8
        ) {
          rawFound = cvAnalysis[key].trim();
          source = "cv_extraction";
          break;
        }
      }

      // Check nested sections (personal_info, personal_details, candidate_info, etc.)
      if (!rawFound) {
        const nestedSections = [
          (cvAnalysis as any).personal_info,
          (cvAnalysis as any).personal_details,
          (cvAnalysis as any).candidate_info,
          (cvAnalysis as any).contact_info,
          (cvAnalysis as any).kontak_info,
          (cvAnalysis as any).evaluation,
        ];

        for (const section of nestedSections) {
          if (section && typeof section === "object") {
            for (const key of candidatePhoneKeys) {
              if (
                section[key] &&
                typeof section[key] === "string" &&
                section[key].trim().length >= 8
              ) {
                rawFound = section[key].trim();
                source = "cv_extraction";
                break;
              }
            }
            if (rawFound) break;
          }
        }
      }
    }
  }

  // Tier 3: Direct Application column
  if (!rawFound && (params.application as any)?.phone) {
    rawFound = (params.application as any).phone;
    source = "cv_extraction";
  }

  if (rawFound) {
    const normalized = normalizePhoneNumber(rawFound);
    if (normalized && normalized.length >= 9) {
      return {
        phone: normalized,
        source,
        rawPhone: rawFound,
      };
    }
  }

  return {
    phone: null,
    source: "none",
    rawPhone: rawFound,
  };
}

/**
 * Check whether a communication is eligible to be sent under anti-spam and deduplication policies.
 */
export async function checkCommunicationEligibility(
  applicationId: string,
  candidateId: string,
  eventType: CommunicationEventType,
  channel: CommunicationChannel = "email"
): Promise<EligibilityResult> {
  const supabase = createAdminClient();

  // 1. Deduplication check: Has this event already been queued or sent for this application and channel?
  try {
    const { data: existingEvent, error: dedupErr } = await supabase
      .from("communication_logs")
      .select("id, status, created_at")
      .eq("application_id", applicationId)
      .eq("event_type", eventType)
      .eq("channel", channel)
      .in("status", ["queued", "sent"])
      .maybeSingle();

    if (!dedupErr && existingEvent) {
      return {
        eligible: false,
        reason: `duplicate: event '${eventType}' (${channel}) already recorded with status '${existingEvent.status}'.`,
      };
    }
  } catch {
    // If channel column not present in schema yet, fallback to legacy query without channel filter
    const { data: existingLegacy } = await supabase
      .from("communication_logs")
      .select("id, status")
      .eq("application_id", applicationId)
      .eq("event_type", eventType)
      .in("status", ["queued", "sent"])
      .maybeSingle();

    if (existingLegacy && channel === "email") {
      return {
        eligible: false,
        reason: `duplicate: event '${eventType}' already recorded with status '${existingLegacy.status}'.`,
      };
    }
  }

  // 2. Global candidate cooldown: Has any communication been sent to this candidate in the last 10 minutes?
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: recentCandidateComms } = await supabase
    .from("communication_logs")
    .select("id, created_at")
    .eq("candidate_id", candidateId)
    .gte("created_at", tenMinutesAgo)
    .eq("status", "sent")
    .limit(1);

  if (recentCandidateComms && recentCandidateComms.length > 0) {
    return {
      eligible: false,
      reason: "global_cooldown: candidate received a communication within the last 10 minutes.",
    };
  }

  // 3. Lifetime cap per application: Maximum 8 communications across entire lifecycle
  const { count: totalSentCount } = await supabase
    .from("communication_logs")
    .select("id", { count: "exact", head: true })
    .eq("application_id", applicationId)
    .in("status", ["queued", "sent"]);

  if (totalSentCount !== null && totalSentCount >= 8) {
    return {
      eligible: false,
      reason: "lifetime_cap: application has reached the maximum cap of 8 lifecycle communications.",
    };
  }

  return { eligible: true };
}

/**
 * Resolves specific action URL for candidate Call-to-Action buttons based on event type.
 */
export function resolveActionUrl(
  eventType: CommunicationEventType,
  applicationId: string,
  customBaseUrl?: string
): string {
  const baseUrl = (customBaseUrl || process.env.APP_BASE_URL || "https://smarthr.my.id").replace(/\/+$/, "");

  switch (eventType) {
    case "screening_passed":
    case "personality_reminder":
      return `${baseUrl}/applications/${applicationId}/personality-test`;

    case "interview_invitation":
    case "interview_reminder_48h":
    case "interview_reminder_24h":
      return `${baseUrl}/applications/${applicationId}/interview`;

    case "application_received":
    case "screening_review":
    case "screening_rejected":
    case "personality_completed":
    case "interview_completed":
    case "interview_expired":
    case "final_rejection":
    default:
      return `${baseUrl}/applications/${applicationId}`;
  }
}

/**
 * Assemble full communication context by resolving application, job, candidate email, and candidate phone.
 */
async function assembleContext(params: SendRecruitmentEmailParams): Promise<{
  context: EmailContext;
  emailTo: string;
  phoneTo: string | null;
  candidateId: string;
  jobId: string;
  candidatePhone?: string | null;
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

  // 1. Resolve Candidate Email
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

  // 2. Resolve Candidate Phone Number using Multi-Tier Fallback Cascade
  const phoneResolution = await resolveCandidatePhoneNumber(supabase, {
    candidatePhoneOverride: params.candidatePhoneOverride,
    candidate,
    candidateId: candidate.id,
    application: app,
    applicationId: app.id,
  });

  const phoneTo = phoneResolution.phone;
  if (phoneTo) {
    console.log(
      `[CommEngine:PhoneResolution] Phone resolved for candidate ${candidate.id}: ${phoneTo} (source: ${phoneResolution.source})`
    );
  }

  const fullName = candidate.full_name || app.cv_parsed_name || "Kandidat";
  const firstName = fullName.trim().split(/\s+/)[0] || "Kandidat";
  const baseUrl = (process.env.APP_BASE_URL || "https://smarthr.my.id").replace(/\/+$/, "");
  const actionUrl = resolveActionUrl(params.eventType, app.id, baseUrl);

  const context: EmailContext = {
    candidateName: fullName,
    candidateFirstName: firstName,
    jobTitle: job.title || "Posisi Rekrutmen",
    jobLocation: job.location,
    applicationId: app.id,
    applicationDate: app.created_at ? new Date(app.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : undefined,
    interviewDeadline: params.interviewDeadline || (app.interview_deadline ? new Date(app.interview_deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : undefined),
    appBaseUrl: baseUrl,
    actionUrl,
  };

  return {
    context,
    emailTo,
    phoneTo,
    candidateId: candidate.id,
    jobId: job.id,
    candidatePhone: (app as any).phone || candidate.phone || null,
  };
}

/**
 * Resilient helper to insert a log entry into communication_logs.
 * Automatically falls back to legacy schema if 'channel' or 'phone_to' columns are not yet migrated in Supabase.
 */
async function recordCommunicationLog(
  supabase: any,
  payload: {
    application_id: string;
    candidate_id: string;
    job_id: string;
    event_type: CommunicationEventType;
    channel: CommunicationChannel;
    email_to: string;
    phone_to?: string | null;
    email_subject: string;
    email_body_html: string;
    email_body_text: string | null;
    status: CommunicationStatus;
    hermes_model?: string | null;
    hermes_duration_ms?: number | null;
    error_message?: string | null;
  }
): Promise<string | null> {
  const { data, error } = await supabase
    .from("communication_logs")
    .insert(payload)
    .select("id")
    .maybeSingle();

  if (error) {
    // If column 'channel' or 'phone_to' does not exist yet (migration pending), retry without them
    if (error.code === "42703" || error.message?.includes("channel") || error.message?.includes("phone_to")) {
      const { channel, phone_to, ...legacyPayload } = payload;
      const { data: legacyData, error: legacyErr } = await supabase
        .from("communication_logs")
        .insert(legacyPayload)
        .select("id")
        .maybeSingle();
      if (legacyErr) {
        console.warn(`[CommEngine] Legacy communication_logs insert warning: ${legacyErr.message}`);
        return null;
      }
      return legacyData?.id || null;
    }
    console.warn(`[CommEngine] communication_logs insert warning: ${error.message}`);
    return null;
  }

  return data?.id || null;
}

/**
 * Dispatch Email Channel
 */
async function dispatchEmailChannel(
  supabase: any,
  assembled: { context: EmailContext; emailTo: string; candidateId: string; jobId: string },
  eventType: CommunicationEventType,
  applicationId: string
): Promise<CommunicationResult> {
  const { context, emailTo, candidateId, jobId } = assembled;

  // 1. Eligibility check
  const eligibility = await checkCommunicationEligibility(applicationId, candidateId, eventType, "email");
  if (!eligibility.eligible) {
    console.log(`[CommEngine] Skipped email '${eventType}' for app ${applicationId}: ${eligibility.reason}`);
    return { success: true, skipped: true, reason: eligibility.reason };
  }

  // 2. Generate content with Hermes
  const generated = await generateEmailContent(eventType, context);
  let hermesErrorMessage: string | null = null;
  if (generated.hermes_error) {
    hermesErrorMessage = `[Fallback Used] Hermes Failed: ${generated.hermes_error}`;
    console.warn("[CommEngine] Dispatched email using fallback due to:", generated.hermes_error);
  }

  // 3. Insert initial log record (status: queued)
  const logId = await recordCommunicationLog(supabase, {
    application_id: applicationId,
    candidate_id: candidateId,
    job_id: jobId,
    event_type: eventType,
    channel: "email",
    email_to: emailTo,
    phone_to: null,
    email_subject: generated.subject,
    email_body_html: generated.body_html,
    email_body_text: generated.body_text,
    status: "queued",
    hermes_model: generated.hermes_model || generated.modelUsed,
    hermes_duration_ms: generated.hermes_duration_ms || generated.durationMs,
    error_message: hermesErrorMessage,
  });

  // 4. Dispatch email via Transport
  let transportResult;
  try {
    transportResult = await sendEmail({
      to: emailTo,
      subject: generated.subject,
      html: generated.body_html,
      text: generated.body_text,
      tags: [
        { name: "event_type", value: eventType },
        { name: "application_id", value: applicationId },
      ],
    });
  } catch (err: any) {
    transportResult = { success: false, error: err?.message || "Transport dispatch error" };
  }

  // 5. Update log record with final dispatch status
  if (logId) {
    if (transportResult.success) {
      await supabase
        .from("communication_logs")
        .update({
          status: "sent",
          provider_message_id: transportResult.messageId || null,
          sent_at: new Date().toISOString(),
          error_message: hermesErrorMessage,
        })
        .eq("id", logId);
    } else {
      const combinedError = hermesErrorMessage
        ? `${hermesErrorMessage} | Transport Error: ${transportResult.error || "Unknown transport error"}`
        : (transportResult.error || "Unknown transport error");

      await supabase
        .from("communication_logs")
        .update({
          status: "failed",
          error_message: combinedError,
        })
        .eq("id", logId);
    }
  }

  return {
    success: transportResult.success,
    messageId: transportResult.messageId,
    error: transportResult.error,
  };
}

/**
 * Dispatch WhatsApp Channel via Native Hermes Agent Gateway
 */
async function dispatchWhatsAppChannel(
  supabase: any,
  assembled: { context: EmailContext; emailTo: string; phoneTo: string | null; candidateId: string; jobId: string },
  eventType: CommunicationEventType,
  applicationId: string
): Promise<CommunicationResult> {
  const { context, emailTo, phoneTo, candidateId, jobId } = assembled;

  // Multi-Tier Phone Number Check: Missing Phone Handling
  if (!phoneTo) {
    console.warn(
      `[CommunicationEngine:Warning] Nomor WhatsApp kandidat tidak ditemukan untuk application_id: ${applicationId}. Dispatch WhatsApp dilewati.`
    );

    // Record skipped/failed log transparently in communication_logs
    await recordCommunicationLog(supabase, {
      application_id: applicationId,
      candidate_id: candidateId,
      job_id: jobId,
      event_type: eventType,
      channel: "whatsapp",
      email_to: emailTo || "",
      phone_to: null,
      email_subject: `WhatsApp Notification: ${eventType}`,
      email_body_html: "",
      email_body_text: null,
      status: "failed",
      error_message: "Phone number missing",
    });

    return {
      success: false,
      skipped: true,
      reason: "Phone number missing",
      error: "Phone number missing",
    };
  }

  // 1. Eligibility check
  const eligibility = await checkCommunicationEligibility(applicationId, candidateId, eventType, "whatsapp");
  if (!eligibility.eligible) {
    console.log(`[CommEngine] Skipped WhatsApp '${eventType}' for app ${applicationId}: ${eligibility.reason}`);
    return { success: true, skipped: true, reason: eligibility.reason };
  }

  // 2. Generate WhatsApp formatted content with Hermes
  const generated = await generateWhatsAppContent(eventType, context);
  let hermesErrorMessage: string | null = null;
  if (generated.hermes_error) {
    hermesErrorMessage = `[Fallback Used] Hermes Failed: ${generated.hermes_error}`;
    console.warn("[CommEngine] Dispatched WhatsApp using fallback due to:", generated.hermes_error);
  }

  // 3. Insert initial log record (status: queued, with phone_to recorded)
  const logId = await recordCommunicationLog(supabase, {
    application_id: applicationId,
    candidate_id: candidateId,
    job_id: jobId,
    event_type: eventType,
    channel: "whatsapp",
    email_to: emailTo,
    phone_to: phoneTo,
    email_subject: `WhatsApp Notification: ${eventType}`,
    email_body_html: "",
    email_body_text: generated.message,
    status: "queued",
    hermes_model: generated.hermes_model,
    hermes_duration_ms: generated.hermes_duration_ms,
    error_message: hermesErrorMessage,
  });

  // 4. Dispatch via Native Hermes WhatsApp Gateway Transport
  let transportResult;
  try {
    transportResult = await sendWhatsAppViaHermes({
      to: phoneTo,
      message: generated.message,
    });
  } catch (err: any) {
    transportResult = { success: false, error: err?.message || "Hermes Gateway error" };
  }

  // 5. Update log record with final dispatch status
  if (logId) {
    if (transportResult.success) {
      await supabase
        .from("communication_logs")
        .update({
          status: "sent",
          phone_to: phoneTo,
          provider_message_id: transportResult.messageId || null,
          sent_at: new Date().toISOString(),
          error_message: hermesErrorMessage,
        })
        .eq("id", logId);
    } else {
      const combinedError = hermesErrorMessage
        ? `${hermesErrorMessage} | Gateway Error: ${transportResult.error || "Unknown gateway error"}`
        : (transportResult.error || "Unknown gateway error");

      await supabase
        .from("communication_logs")
        .update({
          status: "failed",
          phone_to: phoneTo,
          error_message: combinedError,
        })
        .eq("id", logId);
    }
  }

  return {
    success: transportResult.success,
    messageId: transportResult.messageId,
    error: transportResult.error,
  };
}

/**
 * Main Multi-Channel Recruitment Notification Orchestrator:
 * Supports Email and native Hermes WhatsApp Gateway in parallel.
 */
export async function sendRecruitmentNotification(
  params: RecruitmentNotificationParams
): Promise<MultiChannelCommunicationResult> {
  const defaultChannels: CommunicationChannel[] =
    process.env.WHATSAPP_ENABLED === "true" ? ["email", "whatsapp"] : ["email"];
  const { eventType, applicationId, channels = defaultChannels } = params;
  const supabase = createAdminClient();

  try {
    const assembled = await assembleContext(params);
    if (!assembled) {
      return {
        success: false,
        email: { success: false, error: "Failed to assemble candidate context" },
      };
    }

    const result: MultiChannelCommunicationResult = { success: true };

    // 1. Dispatch Email channel if requested
    if (channels.includes("email")) {
      result.email = await dispatchEmailChannel(supabase, assembled, eventType, applicationId);
      if (!result.email.success && !result.email.skipped) {
        result.success = false;
      }
    }

    // 2. Dispatch WhatsApp channel if requested
    if (channels.includes("whatsapp")) {
      result.whatsapp = await dispatchWhatsAppChannel(supabase, assembled, eventType, applicationId);
      if (!result.whatsapp.success && !result.whatsapp.skipped) {
        console.warn(`[CommEngine] WhatsApp dispatch failed for app ${applicationId}: ${result.whatsapp.error}`);
      }
    }

    return result;
  } catch (err: any) {
    console.error(`[CommEngine] Exception during notification dispatch for app ${applicationId}:`, err);
    return {
      success: false,
      email: { success: false, error: err?.message || String(err) },
    };
  }
}

/**
 * Backward-compatible recruitment dispatcher.
 * When WHATSAPP_ENABLED is true, sends both Email and WhatsApp in parallel.
 */
export async function sendRecruitmentEmail(
  params: SendRecruitmentEmailParams
): Promise<CommunicationResult> {
  const defaultChannels: CommunicationChannel[] =
    process.env.WHATSAPP_ENABLED === "true" ? ["email", "whatsapp"] : ["email"];
  const res = await sendRecruitmentNotification({ ...params, channels: defaultChannels });
  return res.email || res.whatsapp || { success: res.success };
}
