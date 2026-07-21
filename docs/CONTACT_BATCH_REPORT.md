# CONTACT BATCH REPORT — easygospa (A/B/C)

Date: 2026-07-21

## Result

PASS. The website side of `FIX_BLUEPRINT_CONTACT_BATCH.md` is implemented without backend phone-normalization or rate-limit changes.

- A: both location actions now finish in one action (locate/pin, reverse lookup, address replacement, grey checked state). A later pin drag/map tap revives both actions. A failed reverse lookup preserves the current address. The obsolete `lastAutoAddressRef` path is removed.
- B: the booking form has the approved ten-country selector, defaults to Philippines `+63`, strips leading zeroes, splits pasted international numbers, and submits E.164. Philippine validation still requires a valid `9xxxxxxxxx` national number.
- C: the green WhatsApp updates banner is immediately below the primary status card for `waiting_acceptance`, `confirmed`, and `on_the_way`, and is hidden for completed/cancelled states. Arrival notification fires only on a transition into `arrived`.

All new customer-facing copy is English and uses “Therapist”.

## Focused evidence

Command: `node scripts/check-ride-hailing-flow.mjs`

```text
[ride-hailing-site] PASS phone country selector defaults to PH and exposes exactly ten approved countries actual={"defaultCountry":"PH","count":10}
[ride-hailing-site] PASS pasting +63 selects PH and strips the calling code actual={"countryIso":"PH","localNumber":"9081234567"}
[ride-hailing-site] PASS booking phone payload is normalized to E.164 actual="+639081234567"
[ride-hailing-site] PASS either location button reaches its own completed state actual=null
[ride-hailing-site] PASS dragging or tapping the map revives both location buttons actual=""
[ride-hailing-site] PASS reverse-geocode failure preserves the existing address actual="Customer typed unit 18"
[ride-hailing-site] PASS explicit location confirmation overwrites the address once actual="Resolved building"
[ride-hailing-site] PASS obsolete lastAutoAddressRef protection is removed actual=null
[ride-hailing-site] PASS WhatsApp updates banner renders below the primary status card actual=null
[ride-hailing-site] PASS arrival notification fires only on the transition into arrived actual=null
[ride-hailing-site] ALL_LOCAL_ASSERTIONS_PASS
```

Existing negative-path evidence remained green:

```text
[ride-hailing-site] NEGATIVE active_marker_lookup_failure gate=null marker=null
[ride-hailing-site] NEGATIVE cancel_client_opaque status=404 body={"ok":false,"httpStatus":404,"reason":"not_found"}
[ride-hailing-site] NEGATIVE cancel_proxy_opaque status=404 body={"ok":false,"reason":"not_found"} forwarded_ip=203.0.113.44
[ride-hailing-site] NEGATIVE cancel_proxy_rate_limit status=429 body={"ok":false,"code":"RATE_LIMITED","error":"Too many requests, please try again later."} retry_after=47
```

## Regression and build

```text
node scripts/check-service-radius-gate.mjs
SERVICE_RADIUS_GATE_CHECK_PASS

node scripts/check-website-booking-real-flow.mjs
PASS booking flow does not include external sends, finance, dispatch, or online payment

npm run build
Compiled successfully; 21/21 static pages generated; exit 0.
```

The build retained three pre-existing lint warnings (`ReviewWidget`, `TestimonialsSection`, and one no-unused-expression warning in `googleMapsLoader.mjs`).

## Browser runtime

- Production build served locally at `127.0.0.1:3030`.
- `/track/browser-smoke` mounted the tracker error state; `/` mounted the full home page and booking modal; browser console had no error/warning entries.
- The modal visibly mounted the location entry and `Confirm my location` control.
- The local production build could not reach a usable booking/catalog backend, so a ready booking banner and the post-therapist phone field were not claimed as browser E2E. Those states are covered by the focused functional/static assertions above.

## Blueprint assessment

No product-design error was found in A/B/C. The unavailable local backend limits browser evidence, not the implementation result.
