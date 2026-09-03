import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body || {};

    if (!type || !data?.email_id) {
      return NextResponse.json({ error: "Invalid webhook payload structure" }, { status: 400 });
    }

    const emailId = data.email_id;
    const supabase = createAdminClient();

    console.log(`[ResendWebhook] Received event '${type}' for email_id: ${emailId}`);

    let updatePayload: {
      status?: "sent" | "bounced" | "opened" | "failed";
      error_message?: string;
    } = {};

    switch (type) {
      case "email.delivered":
        updatePayload = { status: "sent" };
        break;

      case "email.bounced":
        updatePayload = {
          status: "bounced",
          error_message: data.bounce?.message || "Alamat email memantul (bounced) / tidak dapat menerima pesan.",
        };
        break;

      case "email.opened":
        updatePayload = { status: "opened" };
        break;

      case "email.complained":
        updatePayload = {
          status: "failed",
          error_message: "Kandidat menandai email sebagai spam (complaint).",
        };
        break;

      default:
        // Ignore other unhandled events like email.clicked
        return NextResponse.json({ received: true, ignored: type });
    }

    const { error: updateErr } = await supabase
      .from("communication_logs")
      .update(updatePayload)
      .eq("provider_message_id", emailId);

    if (updateErr) {
      console.warn(`[ResendWebhook] Failed to update communication_logs for email_id ${emailId}:`, updateErr.message);
    }

    return NextResponse.json({ success: true, event: type, email_id: emailId });
  } catch (err: any) {
    console.error("[ResendWebhook] Exception handling webhook:", err);
    return NextResponse.json({ error: err?.message || "Webhook processing error" }, { status: 500 });
  }
}

