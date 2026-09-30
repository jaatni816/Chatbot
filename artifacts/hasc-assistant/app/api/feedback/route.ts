import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messageId?: unknown;
      rating?: unknown;
    };
    const messageId =
      typeof body.messageId === 'string' ? body.messageId.slice(0, 80) : '';
    const rating = body.rating === 'up' || body.rating === 'down' ? body.rating : '';

    if (!messageId || !rating) {
      return NextResponse.json({ error: 'Invalid feedback.' }, { status: 400 });
    }

    const payload = {
      messageId,
      rating,
      submittedAt: new Date().toISOString(),
    };

    console.info('HASC assistant feedback', payload);
    if (process.env.LEAD_WEBHOOK_URL) {
      await fetch(process.env.LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'feedback', ...payload }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Feedback route error', error);
    return NextResponse.json({ error: 'Unable to submit feedback.' }, { status: 500 });
  }
}