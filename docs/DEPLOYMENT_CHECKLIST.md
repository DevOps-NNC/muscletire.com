# Client deployment checklist

## G0: New client separation
- [ ] Private repository created from template; no client records copied
- [ ] `client.config.json` matches client-approved company, locations and domain
- [ ] `pnpm scaffold:client` completed, no placeholder markers remain in website source
- [ ] Separate Vercel project and separate Neon database (not merely a shared schema)
- [ ] Separate Neon Auth origin, admin email, JWT/CRON secrets and integration keys

## G1: Authorization, privacy and spam controls
- [ ] Confirm user role cannot list or mutate leads, read blog drafts or alter the CMS
- [ ] Confirm lead_viewer cannot edit leads, content, analytics integration or invites
- [ ] Confirm suspended staff cannot read internal data
- [ ] Run server-side rate limit / bot-defense tests for public lead submission
- [ ] Confirm public drafts and scheduled blog posts are inaccessible
- [ ] Test password bootstrap, owner-only operations and account recovery

## G2: Operations
- [ ] Migrations applied manually to newly provisioned DB; backup + rollback plan
- [ ] Test service request -> Neon DB -> admin CRM -> webhook. Do not allow Zapier slowness to block lead acceptance
- [ ] Test quote/appointment workflows and all required consent handling
- [ ] Validate email, messaging and payment functions separately; not included by default

## G3: Vercel + storage
- [ ] Production build, Vercel function, routing and DB connectivity verified
- [ ] Blog cron tested with GET and CRON_SECRET; daily schedule default
- [ ] Analytics cron tested with GET and CRON_SECRET
- [ ] Image storage provider is configured or upload UI is disabled
- [ ] Verify /api/auth and /api/storage behavior; legacy routes may need modernization
- [ ] Confirm GA4 OAuth works for Neon-authenticated owner

## G4: Publishing and marketing claims
- [ ] Search Console ownership, canonical, sitemap, robots and all route content validated
- [ ] Only approved cities/service areas publicly listed; no old Florida locality content
- [ ] Real client photos / verified review data only; no placeholder SVG or fictional proof remains
- [ ] Test GTM/GA4 attribution, consent and lead conversion events with real settings
- [ ] Collect observed results before making performance claims

Deployment is blocked until every mandatory applicable gate is checked and evidenced.

## Live integration test gate

CI runs isolated unit tests with dummy client configuration. Database, authentication and recovery integration checks are deliberately excluded until a newly provisioned client Neon environment and authenticated test server exist. Run `RUN_LIVE_INTEGRATION_TESTS=1 pnpm test` in an authorized integration environment. A green unit workflow does not validate production migrations, identity or client data separation.
