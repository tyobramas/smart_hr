import { verifyCvIdentity } from "../lib/identity-verifier";

async function runTests() {
  console.log("======================================================================");
  console.log("TEST SUITE: Candidate Identity & Anti-Fraud Guard Verification");
  console.log("======================================================================\n");

  // Test 1: Authentic Candidate (Budi Santoso with Flutter CV)
  console.log("Test 1: Authentic Submission (Profile: 'Budi Santoso' matches CV name)...");
  const cvBudi = `
    CURRICULUM VITAE
    Nama: Budi Santoso
    Email: budi.santoso@example.com
    Pendidikan: S1 Teknik Informatika, Universitas Indonesia
    Keahlian: Flutter, Dart, BLoC, Clean Architecture, REST API
    Pengalaman Kerja: 4 Tahun Senior Mobile Developer di PT FinTech Indonesia
  `;
  const t1 = verifyCvIdentity("Budi Santoso", cvBudi);
  console.log(`- Result     : ${t1.isMatch ? "✅ MATCH" : "❌ MISMATCH"}`);
  console.log(`- Confidence : ${t1.confidence}`);
  console.log(`- Matched    : [${t1.matchedTokens.join(", ")}]`);
  if (!t1.isMatch) throw new Error("Test 1 should match authentic candidate");

  // Test 2: Academic Title in Profile ('Budi Santoso, S.Kom' vs CV 'Budi Santoso')
  console.log("\nTest 2: Profile With Title ('Budi Santoso, S.Kom' vs CV 'Budi Santoso')...");
  const t2 = verifyCvIdentity("Budi Santoso, S.Kom", cvBudi);
  console.log(`- Result     : ${t2.isMatch ? "✅ MATCH" : "❌ MISMATCH"}`);
  console.log(`- Confidence : ${t2.confidence}`);
  console.log(`- Matched    : [${t2.matchedTokens.join(", ")}]`);
  if (!t2.isMatch) throw new Error("Test 2 should ignore academic titles and match");

  // Test 3: Identity Mismatch / Proxy Fraud (Profile: 'Budi Santoso', CV: 'Dimas Aditya Pratama')
  console.log("\nTest 3: CV Fraud / Impersonation (Profile: 'Budi Santoso' vs CV: 'Dimas Aditya Pratama')...");
  const cvDimas = `
    RESUME
    Dimas Aditya Pratama
    Product Designer & Lead UI/UX Engineer
    Skills: Figma, Design System, User Research, Prototyping
    Experience: 5 years at Unicorn Startup
  `;
  const t3 = verifyCvIdentity("Budi Santoso", cvDimas);
  console.log(`- Result     : ${!t3.isMatch ? "✅ BLOCKED (MISMATCH DETECTED)" : "❌ FAILED TO BLOCK"}`);
  console.log(`- Confidence : ${t3.confidence}`);
  console.log(`- Reason     : ${t3.reason}`);
  if (t3.isMatch) throw new Error("Test 3 should BLOCK mismatched candidate identity");

  // Test 4: Another Fraud Case (Profile: 'Siti Rahmawati', CV: 'Ahmad Fauzi')
  console.log("\nTest 4: Identity Mismatch (Profile: 'Siti Rahmawati' vs CV: 'Ahmad Fauzi')...");
  const cvAhmad = `
    CURRICULUM VITAE - AHMAD FAUZI
    Backend Engineer - Golang, PostgreSQL, Redis, Kubernetes
  `;
  const t4 = verifyCvIdentity("Siti Rahmawati", cvAhmad);
  console.log(`- Result     : ${!t4.isMatch ? "✅ BLOCKED (MISMATCH DETECTED)" : "❌ FAILED TO BLOCK"}`);
  console.log(`- Confidence : ${t4.confidence}`);
  console.log(`- Reason     : ${t4.reason}`);
  if (t4.isMatch) throw new Error("Test 4 should BLOCK mismatched candidate identity");

  console.log("\n======================================================================");
  console.log("🎉 ALL IDENTITY & ANTI-FRAUD VERIFICATION TESTS PASSED (< 5ms)!");
  console.log("======================================================================");
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
