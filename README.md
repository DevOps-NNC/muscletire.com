# Mobile Mechanic Platform Template

Private reusable scaffold derived from **DevOps-NNC/new-age-mobile-mechanic** at commit `f203c525142df2e50c795b621dc2f7e51d92d05c`. Source customer information and unverified reviews were stripped or replaced with onboarding markers.

**This is a client-isolated application scaffold, not a live multi-tenant SaaS.** Every customer receives a separate GitHub repo, Vercel project, Neon database and authentication environment. Never point a new client at another customer's environment.

## New customer in six steps

1. Confirm **Template repository** is enabled in GitHub Settings > General (verified enabled November 6, 2026). Choose **Use this template** to create a new private client repo.
2. Clone the new repo and open it in your code editor or coding agent.
3. Edit `client.config.json` with the approved business name, contact details, city, domain, service areas and social URLs. No secrets belong in this file.
4. Run `pnpm scaffold:client` **once**. This replaces brand markers and creates `.env` from `.env.example` when absent.
5. Supply independent Neon, Neon Auth and integration credentials in `.env` and Vercel project environment variables. Then run `pnpm install && pnpm check && pnpm test && pnpm build`.
6. Apply database migrations **only to the newly provisioned client database**, verify authentication and lead capture, then deploy through a newly linked Vercel project.

The original New Age Mobile Mechanic production repository must never be modified through this template's scaffold process.

## Included

- React 19 / Vite / TypeScript, responsive mobile mechanic site
- Neon/Postgres, Drizzle migrations, Neon Auth
- tRPC lead capture, customer/vehicle records, CRM roles, quotations and activity logs
- Service request wizard, VIN lookup and lead attribution
- Blog editor, site editor, SEO static renderer, sitemap, AMP support
- GA4 and Google Ads attribution groundwork, Zapier integration
- Source tests and operational scripts

## Important restrictions

This template still carries inherited integration and reliability issues listed in `docs/DEPLOYMENT_CHECKLIST.md`. **Do not deploy to a paying client's production domain merely because the repository builds.** Verify all permissions, routing, migrations, emails, storage and SEO pages. Claims about reviews, certifications, warranty, payment methods and service areas require explicit client approval.

See `AGENTS.md` for agent instructions and `docs/TEMPLATE_ROADMAP.md` for phased stabilization.

The canonical repository name is **`mobile-mechanic-template`**. The repository owner must rename its GitHub URL via **Settings > General > Repository name**. Editing source files does not rename GitHub repository metadata; GitHub redirects the old slug following a successful rename.
