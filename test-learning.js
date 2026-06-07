const { PrismaClient } = require("@prisma/client");

async function testLearning() {
  const prisma = new PrismaClient();
  let roleId = null;
  try {
    const latestAnalysis = await prisma.resumeAnalysis.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!latestAnalysis) {
      console.log("No resume analysis found.");
      return;
    }

    // 1. Create temporary role and skill to test the logic dynamically
    const cat = await prisma.careerCategory.create({
      data: { name: "Test Category" }
    });
    
    const role = await prisma.careerRole.create({
      data: {
        title: "Test Role",
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

    console.log("Testing POST /api/learning-path/generate");
    const res = await fetch("http://localhost:4000/api/learning-path/generate", {
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
    // Clean up to strictly adhere to rules
    if (roleId) {
      await prisma.careerRole.delete({ where: { id: roleId } });
    }
    const testCat = await prisma.careerCategory.findUnique({ where: { name: "Test Category" } });
    if (testCat) {
      await prisma.careerCategory.delete({ where: { id: testCat.id } });
    }
    await prisma.$disconnect();
  }
}

testLearning();
