"""Renders the cards and builds print PDFs, mockups and the presentation.

Each card folder holds front.html and back.html drawn at 1125x675
(3.75x2.25 in at 300 dpi, card plus 0.125 in bleed). Run:

    python3 build.py            # render sides and mockups, then build files
    python3 build.py --no-render
"""
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
SHOT = Path("/tmp/claude-0/e2e/shot.mjs")
DPI = 300
CARDS = [
    ("1-arco-clasico", "Classic arch"),
    ("2-ciruela-elegante", "Elegant plum"),
    ("3-paisaje-valle", "Valley landscape"),
    ("4-kraft-sello", "Kraft & stamp"),
    ("5-minimal-tipografica", "Modern minimal"),
]
CREAM = (250, 246, 235)
PLUM = (64, 39, 59)
BLEED = 37  # 0.125 in at 300 dpi


def shot(url, out, w, h):
    subprocess.run(["node", str(SHOT), url, str(out), str(w), str(h)], cwd=SHOT.parent, check=True, capture_output=True)


def render(folder, number, name):
    for side in ("front", "back"):
        shot((HERE / folder / f"{side}.html").as_uri(), HERE / folder / f"{side}.png", 1125, 675)
    url = f"{(HERE / 'mockup.html').as_uri()}?dir={folder}&num={quote(f'Alternative {number}')}&name={quote(name)}"
    shot(url, HERE / folder / "mockup.png", 1800, 1100)


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


def flat_page(folder, label):
    w, h = 1050, 600
    pad, gap, label_h = 80, 50, 70
    page = Image.new("RGB", (pad * 2 + w * 2 + gap, pad * 2 + label_h + h), CREAM)
    d = ImageDraw.Draw(page)
    d.text((pad, pad), label, fill=PLUM, font=font(40))
    for i, img in enumerate(sides(folder)):
        x = pad + i * (w + gap)
        page.paste(trimmed(img), (x, pad + label_h))
        d.rectangle((x - 1, pad + label_h - 1, x + w, pad + label_h + h), outline=(200, 190, 200))
    return page


def main():
    if "--no-render" not in sys.argv:
        for i, (folder, name) in enumerate(CARDS, 1):
            render(folder, i, name)

    # Print file per card: two pages, with bleed.
    for folder, _ in CARDS:
        front, back = sides(folder)
        front.save(HERE / folder / f"dulce-methow-tarjeta-{folder}.pdf", save_all=True, append_images=[back], resolution=DPI)

    # Overview sheet: front and back of every card, trimmed.
    rows = [flat_page(f, f"{i} · {name}") for i, (f, name) in enumerate(CARDS, 1)]
    sheet = Image.new("RGB", (rows[0].width, sum(r.height for r in rows) - 80 * (len(rows) - 1)), CREAM)
    y = 0
    for r in rows:
        sheet.paste(r, (0, y))
        y += r.height - 80
    sheet.save(HERE / "tarjetas-5-alternativas.png")

    # Presentation: for each card, the mockup and then the flat front/back.
    pages = []
    for (folder, _), flat in zip(CARDS, rows):
        mock = Image.open(HERE / folder / "mockup.png").convert("RGB")
        pages.append(mock)
        pages.append(flat.resize((mock.width, round(flat.height * mock.width / flat.width))))
    pages[0].save(HERE / "tarjetas-5-alternativas.pdf", save_all=True, append_images=pages[1:], resolution=150)
    print("built", [f for f, _ in CARDS])


if __name__ == "__main__":
    main()
