import { NextResponse } from 'next/server';
import { getDashboardMetrics } from '@/lib/db';

export async function GET() {
  return NextResponse.json(getDashboardMetrics());
}
