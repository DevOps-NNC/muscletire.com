# Template stabilization roadmap

Source of truth: this ChatGPT Project's New Age Mobile Mechanic audit and Master Roadmap; source repo `DevOps-NNC/new-age-mobile-mechanic`, SHA `f203c525`. Template source repo `DevOps-NNC/mobile-mechanic-template`.

- **T0, baseline:** copy reusable code without customer data, add configurable branding + new per-client env and setup. Gate: scaffold command succeeds and audit identifies any residual locality leakage.
- **T1, security:** enforce RBAC at every legacy tRPC route; hide blog drafts; harden lead input and add persistent bot/rate controls. Gate: role matrix and abuse tests.
- **T2, reliability:** make public leads transaction-safe, queue outbound webhook handoffs, normalize phone/customer matching, verify Neon migrations. Gate: end-to-end lead and retry tests.
- **T3, operations:** unify Neon Auth across GA4 endpoints, replace legacy Manus storage and routes with an independently configured provider, secure cron GET, avoid site publishing drift. Gate: fresh Vercel deploy + smoke tests.
- **T4, quality:** CI for checks/tests/build, dependency/security scanning, migration safety, logging and backup/restore evidence. Gate: green CI and successful recovery drill.
- **T5, commercial:** add approved payments, optional customer portal, appointments/reminders and validated revenue attribution as separately scoped modules. Gate: customer acceptance.
- **T6, reusable factory:** smoke-test creation of at least two isolated client repos/databases from this template, with automated rebranding, SEO correctness and zero cross-client data. Gate: both deployments independently verified.

DO NOT declare a gate passed based only on source-code presence. The original repo's findings are the initial risk register. Any scope change requires an entry in docs/DECISIONS.md.
