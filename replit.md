# HASC Kaithal AI Assistant

Professional AI admissions assistant for Hartron Advanced Skill Centre (HASC), Kaithal, with verified knowledge-base answers, streamed Groq responses, lead capture, and an embeddable widget.

## Run & Operate

- `pnpm --filter @workspace/hasc-assistant run dev` — run the HASC Next.js app (workflow supplies the preview port; defaults to port 3000)
- `npm run build` — typecheck and build the full workspace
- `pnpm run typecheck` — full typecheck across all packages
- HASC env: `GROQ_API_KEY` (required for live answers), `GROQ_MODEL` (optional), `LEAD_WEBHOOK_URL` (optional), `RESEND_API_KEY` (optional)
- The HASC app owns `/api/*` routes. The scaffold API service is narrowed to `/api/healthz` so it does not shadow the Next serverless routes.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- App: Next.js App Router, TypeScript, React, Tailwind CSS
- AI: official `groq-sdk` with server-only streaming route
- Delivery: Vercel-compatible Next serverless routes; leads are sent only to configured external webhook/email channels

## Where things live

- `artifacts/hasc-assistant/app/` — Next pages and server routes
- `artifacts/hasc-assistant/data/knowledge.md` — editable source of institute facts
- `artifacts/hasc-assistant/src/App.tsx` — chat UI and interaction state
- `artifacts/hasc-assistant/public/embed.js` — single-script floating widget
- `artifacts/hasc-assistant/README.md` — Replit, GitHub, Vercel, and embed instructions

## Architecture decisions

- The assistant is grounded only by `data/knowledge.md`; `[FILL]` fields are treated as unavailable.
- Groq is called only from `/api/chat`; the browser receives streamed text and never sees the key.
- Leads and feedback use external webhook/email delivery; runtime code does not write local files or a local database.
- The embed surface is a normal `/embed` route plus a tiny host-site script that creates the floating button and iframe.

## Product

Visitors can ask about HASC courses, fees, duration, admissions, scholarships, and contacts in English, Hindi, or Hinglish; request a callback; copy/rate answers; and use the same assistant as a full page or a floating widget.

## User preferences

- Keep institute facts editable in the markdown knowledge base rather than in UI code.

## Gotchas

- Add `GROQ_API_KEY` in Replit/Vercel before expecting live LLM answers; without it `/api/chat` intentionally returns a clear 503.
- Keep `/api` claimed by the HASC artifact when testing the Next routes locally.

## Pointers

- See `artifacts/hasc-assistant/README.md` for deployment and embed steps.
