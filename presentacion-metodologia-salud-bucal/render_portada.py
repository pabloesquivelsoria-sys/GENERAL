"""Render 3D (raymarching con numpy) para la portada: un molar como gnomon de un reloj de sol.

La sombra del diente cae sobre la carátula de 24 h, justo en el cepillado de mediodía omitido.
Uso:  python3 render_portada.py [escala]      (escala 1 = 980×810 px; 0.35 para una prueba rápida)
Salida: assets/portada_render.png
"""
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "assets", "portada_render.png")
FONT = os.path.join(HERE, "assets", "fonts", "DMMono-Regular.ttf")

F32 = np.float32


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], dtype=F32)


PAPER = hexrgb("#F4F0E8")
ENAMEL_TOP = hexrgb("#FAF7F1")
INK = hexrgb("#13294B")
NAVY_MID = hexrgb("#4A5A78")
NAVY_LT = hexrgb("#9AA3B5")
FAINT = hexrgb("#DED7C9")
VERM = hexrgb("#C8372D")
TEAL = hexrgb("#00897B")
TOOTH = np.array([0.985, 0.968, 0.935], dtype=F32)
TS = 1.2  # escala del diente

R_PLATE, H_PLATE = 1.7, 0.14
DAY = [(0.0, 6.5, "#DED7C9"), (6.5, 7.0, "#C8372D"), (7.0, 14.0, "#13294B"), (14.0, 15.0, "#9AA3B5"),
       (15.0, 20.0, "#4A5A78"), (20.0, 22.5, "#9AA3B5"), (22.5, 23.0, "#C8372D"), (23.0, 24.0, "#DED7C9")]
OMITTED_H = 14.5

# ── Luz: la sombra apunta hacia las 14:30 ─────────────────────────────────
theta = math.radians(OMITTED_H * 15)
shadow_dir = np.array([math.sin(theta), 0, -math.cos(theta)])
elev = math.radians(47)
LIGHT = np.array([-shadow_dir[0] * math.cos(elev), math.sin(elev), -shadow_dir[2] * math.cos(elev)], dtype=F32)
LIGHT /= np.linalg.norm(LIGHT)
FILL = np.array([0.5, 0.45, 0.74], dtype=F32)
FILL /= np.linalg.norm(FILL)


# ── Textura de la carátula ────────────────────────────────────────────────
def dial_texture(size=3072):
    img = Image.new("RGB", (size, size), tuple(int(c * 255) for c in ENAMEL_TOP))
    d = ImageDraw.Draw(img)
    c = size / 2
    k = size / 2 / R_PLATE

    def pt(h, r):
        a = math.radians(h * 15)
        return c + r * k * math.sin(a), c - r * k * math.cos(a)

    def rgb(h):
        return tuple(int(h.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))

    d.ellipse([c - 1.64 * k, c - 1.64 * k, c + 1.64 * k, c + 1.64 * k], outline=rgb("#13294B"), width=5)
    for m in range(24 * 6):
        h = m / 6
        hour = m % 6 == 0
        r1, r2 = (1.43, 1.585) if hour else (1.52, 1.575)
        d.line([pt(h, r1), pt(h, r2)], fill=rgb("#13294B") if hour else rgb("#9AA3B5"), width=7 if hour else 3)
    font = ImageFont.truetype(FONT, int(0.105 * k))
    for h in range(0, 24, 3):
        x, y = pt(h, 1.33)
        d.text((x, y), f"{h:02d}", font=font, fill=rgb("#556079"), anchor="mm")
    # anillo del día
    r_in, r_out = 1.06, 1.20
    for h1, h2, col in DAY:
        a1, a2 = h1 * 15 - 90 + 0.6, h2 * 15 - 90 - 0.6
        box = [c - r_out * k, c - r_out * k, c + r_out * k, c + r_out * k]
        d.pieslice(box, a1, a2, fill=rgb(col))
    d.ellipse([c - r_in * k, c - r_in * k, c + r_in * k, c + r_in * k], fill=tuple(int(v * 255) for v in ENAMEL_TOP))
    d.ellipse([c - 0.84 * k, c - 0.84 * k, c + 0.84 * k, c + 0.84 * k], outline=rgb("#CFC7B7"), width=3)
    # momentos de cepillado
    for h, done in ((6.75, True), (OMITTED_H, False), (22.75, True)):
        x, y = pt(h, 0.95)
        r = 0.055 * k
        if done:
            d.ellipse([x - r, y - r, x + r, y + r], fill=rgb("#00897B"))
        else:
            for i in range(16):
                a1 = i * 22.5
                d.arc([x - r, y - r, x + r, y + r], a1, a1 + 11, fill=rgb("#00897B"), width=6)
    return np.asarray(img, dtype=F32) / 255


TEX = None


# ── Geometría (SDF) ───────────────────────────────────────────────────────
def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def round_box(x, y, z, b, r):
    qx, qy, qz = np.abs(x) - b[0], np.abs(y) - b[1], np.abs(z) - b[2]
    out = np.sqrt(np.maximum(qx, 0) ** 2 + np.maximum(qy, 0) ** 2 + np.maximum(qz, 0) ** 2)
    return out + np.minimum(np.maximum(qx, np.maximum(qy, qz)), 0) - r


def cone(x, y, z, a, b, r1, r2):
    bx, by, bz = b[0] - a[0], b[1] - a[1], b[2] - a[2]
    px, py, pz = x - a[0], y - a[1], z - a[2]
    h = np.clip((px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz), 0, 1)
    dx, dy, dz = px - bx * h, py - by * h, pz - bz * h
    return np.sqrt(dx * dx + dy * dy + dz * dz) - (r1 + (r2 - r1) * h)


def sphere(x, y, z, c, r):
    return np.sqrt((x - c[0]) ** 2 + (y - c[1]) ** 2 + (z - c[2]) ** 2) - r


def tooth(x, y, z):
    x, y, z = x / TS, (y - H_PLATE) / TS + H_PLATE, z / TS
    return tooth_unit(x, y, z) * TS


def tooth_unit(x, y, z):
    # corona ligeramente más estrecha hacia el cuello
    k = np.clip((1.08 - y) / 0.5, 0, 1)
    s = 1 + 0.2 * k * k * (3 - 2 * k)
    crown = round_box(x * s, y - 1.06, z * s, (0.29, 0.17, 0.24), 0.2) / s
    cusps = np.minimum.reduce([sphere(x, y, z, (cx, 1.31, cz), 0.185)
                               for cx in (-0.21, 0.21) for cz in (-0.165, 0.165)])
    crown = smin(crown, cusps, 0.1)
    groove = np.minimum(cone(x, y, z, (-0.3, 1.5, 0.0), (0.3, 1.5, 0.0), 0.065, 0.065),
                        cone(x, y, z, (0.0, 1.5, -0.26), (0.0, 1.5, 0.26), 0.06, 0.06))
    crown = smax(crown, -groove, 0.05)
    roots = np.minimum.reduce([
        cone(x, y, z, (-0.18, 0.84, 0.06), (-0.27, 0.21, 0.10), 0.2, 0.075),
        cone(x, y, z, (0.18, 0.84, 0.06), (0.26, 0.21, 0.12), 0.2, 0.075),
        cone(x, y, z, (0.0, 0.84, -0.10), (0.02, 0.22, -0.29), 0.18, 0.07),
    ])
    return smin(crown, roots, 0.17)


def plate(x, y, z):
    rr = 0.025
    dx = np.sqrt(x * x + z * z) - R_PLATE + rr
    dy = np.abs(y - H_PLATE / 2) - H_PLATE / 2 + rr
    return (np.minimum(np.maximum(dx, dy), 0)
            + np.sqrt(np.maximum(dx, 0) ** 2 + np.maximum(dy, 0) ** 2) - rr)


def scene(x, y, z, with_id=False):
    t = tooth(x, y, z)
    p = plate(x, y, z)
    f = y
    d = np.minimum(np.minimum(t, p), f)
    if not with_id:
        return d
    mid = np.where(d == f, 0, np.where(d == p, 1, 2))
    return d, mid


# ── Render ────────────────────────────────────────────────────────────────
def march(ox, oy, oz, dx, dy, dz, tmax=40.0, steps=220):
    n = ox.shape[0]
    t = np.full(n, 0.01, dtype=F32)
    hit = np.zeros(n, dtype=bool)
    alive = np.ones(n, dtype=bool)
    for _ in range(steps):
        idx = np.nonzero(alive)[0]
        if idx.size == 0:
            break
        tt = t[idx]
        d = scene(ox[idx] + dx[idx] * tt, oy[idx] + dy[idx] * tt, oz[idx] + dz[idx] * tt)
        done = d < 0.0004 * tt + 0.0002
        hit[idx[done]] = True
        t[idx] = tt + d * 0.75
        far = t[idx] > tmax
        alive[idx[done | far]] = False
    return t, hit


def soft_shadow(px, py, pz, L, k=12.0):
    n = px.shape[0]
    res = np.ones(n, dtype=F32)
    t = np.full(n, 0.015, dtype=F32)
    alive = np.ones(n, dtype=bool)
    for _ in range(90):
        idx = np.nonzero(alive)[0]
        if idx.size == 0:
            break
        tt = t[idx]
        h = scene(px[idx] + L[0] * tt, py[idx] + L[1] * tt, pz[idx] + L[2] * tt)
        res[idx] = np.minimum(res[idx], k * h / tt)
        t[idx] = tt + np.clip(h, 0.008, 0.2)
        stop = (res[idx] < 0.002) | (t[idx] > 6)
        alive[idx[stop]] = False
    res = np.clip(res, 0, 1)
    return res * res * (3 - 2 * res)


def normals(px, py, pz, e=0.0012):
    ks = [(1, -1, -1), (-1, -1, 1), (-1, 1, -1), (1, 1, 1)]
    nx = np.zeros_like(px)
    ny = np.zeros_like(px)
    nz = np.zeros_like(px)
    for a, b, c in ks:
        d = scene(px + a * e, py + b * e, pz + c * e)
        nx += a * d
        ny += b * d
        nz += c * d
    ln = np.sqrt(nx * nx + ny * ny + nz * nz) + 1e-9
    return nx / ln, ny / ln, nz / ln


def ambient_occlusion(px, py, pz, nx, ny, nz):
    occ = np.zeros_like(px)
    sca = 1.0
    for i in range(6):
        h = 0.012 + 0.06 * i
        d = scene(px + nx * h, py + ny * h, pz + nz * h)
        occ += (h - d) * sca
        sca *= 0.82
    return np.clip(1 - 2.2 * occ, 0, 1)


def shade(px, py, pz, vx, vy, vz, mid):
    nx, ny, nz = normals(px, py, pz)
    sh = soft_shadow(px + nx * 0.002, py + ny * 0.002, pz + nz * 0.002, LIGHT)
    ao = ambient_occlusion(px, py, pz, nx, ny, nz)
    ndl = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]
    col = np.zeros((px.shape[0], 3), dtype=F32)

    # suelo: el papel exacto donde no hay sombra
    m = mid == 0
    if m.any():
        f = (0.62 + 0.38 * sh[m]) * (0.6 + 0.4 * ao[m])
        col[m] = PAPER[None, :] * f[:, None]

    # placa: cara superior con la carátula, canto en tinta
    m = mid == 1
    if m.any():
        top = m & (ny > 0.9)
        side = m & ~top
        if top.any():
            u = ((px[top] / R_PLATE) * 0.5 + 0.5) * (TEX.shape[1] - 1)
            v = ((pz[top] / R_PLATE) * 0.5 + 0.5) * (TEX.shape[0] - 1)
            tex = TEX[np.clip(v.astype(int), 0, TEX.shape[0] - 1), np.clip(u.astype(int), 0, TEX.shape[1] - 1)]
            f = (0.5 + 0.5 * sh[top]) * (0.6 + 0.4 * ao[top])
            col[top] = tex * f[:, None] * 1.01
        if side.any():
            d = np.clip(ndl[side], 0, 1)
            f = (0.42 + 0.5 * d * sh[side]) * (0.55 + 0.45 * ao[side])
            hx, hy, hz = LIGHT[0] - vx[side], LIGHT[1] - vy[side], LIGHT[2] - vz[side]
            hl = np.sqrt(hx * hx + hy * hy + hz * hz) + 1e-9
            spec = np.clip((nx[side] * hx + ny[side] * hy + nz[side] * hz) / hl, 0, 1) ** 40 * 0.25 * sh[side]
            col[side] = INK[None, :] * f[:, None] + spec[:, None]

    # diente: esmalte con luz envolvente, brillo y borde
    m = mid == 2
    if m.any():
        n_ = (nx[m], ny[m], nz[m])
        wrap = 0.35
        diff = np.clip((ndl[m] + wrap) / (1 + wrap), 0, 1) * (0.25 + 0.75 * sh[m])
        fill = np.clip(n_[0] * FILL[0] + n_[1] * FILL[1] + n_[2] * FILL[2], 0, 1)
        sky = 0.5 + 0.5 * n_[1]
        hx, hy, hz = LIGHT[0] - vx[m], LIGHT[1] - vy[m], LIGHT[2] - vz[m]
        hl = np.sqrt(hx * hx + hy * hy + hz * hz) + 1e-9
        spec = np.clip((n_[0] * hx + n_[1] * hy + n_[2] * hz) / hl, 0, 1) ** 70 * 0.55 * sh[m]
        ndv = np.clip(-(n_[0] * vx[m] + n_[1] * vy[m] + n_[2] * vz[m]), 0, 1)
        rim = (1 - ndv) ** 3
        light = 0.62 * diff + 0.22 * fill + 0.28 * sky * ao[m]
        c = TOOTH[None, :] * light[:, None] * (0.55 + 0.45 * ao[m])[:, None]
        # translucidez cálida del esmalte en las zonas de penumbra
        c += np.array([0.10, 0.06, 0.02], dtype=F32)[None, :] * ((1 - sh[m]) * 0.6 + 0.2)[:, None] * ao[m][:, None]
        c += np.array([0.82, 0.88, 0.95], dtype=F32)[None, :] * (rim * 0.22 * ao[m])[:, None]
        c = c / (c + 0.32) * 1.32  # curva tonal: esmalte luminoso sin quemar las luces
        c += spec[:, None]
        col[m] = c
    return col


def camera_rays(w, h, eye, target, vfov):
    fwd = target - eye
    fwd /= np.linalg.norm(fwd)
    right = np.cross(fwd, np.array([0, 1, 0]))
    right /= np.linalg.norm(right)
    up = np.cross(right, fwd)
    th = math.tan(math.radians(vfov) / 2)
    ys, xs = np.mgrid[0:h, 0:w].astype(F32)
    sx = ((xs + 0.5) / w * 2 - 1) * th * w / h
    sy = (1 - (ys + 0.5) / h * 2) * th
    d = fwd[None, None, :] + sx[..., None] * right[None, None, :] + sy[..., None] * up[None, None, :]
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    return d.reshape(-1, 3).astype(F32)


def render(scale=1.0, ss=2):
    global TEX
    TEX = dial_texture()
    W, H = int(980 * scale), int(810 * scale)
    w, h = W * ss, H * ss
    az, el, dist = math.radians(40), math.radians(31), 6.6
    # desplazado hacia la izquierda de la cámara para que la sombra no toque el borde de la imagen
    target = np.array([-0.27, 0.52, 0.225])
    eye = target + dist * np.array([math.sin(az) * math.cos(el), math.sin(el), math.cos(az) * math.cos(el)])
    dirs = camera_rays(w, h, eye, target, 33.0)
    out = np.zeros((dirs.shape[0], 3), dtype=F32)
    chunk = 400_000
    for s0 in range(0, dirs.shape[0], chunk):
        dd = dirs[s0:s0 + chunk]
        n = dd.shape[0]
        ox = np.full(n, eye[0], F32)
        oy = np.full(n, eye[1], F32)
        oz = np.full(n, eye[2], F32)
        t, hit = march(ox, oy, oz, dd[:, 0], dd[:, 1], dd[:, 2])
        col = np.tile(PAPER, (n, 1))
        idx = np.nonzero(hit)[0]
        px = ox[idx] + dd[idx, 0] * t[idx]
        py = oy[idx] + dd[idx, 1] * t[idx]
        pz = oz[idx] + dd[idx, 2] * t[idx]
        _, mid = scene(px, py, pz, with_id=True)
        col[idx] = shade(px, py, pz, dd[idx, 0], dd[idx, 1], dd[idx, 2], mid)
        out[s0:s0 + n] = col
        print(f"  {min(s0 + chunk, dirs.shape[0]) / dirs.shape[0]:.0%}", flush=True)
    img = (np.clip(out.reshape(h, w, 3), 0, 1) * 255 + 0.5).astype(np.uint8)
    im = Image.fromarray(img).resize((W, H), Image.LANCZOS)
    im.save(OUT)
    print("Render:", OUT, im.size)


if __name__ == "__main__":
    render(float(sys.argv[1]) if len(sys.argv) > 1 else 1.25)
