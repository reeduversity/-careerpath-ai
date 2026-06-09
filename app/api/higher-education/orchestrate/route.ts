import { NextResponse } from 'next/server';
import { orchestrateCollegePlan } from '@/lib/services/collegeOrchestrator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profileId } = body;
    if (!profileId) {
      return NextResponse.json({ error: "profileId required" }, { status: 400 });
    }

    const data = await orchestrateCollegePlan(profileId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Orchestration Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
