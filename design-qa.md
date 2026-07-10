# Therapist Preview Design QA

## Correction Pass — 2026-07-10

This correction pass is authoritative. The earlier preview record is retained below as superseded history.

### Evidence

- Reference-to-live comparison boards:
  - `artifacts/therapist-preview-correction/14-qa-list-reference-vs-live.png`
  - `artifacts/therapist-preview-correction/15-qa-detail-reference-vs-live.png`
  - `artifacts/therapist-preview-correction/16-qa-services-reference-vs-live.png`
- Live public-catalog screenshots:
  - `01-mobile-therapist-list-390x844.png`
  - `02-mobile-detail-top-live-fallback-390x844.png`
  - `03-mobile-care-about-missing-bio-390x844.png`
  - `04-mobile-selected-service-duration-price-390x844.png`
  - `05-mobile-existing-booking-flow-email-390x844.png`
  - `06-mobile-services-before-selection-390x844.png`
  - `07-mobile-service-duration-90-price-390x844.png`
  - `08-mobile-detail-sticky-430x932.png`
  - `09-desktop-therapist-list-1440x1000.png`
  - `10-desktop-therapist-detail-top-1440x1000.png`
  - `11-desktop-detail-services-1440x1000.png`
  - `12-desktop-existing-booking-flow-1440x1000.png`
  - `13-mobile-search-no-results-390x844.png`

### Mandatory comparison results

- Typography: the therapist list, detail, service selector, sticky summary, and existing email booking step now use one sans-serif hierarchy. No serif regression, truncated booking subtitle, or cramped price treatment remains.
- Spacing and layout: the mobile modal is a full `100dvh` app surface. The single live card fits at 390 px with its 44 px Book target visible. Detail content scrolls in one container, and the selected summary remains sticky without horizontal overflow.
- Viewport resilience: verified at 390 x 844, 430 x 932, and 1440 x 1000. Document scroll width equaled client width at each checked state.
- Color and tokens: one EasyGoSpa green family (`#4E8D43` / `#3F7838`) is used for therapist actions and selected states; pale green is reserved for Care and verified selection surfaces.
- Image fidelity: the live technician `ida` has no uploaded public-catalog image. The compact neutral local fallback is therefore correct. No reference portrait, generated person, or fake uploaded asset was used.
- Copy and content: areas, service names, durations, and prices are live public-catalog data. The current selection evidence is Swedish Massage, 90 minutes, PHP 3,500. Rating, review count, distance, arrival time, and availability slots are not invented.
- Icons and controls: unsupported favorite/share controls and decorative no-op filters were removed. Area filtering is a functional native select; Makati returns the live technician after the search field is cleared.
- States and interactions: verified list, detail, missing-bio, unselected service, selected duration/price, sticky summary, search no-results, and Book-to-existing-email flow. Console errors were zero across all four live browser sessions.
- Accessibility: visible therapist-flow buttons and duration pills are at least 44 px high; back and primary Book controls are semantic buttons; the native area selector has a label; horizontal overflow is absent.

### Constraint-driven differences and evidence limits

- The reference uses multiple portrait therapists and ratings. The live catalog currently exposes one eligible technician, `ida`, with no public uploaded image, public biography, verified reviews, distance, or availability times. The UI truthfully shows the exact missing-bio copy and neutral image fallback.
- A real-photo detail screenshot and a real-bio screenshot are unavailable because those fields are absent in the live public catalog. They were not fabricated.
- The valid-empty and catalog-failure branches are covered by source regressions and exact-copy assertions. An isolated browser fixture was permitted by the task, but the in-app browser rejected the non-local fixture URL under its URL security policy. No production route, environment value, fallback behavior, or backend data was changed to force those states.

### Findings

- No actionable P0, P1, or P2 implementation defect remains in the live therapist path.
- Evidence blocker: the requested empty and catalog-failure screenshots could not be captured without violating the no-environment/no-production-fixture boundaries after the isolated fixture URL was blocked.

final result: blocked

## Historical Prior Pass (superseded)

## Evidence

- Source visual truth:
  - `C:/Users/gaoju/AppData/Local/Temp/codex-clipboard-5d623f80-aacc-409a-8a2c-a10257ea2b5c.png`
  - `C:/Users/gaoju/AppData/Local/Temp/codex-clipboard-6cfdc243-1e73-472d-a616-0eb65bea4f60.png`
  - `C:/Users/gaoju/AppData/Local/Temp/codex-clipboard-09fa9de9-c76c-4a70-a80f-969f60a44043.png`
  - `C:/Users/gaoju/AppData/Local/Temp/codex-clipboard-7761f70c-40f7-40e0-bb5a-a4a41fc0a798.png`
- Browser-rendered implementation screenshots:
  - `artifacts/therapist-preview/01-mobile-therapist-list.png`
  - `artifacts/therapist-preview/02-mobile-therapist-detail-top.png`
  - `artifacts/therapist-preview/03-about-and-easygospa-care.png`
  - `artifacts/therapist-preview/04-therapist-services-duration-selection-final.png`
  - `artifacts/therapist-preview/05-existing-booking-flow-opened-final.png`
  - `artifacts/therapist-preview/06-empty-state.png`
  - `artifacts/therapist-preview/07-desktop-safety-check-final.png`
- Full-view and focused comparison evidence:
  - `artifacts/therapist-preview/08-qa-list-comparison.png`
  - `artifacts/therapist-preview/09-qa-detail-comparison.png`
  - `artifacts/therapist-preview/10-qa-care-comparison.png`
  - `artifacts/therapist-preview/11-qa-services-comparison.png`
- Mobile viewport: 390 x 844.
- Desktop viewport: 1440 x 900.
- States: real public-catalog list, real therapist detail, Care/About, real service duration selected, email booking step, deterministic catalog-unavailable fallback, and desktop list.

## Comparison History

1. Initial mobile detail capture had a P2 obstruction: the selected summary stuck over EasyGoSpa Care and About. The summary now remains in normal flow on mobile and is sticky only at the desktop breakpoint. Post-fix evidence: `02-mobile-therapist-detail-top.png` and `03-about-and-easygospa-care.png`.
2. Initial mobile list capture had a P1 proportion mismatch: one real therapist caused the modal to shrink to a short bottom sheet. The mobile modal now uses a 96vh app surface while retaining the existing modal behavior. Post-fix evidence: `01-mobile-therapist-list.png` and `08-qa-list-comparison.png`.
3. Initial detail capture had a P2 placeholder-scale mismatch because the neutral fallback filled the hero like a portrait. The fallback now uses contained sizing while uploaded therapist photography still uses cover cropping. Post-fix evidence: `02-mobile-therapist-detail-top.png` and `09-qa-detail-comparison.png`.

## Required Fidelity Surfaces

- Fonts and typography: Existing EasyGoSpa font stack is preserved. Heading weights, compact labels, price emphasis, and button hierarchy follow the reference. No clipping or unintended truncation was visible at 390px.
- Spacing and layout rhythm: Near-full-height mobile list, compact row card, rounded detail hero, Care/About cards, duration pills, and service-card spacing match the reference hierarchy. Desktop uses two 490px columns inside a 1000px list with no horizontal overflow.
- Colors and visual tokens: Existing EasyGoSpa green, pale green safety surface, neutral gray controls, white cards, and restrained shadows align with the reference palette.
- Image quality and asset fidelity: The public catalog currently supplies no uploaded image for `ida`, so the existing neutral therapist placeholder is shown. No reference portrait, generated person, or fake asset was substituted. Uploaded Supabase therapist images remain preferred when present.
- Copy and content: The rendered therapist, service relationships, durations, and prices come from the live public catalog. Rating, review count, distance, earliest time, and availability-time claims are not invented. Empty-state copy matches the owner-provided wording.

## Intentional Constraint-Driven Differences

- The reference shows several therapists, portraits, ratings, distances, and earliest times. The live catalog returned one website-visible active therapist (`ida`) with no uploaded image or verified review/distance fields, so the implementation truthfully shows one card, a neutral placeholder, service area, and safe confirmation copy.
- Reference prices were not copied. The selected Swedish Massage 90-minute price is the live catalog value, PHP 3,500.
- The existing English EasyGoSpa website and modal contract are preserved; the Chinese reference is used for layout and hierarchy only.

## Browser Validation

- Tested list -> therapist card -> detail -> Swedish Massage -> 90 mins -> Book -> existing email booking step.
- Confirmed selected summary: `ida`, `Swedish Massage / 90 mins`, `PHP 3,500`.
- Confirmed empty state exposes `Continue with Any available therapist` without a named fallback technician.
- Confirmed desktop list has two columns and no horizontal overflow.
- Console errors: 0 on real-catalog mobile flow, empty state, and desktop safety check.

## Findings

- No actionable P0, P1, or P2 findings remain.
- P3: The existing BookingModal keeps rounded mobile top corners instead of recreating the reference app's operating-system chrome. This is acceptable for preview because modal behavior must remain intact.

## Implementation Checklist

- [x] Real public-catalog therapist only.
- [x] Uploaded image precedence preserved with a neutral local fallback.
- [x] Real services, durations, and selected prices.
- [x] Book opens the existing booking flow.
- [x] Any-available empty state preserved.
- [x] Mobile and desktop browser evidence captured.
- [x] Zero browser console errors.

historical final result: passed (superseded)

final result: blocked
