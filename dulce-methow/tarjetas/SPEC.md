# Dulce Methow · Business cards · Shared spec

Bakery: Dulce Methow, Mexican sweet bread & desserts, Winthrop, WA (Methow Valley).

## Size and print
- US business card 3.5 × 2 in, landscape. Each side is one HTML file drawn at **1125 × 675 px** (3.75 × 2.25 in at 300 dpi = card plus 0.125 in bleed on every side).
- Backgrounds and full-bleed art must reach all four edges.
- Keep every text and the logo inside the **safe area: 75 px from each edge** (bleed + 0.125 in margin), so inside x 75–1050, y 75–600.
- Smallest text: 26 px (about 6.2 pt printed). Contact lines 30–36 px.

## Logo (use it, never redraw it)
- File: `../../logo/dulce-methow-logo.jpg` (relative to your side files). 1323×1303, the arched badge on a cream #FAF6EB background.
- Place it on cream (#FAF6EB), or inside a cream rounded card or circle when the background is another color. Use `object-fit: contain`. Never stretch, recolor, rotate, crop the words or add effects. Clear space at least 1/10 of its width.

## Colors
| Name | Hex | Use |
|---|---|---|
| Cream | #FAF6EB | main background |
| Lavender | #CDBED2 | soft fills |
| Sage | #AEB594 | hills, leaf, secondary fills |
| Deep Plum | #40273B | all text, lines; dark backgrounds |
| Sand | #D9C7AE | kraft-paper accent |
Text is Deep Plum on light colors, Cream on Deep Plum. Never light text on Sage or Lavender.

## Type
- Playfair Display: italic for "dulce" and warm lines; uppercase with letter-spacing 0.3–0.45em for "METHOW"-style labels.
- Lora for contact lines.
- Fonts link (only network request allowed): `https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,500&display=swap`

## Graphic language
Arch frames with a double thin Deep Plum line; shell-bun (concha) scored lines that become mountain peaks; small sun with fine rays; slim pines; soft rolling hills; small sage leaf sprig as divider. Flat fills, thin even lines, inline SVG only. No gradients, no drop shadows, no emoji, no other images.

## Words (English, name stays Spanish)
- Name: Dulce Methow. Tagline: "Mexican sweet bread & desserts · Methow Valley". Handle: @dulcemethow.
- Contact block (placeholders stay in brackets, the client fills them): `[Owner name]`, `Baker & owner`, `[phone]`, `[email]`, `@dulcemethow`, `[address] · Winthrop, WA`.
- Call to action: "Pre-order by message".

## Files and render
- Write `front.html` and `back.html` in your folder. Each is a full HTML page: `<!doctype html>`, `<meta charset="utf-8">`, the fonts link, `body{margin:0}`, and one root div exactly 1125×675 with `overflow:hidden`.
- Render each side to PNG to check it yourself:
  `cd /tmp/claude-0/e2e && node shot.mjs "file://<abs path>/front.html" "<abs path>/front.png" 1125 675`
  (same for back). Then Read the PNG and fix anything wrong: text outside the safe area, overlaps, low contrast, cut words, logo distorted. Re-render after fixes.
- Do not touch files outside your folder. Do not commit.
