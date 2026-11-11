# Decision log

Record date, task ID, decision, evidence, affected files and approval. Baseline copied from New Age Mobile Mechanic on 2026-11-06.

## 2026-11-06: Repository naming and CI log cleanup

- Target repository slug: `DevOps-NNC/mobile-mechanic-template`. A repository owner must rename the slug in GitHub Settings > General; repository contents cannot change that setting.
- Source application `DevOps-NNC/new-age-mobile-mechanic` remains untouched.
- Repository template flag verified enabled. Latest checked GitHub Actions run succeeded; past failed runs are historical.
- Optional legacy OAuth absence and anonymous requests are not configuration errors in Neon Auth deployments. Actual login errors remain logged and must be investigated separately.
