import { Router } from "express";
import { generateLearningPath } from "../services/learningPathGenerator";

const router = Router();

// POST /api/learning-path/generate
router.post("/generate", async (req, res) => {
  try {
    const { resumeProfileId, careerRoleId } = req.body;
    
    if (!resumeProfileId || !careerRoleId) {
      return res.status(400).json({ error: "resumeProfileId and careerRoleId are required" });
    }

    const result = await generateLearningPath(resumeProfileId, careerRoleId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

export default router;
