import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { orchestrateCollegePlan } from "../services/collegeOrchestrator";

const router = Router();
const prisma = new PrismaClient();

router.post("/submit", async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      educationLevel,
      currentQualification,
      boardUniversity,
      percentage,
      passingYear,
      budget,
      preferredStudyLocation
    } = req.body;

    const profile = await prisma.higherEducationProfile.create({
      data: {
        fullName,
        email,
        phone,
        educationLevel,
        currentQualification,
        boardUniversity,
        percentage,
        passingYear: passingYear ? parseInt(passingYear) : null,
        budget,
        domesticProfile: {
          create: {
            state: "TBD",
            city: "TBD",
            preferredStudyLocation,
            board: boardUniversity,
            percentage
          }
        }
      }
    });

    return res.json({ success: true, profileId: profile.id });
  } catch (error: any) {
    console.error("Higher Education Submit Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/orchestrate", async (req, res) => {
  try {
    const { profileId } = req.body;
    if (!profileId) return res.status(400).json({ error: "profileId required" });

    const data = await orchestrateCollegePlan(profileId);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Orchestration Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
