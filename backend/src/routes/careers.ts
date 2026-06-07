import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { appCache } from "../lib/cache";

const router = Router();
const prisma = new PrismaClient();

// GET /api/careers
router.get("/", async (req, res) => {
  try {
    const CACHE_KEY = "all_careers";
    const cachedData = appCache.get(CACHE_KEY);

    if (cachedData) {
      console.log("[CACHE HIT] careers");
      return res.json({ success: true, data: cachedData });
    }

    const categories = await prisma.careerCategory.findMany({
      include: {
        roles: {
          include: {
            requirements: {
              include: {
                skillMaster: true,
              },
            },
          },
        },
      },
    });

    appCache.set(CACHE_KEY, categories);
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// GET /api/careers/:id (Get Role by ID)
router.get("/:id", async (req, res) => {
  try {
    const role = await prisma.careerRole.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        requirements: {
          include: {
            skillMaster: true,
          },
        },
      },
    });
    if (!role) {
      return res.status(404).json({ error: "Career role not found" });
    }
    res.json({ success: true, data: role });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// POST /api/careers
// Creates a Category and Role (or just Role under existing category)
router.post("/", async (req, res) => {
  try {
    const { categoryName, roleTitle, roleDescription, requiredSkills } = req.body;
    
    // Ensure category exists or create it
    const category = await prisma.careerCategory.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });

    // Create the role
    const role = await prisma.careerRole.create({
      data: {
        title: roleTitle,
        description: roleDescription,
        categoryId: category.id,
      },
    });

    // Handle requirements if provided
    if (requiredSkills && Array.isArray(requiredSkills)) {
      for (const skillName of requiredSkills) {
        const skill = await prisma.skillMaster.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName },
        });

        await prisma.careerPathRequirement.create({
          data: {
            careerRoleId: role.id,
            skillMasterId: skill.id,
          },
        });
      }
    }

    res.json({ success: true, data: role });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// PUT /api/careers/:id
router.put("/:id", async (req, res) => {
  try {
    const { title, description } = req.body;
    const role = await prisma.careerRole.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
      },
    });
    res.json({ success: true, data: role });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// DELETE /api/careers/:id
router.delete("/:id", async (req, res) => {
  try {
    await prisma.careerRole.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true, message: "Career role deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

export default router;
