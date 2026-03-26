import { NextRequest, NextResponse } from 'next/server';
import { createMcaProspect } from '@/lib/db.runtime';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = await createMcaProspect(body);
  return NextResponse.json({ id }, { status: 201 });
}
