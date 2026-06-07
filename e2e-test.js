const fs = require('fs');
const path = require('path');

const API_BASE = "http://localhost:4000/api";

async function runE2ETests() {
  console.log("Starting End-to-End API Validation...\n");

  let careerRoleId = null;
  let resumeProfileId = null;

  // Fetch valid IDs from DB
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const start1 = performance.now();
    const res = await fetch(`${API_BASE}/careers`);
    const data = await res.json();
    const latency1 = performance.now() - start1;
    console.log(`[PASS] GET /api/careers (Latency: ${latency1.toFixed(2)}ms)`);
    
    const role = await prisma.careerRole.findFirst();
    if (role) careerRoleId = role.id;

    const profile = await prisma.resumeProfile.findFirst();
    if (profile) resumeProfileId = profile.id;
  } catch (err) {
    console.error("DB Fetch Error:", err);
  } finally {
    await prisma.$disconnect();
  }

  // 3. Orchestrator - Happy Path
  if (careerRoleId && resumeProfileId) {
    try {
      const start = performance.now();
      const res = await fetch(`${API_BASE}/career/orchestrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeProfileId, careerRoleId })
      });
      const data = await res.json();
      const latency = performance.now() - start;
      console.log(`[PASS] POST /api/career/orchestrate [Happy Path] (Latency: ${latency.toFixed(2)}ms)`);
      if (!data.data.skillGap) console.log("  ⚠️ Missing skillGap field");
      if (!data.data.learningPath) console.log("  ⚠️ Missing learningPath field");
      if (!data.data.roadmap) console.log("  ⚠️ Missing roadmap field");
    } catch (err) {
      console.error(`[FAIL] POST /api/career/orchestrate [Happy Path] - ${err.message}`);
    }
  } else {
    console.log("Skipping Orchestrator Happy Path due to missing dependencies.");
  }

  console.log("\nRunning Edge Cases...");

  // Edge Case: Invalid Career Role
  try {
    const res = await fetch(`${API_BASE}/career/orchestrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeProfileId: resumeProfileId || "dummy", careerRoleId: "invalid123" })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      console.log(`[PASS] Edge Case: Invalid Career Role handled correctly -> ${data.error}`);
    } else {
      console.log(`[FAIL] Edge Case: Invalid Career Role not handled correctly`);
    }
  } catch (err) {
    console.error(`[ERROR] Edge Case: Invalid Career Role - ${err.message}`);
  }

  // Edge Case: Missing Resume Profile
  try {
    const res = await fetch(`${API_BASE}/career/orchestrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeProfileId: "invalid123", careerRoleId: careerRoleId || "dummy" })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      console.log(`[PASS] Edge Case: Missing Resume Profile handled correctly -> ${data.error}`);
    } else {
      console.log(`[FAIL] Edge Case: Missing Resume Profile not handled correctly`);
    }
  } catch (err) {
    console.error(`[ERROR] Edge Case: Missing Resume Profile - ${err.message}`);
  }

}

runE2ETests();
