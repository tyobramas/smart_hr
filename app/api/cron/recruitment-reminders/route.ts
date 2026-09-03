import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendRecruitmentEmail, checkCommunicationEligibility } from "@/lib/communication-engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // If no secret configured in development, allow for local testing
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const querySecret = request.nextUrl.searchParams.get("secret");

  return bearerToken === cronSecret || querySecret === cronSecret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized access to recruitment cron." },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();

  const processed = {
    personality_reminders: 0,
    interview_48h_reminders: 0,
    interview_24h_reminders: 0,
    interview_expired: 0,
  };

  const errors: string[] = [];

  try {
    // =========================================================================
    // 1. PERSONALITY ASSESSMENT REMINDER (personality_reminder)
    // Target:
    // - status = 'screened'
    // - personality_completed_at IS NULL
    // - created_at <= NOW() - INTERVAL '2 days'
    // =========================================================================
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const { data: personalityCandidates, error: persErr } = await supabase
      .from("applications")
      .select("id, candidate_id, created_at")
      .eq("status", "screened")
      .is("personality_completed_at", null)
      .lte("created_at", twoDaysAgo);

    if (persErr) {
      errors.push(`Personality query error: ${persErr.message}`);
    } else if (personalityCandidates) {
      for (const app of personalityCandidates) {
        try {
          // Idempotency check: Skip if already queued/sent or candidate on cooldown
          const eligibility = await checkCommunicationEligibility(
            app.id,
            app.candidate_id,
            "personality_reminder"
          );

          if (eligibility.eligible) {
            const res = await sendRecruitmentEmail({
              eventType: "personality_reminder",
              applicationId: app.id,
            });

            if (res.success && !res.skipped) {
              processed.personality_reminders++;
            }
          }
        } catch (err: any) {
          errors.push(`Personality reminder app ${app.id}: ${err?.message || err}`);
        }
      }
    }

    // =========================================================================
    // 2. INTERVIEW REMINDER 48 JAM (interview_reminder_48h)
    // Target:
    // - status = 'invited_interview'
    // - interview_completed_at IS NULL
    // - Sisa waktu wawancara antara 24 jam hingga 48 jam ke depan:
    //   interview_deadline <= NOW() + INTERVAL '48 hours' AND interview_deadline > NOW() + INTERVAL '24 hours'
    // =========================================================================
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const { data: interview48hCandidates, error: err48h } = await supabase
      .from("applications")
      .select("id, candidate_id, interview_deadline")
      .eq("status", "invited_interview")
      .is("interview_completed_at", null)
      .not("interview_deadline", "is", null)
      .lte("interview_deadline", in48h)
      .gt("interview_deadline", in24h);

    if (err48h) {
      errors.push(`Interview 48h query error: ${err48h.message}`);
    } else if (interview48hCandidates) {
      for (const app of interview48hCandidates) {
        try {
          const eligibility = await checkCommunicationEligibility(
            app.id,
            app.candidate_id,
            "interview_reminder_48h"
          );

          if (eligibility.eligible) {
            const res = await sendRecruitmentEmail({
              eventType: "interview_reminder_48h",
              applicationId: app.id,
            });

            if (res.success && !res.skipped) {
              processed.interview_48h_reminders++;
            }
          }
        } catch (err: any) {
          errors.push(`Interview 48h reminder app ${app.id}: ${err?.message || err}`);
        }
      }
    }

    // =========================================================================
    // 3. INTERVIEW REMINDER 24 JAM (interview_reminder_24h)
    // Target:
    // - status = 'invited_interview'
    // - interview_completed_at IS NULL
    // - Sisa waktu wawancara <= 24 jam ke depan namun belum expired:
    //   interview_deadline <= NOW() + INTERVAL '24 hours' AND interview_deadline > NOW()
    // =========================================================================
    const { data: interview24hCandidates, error: err24h } = await supabase
      .from("applications")
      .select("id, candidate_id, interview_deadline")
      .eq("status", "invited_interview")
      .is("interview_completed_at", null)
      .not("interview_deadline", "is", null)
      .lte("interview_deadline", in24h)
      .gt("interview_deadline", nowIso);

    if (err24h) {
      errors.push(`Interview 24h query error: ${err24h.message}`);
    } else if (interview24hCandidates) {
      for (const app of interview24hCandidates) {
        try {
          const eligibility = await checkCommunicationEligibility(
            app.id,
            app.candidate_id,
            "interview_reminder_24h"
          );

          if (eligibility.eligible) {
            const res = await sendRecruitmentEmail({
              eventType: "interview_reminder_24h",
              applicationId: app.id,
            });

            if (res.success && !res.skipped) {
              processed.interview_24h_reminders++;
            }
          }
        } catch (err: any) {
          errors.push(`Interview 24h reminder app ${app.id}: ${err?.message || err}`);
        }
      }
    }

    // =========================================================================
    // 4. INTERVIEW EXPIRED (interview_expired)
    // Target:
    // - status = 'invited_interview'
    // - interview_completed_at IS NULL
    // - Waktu deadline telah lewat: interview_deadline <= NOW()
    // Aksi:
    // 1. Update status lamaran ke 'withdrawn_expired'
    // 2. Kirim notifikasi interview_expired
    // =========================================================================
    const { data: expiredCandidates, error: expErr } = await supabase
      .from("applications")
      .select("id, candidate_id, interview_deadline")
      .eq("status", "invited_interview")
      .is("interview_completed_at", null)
      .not("interview_deadline", "is", null)
      .lte("interview_deadline", nowIso);

    if (expErr) {
      errors.push(`Expired interview query error: ${expErr.message}`);
    } else if (expiredCandidates) {
      for (const app of expiredCandidates) {
        try {
          // 1. Perbarui status lamaran menjadi withdrawn_expired
          const { error: updateErr } = await supabase
            .from("applications")
            .update({ status: "withdrawn_expired" })
            .eq("id", app.id);

          if (updateErr) {
            errors.push(`Update withdrawn_expired app ${app.id}: ${updateErr.message}`);
            continue;
          }

          // 2. Kirim notifikasi interview_expired
          const res = await sendRecruitmentEmail({
            eventType: "interview_expired",
            applicationId: app.id,
          });

          if (res.success && !res.skipped) {
            processed.interview_expired++;
          }
        } catch (err: any) {
          errors.push(`Interview expired app ${app.id}: ${err?.message || err}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: nowIso,
      processed,
      ...(errors.length > 0 ? { errors } : {}),
    });
  } catch (err: any) {
    console.error("[Cron:RecruitmentReminders] Fatal exception:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Internal server error during reminder cron execution",
        processed,
        errors: [...errors, err?.message || String(err)],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
