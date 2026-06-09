import { NextResponse } from 'next/server';
import { orchestrateCareerPlan } from '@/lib/services/careerOrchestrator';
import { appCache } from '@/lib/cache';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, resumeProfileId, careerRoleId, jobInterest, examName, profileType, jobSeekerProfileId } = body;
    
    if (!resumeProfileId || !careerRoleId) {
      return NextResponse.json({ success: false, error: "resumeProfileId and careerRoleId are required" }, { status: 400 });
    }

    const CACHE_KEY = JSON.stringify({ userId, resumeProfileId, careerRoleId, jobInterest, examName, profileType, jobSeekerProfileId });

    const result = await orchestrateCareerPlan(resumeProfileId, careerRoleId, jobInterest, examName, profileType, jobSeekerProfileId);
    
    appCache.set(CACHE_KEY, result);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
