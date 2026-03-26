import { NextRequest, NextResponse } from 'next/server';
import { createMcaProspect } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = createMcaProspect(body);
  return NextResponse.json({ id }, { status: 201 });
}
