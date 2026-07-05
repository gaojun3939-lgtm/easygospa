# EasyGoSpa Website Image Asset Plan

Date: 2026-07-05

Scope: public website only. This plan does not change backend code, booking payload semantics, payment, revenue, dispatch, settlement, or technician portal logic. It is an audit and replacement plan; production images are not replaced in this task.

## 1. Current Image Inventory

| File / component | Current source | Current purpose | Current fallback behavior | Status |
| --- | --- | --- | --- | --- |
| `public/images/ideal-hero.jpg` | Local public jpg | Homepage hero slide 1 in `src/components/Hero.jsx` | No explicit fallback | Acceptable short term; convert to planned hero system |
| `public/images/young-woman-hero1.jpg` | Local public jpg | Homepage hero slide 2 in `src/components/Hero.jsx` | No explicit fallback | Acceptable short term; review style consistency |
| `public/images/young-woman-hero.jpg` | Local public jpg | Homepage hero slide 3 in `src/components/Hero.jsx` | No explicit fallback | Acceptable short term; review style consistency |
| `public/images/young-woman-hero2.jpg` | Local public jpg | Shared page banner background in team, gallery, services, contact, booking notifications, stats | No explicit fallback | Needs replacement with one approved local banner asset |
| `public/images/cta.jpg` | Local public jpg | CTA/why-choose visual in `src/components/WhyChooseUs.jsx` | No explicit fallback | Needs review and conversion to optimized webp |
| `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` | Default starter SVGs | Not brand-specific website imagery | Not applicable | Remove or replace if unused after image cleanup |
| `src/components/Hero.jsx` | Local `/images/*.jpg` slide list | Homepage hero background carousel | Browser broken image if file missing | Needs centralized hero asset mapping |
| `src/components/BookingModal.jsx` | `therapist.photoUrl || therapist.avatarUrl || therapist.imageUrl` | BookingModal therapist list/detail avatar | Local CSS/lucide `User` icon block; no BD/MR letters | Good logic; replace fallback with approved local therapist placeholder |
| `src/lib/bookingCatalogNormalizer.mjs` | `therapist.photoUrl` from public catalog | Normalized therapist photo metadata | Empty photo string, then BookingModal icon fallback | Good field path; should add detail/list image metadata later |
| `src/lib/therapistServiceBookingFlow.mjs` | No therapist image paths in local seed | Grace/Luna local fallback catalog | BookingModal icon fallback | Needs local placeholder path mapping until real photos exist |
| `src/components/ServicesSection.jsx` | Many Supabase and Pexels external `image_url` values | Homepage service cards | No explicit fallback | Needs replacement with local service images |
| `src/components/ServicesPage.jsx` | Supabase external `image_url` values for service page cards | Services page cards | No explicit fallback | Needs replacement with local service images; avoid duplicate data drift |
| `src/app/gallery/page.jsx` | Supabase external gallery URLs | Gallery grid and lightbox | No explicit fallback | Needs local gallery/brand image set or removal from production |
| `src/components/TestimonialsSection.jsx` | Supabase external `image_url` values | Customer/testimonial avatar-like imagery | No explicit fallback | Needs local approved review/avatar placeholder policy |
| `src/components/ReviewWidget.jsx` | Supabase external avatar URLs | Floating review widget avatars | No explicit fallback | Needs local placeholder or verified customer image policy |
| `src/components/WhatWeDo.jsx` | Two Supabase external images plus inline SVG | Section imagery | No explicit fallback | Needs local replacement images |
| `src/components/StatsSection.jsx` | Local `/images/young-woman-hero2.jpg` background | Stats background | No explicit fallback | Replace through shared banner asset |
| `src/app/team/page.jsx` | Unsplash team photos and local banner | Team profile cards and page banner | No explicit fallback | Replace with real team/therapist photos or placeholders |
| `src/app/layout.tsx` | Supabase external Open Graph images | Social preview metadata | No image fallback | Replace with local brand OG image |
| `src/components/SeoSchema.jsx` | `https://www.easygospa.com/logo.png` placeholder and Supabase image | Structured data logo/image | No fallback | Replace with real local public brand paths exposed on domain |
| `docs/*.jpg`, `docs/*.png`, `docs/*.webp`, `docs/*.jpeg` | Local documentation/reference files | Reference/design assets outside public serving path | Not used by website unless imported or moved | Do not treat as production public assets without review, compression, and relocation |

External image sources found:
- Supabase storage under `qtrypzzcjebvfcihiynt.supabase.co`.
- Pexels URLs under `images.pexels.com`.
- Unsplash URLs under `images.unsplash.com`.
- Placeholder SEO logo URL `https://www.easygospa.com/logo.png`.

No copied reference-platform images were added in this task. The audit found existing external images, but did not download or copy any new images.

## 2. Required Final Image Slots

| Slot | Purpose | Required behavior |
| --- | --- | --- |
| Therapist list avatar | Compact BookingModal list row image | Use real therapist list image if available; else local default therapist placeholder |
| Therapist detail hero image | Larger therapist profile image in BookingModal detail and future profile surfaces | Use approved therapist detail image; do not load this larger file in list rows |
| BookingModal therapist image | Shared avatar component source | Prefer `avatarUrl`, `photoUrl`, or future `listImageUrl`; fallback to local placeholder |
| Service category image | Homepage/services card visuals | Use local approved service image mapped by service id/name |
| Homepage hero image | First viewport brand visual | Use local compressed hero webp with responsive sizing |
| Default therapist placeholder | Missing therapist photo fallback | Local SVG or webp, no initials, no BD/MR letters |
| Default service placeholder | Missing service image fallback | Local neutral massage/service image or SVG |
| Empty state illustration | No therapist/search result/catalog unavailable states | Local simple SVG or webp |
| Logo/icon | Brand metadata, favicon, structured data, header if applicable | Local brand file in `public/images/brand/` or existing app icon path |
| Open Graph image | Social sharing image | Local `1200x630` brand image served from public path |

## 3. Recommended Folder Structure

Use local public assets only:

```text
public/images/therapists/
public/images/services/
public/images/placeholders/
public/images/brand/
```

Recommended naming rules:
- Therapist files: `grace-list.webp`, `grace-detail.webp`, `luna-list.webp`, `luna-detail.webp`.
- Service files: service id slug, for example `deep-tissue-massage.webp`.
- Placeholder files: `therapist-default.svg`, `service-default.webp`, `empty-state.svg`.
- Brand files: `homepage-hero.webp`, `page-banner.webp`, `og-image.webp`, `logo.svg`.

Do not keep production assets under `docs/`; that folder should remain documentation/reference only.

## 4. Recommended Image Sizes

| Image type | Size | Format | Notes |
| --- | --- | --- | --- |
| Therapist list avatar | 300x300 | webp | Square crop, object-cover, small file size |
| Therapist detail hero | 900x1200 | webp | Portrait crop, not loaded in list rows |
| Service image | 1200x900 | webp | 4:3 crop, consistent lighting/style |
| Homepage hero | 1920x1080 | webp | Also prepare smaller responsive versions later if needed |
| Placeholder avatar | SVG or 512x512 | svg/webp | Clean icon or non-person abstract therapist silhouette |
| Empty state image | SVG or 800x600 | svg/webp | Light, minimal, brand-consistent |
| Page banner | 1920x720 | webp | Replace repeated `young-woman-hero2.jpg` usage |
| Open Graph image | 1200x630 | webp/png | Local share image for metadata |

## 5. Therapist Image Mapping Plan

Do not invent real photo filenames as if they exist. Paths below are target placeholders until real approved photos are available.

| Therapist | Account id | Current real photo available | List image path | Detail image path | Fallback path | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Grace | `th-a-001` | No local real photo found | To be assigned when real photo exists | To be assigned when real photo exists | `/images/placeholders/therapist-default.svg` | Current local seed has no `photoUrl`; catalog can provide `photoUrl` |
| Luna | `th-a-002` | No local real photo found | To be assigned when real photo exists | To be assigned when real photo exists | `/images/placeholders/therapist-default.svg` | Current local seed has no `photoUrl`; catalog can provide `photoUrl` |
| Rhea | `th-a-003` | Not found in current local seed | To be assigned if account appears | To be assigned if account appears | `/images/placeholders/therapist-default.svg` | Include only when public catalog exposes a real Rhea account |
| Future therapists | Future account id | Depends on catalog | `/images/therapists/{slug}-list.webp` after approval | `/images/therapists/{slug}-detail.webp` after approval | `/images/placeholders/therapist-default.svg` | Mapping should live in normalized catalog metadata or a safe website asset map |

Implementation rule: the display name and booking payload fields must keep using account/profile mapping from the booking catalog. Image fields must not become identity fields.

## 6. Service Image Mapping Plan

| Service | Target image path | Required style | Fallback path |
| --- | --- | --- | --- |
| Deep Tissue Massage | `/images/services/deep-tissue-massage.webp` | Professional home massage scene, neutral/light room, non-sexualized | `/images/placeholders/service-default.webp` |
| Swedish Massage | `/images/services/swedish-massage.webp` | Calm home-service full-body massage environment, clean linens | `/images/placeholders/service-default.webp` |
| Thai Dry Massage | `/images/services/thai-dry-massage.webp` | Assisted stretch or dry massage setup, modest clothing, clean floor/mat | `/images/placeholders/service-default.webp` |
| Foot Massage | `/images/services/foot-massage.webp` | Foot/reflexology setup, towel, clean home/hotel context | `/images/placeholders/service-default.webp` |
| Aromatherapy | `/images/services/aromatherapy.webp` | Oils/towels with therapist context; avoid generic candle-only stock feel | `/images/placeholders/service-default.webp` |
| Neck & Shoulder Massage | `/images/services/neck-shoulder-massage.webp` | Seated or table-based upper-body care, professional and modest | `/images/placeholders/service-default.webp` |

The current booking service catalog only includes Swedish Massage, Deep Tissue Massage, Thai Dry Massage, and Foot Massage in `therapistServiceBookingFlow.mjs`. Aromatherapy and Neck & Shoulder should be mapped only if present in the public website service data or future catalog.

## 7. Visual Style Guidelines

- Clean light background, green/white brand cues, professional home-service massage feel.
- Therapist photos should look consistent: similar crop, lighting, uniform or professional attire, neutral background.
- Service images should show clear service context, not vague spa atmosphere.
- No sexualized imagery, suggestive poses, or misleading intimacy.
- No copied reference-platform photos, screenshots, logos, avatars, or UI assets.
- No low-quality stock collage or inconsistent mixed styles.
- No heavy AI-looking facial artifacts; if generated placeholders are ever used, they must be non-deceptive and reviewed before production.
- Avoid showing fake people as real verified therapists.
- Prefer real therapist photos where available; otherwise use a clearly generic EasyGoSpa placeholder.

## 8. Replacement Implementation Plan

### Phase 1: Therapist images

- Add `/public/images/placeholders/therapist-default.svg`.
- Extend normalized therapist metadata to support `listImageUrl` and `detailImageUrl` when available.
- Keep `photoUrl/avatarUrl/imageUrl` compatibility for catalog-provided real photos.
- Update BookingModal avatar usage to prefer list-sized image in the therapist wall and detail-sized image in detail view.
- Confirm no BD/MR letter fallback returns.

### Phase 2: Service images

- Add local service webp images under `/public/images/services/`.
- Replace `ServicesSection.jsx` and `ServicesPage.jsx` external URLs with a shared local service image map.
- Add default service fallback.
- Remove duplicated service image URL data where practical so homepage/services page do not drift.

### Phase 3: Homepage hero, gallery, metadata, placeholders

- Replace hero slides with approved local hero assets.
- Replace repeated page banner usage with `/images/brand/page-banner.webp`.
- Replace gallery Supabase images with approved local gallery/brand assets or hide gallery until local assets exist.
- Replace metadata/OG/schema image URLs with local public brand paths.
- Replace review/testimonial external avatars with approved local placeholder or verified customer policy.

### Phase 4: Compression and responsive loading

- Convert large jpg/png images to compressed webp where browser support is acceptable.
- Keep hero/detail images out of list cards.
- Use `loading="lazy"` for below-the-fold images.
- Use `object-cover` and stable aspect ratios to avoid layout shift.
- Add width/height or Next Image sizing where practical.
- Audit bundle/network size after replacements.

## 9. Technical Implementation Notes

- Keep image metadata in normalized therapist catalog or a website-only asset map keyed by stable therapist profile/account ids.
- Do not use image filenames as technician identity, account id, profile id, or payload data.
- Preserve existing payload fields:
  - `requestedTechnicianProfileId`
  - `requestedTechnicianProfileName`
  - `requestedTechnicianAccountId`
  - `requestedTechnicianAccountName`
  - service id/name/duration/price fields
- Use `avatarUrl`, `photoUrl`, `imageUrl` if a trusted public catalog supplies them.
- Add optional future fields without breaking old catalog payloads:
  - `listImageUrl`
  - `detailImageUrl`
  - `serviceImageUrl`
- Use local fallbacks when any image field is missing or empty.
- Use `object-cover` for cards, hero, service images, and therapist images.
- Use lazy loading for service cards, gallery cards, testimonial avatars, and below-the-fold images.
- Avoid external URLs in production image data unless a future CDN is owned/approved by EasyGoSpa and documented.
- Do not load 900x1200 detail images in the therapist list.

## 10. Risk List

- Booking payload breakage if image metadata is mixed with identity fields.
- External image licensing risk from Supabase/Pexels/Unsplash URLs without a local approved asset policy.
- Large images slowing mobile booking and homepage load.
- Inconsistent therapist photos reducing trust.
- Fake AI-looking faces making real therapist identity unclear.
- Placeholder image appearing too often if real therapist photos are missing.
- Gallery and service pages drifting if image data stays duplicated in multiple components.
- SEO/social previews showing old external images after local site images are updated.
- Broken image paths if files are moved into `public/` without updating metadata/schema references.
