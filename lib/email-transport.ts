import { Resend } from "resend";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  dryRun?: boolean;
}

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Deliver an email via Resend transport with dry-run and safety guards.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const isEnabled = process.env.COMMUNICATION_ENABLED === "true" || process.env.NODE_ENV === "production";
  const isDryRun = process.env.COMMUNICATION_DRY_RUN === "true" || !process.env.RESEND_API_KEY;

  if (!isEnabled) {
    console.log(`[EmailTransport] Communication is disabled (COMMUNICATION_ENABLED != true). Email to ${params.to} skipped.`);
    return {
      success: true,
      dryRun: true,
      messageId: `disabled_msg_${Date.now()}`,
    };
  }

  if (isDryRun) {
    console.log(`[EmailTransport:DRY_RUN] Simulating email delivery:`);
    console.log(`  To:      ${params.to}`);
    console.log(`  Subject: ${params.subject}`);
    console.log(`  Preview: ${params.html.replace(/<[^>]*>/g, " ").slice(0, 150)}...`);
    return {
      success: true,
      dryRun: true,
      messageId: `dry_run_msg_${Date.now()}`,
    };
  }

  const resend = getResendClient();
  if (!resend) {
    const errMsg = "RESEND_API_KEY is not configured in environment.";
    console.error(`[EmailTransport] ${errMsg}`);
    return {
      success: false,
      error: errMsg,
    };
  }

  const fromName = process.env.EMAIL_FROM_NAME || "SmartHR Recruitment";
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";
  const from = `${fromName} <${fromAddress}>`;

  console.log(`[Email:Dispatch] To: ${params.to} | Subject: ${params.subject}`);

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      tags: params.tags,
    });

    if (error) {
      console.error(`[Email:Response] Success: false | Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(`[Email:Response] Success: true | Id: ${data?.id || "N/A"}`);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err: any) {
    const errMsg = err?.message || "Unknown error during Resend email dispatch";
    console.error(`[Email:Response] Success: false | Error: ${errMsg}`);
    return {
      success: false,
      error: errMsg,
    };
  }
}

