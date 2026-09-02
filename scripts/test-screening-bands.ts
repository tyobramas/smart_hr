import { classifyScreening, SCREENING_BANDS } from "../lib/screening-bands";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${msg}`);
  }
}

console.log("======================================================================");
console.log("TEST SUITE: 3-Band CV Screening Classifier & Safety Guards");
console.log("======================================================================\n");

// 1. Guard 1: AI Failed / Null Score
const r1 = classifyScreening({
  score: null,
  aiSucceeded: false,
  cvTextLength: 600,
  jobMinScoreThreshold: 70,
});
assert(r1.outcome === "unprocessed" && r1.status === "pending" && !r1.canProceedToInterview, "Guard 1: AI Failed -> status: pending, outcome: unprocessed");

// 2. Guard 2: Unreadable / Scanned PDF (CV Text < 200 chars)
const r2 = classifyScreening({
  score: 40,
  aiSucceeded: true,
  cvTextLength: 120, // Scanned PDF
  jobMinScoreThreshold: 70,
});
assert(r2.outcome === "unprocessed" && r2.status === "pending" && !r2.canProceedToInterview, "Guard 2: CV text < 200 chars -> status: pending, outcome: unprocessed (no auto-reject)");

// 3. Band 1: Auto-Reject Boundary (0 - 50)
const r3_45 = classifyScreening({ score: 45, aiSucceeded: true, cvTextLength: 500 });
assert(r3_45.outcome === "rejected" && r3_45.status === "rejected" && !r3_45.canProceedToInterview, "Band 1: Score 45 -> status: rejected");

const r3_50 = classifyScreening({ score: 50, aiSucceeded: true, cvTextLength: 500 });
assert(r3_50.outcome === "rejected" && r3_50.status === "rejected" && !r3_50.canProceedToInterview, "Band 1: Score 50 (Boundary) -> status: rejected");

// 4. Band 2: Manual Review Band (51 - 70)
const r4_51 = classifyScreening({ score: 51, aiSucceeded: true, cvTextLength: 500 });
assert(r4_51.outcome === "manual_review" && r4_51.status === "pending" && !r4_51.canProceedToInterview, "Band 2: Score 51 (Boundary) -> status: pending, outcome: manual_review");

const r4_70 = classifyScreening({ score: 70, aiSucceeded: true, cvTextLength: 500 });
assert(r4_70.outcome === "manual_review" && r4_70.status === "pending" && !r4_70.canProceedToInterview, "Band 2: Score 70 (Boundary) -> status: pending, outcome: manual_review");

// 5. Band 3: Auto-Pass Band (>= 71) with Default Threshold
const r5_71 = classifyScreening({ score: 71, aiSucceeded: true, cvTextLength: 500 });
assert(r5_71.outcome === "passed" && r5_71.status === "screened" && r5_71.canProceedToInterview, "Band 3: Score 71 (Boundary) -> status: screened, outcome: passed");

// 6. Job Threshold Higher than Global Default (e.g. 80)
const r6_75 = classifyScreening({ score: 75, aiSucceeded: true, cvTextLength: 500, jobMinScoreThreshold: 80 });
assert(r6_75.effectivePassMin === 80 && r6_75.outcome === "manual_review" && r6_75.status === "pending" && !r6_75.canProceedToInterview, "Threshold 80: Score 75 -> status: pending, outcome: manual_review");

const r6_82 = classifyScreening({ score: 82, aiSucceeded: true, cvTextLength: 500, jobMinScoreThreshold: 80 });
assert(r6_82.effectivePassMin === 80 && r6_82.outcome === "passed" && r6_82.status === "screened" && r6_82.canProceedToInterview, "Threshold 80: Score 82 -> status: screened, outcome: passed");

// 7. Job Threshold Lower than Global Default (e.g. 60 should not lower passing band below 71)
const r7_65 = classifyScreening({ score: 65, aiSucceeded: true, cvTextLength: 500, jobMinScoreThreshold: 60 });
assert(r7_65.effectivePassMin === 71 && r7_65.outcome === "manual_review" && r7_65.status === "pending" && !r7_65.canProceedToInterview, "Threshold 60: Score 65 -> clamped to 71 min -> status: pending, outcome: manual_review");

console.log("\n🎉 ALL 8 SCREENING BAND UNIT TESTS PASSED PERFECTLY!");
