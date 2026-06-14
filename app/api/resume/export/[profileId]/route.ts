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

    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4'
    });
    
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Helper functions for styling
    const addSectionHeader = (title: string) => {
      doc.moveDown(1.5);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e293b').text(title.toUpperCase());
      
      // Draw a line under the header
      const y = doc.y + 4;
      doc.moveTo(50, y).lineTo(doc.page.width - 50, y).lineWidth(1).strokeColor('#cbd5e1').stroke();
      doc.moveDown(0.8);
      doc.fillColor('#0f172a'); // Reset text color to very dark slate
    };

    // Name and Contact Info
    doc.font('Helvetica-Bold').fontSize(24).fillColor('#0f172a').text(analysis.fullName || "Professional Resume", { align: 'center' });
    doc.moveDown(0.3);
    
    const contacts = [analysis.email, analysis.phone, analysis.location].filter(Boolean);
    doc.font('Helvetica').fontSize(10).fillColor('#475569').text(contacts.join("  |  "), { align: 'center' });
    doc.fillColor('#0f172a');
    doc.moveDown(0.5);

    // SKILLS
    const technicalSkills = Array.isArray(analysis.technicalSkills) && analysis.technicalSkills.length > 0 ? analysis.technicalSkills.join(", ") : null;
    const softSkills = Array.isArray(analysis.softSkills) && analysis.softSkills.length > 0 ? analysis.softSkills.join(", ") : null;
    const allSkills = Array.isArray(analysis.skills) && analysis.skills.length > 0 ? analysis.skills.join(", ") : null;
    
    if (technicalSkills || softSkills || allSkills) {
      addSectionHeader("Skills & Core Competencies");
      if (technicalSkills) {
        doc.font('Helvetica-Bold').fontSize(10).text("Technical Skills: ", { continued: true }).font('Helvetica').text(technicalSkills);
        doc.moveDown(0.3);
      }
      if (softSkills) {
        doc.font('Helvetica-Bold').fontSize(10).text("Soft Skills: ", { continued: true }).font('Helvetica').text(softSkills);
        doc.moveDown(0.3);
      }
      if (!technicalSkills && !softSkills && allSkills) {
         doc.font('Helvetica').fontSize(10).text(allSkills);
      }
    }

    // EXPERIENCE
    const experience = Array.isArray(analysis.experience) ? analysis.experience.filter(e => e) : [];
    if (experience.length > 0) {
      addSectionHeader("Professional Experience");
      experience.forEach((exp: any) => {
        if (typeof exp === 'object') {
          doc.font('Helvetica-Bold').fontSize(11).text(exp.role || exp.title || "Experience Role");
          if (exp.company) {
            doc.font('Helvetica-Bold').fontSize(10).text(exp.company, { continued: true });
            if (exp.duration || exp.year) {
               doc.font('Helvetica').text(`  |  ${exp.duration || exp.year}`);
            } else {
               doc.text(""); // new line
            }
          }
          if (exp.description) {
            doc.moveDown(0.3);
            doc.font('Helvetica').fontSize(10).text(exp.description);
          }
        } else {
          const expText = String(exp).trim();
          if (expText.startsWith('-') || expText.startsWith('•')) {
            doc.font('Helvetica').fontSize(10).text(expText);
          } else if (expText.length < 100 && !expText.includes('\n')) {
             doc.font('Helvetica-Bold').fontSize(11).text(expText);
          } else {
             doc.font('Helvetica').fontSize(10).text(`• ${expText}`);
          }
        }
        doc.moveDown(0.6);
      });
    }

    // EDUCATION
    const education = Array.isArray(analysis.education) ? analysis.education.filter((e: any) => e) : [];
    if (education.length > 0) {
      addSectionHeader("Education");
      education.forEach((edu: any) => {
        if (typeof edu === 'object') {
          doc.font('Helvetica-Bold').fontSize(11).text(edu.degree || edu.institution || "Education Detail");
          let details = [];
          if (edu.institution && edu.degree) details.push(edu.institution);
          if (edu.year || edu.passingYear) details.push(edu.year || edu.passingYear);
          if (edu.cgpa || edu.score) details.push(`Score: ${edu.cgpa || edu.score}`);
          
          if (details.length > 0) {
             doc.font('Helvetica').fontSize(10).text(details.join("  |  "));
          }
        } else {
           const eduText = String(edu).trim();
           doc.font('Helvetica').fontSize(10).text(`• ${eduText}`);
        }
        doc.moveDown(0.4);
      });
    }

    // PROJECTS
    const projects = Array.isArray(analysis.projects) ? analysis.projects.filter(p => p) : [];
    if (projects.length > 0) {
      addSectionHeader("Projects");
      projects.forEach((proj: any) => {
        if (typeof proj === 'object') {
          doc.font('Helvetica-Bold').fontSize(11).text(proj.name || proj.title || "Project");
          if (proj.techStack) {
             doc.font('Helvetica-Oblique').fontSize(10).text(`Technologies: ${proj.techStack}`);
          }
          if (proj.description) {
             doc.moveDown(0.3);
             doc.font('Helvetica').fontSize(10).text(proj.description);
          }
        } else {
          const projText = String(proj).trim();
          if (projText.startsWith('-') || projText.startsWith('•')) {
             doc.font('Helvetica').fontSize(10).text(projText);
          } else if (projText.length < 60) {
             doc.font('Helvetica-Bold').fontSize(11).text(projText);
          } else {
             doc.font('Helvetica').fontSize(10).text(`• ${projText}`);
          }
        }
        doc.moveDown(0.6);
      });
    }

    // CERTIFICATIONS & ACHIEVEMENTS
    const certsAndAchievements = [
      ...(Array.isArray(analysis.certifications) ? analysis.certifications : []),
      ...(Array.isArray(analysis.achievements) ? analysis.achievements : [])
    ].filter(Boolean);

    if (certsAndAchievements.length > 0) {
      addSectionHeader("Certifications & Achievements");
      certsAndAchievements.forEach((cert: any) => {
        const text = typeof cert === 'object' ? (cert.name || cert.title || cert.description || JSON.stringify(cert)) : String(cert);
        doc.font('Helvetica').fontSize(10).text(`• ${text.trim()}`);
        doc.moveDown(0.3);
      });
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
