# Content inventory (M7)

Use this checklist when gathering real URLs from division officers. **Do not seed placeholder URLs** into production.

## Verified (M7)

| Placement | Category / section | Name | Description | URL | Type | Division | Active | Display order |
|---|---|---|---|---|---|---|---|---|
| Academic Drive | Academic Drive | Official Academic Drive | Official UP Circuit academic Google Drive folder | https://drive.google.com/drive/folders/1p0YfBR_USHSX7M_XKCb8lxv-fOqC5pN8?usp=drive_link | GOOGLE_DRIVE | | yes | 0 |
| Resources | Organizational Documents | UP Circuit Constitution | Official Constitution document (link only — do not edit content) | https://drive.google.com/file/d/0BwpnmRTN35zQQTBQVHNudnk4TnM/view?usp=sharing&resourcekey=0-odb6pGr4b4hkefdfJO4Fxw | GOOGLE_DRIVE | | yes | 0 |
| Renewals (constant) | — | Membership Portal | External renewal — not a resource row | https://membership.upcircuit.org/ | — | | — | — |
| Login (constant) | — | First-time renewal / new member | Google Form for users without a portal account | https://docs.google.com/forms/d/e/1FAIpQLScXEvv1TbG9upZ3ymzA-svMnZQ_Nb6VudR0YV9YWZOdp85TzA/viewform | GOOGLE_FORM | | — | — |

## Awaiting verification

| Placement | Category / section | Name | URL | Type | Notes |
|---|---|---|---|---|---|
| Academic Drive | | EEEPen | | EXTERNAL_LINK | No official URL yet |
| Resources | | Code of Discipline | | EXTERNAL_LINK | |
| Resources | | CKT Trivia | | EXTERNAL_LINK | |
| Resources | | Safe Space | | EXTERNAL_LINK | |
| Resources | Requests | Double Division | | GOOGLE_FORM | Category seeded empty |
| Resources | Requests | Transfer Request | | GOOGLE_FORM | |
| Resources | Requests | Headships Form | | GOOGLE_FORM | |
| Resources | Requests | Pub Request | | GOOGLE_FORM | |
| Resources | Requests | Finance Request | | GOOGLE_FORM | |
| Resources | Requests | Venue Request | | GOOGLE_FORM | |
| Division | (per division) | GC / Drive / Sheet links | | varies | Six standing divisions — no URLs yet |

**Field notes**

- **Placement:** `Academic Drive`, `Resources`, or `Division`.
- **Category / section:** Admin-created `resource_categories.name`. Only create a section when you have a real link for it.
- **Type:** `GOOGLE_FORM`, `GOOGLE_SHEET`, `GOOGLE_DRIVE`, `GOOGLE_DOC`, or `EXTERNAL_LINK`.
- **Division:** Leave blank for global Resources / Academic Drive rows. Use the official Constitution division name for division-owned links.
- **Requests** is seeded empty by M6 migration; add form rows when URLs are confirmed.
- Membership renewal uses frontend `RENEWAL_URL` → internal `/renewals` page → official Membership Portal (not a resource row).

**Local seed:** Run `python scripts/seed_verified_content.py` to upsert only the verified Academic Drive and Constitution rows (opt-in; not run by `start-local.bat`).
