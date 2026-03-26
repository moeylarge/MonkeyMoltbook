import { NextResponse } from 'next/server';
import { getDashboardMetrics } from '@/lib/db.runtime';

export async function GET() {
  return NextResponse.json(await getDashboardMetrics());
}
