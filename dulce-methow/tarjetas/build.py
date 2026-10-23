"""Builds print PDFs and an overview sheet from the rendered card sides.

Each card folder holds front.png and back.png at 1125x675 (3.75x2.25 in at
300 dpi, card plus 0.125 in bleed). Run after rendering:

    python3 build.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
DPI = 300
CARDS = [
    ("1-arco-clasico", "1 · Classic arch"),
    ("2-ciruela-elegante", "2 · Elegant plum"),
    ("3-paisaje-valle", "3 · Valley landscape"),
    ("4-kraft-sello", "4 · Kraft & stamp"),
    ("5-minimal-tipografica", "5 · Modern minimal"),
]
CREAM = (250, 246, 235)
PLUM = (64, 39, 59)
BLEED = 37  # 0.125 in at 300 dpi


def sides(folder):
    return [Image.open(HERE / folder / f"{s}.png").convert("RGB") for s in ("front", "back")]


def trimmed(img):
    return img.crop((BLEED, BLEED, img.width - BLEED, img.height - BLEED))


def font(size):
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
    ):
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def main():
    ready = [(f, label) for f, label in CARDS if (HERE / f / "front.png").exists() and (HERE / f / "back.png").exists()]

    # Print file per card: two pages, with bleed.
    for folder, _ in ready:
        front, back = sides(folder)
        front.save(HERE / folder / f"dulce-methow-tarjeta-{folder}.pdf", save_all=True, append_images=[back], resolution=DPI)

    # Overview: one row per card, front and back trimmed to the final size.
    w, h = 1050, 600
    pad, gap, label_h = 80, 50, 70
    sheet = Image.new("RGB", (pad * 2 + w * 2 + gap, pad + len(ready) * (label_h + h + gap)), CREAM)
    draw = ImageDraw.Draw(sheet)
    y = pad
    for folder, label in ready:
        draw.text((pad, y), label, fill=PLUM, font=font(40))
        y += label_h
        for i, img in enumerate(sides(folder)):
            x = pad + i * (w + gap)
            sheet.paste(trimmed(img), (x, y))
            draw.rectangle((x - 1, y - 1, x + w, y + h), outline=(200, 190, 200))
        y += h + gap
    sheet.save(HERE / "tarjetas-5-alternativas.png")

    # Presentation PDF: one page per card with front and back side by side.
    pages = []
    for folder, label in ready:
        page = Image.new("RGB", (pad * 2 + w * 2 + gap, pad * 2 + label_h + h), CREAM)
        d = ImageDraw.Draw(page)
        d.text((pad, pad), label, fill=PLUM, font=font(44))
        for i, img in enumerate(sides(folder)):
            x = pad + i * (w + gap)
            page.paste(trimmed(img), (x, pad + label_h))
            d.rectangle((x - 1, pad + label_h - 1, x + w, pad + label_h + h), outline=(200, 190, 200))
        pages.append(page)
    if pages:
        pages[0].save(HERE / "tarjetas-5-alternativas.pdf", save_all=True, append_images=pages[1:], resolution=150)
    print("built", [f for f, _ in ready])


if __name__ == "__main__":
    main()
