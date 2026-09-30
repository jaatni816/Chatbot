import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Lead = {
  name: string;
  phone: string;
  courseInterest: string;
};

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength)
    : '';
}

function isValidPhone(phone: string) {
  return /^[+()\d\s-]{7,20}$/.test(phone);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<Lead>;
    const lead = {
      name: clean(body.name, 80),
      phone: clean(body.phone, 24),
      courseInterest: clean(body.courseInterest, 120),
    };

    if (!lead.name || !isValidPhone(lead.phone) || !lead.courseInterest) {
      return NextResponse.json(
        { error: 'Please enter your name, a valid phone number and course interest.' },
        { status: 400 },
      );
    }

    const payload = {
      ...lead,
      source: 'HASC AI Assistant',
      submittedAt: new Date().toISOString(),
    };

    const webhookUrl = process.env.LEAD_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'HASC Assistant <onboarding@resend.dev>',
          to: [process.env.LEAD_EMAIL_TO || 'info@hartronkaithal.com'],
          subject: `New HASC counselling request from ${lead.name}`,
          text: `Name: ${lead.name}\nPhone: ${lead.phone}\nCourse interest: ${lead.courseInterest}`,
        }),
      });
    }

    if (!webhookUrl && !resendKey) {
      console.info('HASC lead captured; no delivery channel configured', payload);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Lead route error', error);
    return NextResponse.json({ error: 'Unable to submit right now.' }, { status: 500 });
  }
}