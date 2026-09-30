# HASC Kaithal AI Assistant

Production-ready AI admissions assistant for Hartron Advanced Skill Centre (HASC), Kaithal, Haryana. It uses Next.js App Router, TypeScript, Tailwind CSS, a server-only Groq integration, streamed responses, and external-only lead delivery.

## Run on Replit

From the app directory:

```bash
cd artifacts/hasc-assistant
npm run dev
```

The app binds to `0.0.0.0` and uses port `3000` by default. The Replit workflow supplies its own `PORT`.

Copy `.env.example` to `.env.local` and set `GROQ_API_KEY` for real responses. The app intentionally returns `Server busy, please try again.` when no provider key is configured rather than exposing a fake answer.

## Replit → GitHub → Vercel

1. Push the repository to GitHub from Replit.
2. In Vercel, import the GitHub repository.
3. Set **Root Directory** to `artifacts/hasc-assistant`.
4. Keep the framework as **Next.js**. Vercel will use `npm run build` (or `pnpm run build`) and `next start` is not needed on Vercel.
5. In Vercel **Project Settings → Environment Variables**, add:
   - `GROQ_API_KEY` — required, server-only Groq key.
   - `GROQ_MODEL` — optional; defaults to `llama-3.3-70b-versatile`.
   - `LEAD_WEBHOOK_URL` — optional webhook URL for leads and feedback.
   - `RESEND_API_KEY` — optional email delivery.
   - `RESEND_FROM_EMAIL` and `LEAD_EMAIL_TO` — optional Resend overrides.
6. Redeploy after saving the variables. Never add `GROQ_API_KEY` to `NEXT_PUBLIC_*` variables or browser code.

Edit `data/knowledge.md` to update verified institute information. Keep incomplete owner fields as `[FILL]`; the assistant treats them as unavailable.

## Add the floating widget to hartronindia.com

After deployment, replace `YOUR-VERCEL-DOMAIN` with the Vercel domain:

```html
<script src="https://YOUR-VERCEL-DOMAIN/embed.js" defer></script>
```

The script creates a bottom-right HA bubble and opens the `/embed` assistant in a responsive panel. If the host site does not allow scripts, use this iframe instead:

```html
<iframe
  title="HASC admissions assistant"
  src="https://YOUR-VERCEL-DOMAIN/embed"
  style="position:fixed;right:20px;bottom:20px;width:min(390px,calc(100vw - 40px));height:min(720px,calc(100vh - 40px));border:0;border-radius:20px;box-shadow:0 20px 65px rgba(19,34,56,.24);z-index:2147483645"
  loading="lazy"
></iframe>
```

## Routes

- `/` — full-page chat
- `/embed` — compact embeddable chat surface
- `/api/chat` — server-only Groq streaming endpoint
- `/api/lead` — webhook and optional Resend delivery
- `/api/feedback` — feedback logging and optional webhook delivery