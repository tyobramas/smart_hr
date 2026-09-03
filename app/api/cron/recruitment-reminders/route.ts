import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendRecruitmentEmail } from "@/lib/communication-engine";

export const dynamic = "force-dynamic";

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
    return NextResponse.json({ error: "Unauthorized access to recruitment cron." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();

  const summary = {
    personality_reminders: 0,
    interview_reminders_48h: 0,
    interview_reminders_24h: 0,
    expired_applications: 0,
    errors: [] as string[],
  };

  try {
    // ------------------------------------------------------------------------
    // 1. PERSONALITY TEST REMINDERS
    // Eligible: status = 'screened', personality_completed_at IS NULL, created >= 2 days ago
    // ------------------------------------------------------------------------
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const { data: pendingPersonalityApps, error: persErr } = await supabase
      .from("applications")
      .select("id, created_at")
      .eq("status", "screened")
      .is("personality_completed_at", null)
      .lte("created_at", twoDaysAgo);

    if (persErr) {
      summary.errors.push(`Personality query error: ${persErr.message}`);
    } else if (pendingPersonalityApps) {
      for (const app of pendingPersonalityApps) {
        const res = await sendRecruitmentEmail({
          eventType: "personality_reminder",
          applicationId: app.id,
        });
        if (res.success && !res.skipped) {
          summary.personality_reminders++;
        }
      }
    }

    // ------------------------------------------------------------------------
    // 2. INTERVIEW DEADLINE REMINDERS (48h & 24h)
    // Eligible: status = 'invited_interview', interview_started_at IS NULL, interview_deadline IS NOT NULL
    // ------------------------------------------------------------------------
    const { data: invitedApps, error: invitedErr } = await supabase
      .from("applications")
      .select("id, interview_deadline, interview_started_at")
      .eq("status", "invited_interview")
      .not("interview_deadline", "is", null)
      .is("interview_started_at", null);

    if (invitedErr) {
      summary.errors.push(`Invited query error: ${invitedErr.message}`);
    } else if (invitedApps) {
      for (const app of invitedApps) {
        if (!app.interview_deadline) continue;
        const deadlineTime = new Date(app.interview_deadline).getTime();
        const diffMs = deadlineTime - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // 48h Window: between 24h and 48h from deadline
        if (diffHours > 24 && diffHours <= 48) {
          const res = await sendRecruitmentEmail({
            eventType: "interview_reminder_48h",
            applicationId: app.id,
          });
          if (res.success && !res.skipped) {
            summary.interview_reminders_48h++;
          }
        }
        // 24h Window: between 0h and 24h from deadline
        else if (diffHours > 0 && diffHours <= 24) {
          const res = await sendRecruitmentEmail({
            eventType: "interview_reminder_24h",
            applicationId: app.id,
          });
          if (res.success && !res.skipped) {
            summary.interview_reminders_24h++;
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // 3. EXPIRED INTERVIEW DETECTION
    // Eligible: status = 'invited_interview', interview_deadline < now, interview_completed_at IS NULL
    // ------------------------------------------------------------------------
    const { data: expiredApps, error: expErr } = await supabase
      .from("applications")
      .select("id, interview_deadline")
      .eq("status", "invited_interview")
      .not("interview_deadline", "is", null)
      .is("interview_completed_at", null)
      .lt("interview_deadline", nowIso);

    if (expErr) {
      summary.errors.push(`Expired query error: ${expErr.message}`);
    } else if (expiredApps) {
      for (const app of expiredApps) {
        // Mark application status as withdrawn_expired
        await supabase
          .from("applications")
          .update({ status: "withdrawn_expired" })
          .eq("id", app.id);

        const res = await sendRecruitmentEmail({
          eventType: "interview_expired",
          applicationId: app.id,
        });

        if (res.success && !res.skipped) {
          summary.expired_applications++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: nowIso,
      summary,
    });
  } catch (err: any) {
    console.error("[Cron:RecruitmentReminders] Unhandled exception:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Internal server error during reminder cron execution",
        summary,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

