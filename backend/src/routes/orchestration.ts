import { Router } from "express";
import { orchestrateCareerPlan } from "../services/careerOrchestrator.js";
import { appCache } from "../lib/cache";

const router = Router();

// POST /api/career/orchestrate
router.post("/orchestrate", async (req, res) => {
  try {
    const { userId, resumeProfileId, careerRoleId, jobInterest, examName, profileType } = req.body;
    
    if (!resumeProfileId || !careerRoleId) {
      return res.status(400).json({ error: "resumeProfileId and careerRoleId are required" });
    }

    const CACHE_KEY = JSON.stringify({ userId, resumeProfileId, careerRoleId, jobInterest, examName, profileType });
    // Bypassing cache temporarily so user can see the new Omni-Dashboard
    // const cachedData = appCache.get(CACHE_KEY);

    // if (cachedData) {
    //   console.log("[CACHE HIT] orchestration");
    //   return res.json({ success: true, data: cachedData });
    // }

    const result = await orchestrateCareerPlan(resumeProfileId, careerRoleId, jobInterest, examName, profileType);
    
    appCache.set(CACHE_KEY, result);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

export default router;
