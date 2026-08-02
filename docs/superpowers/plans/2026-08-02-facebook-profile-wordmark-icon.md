# Facebook Profile Wordmark Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revise the approved Facebook profile icon so the existing lotus symbol is paired with the complete `EasyGoSpa` wordmark.

**Architecture:** Keep the source as deterministic SVG and export an 800×800 PNG with Sharp. Reuse the existing lotus paths, recolor only approved brand elements, and keep every element within Facebook's circular crop-safe area.

**Tech Stack:** SVG, Node.js, Sharp

## Global Constraints

- Canvas must be exactly 800×800 px.
- Background must be `#1B4D3E`.
- Lotus and `Easy` / `Spa` must be `#F8F2EC`.
- `Go` must be `#C9A24B`.
- Preserve the existing EasyGoSpa lotus geometry; do not generate or invent a new logo.
- Add no tagline or other small text.
- Keep the lotus and wordmark inside the circular profile crop-safe area.

---

### Task 1: Add the complete wordmark and export the icon

**Files:**
- Modify: `creative-output/facebook-cover/EasyGoSpa-Facebook-Profile-Icon.svg`
- Modify: `creative-output/facebook-cover/EasyGoSpa-Facebook-Profile-Icon-800.png`
- Modify: `creative-output/facebook-cover/manifest.json`
- Verify: `scripts/render-facebook-profile-icon.mjs`

**Interfaces:**
- Consumes: the existing lotus paths and approved three-color palette.
- Produces: an 800×800 PNG and editable SVG with the lotus above the full `EasyGoSpa` wordmark.

- [ ] **Step 1: Update the deterministic SVG**

Move and scale the existing lotus upward, remove the standalone gold dot, and add a centered wordmark below it. Use separate SVG `<tspan>` elements so `Easy` and `Spa` are cream while `Go` is gold.

- [ ] **Step 2: Export the PNG**

Run:

```powershell
node scripts/render-facebook-profile-icon.mjs
```

Expected: `PASS ...EasyGoSpa-Facebook-Profile-Icon-800.png 800x800 PNG`.

- [ ] **Step 3: Visually inspect circular-crop safety**

Open the rendered PNG and confirm the lotus and wordmark remain legible with generous edge clearance under a circular crop.

- [ ] **Step 4: Verify dimensions and format**

Run the Sharp metadata check and require width `800`, height `800`, and format `png`.

- [ ] **Step 5: Copy the final PNG and SVG to Downloads**

Copy both files into `C:\Users\gaoju\Downloads\EasyGoSpa-Facebook-Covers`, replacing only the prior icon versions.
