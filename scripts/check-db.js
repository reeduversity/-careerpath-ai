const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const profile = await prisma.higherEducationProfile.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { domesticProfile: true, internationalProfile: true }
    });
    console.log("LATEST PROFILE:", JSON.stringify(profile, null, 2));
  } catch (err) {
    console.error("PRISMA ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
