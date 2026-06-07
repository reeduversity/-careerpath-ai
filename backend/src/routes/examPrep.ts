import { Router } from "express";
import { orchestrateExamPrep } from "../services/examOrchestrator";

const router = Router();

// POST /api/exam-prep/orchestrate
router.post("/orchestrate", async (req, res) => {
  try {
    const { stage, sector, examName, hours, budget } = req.body;
    
    if (!stage || !sector) {
      return res.status(400).json({ error: "Stage and Sector are required" });
    }

    const result = await orchestrateExamPrep(stage, sector, examName, hours, budget);
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Exam Orchestration Error:", error);
    res.status(500).json({ error: error.message || "Failed to orchestrate exam prep" });
  }
});

export default router;
