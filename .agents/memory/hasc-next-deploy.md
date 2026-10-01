---
name: HASC Next deployment
description: Deployment and routing constraints for the HASC assistant in this monorepo.
---

The HASC assistant is a Next.js app inside the monorepo, while the workspace artifact wrapper supplies Replit preview routing. Its `/api` paths must be explicitly routed to the HASC service; the scaffold API service should only claim its health path or it will shadow the Next serverless routes.

Groq model IDs are retired over time. A `model_not_found` error can mean the configured model was shut down, not that the API key is missing or invalid. Check Groq's supported-model and deprecation docs before changing credentials. Also, `next start` is incompatible with Next's `output: 'standalone'`; choose one production serving mode and keep the artifact command aligned with it.

**Why:** The workspace's shared API artifact can shadow HASC routes, while Groq has retired its former default model and Next warns when `next start` is used with standalone output.

**How to apply:** When changing HASC endpoints, verify the HASC artifact owns `/api`. When chat returns `model_not_found`, check Groq's current production model list and update the configurable default. When changing Next output mode, update the Replit production run command too. Keep `GROQ_API_KEY` server-side.