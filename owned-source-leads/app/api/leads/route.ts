import { NextRequest, NextResponse } from 'next/server';
import { createInboundLead, listLeads } from '@/lib/db.runtime';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  return NextResponse.json(await listLeads({
    vertical: params.get('vertical') || undefined,
    leadType: params.get('leadType') || undefined,
    temperature: params.get('temperature') || undefined,
    status: params.get('status') || undefined,
  }));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = await createInboundLead(body);
  return NextResponse.json({ id }, { status: 201 });
}
