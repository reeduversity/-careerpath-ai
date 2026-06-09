import { NextResponse } from 'next/server';
import { orchestrateExamPrep } from '@/lib/services/examOrchestrator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { stage, sector, examName, hours, budget } = body;
    
    if (!stage || !sector) {
      return NextResponse.json({ error: "Stage and Sector are required" }, { status: 400 });
    }

    const result = await orchestrateExamPrep(stage, sector, examName, hours, budget);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Exam Orchestration Error:", error);
    return NextResponse.json({ error: error.message || "Failed to orchestrate exam prep" }, { status: 500 });
  }
}
