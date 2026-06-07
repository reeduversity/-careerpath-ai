import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import PDFDocument from "pdfkit";

const router = Router();
const prisma = new PrismaClient();

router.get("/export/:profileId", async (req, res) => {
  try {
    const { profileId } = req.params;

    const analysis = await prisma.resumeAnalysis.findUnique({
      where: { resumeProfileId: profileId }
    });

    if (!analysis) {
      return res.status(404).json({ error: "Resume analysis not found" });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=ATS_Resume_${profileId}.pdf`);

    // Pipe the PDF directly to the response
    doc.pipe(res);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text(analysis.fullName || "Your Name", { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`${analysis.email || ""} | ${analysis.phone || ""} | ${analysis.location || ""}`, { align: 'center' });
    doc.moveDown(2);

    // Skills
    doc.fontSize(14).font('Helvetica-Bold').text("SKILLS", { underline: true });
    doc.moveDown(0.5);
    
    // Type checking and safe mapping for JSON arrays
    const technicalSkills = Array.isArray(analysis.technicalSkills) ? analysis.technicalSkills.join(", ") : "N/A";
    const softSkills = Array.isArray(analysis.softSkills) ? analysis.softSkills.join(", ") : "N/A";
    
    doc.fontSize(10).font('Helvetica-Bold').text("Technical: ", { continued: true }).font('Helvetica').text(technicalSkills);
    doc.fontSize(10).font('Helvetica-Bold').text("Soft Skills: ", { continued: true }).font('Helvetica').text(softSkills);
    doc.moveDown(1.5);

    // Education
    doc.fontSize(14).font('Helvetica-Bold').text("EDUCATION", { underline: true });
    doc.moveDown(0.5);
    const education = Array.isArray(analysis.education) ? analysis.education : [];
    if (education.length > 0) {
      education.forEach((edu: any) => {
        doc.fontSize(10).font('Helvetica-Bold').text(edu.degree || edu);
        doc.moveDown(0.5);
      });
    } else {
      doc.fontSize(10).font('Helvetica').text("Details not provided.");
      doc.moveDown(0.5);
    }
    doc.moveDown(1);

    // Experience
    doc.fontSize(14).font('Helvetica-Bold').text("PROFESSIONAL EXPERIENCE", { underline: true });
    doc.moveDown(0.5);
    const experience = Array.isArray(analysis.experience) ? analysis.experience : [];
    if (experience.length > 0) {
      experience.forEach((exp: any) => {
        doc.fontSize(10).font('Helvetica-Bold').text(exp.role || exp);
        if (exp.description) doc.font('Helvetica').text(exp.description);
        doc.moveDown(0.5);
      });
    } else {
      doc.fontSize(10).font('Helvetica').text("Details not provided.");
      doc.moveDown(0.5);
    }

    doc.end();

  } catch (error: any) {
    console.error("PDF Export Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Error generating PDF" });
    }
  }
});

export default router;
