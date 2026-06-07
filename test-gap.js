const { PrismaClient } = require('@prisma/client');

async function run() {
  const prisma = new PrismaClient();
  try {
    const latestAnalysis = await prisma.resumeAnalysis.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!latestAnalysis) {
      console.log("No resume analysis found. Please upload a resume first.");
      return;
    }

    console.log("Testing with ResumeProfileId:", latestAnalysis.resumeProfileId);

    const res = await fetch('http://localhost:4000/api/skill-gap/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeProfileId: latestAnalysis.resumeProfileId,
        careerGoal: "Frontend Developer"
      })
    });

    const data = await res.json();
    console.log("\n=== API RESPONSE ===");
    console.log(JSON.stringify(data, null, 2));

    const dbRecord = await prisma.skillGapAnalysis.findUnique({
      where: { resumeProfileId: latestAnalysis.resumeProfileId },
      include: { skillGapDetails: true }
    });
    console.log("\n=== DB RECORD ===");
    console.log(JSON.stringify(dbRecord, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
