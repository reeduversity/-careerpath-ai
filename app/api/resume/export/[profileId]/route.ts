import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';

export async function GET(req: Request, { params }: { params: Promise<{ profileId: string }> }) {
  try {
    const resolvedParams = await params;
    const { profileId } = resolvedParams;

    const analysis = await prisma.resumeAnalysis.findUnique({
      where: { resumeProfileId: profileId }
    });

    if (!analysis) {
      return NextResponse.json({ error: "Resume analysis not found" }, { status: 404 });
    }

    const doc = new PDFDocument({ margin: 50 });
    
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    doc.fontSize(24).font('Helvetica-Bold').text(analysis.fullName || "Your Name", { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`${analysis.email || ""} | ${analysis.phone || ""} | ${analysis.location || ""}`, { align: 'center' });
    doc.moveDown(2);

    const technicalSkills = Array.isArray(analysis.technicalSkills) && analysis.technicalSkills.length > 0 ? analysis.technicalSkills.join(", ") : null;
    const softSkills = Array.isArray(analysis.softSkills) && analysis.softSkills.length > 0 ? analysis.softSkills.join(", ") : null;
    
    if (technicalSkills || softSkills) {
      doc.fontSize(14).font('Helvetica-Bold').text("SKILLS", { underline: true });
      doc.moveDown(0.5);
      if (technicalSkills) doc.fontSize(10).font('Helvetica-Bold').text("Technical: ", { continued: true }).font('Helvetica').text(technicalSkills).moveDown(0.5);
      if (softSkills) doc.fontSize(10).font('Helvetica-Bold').text("Soft Skills: ", { continued: true }).font('Helvetica').text(softSkills);
      doc.moveDown(1);
    }

    const education = Array.isArray(analysis.education) ? analysis.education.filter((e: any) => e) : [];
    if (education.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text("EDUCATION", { underline: true });
      doc.moveDown(0.5);
      education.forEach((edu: any) => {
        if (typeof edu === 'object') {
          doc.fontSize(12).font('Helvetica-Bold').text(edu.degree || edu.institution || "Education Details");
          if (edu.institution) doc.fontSize(10).font('Helvetica').text(edu.institution);
          if (edu.year || edu.passingYear) doc.fontSize(10).font('Helvetica').text(`Year: ${edu.year || edu.passingYear}`);
          if (edu.cgpa || edu.score) doc.fontSize(10).font('Helvetica').text(`Score: ${edu.cgpa || edu.score}`);
        } else {
          doc.fontSize(10).font('Helvetica-Bold').text(String(edu));
        }
        doc.moveDown(0.5);
      });
      doc.moveDown(1);
    }

    const experience = Array.isArray(analysis.experience) ? analysis.experience.filter(e => e) : [];
    if (experience.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text("PROFESSIONAL EXPERIENCE", { underline: true });
      doc.moveDown(0.5);
      experience.forEach((exp: any) => {
        doc.fontSize(10).font('Helvetica-Bold').text(exp.role || exp);
        if (exp.company) doc.font('Helvetica-Oblique').text(exp.company);
        if (exp.description) doc.font('Helvetica').text(exp.description);
        doc.moveDown(0.5);
      });
      doc.moveDown(1);
    }

    const projects = Array.isArray(analysis.projects) ? analysis.projects.filter(p => p) : [];
    if (projects.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text("PROJECTS", { underline: true });
      doc.moveDown(0.5);
      projects.forEach((proj: any) => {
        if (typeof proj === 'object') {
          doc.fontSize(10).font('Helvetica-Bold').text(proj.name || proj.title || "Project");
          if (proj.techStack) doc.font('Helvetica-Oblique').text(`Tech Stack: ${proj.techStack}`);
          if (proj.description) doc.font('Helvetica').text(proj.description);
        } else {
          doc.fontSize(10).font('Helvetica-Bold').text(String(proj));
        }
        doc.moveDown(0.5);
      });
      doc.moveDown(1);
    }

    const certsAndAchievements = [
      ...(Array.isArray(analysis.certifications) ? analysis.certifications : []),
      ...(Array.isArray(analysis.achievements) ? analysis.achievements : [])
    ].filter(Boolean);

    if (certsAndAchievements.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text("CERTIFICATIONS & ACHIEVEMENTS", { underline: true });
      doc.moveDown(0.5);
      certsAndAchievements.forEach((cert: any) => {
        const text = typeof cert === 'object' ? (cert.name || cert.title || cert.description || JSON.stringify(cert)) : String(cert);
        doc.fontSize(10).font('Helvetica').text(`• ${text}`);
        doc.moveDown(0.2);
      });
      doc.moveDown(1);
    }

    doc.end();
    
    const pdfBuffer = await pdfPromise;
    
    // Sanitize user name for filename
    const safeName = analysis.fullName ? analysis.fullName.replace(/[^a-zA-Z0-9]/g, '_') : 'User';

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ATS_Resume_${safeName}.pdf"`
      }
    });

  } catch (error: any) {
    console.error("PDF Export Error:", error);
    return NextResponse.json({ success: false, message: "Error generating PDF" }, { status: 500 });
  }
}
