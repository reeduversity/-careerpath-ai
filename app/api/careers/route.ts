import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appCache } from '@/lib/cache';

export async function GET() {
  try {
    const CACHE_KEY = "all_careers";
    const cachedData = appCache.get(CACHE_KEY);

    if (cachedData) {
      console.log("[CACHE HIT] careers");
      return NextResponse.json({ success: true, data: cachedData });
    }

    const categories = await prisma.careerCategory.findMany({
      include: {
        roles: {
          include: {
            requirements: {
              include: {
                skillMaster: true,
              },
            },
          },
        },
      },
    });

    appCache.set(CACHE_KEY, categories);
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
