import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../lib/server/rate-limit';
import { getSystemPrompt } from '../../../lib/server/prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const MAX_MESSAGE_LENGTH = 500;

function cleanText(value: unknown) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()
    : '';
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ChatMessage>;
  return (
    (candidate.role === 'user' || candidate.role === 'assistant') &&
    typeof candidate.content === 'string'
  );
}

export async function POST(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown';
  const limit = checkRateLimit(`chat:${ip}`);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many messages. Please try again shortly.' },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfter) },
      },
    );
  }

  try {
    const body = (await request.json()) as {
      messages?: unknown;
      language?: unknown;
    };
    if (!Array.isArray(body.messages)) {
      return NextResponse.json({ error: 'Please send a valid message.' }, { status: 400 });
    }

    const messages = body.messages
      .filter(isChatMessage)
      .slice(-10)
      .map((message) => ({
        role: message.role,
        content: cleanText(message.content).slice(0, MAX_MESSAGE_LENGTH),
      }))
      .filter((message) => message.content.length > 0);

    if (!messages.length || messages[messages.length - 1]?.role !== 'user') {
      return NextResponse.json({ error: 'Please send a valid user message.' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server busy, please try again.' },
        { status: 503 },
      );
    }

    const groq = new Groq({ apiKey });
    const languageHint =
      body.language === 'hi'
        ? '\n\nThe visitor selected Hindi. Prefer Hindi in Devanagari unless their message is clearly Hinglish or English.'
        : body.language === 'en'
          ? '\n\nThe visitor selected English. Prefer English unless their message is clearly Hindi or Hinglish.'
          : '';

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      temperature: 0.2,
      max_tokens: 600,
      stream: true,
      messages: [
        { role: 'system', content: getSystemPrompt() + languageHint },
        ...messages,
      ],
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) controller.enqueue(encoder.encode(content));
          }
          controller.close();
        } catch (error) {
          console.error('Groq stream error', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Chat route error', error);
    return NextResponse.json(
      { error: 'Server busy, please try again.' },
      { status: 500 },
    );
  }
}