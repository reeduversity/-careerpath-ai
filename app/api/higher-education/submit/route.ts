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

    const indianStates = [
      "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
      "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi NCR", 
      "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", 
      "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
      "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", 
      "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
      "Uttarakhand", "West Bengal", "Anywhere in India"
    ];

    if (preferredStudyLocation) {
      const normalized = preferredStudyLocation.trim().toLowerCase().replace(/\s+/g, ' ');
      const exactMatch = indianStates.find(state => state.trim().toLowerCase().replace(/\s+/g, ' ') === normalized);
      if (!exactMatch) {
        return NextResponse.json({ success: false, message: "You are currently on the Domestic page; please only search for Indian locations." }, { status: 400 });
      }
    }

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
