import { NextRequest, NextResponse } from 'next/server';
import { recordConversion } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = recordConversion({
    buyerId: String(body.buyer_id || ''),
    subId: String(body.sub_id || ''),
    eventType: String(body.event_type || 'conversion'),
    payoutValue: body.payout_value ? String(body.payout_value) : '',
    rawPayload: JSON.stringify(body),
  });

  if (!result) return NextResponse.json({ error: 'Route not found' }, { status: 404 });
  return NextResponse.json({ ok: true, ...result });
}
