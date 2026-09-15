# Handover and Succession

Operational guide for transferring UP Circuit Member Portal ownership when WebDev leadership changes.

**Related open item:** N19 in [`open-items.md`](../architecture/phase-1/open-items.md)

---

## Why this document exists

The founding WebDev member will eventually graduate. Without a documented handoff, the organization can lose access to GitHub, hosting, email, backups, and the development journal.

Infrastructure access is **separate** from portal admin roles (C8). A Super Admin cannot deploy code or recover backups.

---

## Systems to transfer

| System | Purpose | Typical owner account |
|---|---|---|
| **GitHub organization / repo** | Source code, CI secrets, branch protection | WebDev org owner |
| **Vercel** | Frontend hosting | WebDev team |
| **Render** | Backend hosting | WebDev team |
| **Supabase** | Production + Dev PostgreSQL | WebDev team |
| **Cloudflare R2** | Encrypted database backups | WebDev team |
| **Brevo** | Transactional email (OTP, activation) | WebDev team |
| **Domain registrar** | Custom domain DNS (N4) | Circuit / WebDev |
| **Google Docs journal** | Visual development history | WebDev (officers may have read access) |

> **DECISION REQUIRED (N19):** Confirm who holds org-owner accounts for each system before the founding WebDev leaves. Record names and recovery contacts in the Google Docs journal — **not** in git.

---

## Handover checklist

Complete when transferring to a new WebDev lead:

### Access

- [ ] GitHub org ownership transferred or co-owner added  
- [ ] Vercel team admin invite sent  
- [ ] Render team admin invite sent  
- [ ] Supabase project owner access granted (Production + Dev)  
- [ ] Cloudflare R2 bucket access documented  
- [ ] Brevo account access documented  
- [ ] Domain registrar access documented (when N4 resolved)  
- [ ] Google Docs journal shared with edit access  

### Secrets (rotate after transfer if policy requires)

- [ ] `DATABASE_URL`, `MIGRATOR_DATABASE_URL` (Render)  
- [ ] `BREVO_API_KEY`, `EMAIL_FROM` (N20)  
- [ ] `MAINTENANCE_TOKEN` (GitHub Actions cleanup)  
- [ ] R2 backup credentials  
- [ ] Vercel / Render deploy hooks if used  

Never paste secret values into git documentation.

### Knowledge transfer

- [ ] Walk through [`15-development-roadmap.md`](../architecture/phase-1/15-development-roadmap.md) — current phase  
- [ ] Review [`open-items.md`](../architecture/phase-1/open-items.md) — especially prove-early items  
- [ ] Review top ADRs: 001, 002, 006, 012, 033, 040, 043, 045  
- [ ] Demonstrate local setup ([`getting-started/local-setup.md`](../getting-started/local-setup.md))  
- [ ] Demonstrate backup restore drill (N3 — must be done before production data)  
- [ ] Explain officer vs WebDev boundary (C8)  

### Operational runbooks

- [ ] Deploy flow: merge to `main` → Vercel + Render ([`12-deployment-architecture.md`](../architecture/phase-1/12-deployment-architecture.md))  
- [ ] Backup schedule: daily encrypted pg_dump to R2  
- [ ] Maintenance cleanup: GitHub Action + `MAINTENANCE_TOKEN`  
- [ ] Account unlock path for members (N15 — confirm Renewals Admin process)  

---

## Known limitations (do not casually reverse)

| Limitation | Rationale |
|---|---|
| No Supabase Auth / RLS | FastAPI is sole enforcement — ADR-001, ADR-006 |
| No JWT sessions | Revocation via DB — ADR-002 |
| No staging environment (MVP) | Cost — ADR-008; Local + Dev cover testing |
| PR previews cannot test login | CORS policy — ADR-038 |
| Officers do not get GitHub | C8 — content via admin UI |
| OTP inline (no queue) | Simplicity — measure latency (N16) |
| Argon2 params provisional | Benchmark on Render before lock-in (N1) |

Full list: [`decisions/`](../architecture/phase-1/decisions/)

---

## Organizational items pending leadership

These are not engineering tasks — track in [`open-items.md`](../architecture/phase-1/open-items.md):

| ID | Item |
|---|---|
| N2 | Data Privacy Act / PII storage sign-off |
| N4 | Custom domain purchase and DNS |
| N6 | Official division/committee/position seed names |
| N9 | Renewal grace period policy |
| N15 | Member account unlock support path |
| N20 | Transactional email sender identity |

---

## Repository policy

> **DECISION REQUIRED (D5):** No LICENSE file exists. Confirm whether the repo stays private, receives an open-source license, or remains "all rights UP Circuit" before public release.

---

## Related documents

- Deployment: [`12-deployment-architecture.md`](../architecture/phase-1/12-deployment-architecture.md)  
- Git strategy newcomer checklist: [`09-git-github-strategy.md`](../architecture/phase-1/09-git-github-strategy.md)  
- Documentation layers: [`14-documentation-system.md`](../architecture/phase-1/14-documentation-system.md)  
- Phase L handoff: [`15-development-roadmap.md`](../architecture/phase-1/15-development-roadmap.md)
