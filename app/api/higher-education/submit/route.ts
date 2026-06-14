import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      formType,
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

    if (preferredStudyLocation) {
      const normalized = preferredStudyLocation.trim().toLowerCase().replace(/\s+/g, ' ');
      if (formType === "international") {
        // Simple check to ensure they didn't type an Indian state or 'India'
        const isIndia = normalized === "india" || normalized.includes("delhi") || normalized.includes("maharashtra");
        if (isIndia) {
          return NextResponse.json({ success: false, message: "You are currently on the International page; please only search for international locations (not India)." }, { status: 400 });
        }
      } else {
        const indianStates = [
          "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
          "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi NCR", 
          "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", 
          "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
          "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", 
          "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
          "Uttarakhand", "West Bengal", "Anywhere in India"
        ];
        const exactMatch = indianStates.find(state => state.trim().toLowerCase().replace(/\s+/g, ' ') === normalized);
        if (!exactMatch) {
          return NextResponse.json({ success: false, message: "You are currently on the Domestic page; please only search for Indian locations." }, { status: 400 });
        }
      }
    }

    let sat = null, gre = null, gmat = null, ielts = null, toefl = null;
    if (formType === "international" && entranceExams) {
      const examsLower = entranceExams.toLowerCase();
      if (examsLower.includes("sat")) {
        const match = examsLower.match(/sat[^\d]*(\d+)/);
        if (match) sat = parseInt(match[1]);
      }
      if (examsLower.includes("gre")) {
        const match = examsLower.match(/gre[^\d]*(\d+)/);
        if (match) gre = parseInt(match[1]);
      }
      if (examsLower.includes("gmat")) {
        const match = examsLower.match(/gmat[^\d]*(\d+)/);
        if (match) gmat = parseInt(match[1]);
      }
      if (examsLower.includes("ielts")) {
        const match = examsLower.match(/ielts[^\d]*([\d.]+)/);
        if (match) ielts = parseFloat(match[1]);
      }
      if (examsLower.includes("toefl")) {
        const match = examsLower.match(/toefl[^\d]*(\d+)/);
        if (match) toefl = parseInt(match[1]);
      }
    }

    const profileData: any = {
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
    };

    if (formType === "international") {
      profileData.internationalProfile = {
        create: {
          preferredCountry: preferredStudyLocation,
          preferredUniversity: "TBD",
          budget,
          sat,
          gre,
          gmat,
          ielts,
          toefl
        }
      };
    } else {
      profileData.domesticProfile = {
        create: {
          state: "TBD",
          city: "TBD",
          preferredStudyLocation,
          entranceExamScores: entranceExams || null,
          board: boardUniversity,
          percentage
        }
      };
    }

    const profile = await prisma.higherEducationProfile.create({
      data: profileData
    });

    return NextResponse.json({ success: true, profileId: profile.id });
  } catch (error: any) {
    console.error("Higher Education Submit Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
