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

## Professional pass (v2) — these rules win over anything above
The first round looked homemade. A studio-quality card follows these rules:
- **Grid.** The trim is 1050×600 (inside the 37 px bleed). Use one margin all around: text and logo start at **110 px from the canvas edge** (about 0.25 in from the trim). Every element aligns to that margin or to one shared column line. Never mix centered and left-aligned text on the same side.
- **Hierarchy: three levels at most.** 1) the name or wordmark; 2) one label line (role or tagline) in tracked caps, 24–26 px, letter-spacing 0.22–0.3em; 3) contact lines in Lora 28–30 px, line-height 1.55. Nothing else competes.
- **Contact block.** One aligned column. Give each line a short label in Sage-dark small caps (`T`, `E`, `IG`, `A`) in a fixed 60 px column, or use no labels at all. Always use the same treatment on every line.
- **Sample data, no brackets.** Brackets look unfinished. Use this sample data, which the client will replace: name `Owner Name`, role `Baker & Owner`, phone `(509) 555-0123`, email `hello@dulcemethow.com`, Instagram `@dulcemethow`, address `Riverside Ave · Winthrop, WA 98862`.
- **Logo.** Use it once per card, never below 300 px tall (its tagline gets unreadable). On the other side use the type wordmark ("dulce" in Playfair italic plus "METHOW" in spaced caps) or a single line icon.
- **Ornament discipline.** At most one ornament per side (a hairline rule, a leaf sprig, an arch outline or a line icon). It aligns to the grid and has a job. Line weight is 2 px everywhere (about 0.5 pt) and the same on both sides.
- **White space.** At least 40% of each side stays empty. Nothing floats in a corner without alignment.
- **Color.** Each side has one dominant color and at most one accent. Allowed tint: Sage dark #66704F for small labels on cream only (4.9:1). On Sand or Lavender, labels are Deep Plum.
- **Typography details.** Use real typographic apostrophes and middle dots. No faux small caps (`font-variant: small-caps`); use uppercase with tracking. Optical balance: wordmark "METHOW" tracking about 0.4em and visually centered under "dulce".

## Files and render
- Write `front.html` and `back.html` in your folder. Each is a full HTML page: `<!doctype html>`, `<meta charset="utf-8">`, the fonts link, `body{margin:0}`, and one root div exactly 1125×675 with `overflow:hidden`.
- Render each side to PNG to check it yourself:
  `cd /tmp/claude-0/e2e && node shot.mjs "file://<abs path>/front.html" "<abs path>/front.png" 1125 675`
  (same for back). Then Read the PNG and fix anything wrong: text outside the safe area, overlaps, low contrast, cut words, logo distorted. Re-render after fixes.
- Do not touch files outside your folder. Do not commit.
