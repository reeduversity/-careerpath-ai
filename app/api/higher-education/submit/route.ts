import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      educationLevel,
      currentQualification,
      boardUniversity,
      percentage,
      tenthPercentage,
      twelfthPercentage,
      category,
      passingYear,
      budget,
      preferredStudyLocation,
      entranceExams
    } = body;

    const profile = await prisma.higherEducationProfile.create({
      data: {
        fullName,
        email,
        phone,
        educationLevel,
        currentQualification,
        boardUniversity,
        percentage,
        tenthPercentage,
        twelfthPercentage,
        category,
        passingYear: passingYear ? parseInt(passingYear) : null,
        budget,
        domesticProfile: {
          create: {
            state: "TBD",
            city: "TBD",
            preferredStudyLocation,
            entranceExamScores: entranceExams || null,
            board: boardUniversity,
            percentage
          }
        }
      }
    });

    return NextResponse.json({ success: true, profileId: profile.id });
  } catch (error: any) {
    console.error("Higher Education Submit Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
