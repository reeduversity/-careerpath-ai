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

    doc.fontSize(14).font('Helvetica-Bold').text("SKILLS", { underline: true });
    doc.moveDown(0.5);
    
    const technicalSkills = Array.isArray(analysis.technicalSkills) ? analysis.technicalSkills.join(", ") : "N/A";
    const softSkills = Array.isArray(analysis.softSkills) ? analysis.softSkills.join(", ") : "N/A";
    
    doc.fontSize(10).font('Helvetica-Bold').text("Technical: ", { continued: true }).font('Helvetica').text(technicalSkills);
    doc.fontSize(10).font('Helvetica-Bold').text("Soft Skills: ", { continued: true }).font('Helvetica').text(softSkills);
    doc.moveDown(1.5);

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
    
    const pdfBuffer = await pdfPromise;

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=ATS_Resume_${profileId}.pdf`
      }
    });

  } catch (error: any) {
    console.error("PDF Export Error:", error);
    return NextResponse.json({ success: false, message: "Error generating PDF" }, { status: 500 });
  }
}
