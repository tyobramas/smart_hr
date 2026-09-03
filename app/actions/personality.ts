"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/auth";
import { PersonalityTestResult, Job } from "@/types/database";
import { runHermesPsychometricAnalysis } from "@/lib/hermes-psychometric";
import { sendRecruitmentEmail } from "@/lib/communication-engine";
import {
  ALL_50_PSYCHOMETRIC_QUESTIONS,
  MBTI_ARCHETYPE_LOOKUP,
} from "@/lib/psychometric-questions";

export async function submitPersonalityTestAction(
  applicationId: string,
  answers: Record<string, any>
) {
  const { profile } = await requireProfile();
  const supabase = createAdminClient();

  // Verify application exists and belongs to candidate (or admin)
  const { data: app, error } = await supabase
    .from("applications")
    .select(`
      id,
      candidate_id,
      job_id,
      job:jobs (*)
    `)
    .eq("id", applicationId)
    .single();

  if (error || !app) {
    return { success: false, error: "Lamaran tidak ditemukan." };
  }

  // If not admin, ensure it's their own application
  if (profile.role !== "admin" && app.candidate_id !== profile.id) {
    return { success: false, error: "Anda tidak memiliki akses ke lamaran ini." };
  }

  const jobData = (app as any).job as Job | null;

  // =========================================================================
  // 1. CALCULATE DISC SCORES (15 Questions: 4 D, 4 I, 4 S, 3 C) -> Normalized to 100%
  // =========================================================================
  const getLikertVal = (id: string, def = 3) => {
    const val = Number(answers[id]);
    return isNaN(val) || val < 1 || val > 5 ? def : val;
  };

  // D: disc_1, disc_2, disc_3, disc_4 (Max: 4 * 5 = 20)
  const sumD =
    getLikertVal("disc_1") +
    getLikertVal("disc_2") +
    getLikertVal("disc_3") +
    getLikertVal("disc_4");
  const dScore = Math.min(100, Math.round((sumD / 20) * 100));

  // I: disc_5, disc_6, disc_7, disc_8 (Max: 4 * 5 = 20)
  const sumI =
    getLikertVal("disc_5") +
    getLikertVal("disc_6") +
    getLikertVal("disc_7") +
    getLikertVal("disc_8");
  const iScore = Math.min(100, Math.round((sumI / 20) * 100));

  // S: disc_9, disc_10, disc_11, disc_12 (Max: 4 * 5 = 20)
  const sumS =
    getLikertVal("disc_9") +
    getLikertVal("disc_10") +
    getLikertVal("disc_11") +
    getLikertVal("disc_12");
  const sScore = Math.min(100, Math.round((sumS / 20) * 100));

  // C: disc_13, disc_14, disc_15 (Max: 3 * 5 = 15)
  const sumC =
    getLikertVal("disc_13") +
    getLikertVal("disc_14") +
    getLikertVal("disc_15");
  const cScore = Math.min(100, Math.round((sumC / 15) * 100));

  // =========================================================================
  // 2. CALCULATE BIG FIVE (OCEAN) SCORES (10 Questions with Reverse-Scoring)
  // =========================================================================
  // Openness: ocean_1 (pos), ocean_2 (rev)
  const oVal = getLikertVal("ocean_1") + (6 - getLikertVal("ocean_2"));
  const bigFiveOpenness = Math.min(100, Math.round((oVal / 10) * 100));

  // Conscientiousness: ocean_3 (pos), ocean_4 (rev)
  const cVal = getLikertVal("ocean_3") + (6 - getLikertVal("ocean_4"));
  const bigFiveConscientiousness = Math.min(100, Math.round((cVal / 10) * 100));

  // Extraversion: ocean_5 (pos), ocean_6 (rev)
  const eVal = getLikertVal("ocean_5") + (6 - getLikertVal("ocean_6"));
  const bigFiveExtraversion = Math.min(100, Math.round((eVal / 10) * 100));

  // Agreeableness: ocean_7 (pos), ocean_8 (rev)
  const aVal = getLikertVal("ocean_7") + (6 - getLikertVal("ocean_8"));
  const bigFiveAgreeableness = Math.min(100, Math.round((aVal / 10) * 100));

  // Emotional Stability: ocean_9 (pos), ocean_10 (rev)
  const esVal = getLikertVal("ocean_9") + (6 - getLikertVal("ocean_10"));
  const bigFiveEmotionalStability = Math.min(100, Math.round((esVal / 10) * 100));

  // =========================================================================
  // 3. CALCULATE PAPI KOSTICK DRIVES (10 Forced-Choice Questions)
  // =========================================================================
  let papiLeadershipPts = 0;
  let papiAchievementPts = 0;
  let papiRuleCompliancePts = 0;
  let papiSociabilityPts = 0;

  // papi_1: A -> Leadership
  if (answers["papi_1"] === "A") papiLeadershipPts += 30;
  // papi_2: A -> Achievement, B -> Sociability
  if (answers["papi_2"] === "A") papiAchievementPts += 35;
  else papiSociabilityPts += 25;
  // papi_3: A -> Rules, B -> Flexibility
  if (answers["papi_3"] === "A") papiRuleCompliancePts += 35;
  // papi_5: A -> Leadership directness, B -> Harmony
  if (answers["papi_5"] === "A") papiLeadershipPts += 25;
  else papiSociabilityPts += 25;
  // papi_7: A -> Leadership initiative
  if (answers["papi_7"] === "A") papiLeadershipPts += 30;
  // papi_8: A -> Sociability
  if (answers["papi_8"] === "A") papiSociabilityPts += 35;
  // papi_9: A -> Achievement, B -> Rule compliance
  if (answers["papi_9"] === "A") papiAchievementPts += 35;
  else papiRuleCompliancePts += 35;
  // papi_10: A -> Rule/Loyalty
  if (answers["papi_10"] === "A") papiRuleCompliancePts += 25;

  const papiLeadership = Math.min(100, Math.max(30, papiLeadershipPts + 20));
  const papiAchievement = Math.min(100, Math.max(35, papiAchievementPts + 25));
  const papiRuleCompliance = Math.min(100, Math.max(30, papiRuleCompliancePts + 20));
  const papiSociability = Math.min(100, Math.max(25, papiSociabilityPts + 20));

  // =========================================================================
  // 4. DETERMINE MBTI DICHOTOMIES (15 Questions)
  // =========================================================================
  // E vs I (4 questions: mbti_1..mbti_4)
  let countE = 0;
  let countI = 0;
  ["mbti_1", "mbti_2", "mbti_3", "mbti_4"].forEach((k) => {
    if (answers[k] === "A") countE++;
    else countI++;
  });
  const mbtiEI = countE >= countI ? "E" : "I";

  // S vs N (4 questions: mbti_5..mbti_8)
  let countS = 0;
  let countN = 0;
  ["mbti_5", "mbti_6", "mbti_7", "mbti_8"].forEach((k) => {
    if (answers[k] === "A") countS++;
    else countN++;
  });
  const mbtiSN = countS >= countN ? "S" : "N";

  // T vs F (4 questions: mbti_9..mbti_12)
  let countT = 0;
  let countF = 0;
  ["mbti_9", "mbti_10", "mbti_11", "mbti_12"].forEach((k) => {
    if (answers[k] === "A") countT++;
    else countF++;
  });
  const mbtiTF = countT >= countF ? "T" : "F";

  // J vs P (3 questions: mbti_13..mbti_15)
  let countJ = 0;
  let countP = 0;
  ["mbti_13", "mbti_14", "mbti_15"].forEach((k) => {
    if (answers[k] === "A") countJ++;
    else countP++;
  });
  const mbtiJP = countJ >= countP ? "J" : "P";

  const mbtiCode = `${mbtiEI}${mbtiSN}${mbtiTF}${mbtiJP}`;
  const mbtiInfo = MBTI_ARCHETYPE_LOOKUP[mbtiCode] || {
    label: "The Analytical Strategist",
    desc: "Pribadi profesional dengan fokus analitis dan eksekusi terstruktur.",
  };

  // Dominant DISC Archetype
  const maxDisc = Math.max(dScore, iScore, sScore, cScore);
  let primaryTrait = "The Precision Analyst (Conscientious)";
  let traitDesc = "Kandidat memiliki ketelitian tinggi, berorientasi pada data & kualitas, sistematis, serta sangat patuh terhadap regulasi dan SOP.";
  if (maxDisc === dScore) {
    primaryTrait = "The Decisive Leader (Dominance)";
    traitDesc = "Kandidat berorientasi kuat pada pencapaian target, berani mengambil keputusan cepat di bawah tekanan, dan memiliki kepemimpinan yang tegas.";
  } else if (maxDisc === iScore) {
    primaryTrait = "The Inspiring Communicator (Influence)";
    traitDesc = "Kandidat memiliki kemampuan komunikasi persuasif yang sangat kuat, ramah, energik, dan mampu membangun relasi serta memotivasi tim.";
  } else if (maxDisc === sScore) {
    primaryTrait = "The Reliable Team Player (Steadiness)";
    traitDesc = "Kandidat sangat stabil, setia, kooperatif, dapat diandalkan dalam jangka panjang, dan mampu menjaga ketenangan ritme kerja tim.";
  }

  // Work Ethic combined score
  const workEthicScore = Math.min(
    100,
    Math.round((bigFiveConscientiousness * 0.4 + bigFiveEmotionalStability * 0.3 + papiAchievement * 0.3))
  );

  // =========================================================================
  // 5. HERMES MULTI-FRAMEWORK PSYCHOMETRIC EVALUATION
  // =========================================================================
  let deepseekAnalysis = null;
  try {
    deepseekAnalysis = await runHermesPsychometricAnalysis({
      candidateName: profile.full_name,
      jobTitle: jobData?.title || "Posisi Lamaran",
      jobRequirements: jobData?.requirements || jobData?.description || "",
      mbtiType: mbtiCode,
      mbtiLabel: mbtiInfo.label,
      discScores: {
        dominance: dScore,
        influence: iScore,
        steadiness: sScore,
        conscientiousness: cScore,
      },
      bigFiveScores: {
        openness: bigFiveOpenness,
        conscientiousness: bigFiveConscientiousness,
        extraversion: bigFiveExtraversion,
        agreeableness: bigFiveAgreeableness,
        emotional_stability: bigFiveEmotionalStability,
      },
      papiScores: {
        leadership: papiLeadership,
        achievement: papiAchievement,
        rule_compliance: papiRuleCompliance,
        sociability: papiSociability,
      },
      rawAnswers: answers,
    });
  } catch (aiErr) {
    console.error("Hermes Psychometric evaluation failed:", aiErr);
  }

  const strengths = deepseekAnalysis?.kekuatan_kunci?.length
    ? deepseekAnalysis.kekuatan_kunci
    : [
        "Akurasi dan presisi kerja yang tinggi",
        "Disiplin tinggi terhadap kepatuhan standar dan SOP",
        "Kemampuan analitis dan pemecahan masalah yang sistematis",
      ];

  const growthAreas = deepseekAnalysis?.area_pengembangan_blindspot?.length
    ? deepseekAnalysis.area_pengembangan_blindspot
    : [
        "Perlu lebih fleksibel saat terjadi perubahan prioritas mendadak",
        "Meningkatkan kecepatan eksekusi saat menghadapi keputusan darurat",
      ];

  const personalityResult: PersonalityTestResult = {
    completed_at: new Date().toISOString(),
    primary_trait: primaryTrait,
    trait_description: deepseekAnalysis?.siapa_kandidat_ini || traitDesc,
    mbti_type: mbtiCode,
    mbti_label: mbtiInfo.label,
    work_style: mbtiInfo.desc,
    strengths,
    growth_areas: growthAreas,
    raw_answers: answers,
    ai_deepseek_analysis: deepseekAnalysis,
    scores: {
      dominance: dScore,
      influence: iScore,
      steadiness: sScore,
      conscientiousness: cScore,
      big_five_openness: bigFiveOpenness,
      big_five_conscientiousness: bigFiveConscientiousness,
      big_five_extraversion: bigFiveExtraversion,
      big_five_agreeableness: bigFiveAgreeableness,
      big_five_emotional_stability: bigFiveEmotionalStability,
      papi_leadership: papiLeadership,
      papi_achievement: papiAchievement,
      papi_rule_compliance: papiRuleCompliance,
      papi_sociability: papiSociability,
      work_ethic: workEthicScore,
    },
  };

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      personality_result_json: personalityResult,
      personality_completed_at: new Date().toISOString(),
      status: "invited_interview",
    })
    .eq("id", applicationId);

  if (updateError) {
    console.error("Error saving multi-framework personality result:", updateError);
    return { success: false, error: updateError.message };
  }

  // Communication Trigger: personality_completed (Non-blocking)
  sendRecruitmentEmail({
    eventType: "personality_completed",
    applicationId,
    candidate: profile,
    job: app.job as any,
  }).catch((err) =>
    console.error("[CommEngine] personality_completed email error:", err)
  );

  revalidatePath("/applications");
  revalidatePath(`/applications/${applicationId}/personality-test`);
  revalidatePath("/admin/applications");
  revalidatePath("/admin/dashboard");

  return {
    success: true,
    result: personalityResult,
  };
}

// =========================================================================
// RE-ANALYZE PERSONALITY ACTION (ADMIN TRIGGERED)
// =========================================================================
export async function reanalyzePersonalityAction(applicationId: string) {
  const { profile } = await requireProfile();
  if (profile.role !== "admin") {
    return { success: false, error: "Hanya Admin yang dapat melakukan Re-Analyze." };
  }

  const supabase = createAdminClient();

  const { data: app, error } = await supabase
    .from("applications")
    .select(`
      id,
      candidate_id,
      job_id,
      personality_result_json,
      job:jobs (*),
      candidate:profiles (*)
    `)
    .eq("id", applicationId)
    .single();

  if (error || !app) {
    return { success: false, error: "Lamaran tidak ditemukan." };
  }

  const currentResult = app.personality_result_json as PersonalityTestResult | null;
  if (!currentResult || !currentResult.scores) {
    return { success: false, error: "Kandidat belum memiliki hasil tes psikometri untuk dianalisa." };
  }

  const jobData = (app as any).job as Job | null;
  const candidateData = (app as any).candidate as any;
  const candidateName = candidateData?.full_name || "Kandidat";

  const scores = currentResult.scores;
  const rawAnswers = currentResult.raw_answers || {};

  const aiAnalysis = await runHermesPsychometricAnalysis({
    candidateName,
    jobTitle: jobData?.title || "Posisi Lowongan",
    jobRequirements: jobData?.requirements || jobData?.description || "",
    mbtiType: currentResult.mbti_type || "INTJ",
    mbtiLabel: currentResult.mbti_label || "The Mastermind Strategist",
    discScores: {
      dominance: scores.dominance ?? 80,
      influence: scores.influence ?? 60,
      steadiness: scores.steadiness ?? 75,
      conscientiousness: scores.conscientiousness ?? 90,
    },
    bigFiveScores: {
      openness: scores.big_five_openness ?? 85,
      conscientiousness: scores.big_five_conscientiousness ?? 90,
      extraversion: scores.big_five_extraversion ?? 60,
      agreeableness: scores.big_five_agreeableness ?? 75,
      emotional_stability: scores.big_five_emotional_stability ?? 85,
    },
    papiScores: {
      leadership: scores.papi_leadership ?? 75,
      achievement: scores.papi_achievement ?? 90,
      rule_compliance: scores.papi_rule_compliance ?? 90,
      sociability: scores.papi_sociability ?? 65,
    },
    rawAnswers,
  });

  if (!aiAnalysis) {
    return { success: false, error: "Gagal menghubungkan ke router AI untuk analisa ulang." };
  }

  const updatedResult: PersonalityTestResult = {
    ...currentResult,
    completed_at: new Date().toISOString(),
    trait_description: aiAnalysis.siapa_kandidat_ini || currentResult.trait_description,
    strengths: aiAnalysis.kekuatan_kunci || currentResult.strengths,
    growth_areas: aiAnalysis.area_pengembangan_blindspot || currentResult.growth_areas,
    ai_deepseek_analysis: aiAnalysis,
  };

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      personality_result_json: updatedResult,
    })
    .eq("id", applicationId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/admin/applications");
  revalidatePath("/admin/dashboard");
  revalidatePath("/applications");
  revalidatePath(`/applications/${applicationId}/personality-test`);

  return {
    success: true,
    result: updatedResult,
  };
}
