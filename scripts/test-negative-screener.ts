import fs from "fs";
import path from "path";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...values] = trimmed.split("=");
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join("=").trim();
      }
    }
  }
}

import { runHermesCvScreening } from "../lib/hermes-screener";
import { classifyScreening } from "../lib/screening-bands";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${msg}`);
  }
}

async function runNegativeTests() {
  console.log("======================================================================");
  console.log("TEST SUITE: Negative Tests for Screener Bug & 3-Band Routing");
  console.log("======================================================================\n");

  // 1. Negative Test: Network/API endpoint failure
  console.log("1. Testing Screener Failure with Invalid Router Base URL (Simulated Network/Auth Outage)...");
  const oldBaseUrl = process.env.HERMES_BASE_URL;
  process.env.HERMES_BASE_URL = "http://127.0.0.1:9999/v1";

  const failRes = await runHermesCvScreening({
    candidateName: "Jono",
    jobTitle: "Tax Specialist",
    jobRequirements: "Brevet AB",
    cvText: "Pengalaman pajak 2 tahun.",
  });

  process.env.HERMES_BASE_URL = oldBaseUrl;

  assert(!failRes.success, "Screener returns success === false on LLM failure");
  assert(failRes.score === null, `Screener returns score === null (got ${failRes.score})`);
  assert(failRes.analysisJson === null, "Screener returns analysisJson === null");

  const failDecision = classifyScreening({
    score: failRes.score,
    aiSucceeded: failRes.success,
    cvTextLength: 1000,
    jobMinScoreThreshold: 70,
  });

  assert(failDecision.outcome === "unprocessed", `Guard 1 catches failure -> outcome: unprocessed (got ${failDecision.outcome})`);
  assert(failDecision.status === "pending", `Guard 1 sets status: pending (got ${failDecision.status})`);
  assert(!failDecision.canProceedToInterview, "Candidate CANNOT proceed to interview when screening fails");

  // 2. Test Genuine Score 75
  console.log("\n2. Testing Genuine Score 75 with Successful AI and Full CV Text...");
  const genuineDecision = classifyScreening({
    score: 75,
    aiSucceeded: true,
    cvTextLength: 5000,
    jobMinScoreThreshold: 70,
  });

  assert(genuineDecision.outcome === "passed", `Genuine score 75 -> outcome: passed (got ${genuineDecision.outcome})`);
  assert(genuineDecision.status === "screened", `Genuine score 75 -> status: screened (got ${genuineDecision.status})`);
  assert(genuineDecision.canProceedToInterview, "Genuine score 75 candidate CAN proceed to interview");

  // 3. Test Score 0 (Genuine zero score vs Failure)
  console.log("\n3. Testing Difference between Score 0 (Unqualified) vs Score null (Failed AI)...");
  const unqualDecision = classifyScreening({
    score: 0,
    aiSucceeded: true,
    cvTextLength: 500,
    jobMinScoreThreshold: 70,
  });
  assert(unqualDecision.outcome === "rejected", "Genuine Score 0 -> rejected");
  assert(unqualDecision.status === "rejected", "Genuine Score 0 -> status: rejected");

  console.log("\n======================================================================");
  console.log("🎉 ALL NEGATIVE SCREENER TESTS PASSED WITH 100% ACCURACY!");
  console.log("======================================================================");
}

runNegativeTests().catch((err) => {
  console.error("Fatal Error in Negative Tests:", err);
  process.exit(1);
});
