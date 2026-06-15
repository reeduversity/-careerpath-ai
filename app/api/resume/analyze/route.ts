import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeResumeText } from '@/lib/services/resumeAnalyzer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { resumeId } = body;
    if (!resumeId) {
      return NextResponse.json({ error: "resumeId is required" }, { status: 400 });
    }

    const resume = await prisma.resumeProfile.findUnique({
      where: { id: resumeId }
    });

    if (!resume || !resume.resumeText) {
      return NextResponse.json({ error: "Resume not found or text not extracted" }, { status: 404 });
    }

    const analysisResult = await analyzeResumeText(resume.resumeText);

    const savedAnalysis = await prisma.resumeAnalysis.upsert({
      where: { resumeProfileId: resumeId },
      update: {
        fullName: analysisResult.fullName,
        email: analysisResult.email,
        phone: analysisResult.phone,
        location: analysisResult.location,
        education: analysisResult.education,
        skills: analysisResult.skills,
        technicalSkills: analysisResult.technicalSkills,
        softSkills: analysisResult.softSkills,
        experience: analysisResult.experience,
        projects: analysisResult.projects,
        certifications: analysisResult.certifications,
        achievements: analysisResult.achievements,
        completenessScore: analysisResult.completenessScore,
        qualityScore: analysisResult.qualityScore,
        profileStrength: analysisResult.profileStrength,
      },
      create: {
        resumeProfileId: resumeId,
        fullName: analysisResult.fullName,
        email: analysisResult.email,
        phone: analysisResult.phone,
        location: analysisResult.location,
        education: analysisResult.education,
        skills: analysisResult.skills,
        technicalSkills: analysisResult.technicalSkills,
        softSkills: analysisResult.softSkills,
        experience: analysisResult.experience,
        projects: analysisResult.projects,
        certifications: analysisResult.certifications,
        achievements: analysisResult.achievements,
        completenessScore: analysisResult.completenessScore,
        qualityScore: analysisResult.qualityScore,
        profileStrength: analysisResult.profileStrength,
      }
    });

    const finalAnalysis = {
      ...savedAnalysis,
      linkedin: analysisResult.linkedin,
      github: analysisResult.github,
      portfolio: analysisResult.portfolio,
      profileType: analysisResult.profileType,
      careerGoal: analysisResult.careerGoal,
      targetJobRole: analysisResult.targetJobRole,
      industry: analysisResult.industry,
      degree: analysisResult.degree,
      institute: analysisResult.institute,
      cgpa: analysisResult.cgpa,
      passingYear: analysisResult.passingYear,
      tenthPercentage: analysisResult.tenthPercentage,
      twelfthPercentage: analysisResult.twelfthPercentage,
      experienceLevel: analysisResult.experienceLevel,
      currentCity: analysisResult.currentCity,
      currentState: analysisResult.currentState,
    };

    return NextResponse.json({ success: true, analysis: finalAnalysis });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
