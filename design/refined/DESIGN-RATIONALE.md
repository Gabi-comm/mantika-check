# MANTIKA CHECK · Design Rationale (v2 refinement)

## Audit summary
- **Keep:** the Calibrated Paper palette and its single meanings, the encoding (solid = measured, gold dashed = experimental, hatch = uncertainty), Plex Sans and Plex Mono, and status shown as icon plus word.
- **Improve:** the identity, the type rhythm (one scale for mobile and web), the density of web data (14px minimum, 44px rows), the separation of nav, analysis and method panels, and the scanner composition.
- **Remove:** the strip symbol (it read as a battery), Bricolage (a third font family with no role), tracked uppercase labels, and placeholder photo tiles.
- **Defects found by rendering v1:** five panels on the master moodboard fell out of the grid and their fonts fell back to a serif. The strip results screen (page 6) had a fragile disclosure and a stacked label layout, which is the likely cause of the collision in the PDF export. I could not reproduce that collision in a browser render. v2 removes both patterns.

## Identity
- **Selected: Concept A, Editorial Wordmark.** It is drawn as vector geometry on a 100 unit cap height. MANTIKA uses a 17 unit stroke and CHECK a 10 unit stroke.
- **The "gauge A":** the crossbar stops short of the left stroke and fuses into the right one, like a needle reading a level. It is gold in colour versions and ink in mono.
- **App icon:** the A on its own. It stays recognisable at 16px.
- **Concept B rejected:** its three-step swatch symbol reads as a signal meter. It also implies a graded scale the research has not validated.
- **Minimum sizes:** lockup 120px, compact 72px, icon 16px. Clear space equals the cap height.
- **Files:** `brand/` holds the SVGs. `build_logo.py` regenerates them.

## Vendors
- One ink action per screen, at the bottom within thumb reach. Targets are 56px for primary actions and at least 48px elsewhere.
- Light paper ground for daylight readability. Body text is 17px.
- Readings say "Band 2 of 3" and carry an Experimental tag. No screen says safe or unsafe, and there are no countdowns.
- The scanner's checks cover only light, focus and strip alignment, which can be computed from the photo. It says so on screen.
- The vendor confirms or corrects the band. Both answers are kept for the research team.
- The oil log is three grouped steps: choices instead of typing, a temperature stepper, and a "Don't know" option.

## Researchers
- A grouped rail (Overview, Track 1, Track 2, Outputs), a main analysis column, and a right method panel holding limitations, gates and provenance.
- Every chart has a unit, a source line, a "Show table" toggle and a 25% line labelled as a research benchmark, not Philippine law.
- No results are invented. Values show [n], [x], "not run", "pending" or "not computed". Chart shapes are labelled illustrative.

## Accessibility
- Measured WCAG ratios: body 15.97, secondary 10.31, muted 7.56 on white. Experimental text on its background 6.51, error 7.24, ok 8.41.
- Gold #B07A2A (3.71 on white) is used only for graphics and the focus ring, never for text.
- Temperature series sit on an ink ramp that differs in lightness (all at least 3.49 on white), and each has its own marker.
- Verified by rendering in headless Chromium: no page-level horizontal scroll on the web screens at 360, 768, 1024 and 1440px, or on the mobile screens at 320px. Wide tables scroll inside their own boxes.

## Not verified
- **Fonts:** the renders used fallback fonts because Google Fonts did not load in the preview environment.
- **Not tested:** 200% text zoom, screen readers, keyboard order and reduced motion.
- **Mobile screen height:** at 320px the Oil log is taller than one screen and scrolls.
- **Strip colours:** these are stand-ins until real kit photos exist.

## Source files
- **Format:** the `*.dc.html` files are the editable Design canvas sources. Their only external dependency is `./support.js`, the canvas runtime, which is supplied when they are opened in the canvas. Opened directly in a browser, they still render as static HTML.
- **Images:** logo references point to `../brand/*.svg`.
- **Rendered screens:** `previews/` holds the PNG renders.
