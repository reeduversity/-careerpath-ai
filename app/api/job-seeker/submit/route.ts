import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      resumeProfileId,
      profileType,
      targetJobRole,
      industry,
      degree,
      institute,
      cgpa,
      tenthPercentage,
      twelfthPercentage,
      category,
      passingYear,
      experienceLevel,
      currentCity,
      currentState,
      preferredLocation,
      workPreference,
      salaryExpectation,
      linkedin,
      github,
      portfolio,
        jobSearchType,
        preferredCountry,
        skills,
      } = body;

      if (!resumeProfileId) {
      return NextResponse.json({ error: "Missing resumeProfileId" }, { status: 400 });
    }

    // Determine experience years based on level
    let expYears = 0;
    if (experienceLevel === "0-1 Years") expYears = 1;
    else if (experienceLevel === "1-3 Years") expYears = 2;
    else if (experienceLevel === "3-5 Years") expYears = 4;
    else if (experienceLevel === "5+ Years") expYears = 6;

    // Create JobSeekerProfile and connect the ResumeProfile
    const profile = await prisma.jobSeekerProfile.create({
      data: {
        profileType,
        targetJobRole,
        industry,
        degree,
        institute,
        cgpa: cgpa ? parseFloat(cgpa) : null,
        tenthPercentage: tenthPercentage ? parseFloat(tenthPercentage) : null,
        twelfthPercentage: twelfthPercentage ? parseFloat(twelfthPercentage) : null,
        category,
        passingYear: passingYear ? parseInt(passingYear) : null,
        experienceLevel,
        experienceYears: expYears,
        currentCity,
        currentState,
        preferredLocation: jobSearchType === 'international' ? preferredCountry || 'International' : preferredLocation,
        workPreference,
        salaryExpectation,
        linkedin,
        github,
        portfolio,
        jobSearchType,
        preferredCountry,
        resumes: {
          connect: { id: resumeProfileId }
        }
      }
    });

    if (skills && Array.isArray(skills)) {
      try {
        await prisma.resumeAnalysis.update({
          where: { resumeProfileId },
          data: {
            skills: skills,
            technicalSkills: skills
          }
        });
      } catch (err) {
        console.error("Could not update ResumeAnalysis with skills", err);
      }
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error: any) {
    console.error("Job Seeker Submit Error:", error);
    return NextResponse.json({ error: error.message || "Failed to save profile" }, { status: 500 });
  }
}
