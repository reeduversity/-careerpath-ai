import { NextResponse } from 'next/server';
import { orchestrateExamPrep } from '@/lib/services/examOrchestrator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, phone, stage, sector, examName, hours, budget, category } = body;
    
    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: "Full Name is required" }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim() || !emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "A valid Email Address is required" }, { status: 400 });
    }
    const phoneRegex = /^(\+?\d{1,3}[- ]?)?\d{10}$/;
    if (!phone || !phone.trim() || !phoneRegex.test(phone.trim().replace(/[-\s]/g, ''))) {
      return NextResponse.json({ error: "A valid 10-digit Phone Number is required" }, { status: 400 });
    }
    if (!stage || !sector) {
      return NextResponse.json({ error: "Stage and Sector are required" }, { status: 400 });
    }

    const result = await orchestrateExamPrep(stage, sector, examName, hours, budget, category || "General");
    
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Exam Orchestration Error:", error);
    return NextResponse.json({ error: error.message || "Failed to orchestrate exam prep" }, { status: 500 });
  }
}
