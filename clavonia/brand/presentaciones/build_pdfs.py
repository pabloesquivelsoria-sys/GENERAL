"""Arma un PDF por variante de marca, con el mismo orden que la presentación de Dulce Methow."""
import os
import sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
VARIANTS_DIR = os.path.join(HERE, "..", "variants")

VARIANTS = [
    ("bloques-vivos", "Bloques vivos"),
    ("editorial-sereno", "Editorial sereno"),
    ("cursor-codigo", "Cursor"),
    ("papel-y-trazo", "Papel y trazo"),
    ("stickers-pop", "Stickers pop"),
]

# Orden de páginas: guía, portada, vista previa de redes, posts, story, post de enlace y banners.
PAGES = [
    "brand-guide-1600x1200.png",
    "facebook-cover-1640x624.png",
    "social-preview-1500x1150.png",
    "instagram-post-1080x1350.png",
    "instagram-square-1080x1080.png",
    "instagram-story-1080x1920.png",
    "facebook-post-1200x630.png",
    "banners-overview-1600x1200.png",
]


def load_pages(slug):
    images, missing = [], []
    for name in PAGES:
        path = os.path.join(VARIANTS_DIR, slug, name)
        if not os.path.exists(path):
            missing.append(name)
            continue
        images.append(Image.open(path).convert("RGB"))
    return images, missing


def save_pdf(images, path, title):
    first, rest = images[0], images[1:]
    first.save(path, "PDF", save_all=True, append_images=rest, resolution=144.0, quality=90, title=title)


def main():
    all_images = []
    problems = False
    for slug, name in VARIANTS:
        images, missing = load_pages(slug)
        if missing:
            problems = True
            print(f"[{slug}] faltan: {', '.join(missing)}")
        if not images:
            continue
        out = os.path.join(HERE, f"clavonia-{slug}.pdf")
        save_pdf(images, out, f"Clavonia · {name}")
        all_images.extend(images)
        print(f"[{slug}] {len(images)} páginas -> {os.path.relpath(out, HERE)} ({os.path.getsize(out) // 1024} KB)")
    if all_images:
        out = os.path.join(HERE, "clavonia-5-alternativas.pdf")
        save_pdf(all_images, out, "Clavonia · 5 alternativas de marca")
        print(f"[todas] {len(all_images)} páginas -> {os.path.relpath(out, HERE)} ({os.path.getsize(out) // 1024} KB)")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
