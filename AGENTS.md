# Coding agent contract: Mobile Mechanic Platform Template

You are operating in `DevOps-NNC/mobile-mechanic-template`, copied from `DevOps-NNC/new-age-mobile-mechanic` at source commit `f203c525142df2e50c795b621dc2f7e51d92d05c`.

## Order of precedence
1. Latest explicit user instruction in the current task.
2. This file, README and docs/TEMPLATE_ROADMAP.md.
3. The user's ChatGPT Project source conversation about the New Age Mobile Mechanic audit, 47-task Master Roadmap and reusable template, when available.
4. Verified source files and tests. If sources disagree, report the discrepancy rather than silently overriding a locked decision.

## Frozen requirements
- This repo is a **reusable single-customer scaffold**, not a production clone or tenant-shared database.
- New client = new GitHub repo, Vercel project, Neon DB/branch, Neon Auth settings, ownership and tokens. Never reuse a past client's env/secrets.
- Branding, city, domain and service areas are client configuration; backend credentials and API keys are environment secrets.
- Never copy Juan's testimonials, claims, business links or lead/customer data.
- Preserve CRM, lead capture, VIN decoding, SEO, reporting and staff features unless a separately approved spec deprecates one.
- No fabricated reviews, rankings, conversion lifts, warranties or certifications.
- Never run migrations or modify real production infrastructure without explicit client authorization.
- Keep changes compatible with the planned security and reliability gates.
- Fix role permission inconsistencies before shipping; authenticated does not mean authorized.
- Before every implementation task, state baseline, affected files, acceptance tests, risks and rollback plan. Afterward report evidence and unresolved items.
- Do not claim a build or test passed unless it was actually run and the output reviewed.

## First-run sequence
1. Read client.config.json, README, docs/DEPLOYMENT_CHECKLIST.md and docs/TEMPLATE_ROADMAP.md.
2. Check git branch, git status, source SHA and whether .scaffolded.json exists.
3. If not scaffolded, use the approved business inputs and run pnpm scaffold:client.
4. Validate that no sample placeholders or unapproved locations remain.
5. Only then install, typecheck, test, build and conduct security + SEO smoke tests.
6. Record deviations in docs/DECISIONS.md; do not silently alter scope.

**Never assume this chat is accessible.** Everything needed to implement safely should be mirrored into committed docs and tests.
