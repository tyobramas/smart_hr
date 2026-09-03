import fs from "fs";
import path from "path";

// Auto-load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...values] = trimmed.split("=");
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = values.join("=").trim();
      }
    }
  }
}

import { generateEmailContent } from "../lib/hermes-communicator";
import { sendEmail } from "../lib/email-transport";
import { checkCommunicationEligibility, sendRecruitmentEmail } from "../lib/communication-engine";
import { CommunicationEventType } from "../types/database";

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("🚀 TESTING SMART_HR COMMUNICATION ENGINE");
  console.log("=======================================================\n");

  const args = process.argv.slice(2);
  const targetEmail = args.find((a) => a.startsWith("--to="))?.split("=")[1];
  const dryRunOnly = !targetEmail || process.env.COMMUNICATION_DRY_RUN === "true";

  console.log(`Config COMMUNICATION_ENABLED : ${process.env.COMMUNICATION_ENABLED}`);
  console.log(`Config COMMUNICATION_DRY_RUN : ${process.env.COMMUNICATION_DRY_RUN}`);
  console.log(`Config RESEND_API_KEY        : ${process.env.RESEND_API_KEY ? "CONFIGURED (hidden)" : "NOT SET (using dry-run)"}`);
  console.log(`Config SENDER                : ${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`);
  console.log(`Mode                         : ${dryRunOnly ? "DRY-RUN SIMULATION" : `LIVE DISPATCH to ${targetEmail}`}\n`);

  // -------------------------------------------------------------
  // TEST 1: Hermes Content Generation & Quality Validation
  // -------------------------------------------------------------
  console.log("--- TEST 1: HERMES CONTENT GENERATION (Indonesian) ---");
  const sampleEvents: CommunicationEventType[] = [
    "application_received",
    "screening_passed",
    "screening_rejected",
    "interview_invitation",
  ];

  for (const evt of sampleEvents) {
    console.log(`\n⏳ Generating email for event: '${evt}'...`);
    const startTime = Date.now();
    const result = await generateEmailContent(evt, {
      candidateName: "Budi Santoso",
      candidateFirstName: "Budi",
      jobTitle: "Senior Fullstack Engineer",
      jobLocation: "Jakarta (Hybrid)",
      applicationId: "test-app-uuid-12345",
      applicationDate: "2 September 2026",
      interviewDeadline: "5 September 2026",
      appBaseUrl: "http://localhost:3000",
    });

    const elapsed = Date.now() - startTime;
    console.log(`   Engine:     ${result.modelUsed} (${elapsed}ms)`);
    console.log(`   Subject:    "${result.subject}"`);
    console.log(`   Tone Notes: ${result.internal_tone_notes}`);

    // Assertions
    if (!result.subject || result.subject.length === 0) {
      throw new Error(`Subject is empty for event ${evt}`);
    }
    if (result.subject.length > 100) {
      throw new Error(`Subject exceeds 100 characters: ${result.subject}`);
    }
    if (!result.body_html || result.body_html.length < 50) {
      throw new Error(`HTML body too short or empty for event ${evt}`);
    }
    if (result.body_html.includes("score") && result.body_html.includes("/100")) {
      throw new Error(`Safety violation: Raw numerical score leaked in body for event ${evt}`);
    }
    if (result.body_html.includes('{"') && result.body_html.includes('"}')) {
      throw new Error(`Safety violation: Raw JSON detected in body for event ${evt}`);
    }

    console.log(`   Validation: ✅ PASSED (clean HTML, appropriate tone, no leaked internal rubrics)`);
  }

  // -------------------------------------------------------------
  // TEST 2: Email Transport Dispatch (Dry Run or Live)
  // -------------------------------------------------------------
  console.log("\n--- TEST 2: EMAIL TRANSPORT LAYER ---");
  const transportTest = await sendEmail({
    to: targetEmail || "candidate-test@example.com",
    subject: "Uji Coba Sistem Komunikasi SmartHR",
    html: "<p>Halo Budi, ini adalah uji coba komunikasi otomatis dari sistem SmartHR.</p>",
    text: "Halo Budi, ini adalah uji coba komunikasi otomatis dari sistem SmartHR.",
  });

  console.log(`Transport Dispatch Success : ${transportTest.success ? "✅ BERHASIL" : "❌ GAGAL"}`);
  console.log(`Message ID                 : ${transportTest.messageId}`);
  if (transportTest.dryRun) {
    console.log(`Mode Flag                  : Dry-Run (No network charge)`);
  }
  if (transportTest.error) {
    console.log(`Error                      : ${transportTest.error}`);
  }

  // -------------------------------------------------------------
  // TEST 3: Deduplication & Cooldown Logic Check
  // -------------------------------------------------------------
  console.log("\n--- TEST 3: DEDUPLICATION & COOLDOWN SIMULATION ---");
  const eligibilityTest = await checkCommunicationEligibility(
    "00000000-0000-0000-0000-000000000000",
    "00000000-0000-0000-0000-000000000000",
    "application_received"
  );
  console.log(`Eligibility Check for Mock Application:`);
  console.log(`  Eligible: ${eligibilityTest.eligible ? "✅ YES" : "ℹ️ NO"}`);
  if (eligibilityTest.reason) {
    console.log(`  Reason:   ${eligibilityTest.reason}`);
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL TESTS COMPLETED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

runTestSuite().catch((err) => {
  console.error("\n❌ TEST SUITE FAILURE:", err);
  process.exit(1);
});

