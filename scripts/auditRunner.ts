const { enforceCollegeCutoffs, enforceJobEligibility } = require('../lib/services/eligibilityFilters.ts');

const runTests = () => {
  let passed = 0;
  let failed = 0;
  let total = 0;

  const assert = (condition: boolean, testName: string, message: string) => {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${message}`);
      failed++;
    }
  };

  console.log("--- STARTING RULE ENGINE TESTS ---");

  // TEST 1: Valid Engineering
  const t1Colleges = [{ name: "IIT Bombay", domain: "ENGINEERING" }];
  const t1Profile = { twelfthPercentage: 90, currentQualification: "12th PCM", category: "General" };
  const res1 = enforceCollegeCutoffs(t1Colleges, t1Profile);
  assert(res1[0].passedCutoff === true, "Valid Engineering (PCM + 90%)", "Should pass Tier 1 Engineering");

  // TEST 2: Arts + IIT (Invalid Stream)
  const t2Colleges = [{ name: "IIT Delhi", domain: "ENGINEERING" }];
  const t2Profile = { twelfthPercentage: 85, currentQualification: "12th Arts", category: "General" };
  const res2 = enforceCollegeCutoffs(t2Colleges, t2Profile);
  assert(res2[0].passedCutoff === false, "Arts + IIT", "Should reject Arts student for Engineering");

  // TEST 3: Low Percentage + IIT
  const t3Colleges = [{ name: "IIT Madras", domain: "ENGINEERING" }];
  const t3Profile = { twelfthPercentage: 60, currentQualification: "12th PCM", category: "General" };
  const res3 = enforceCollegeCutoffs(t3Colleges, t3Profile);
  assert(res3[0].passedCutoff === false, "PCM 60% + IIT", "Should reject for below 75% cutoff");

  // TEST 4: SC/ST Relaxation
  const t4Colleges = [{ name: "IIT Kanpur", domain: "ENGINEERING" }];
  const t4Profile = { twelfthPercentage: 72, currentQualification: "12th PCM", category: "SC" };
  const res4 = enforceCollegeCutoffs(t4Colleges, t4Profile);
  assert(res4[0].passedCutoff === true, "PCM 72% + SC + IIT", "Should pass due to 5% relaxation on 75% cutoff");

  // TEST 5: Valid Job (Software Engineering)
  const t5Jobs = ["Software Developer"];
  const t5Profile = { degree: "B.Tech", cgpa: 8.5 };
  const res5 = enforceJobEligibility(t5Jobs, t5Profile, "Software Engineering");
  assert(res5[0].passed === true, "Valid Job (B.Tech + 8.5 CGPA)", "Should pass Software Dev role");

  // TEST 6: Invalid Job (12th Pass + SSC CGL)
  const t6Jobs = ["SSC CGL Inspector"];
  const t6Profile = { educationLevel: "12th", degree: "None" };
  const res6 = enforceJobEligibility(t6Jobs, t6Profile, "Government Job");
  assert(res6[0].passed === false, "12th Pass + SSC CGL", "Should strictly reject 12th pass for Graduation required roles");

  // TEST 7: Invalid Job (Low CGPA Data Science)
  const t7Jobs = ["Data Scientist"];
  const t7Profile = { degree: "B.Tech", cgpa: 6.0 };
  const res7 = enforceJobEligibility(t7Jobs, t7Profile, "Data Science");
  assert(res7[0].passed === false, "Data Science + 6.0 CGPA", "Should reject if CGPA < 7.0 for Data Science");

  console.log("----------------------------------");
  console.log(`TOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
};

runTests();
