---
name: HASC Next deployment
description: Deployment and routing constraints for the HASC assistant in this monorepo.
---

The HASC assistant is a Next.js app inside the monorepo, while the workspace artifact wrapper still supplies Replit preview routing. Its `/api` paths must be explicitly routed to the HASC service; the scaffold API service should only claim its health path or it will shadow the Next serverless routes.

**Why:** The workspace already contains a shared API artifact that claims `/api`; leaving that broad claim in place produces proxy-level 502s before requests reach the HASC Next handlers.

**How to apply:** When adding or changing HASC API endpoints, verify the HASC artifact owns `/api` and the shared API artifact does not claim the same subpaths. Deploy from `artifacts/hasc-assistant` on Vercel with `GROQ_API_KEY` set server-side.