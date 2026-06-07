const { PrismaClient } = require("@prisma/client");

async function testOrchestration() {
  const prisma = new PrismaClient();
  let roleId = null;
  let categoryId = null;

  try {
    const latestAnalysis = await prisma.resumeAnalysis.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!latestAnalysis) {
      console.log("No resume analysis found.");
      return;
    }

    // 1. Create temporary role and skill to test the pipeline dynamically
    const cat = await prisma.careerCategory.create({
      data: { name: "Orchestrator Test Category" }
    });
    categoryId = cat.id;
    
    const role = await prisma.careerRole.create({
      data: {
        title: "Orchestrator Role",
        categoryId: cat.id
      }
    });
    roleId = role.id;

    const skill = await prisma.skillMaster.upsert({
      where: { name: "SuperObscureSkill123" },
      update: {},
      create: { name: "SuperObscureSkill123" }
    });

    await prisma.careerPathRequirement.create({
      data: {
        careerRoleId: role.id,
        skillMasterId: skill.id
      }
    });

    console.log("Testing POST /api/career/orchestrate");
    const res = await fetch("http://localhost:4000/api/career/orchestrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeProfileId: latestAnalysis.resumeProfileId,
        careerRoleId: role.id
      })
    });

    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    // Clean up
    if (roleId) await prisma.careerRole.delete({ where: { id: roleId } });
    if (categoryId) await prisma.careerCategory.delete({ where: { id: categoryId } });
    await prisma.$disconnect();
  }
}

testOrchestration();
