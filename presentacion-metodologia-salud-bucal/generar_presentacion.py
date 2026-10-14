"""Genera la presentación «Justificación de la hipótesis» (Salud bucal) como PDF 16:9.

Uso:  python3 generar_presentacion.py
Salida: Justificacion_Hipotesis_Salud_Bucal.pdf y laminas/*.png (si pdftoppm está disponible)
"""
import math
import os
import random
import subprocess

from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "assets", "fonts")
LOGOS = os.path.join(HERE, "assets", "logos")
OUT_PDF = os.path.join(HERE, "Justificacion_Hipotesis_Salud_Bucal.pdf")
OUT_PPTX = os.path.join(HERE, "Justificacion_Hipotesis_Salud_Bucal.pptx")
BUILD = os.path.join(HERE, "build")

W, H = 960, 540  # 16:9 (13.33 x 7.5 in)
M = 44           # margen

# ── Paleta ────────────────────────────────────────────────────────────────
PAPER = HexColor("#F4F0E8")   # marfil de esmalte
PANEL = HexColor("#ECE6DA")
ENAMEL = HexColor("#FBF9F4")
INK = HexColor("#13294B")     # tinta azul profundo
INK2 = HexColor("#556079")
MUTED = HexColor("#8A8F9C")
RULE = HexColor("#CFC7B7")
FAINT = HexColor("#DED7C9")
VERM = HexColor("#C8372D")    # tiempo · variable independiente
TEAL = HexColor("#00897B")    # higiene · variable dependiente
NAVY_MID = HexColor("#4A5A78")
NAVY_LT = HexColor("#9AA3B5")

# ── Tipografía ────────────────────────────────────────────────────────────
for name in ["InstrumentSerif-Regular", "InstrumentSerif-Italic", "InstrumentSans-Regular",
             "InstrumentSans-Bold", "InstrumentSans-Italic", "DMMono-Regular"]:
    pdfmetrics.registerFont(TTFont(name, os.path.join(FONTS, name + ".ttf")))
SERIF, SERIF_I = "InstrumentSerif-Regular", "InstrumentSerif-Italic"
SANS, SANS_B, SANS_I = "InstrumentSans-Regular", "InstrumentSans-Bold", "InstrumentSans-Italic"
MONO = "DMMono-Regular"

N_SLIDES = 13


# ── Utilidades de dibujo (coordenada y medida desde ARRIBA) ───────────────
class Slide:
    """Lienzo de una lámina. Con rec (lista), el texto y las imágenes no se dibujan: se registran
    para convertirlos en cuadros de texto e imágenes editables del .pptx, y solo queda el fondo gráfico."""

    def __init__(self, c, rec=None):
        self.c = c
        self.rec = rec

    @staticmethod
    def Y(y):
        return H - y

    def width(self, s, font, size, cs=0.0):
        return pdfmetrics.stringWidth(s, font, size) + cs * max(len(s) - 1, 0)

    def text(self, x, y, s, font, size, color, anchor="l", cs=0.0, alpha=1.0):
        c = self.c
        w = self.width(s, font, size, cs)
        if anchor == "c":
            x -= w / 2
        elif anchor == "r":
            x -= w
        if self.rec is not None:
            self.rec.append(dict(kind="text", x=x, y=y, w=w, s=s, font=font, size=size, color=color,
                                 anchor=anchor, cs=cs))
            return w
        c.setFillColor(color)
        c.setFillAlpha(alpha)
        c.setFont(font, size)
        c.drawString(x, self.Y(y), s, charSpace=cs)
        c.setFillAlpha(1)
        return w

    def label(self, x, y, s, color=INK2, size=6.8, anchor="l", cs=1.1):
        return self.text(x, y, s.upper(), MONO, size, color, anchor, cs)

    def wrap(self, s, font, size, w):
        words, lines, cur = s.split(), [], ""
        for wd in words:
            t = (cur + " " + wd).strip()
            if pdfmetrics.stringWidth(t, font, size) <= w or not cur:
                cur = t
            else:
                lines.append(cur)
                cur = wd
        if cur:
            lines.append(cur)
        return lines

    def para(self, x, y, w, s, font, size, lead, color, anchor="l"):
        """Dibuja un párrafo; y es la línea base de la primera línea. Devuelve la base de la última."""
        lines = self.wrap(s, font, size, w)
        if self.rec is not None:
            self.rec.append(dict(kind="para", x=x, y=y, w=w, s=s, font=font, size=size, lead=lead,
                                 color=color, anchor=anchor, n=len(lines)))
            return y + (len(lines) - 1) * lead
        for i, ln in enumerate(lines):
            ax = x + w / 2 if anchor == "c" else x
            self.text(ax, y + i * lead, ln, font, size, color, anchor)
        return y + (len(lines) - 1) * lead

    def rich(self, x, y, w, segs, size, lead):
        """Texto con estilos mezclados: segs = [(texto, fuente, color), …]."""
        chars = []
        for txt, font, color in segs:
            chars += [(ch, font, color) for ch in txt]
        words, cur = [], []
        for ch in chars:
            if ch[0] == " ":
                if cur:
                    words.append(cur)
                    cur = []
            else:
                cur.append(ch)
        if cur:
            words.append(cur)

        def runs(word):
            out = []
            for ch, f, col in word:
                if out and out[-1][1] == f and out[-1][2] == col:
                    out[-1][0] += ch
                else:
                    out.append([ch, f, col])
            return out

        lines, line, lw = [], [], 0.0
        for wd in words:
            rs = runs(wd)
            ww = sum(pdfmetrics.stringWidth(r[0], r[1], size) for r in rs)
            sp = pdfmetrics.stringWidth(" ", rs[0][1], size)
            if line and lw + sp + ww > w:
                lines.append(line)
                line, lw = [], 0.0
            if line:
                lw += sp
            line.append((rs, ww, sp))
            lw += ww
        if line:
            lines.append(line)
        if self.rec is not None:
            self.rec.append(dict(kind="rich", x=x, y=y, w=w, segs=segs, size=size, lead=lead, n=len(lines)))
            return y + (len(lines) - 1) * lead
        for i, ln in enumerate(lines):
            cx = x
            for j, (rs, ww, sp) in enumerate(ln):
                if j:
                    cx += sp
                for t, f, col in rs:
                    cx += self.text(cx, y + i * lead, t, f, size, col)
        return y + (len(lines) - 1) * lead

    def line(self, x1, y1, x2, y2, color, lw=0.5, dash=None, cap=0, alpha=1.0):
        c = self.c
        c.setStrokeColor(color)
        c.setStrokeAlpha(alpha)
        c.setLineWidth(lw)
        c.setLineCap(cap)
        c.setDash(dash or [])
        c.line(x1, self.Y(y1), x2, self.Y(y2))
        c.setDash([])
        c.setStrokeAlpha(1)

    def rect(self, x, y, w, h, fill=None, stroke=None, lw=0.5, r=0):
        c = self.c
        if fill is not None:
            c.setFillColor(fill)
        if stroke is not None:
            c.setStrokeColor(stroke)
            c.setLineWidth(lw)
        if r:
            c.roundRect(x, self.Y(y + h), w, h, r, stroke=int(stroke is not None), fill=int(fill is not None))
        else:
            c.rect(x, self.Y(y + h), w, h, stroke=int(stroke is not None), fill=int(fill is not None))

    def circle(self, x, y, r, fill=None, stroke=None, lw=0.5, dash=None):
        c = self.c
        if fill is not None:
            c.setFillColor(fill)
        if stroke is not None:
            c.setStrokeColor(stroke)
            c.setLineWidth(lw)
        c.setDash(dash or [])
        c.circle(x, self.Y(y), r, stroke=int(stroke is not None), fill=int(fill is not None))
        c.setDash([])

    def arrow(self, x1, y, x2, color, lw=0.7, head=4.5):
        self.line(x1, y, x2 - 1, y, color, lw)
        c = self.c
        c.setFillColor(color)
        p = c.beginPath()
        d = 1 if x2 > x1 else -1
        p.moveTo(x2, self.Y(y))
        p.lineTo(x2 - d * head, self.Y(y) + head * 0.55)
        p.lineTo(x2 - d * head, self.Y(y) - head * 0.55)
        p.close()
        c.drawPath(p, stroke=0, fill=1)

    def arrow_down(self, x, y1, y2, color, lw=0.7, head=4.5):
        self.line(x, y1, x, y2 - 1, color, lw)
        c = self.c
        c.setFillColor(color)
        p = c.beginPath()
        p.moveTo(x, self.Y(y2))
        p.lineTo(x - head * 0.55, self.Y(y2 - head))
        p.lineTo(x + head * 0.55, self.Y(y2 - head))
        p.close()
        c.drawPath(p, stroke=0, fill=1)

    def hsub(self, x, y, base, sub, font, size, color):
        """Escribe H₀ / H₁ con subíndice tipográfico real."""
        w = self.text(x, y, base, font, size, color)
        w += self.text(x + w + 0.8, y + size * 0.2, sub, SANS, size * 0.5, color)
        return w + 0.8

    def logo(self, path, x, y, h):
        img = ImageReader(path)
        iw, ih = img.getSize()
        w = h * iw / ih
        self.image(path, x, y, w, h)
        return w

    def image(self, path, x, y, w, h):
        if self.rec is not None:
            self.rec.append(dict(kind="image", path=path, x=x, y=y, w=w, h=h))
            return
        self.c.drawImage(ImageReader(path), x, self.Y(y + h), w, h, mask="auto")


# ── Elementos comunes ─────────────────────────────────────────────────────
def background(s):
    s.rect(0, 0, W, H, fill=PAPER)


def chrome(s, idx, kicker, title):
    background(s)
    s.label(M, 30, "Salud bucal — Justificación de la hipótesis", INK2)
    s.label(W - M, 30, f"{idx:02d} / {N_SLIDES:02d}", INK2, anchor="r")
    s.line(M, 40, W - M, 40, RULE, 0.5)
    s.label(M, 74, f"{idx - 1:02d} — {kicker}", VERM, size=7.5, cs=1.4)
    s.text(M - 1.5, 113, title, SERIF, 38, INK)
    ruler(s, idx)


def ruler(s, idx):
    """Regla inferior: cada lámina es un segmento; lo recorrido se marca en bermellón."""
    y = H - 36
    x0, x1 = M, W - M
    seg = (x1 - x0) / N_SLIDES
    s.line(x0, y, x1, y, RULE, 0.5)
    for i in range(N_SLIDES + 1):
        x = x0 + i * seg
        s.line(x, y, x, y - 5, INK2, 0.5)
        if i < N_SLIDES:
            for k in range(1, 8):
                xx = x + k * seg / 8
                s.line(xx, y, xx, y - (2.6 if k != 4 else 3.6), RULE, 0.45)
    s.line(x0, y, x0 + seg * idx, y, VERM, 1.6)
    s.label(M, H - 20, "TecNM · Instituto Tecnológico de Ciudad Juárez", MUTED, size=6.3)
    s.label(W - M, H - 20, "Taller de Investigación II · Unidad II", MUTED, size=6.3, anchor="r")


# ── Arte: carátula de 24 h con arcada dental ──────────────────────────────
DAY = [  # (inicio h, fin h, color)  — modelo ilustrativo de un día de estudiante
    (0.0, 6.5, FAINT), (6.5, 7.0, VERM), (7.0, 14.0, INK), (14.0, 15.0, NAVY_LT),
    (15.0, 20.0, NAVY_MID), (20.0, 22.5, NAVY_LT), (22.5, 23.0, VERM), (23.0, 24.0, FAINT),
]


def clock_ang(h):
    return math.radians(90 - h * 15)


def dial(s, cx, cy, R, show_labels=True, teeth_scale=1.0):
    c = s.c
    Y = s.Y
    # ticks de 5 minutos
    for k in range(24 * 12):
        a = clock_ang(k / 12)
        hour = k % 12 == 0
        r1, r2 = (R - 9, R + 1.5) if hour else (R - 3.5, R)
        c.setStrokeColor(INK if hour else NAVY_LT)
        c.setLineWidth(0.75 if hour else 0.32)
        c.line(cx + r1 * math.cos(a), Y(cy) + r1 * math.sin(a), cx + r2 * math.cos(a), Y(cy) + r2 * math.sin(a))
    if show_labels:
        for h in (0, 6, 12, 18):
            a = clock_ang(h)
            rr = R + 13
            s.text(cx + rr * math.cos(a), cy - rr * math.sin(a) + 2.4, f"{h:02d}", MONO, 7, INK2, "c")
    # anillo del día
    ring_r, ring_w, gap = R - 26, 12, 0.9
    c.setLineCap(0)
    for h1, h2, col in DAY:
        c.setStrokeColor(col)
        c.setLineWidth(ring_w)
        p = c.beginPath()
        start = 90 - h1 * 15 - gap / 2
        extent = -((h2 - h1) * 15 - gap)
        p.arc(cx - ring_r, Y(cy) - ring_r, cx + ring_r, Y(cy) + ring_r, start, extent)
        c.drawPath(p, stroke=1, fill=0)
    # momentos de cepillado: mañana y noche sí; mediodía, omitido
    for h, done in ((6.75, True), (14.5, False), (22.75, True)):
        a = clock_ang(h)
        rr = ring_r + ring_w / 2 + 8
        x, y = cx + rr * math.cos(a), cy - rr * math.sin(a)
        if done:
            s.circle(x, y, 3.4, fill=TEAL, stroke=PAPER, lw=1.2)
        else:
            s.circle(x, y, 3.4, fill=PAPER, stroke=TEAL, lw=0.8, dash=[1.2, 1.2])
    # arcada dental (16 piezas, vista oclusal), centrada en la carátula
    arch(s, cx, cy, R / 142)


def arch(s, cx, cy, k=1.0):
    """Arcada superior: 8 piezas por lado repartidas a lo largo de una semielipse."""
    c = s.c
    a, b = 64 * k, 76 * k
    t_end = math.radians(102)
    # (ancho mesiodistal, profundidad) relativos: incisivo central → tercer molar
    half = [(8.6, 7.0), (6.6, 6.2), (7.6, 8.0), (7.0, 8.6), (6.8, 8.8), (10.4, 11.2), (9.4, 10.6), (8.6, 9.8)]
    gap_rel = 1.2
    ts = [i / 3000 * t_end for i in range(3001)]
    pts = [(a * math.sin(t), b * math.cos(t)) for t in ts]
    L = [0.0]
    for i in range(1, len(pts)):
        L.append(L[-1] + math.dist(pts[i], pts[i - 1]))
    scale = L[-1] / (sum(w for w, _ in half) + gap_rel * (len(half) + 0.5))
    # centrar verticalmente la arcada en el punto (cx, cy)
    y_top, y_bot = b, b * math.cos(t_end)
    shift = -(y_top + y_bot) / 2

    def at(length):
        for i in range(1, len(L)):
            if L[i] >= length:
                return ts[i]
        return ts[-1]

    for side in (1, -1):
        pos = gap_rel * scale / 2
        for tw, td in half:
            tw, td = tw * scale, td * scale
            t = at(pos + tw / 2)
            x = cx + side * a * math.sin(t)
            y_up = s.Y(cy) + b * math.cos(t) + shift
            dx, dy = side * a * math.cos(t), -b * math.sin(t)
            ang = math.degrees(math.atan2(dy, dx))
            c.saveState()
            c.translate(x, y_up)
            c.rotate(ang)
            c.setFillColor(ENAMEL)
            c.setStrokeColor(INK)
            c.setLineWidth(0.6)
            c.roundRect(-tw / 2, -td / 2, tw, td, min(tw, td) * 0.42, stroke=1, fill=1)
            c.restoreState()
            pos += tw + gap_rel * scale


def legend_day(s, cx, y):
    """Leyenda en dos renglones, centrada bajo la carátula."""
    sz, cs, gap = 6, 0.9, 11
    row1 = [(FAINT, "Sueño"), (INK, "Clases"), (NAVY_MID, "Trabajo"), (NAVY_LT, "Tareas · traslados"),
            (VERM, "Tiempo libre")]
    w = sum(13 + s.width(n.upper(), MONO, sz, cs) for _, n in row1) + gap * (len(row1) - 1)
    x = cx - w / 2
    for col, name in row1:
        s.rect(x, y - 5.5, 9, 5.5, fill=col)
        x += 13
        x += s.label(x, y, name, INK2, size=sz, cs=cs) + gap
    row2 = [(True, "Cepillado realizado"), (False, "Cepillado omitido")]
    w = sum(10 + s.width(n.upper(), MONO, sz, cs) for _, n in row2) + gap * 2
    x = cx - w / 2
    for done, name in row2:
        if done:
            s.circle(x + 3, y + 14 - 2.6, 3, fill=TEAL)
        else:
            s.circle(x + 3, y + 14 - 2.6, 3, fill=PAPER, stroke=TEAL, lw=0.8, dash=[1.2, 1.2])
        x += 10
        x += s.label(x, y + 14, name, INK2, size=sz, cs=cs) + gap * 2


# ── Láminas ───────────────────────────────────────────────────────────────
HYP_SEGS = [("La ", SERIF, INK), ("disponibilidad de tiempo", SERIF, VERM),
            (", condicionada por los horarios académicos y laborales, influye de manera significativa en los ",
             SERIF, INK),
            ("hábitos de higiene bucal", SERIF, TEAL),
            (" de los estudiantes universitarios de 18 a 23 años, de tal forma que ", SERIF, INK),
            ("a menor tiempo disponible, menor es la frecuencia y calidad del cepillado dental.", SERIF_I, INK)]


def callout(s, x, y, w, text, size=15, lead=19.5, color=VERM):
    """Cita destacada con regla vertical; devuelve la base de la última línea."""
    lines = s.wrap(text, SERIF_I, size, w - 16)
    s.rect(x, y - size * 0.85, 2.2, (len(lines) - 1) * lead + size * 1.2, fill=color)
    return s.para(x + 16, y, w - 16, text, SERIF_I, size, lead, INK)


def source(s, x, y, text, anchor="l"):
    return s.label(x, y, "Fuente: " + text, MUTED, size=6, anchor=anchor, cs=0.9)


def slide_cover(s):
    background(s)
    w1 = s.logo(os.path.join(LOGOS, "tecnm.png"), M, 40, 40)
    s.line(M + w1 + 12, 42, M + w1 + 12, 78, RULE, 0.6)
    s.logo(os.path.join(LOGOS, "itcj.png"), M + w1 + 24, 40, 40)
    s.label(M, 104, "Tecnológico Nacional de México — Instituto Tecnológico de Ciudad Juárez", INK2, size=6.3)

    s.label(M, 160, "Justificación de la hipótesis", VERM, size=7.8, cs=1.5)
    s.text(M - 4, 250, "Salud", SERIF, 108, INK)
    s.text(M - 2, 334, "bucal", SERIF_I, 108, INK)
    s.para(M, 370, 400, "Disponibilidad de tiempo y hábitos de higiene bucal en estudiantes "
                        "universitarios de 18 a 23 años", SANS, 13, 17.5, INK2)

    render = os.path.join(HERE, "assets", "portada_render.png")
    if os.path.exists(render):
        # render 3D (render_portada.py): el suelo es el mismo papel, así que la imagen se funde con la página
        s.image(render, 448, 0, 490, 405)
        legend_day(s, 706, 388)
    else:
        cx, cy, R = 738, 202, 138
        dial(s, cx, cy, R)
        legend_day(s, cx, 380)

    s.line(M, 420, W - M, 420, INK, 0.6)
    s.label(M, 442, "Integrantes", VERM)
    names = ["Romero Elías Esmeralda", "Rodríguez Esquivel Megan", "Nolasco Mejia Luis Diego",
             "Esquivel Soria Pablo", "Rodríguez Hernández Tania"]
    for i, n in enumerate(names):
        col, row = divmod(i, 3)
        s.text(M + col * 168, 462 + row * 16, n, SANS, 10.5, INK)
    cols = [(420, "Docente", ["Chávez Martínez Martín"]),
            (584, "Asignatura", ["Taller de Investigación II", "Unidad II · Proyecto"]),
            (760, "Lugar y fecha", ["Cd. Juárez, Chih.", "14 de octubre de 2026"])]
    for x, lab, lines in cols:
        s.label(x, 442, lab, VERM)
        for i, ln in enumerate(lines):
            s.text(x, 462 + i * 16, ln, SANS, 10.5, INK)
    s.line(M, 508, W - M, 508, RULE, 0.5)
    s.label(M, 524, "Fig. 00 — Reloj de sol: la sombra del diente cae sobre el cepillado omitido", MUTED, size=6)
    s.label(W - M, 524, "Modelo ilustrativo", MUTED, size=6, anchor="r")


def slide_hypothesis(s):
    chrome(s, 2, "Hipótesis", "La respuesta que proponemos")
    s.label(M, 152, "Pregunta de investigación", INK2)
    yq = s.para(M, 174, 560, "¿De qué manera la disponibilidad de tiempo, condicionada por los horarios académicos "
                             "y laborales, influye en los hábitos de higiene bucal de los estudiantes universitarios "
                             "de 18 a 23 años?", SERIF_I, 15.5, 20, INK2)
    s.arrow_down(M + 3, yq + 12, yq + 36, VERM, 0.7, 4.5)
    s.label(M + 16, yq + 30, "Hipótesis · respuesta tentativa", VERM)
    yb = s.rich(M, yq + 68, 560, HYP_SEGS, 24, 31)

    yt = yb + 28
    s.rect(M, yt - 6, 9, 6, fill=VERM)
    w = s.label(M + 15, yt, "VI · Variable independiente", INK2)
    s.rect(M + 15 + w + 22, yt - 6, 9, 6, fill=TEAL)
    s.label(M + 15 + w + 37, yt, "VD · Variable dependiente", INK2)

    def column(x, color, name):
        s.label(x + 23, 168, name, color, anchor="c", size=7.2)
        n, filled = 10, 3
        for i in range(n):
            y = 184 + i * 17
            on = i >= n - filled
            s.rect(x, y, 46, 12, fill=color if on else None, stroke=None if on else NAVY_LT, lw=0.5, r=6)
    xa, xb = 668, 846
    column(xa, VERM, "Tiempo")
    column(xb, TEAL, "Cepillado")
    lvl = 184 + 7 * 17 - 3.5
    s.line(xa + 54, lvl, xb - 8, lvl, INK, 0.6, dash=[2, 2])
    s.arrow(xb - 14, lvl, xb - 7, INK, 0.6, 4)
    s.text((xa + 46 + xb) / 2, lvl - 9, "a menor tiempo,", SERIF_I, 13, INK, "c")
    s.text((xa + 46 + xb) / 2, lvl + 17, "menor cepillado", SERIF_I, 13, INK, "c")
    for x in (xa - 12, xb + 58):
        s.arrow_down(x, 186, 300, INK2, 0.5, 4)
    s.label((xa + xb + 46) / 2, 372, "Fig. 01 — Relación esperada (directa)", MUTED, size=6, anchor="c")


def slide_magnitude(s):
    chrome(s, 3, "Argumento 1 · Magnitud del problema", "Un problema de salud pública")
    gx, gy, sp = M + 7, 172, 22
    for i in range(100):
        r, c_ = divmod(i, 10)
        x, y = gx + c_ * sp, gy + r * sp
        if i < 95:
            s.circle(x, y, 6.2, fill=INK)
        else:
            s.circle(x, y, 6.2, stroke=NAVY_LT, lw=0.7)
    s.label(gx - 7, gy + 9 * sp + 30, "Fig. 02 — 95 de cada 100 personas", MUTED, size=6)

    X = 300
    w95 = s.text(X - 4, 262, "95", SERIF, 120, INK)
    s.text(X - 4 + w95 + 6, 262, "%", SERIF, 52, INK)
    s.para(X, 294, 180, "de la población en México ha padecido caries o enfermedades de las encías.",
           SANS, 12, 16, INK)
    source(s, X, 366, "DGCS-UNAM, 2025")

    R0 = 540
    s.line(R0 - 26, 150, R0 - 26, 452, RULE, 0.5)
    s.label(R0, 166, "Organización Mundial de la Salud", VERM)
    y = s.para(R0, 188, 376, "Las enfermedades bucodentales —como la caries y la enfermedad periodontal— son un "
                             "problema de salud pública mundial por su alta prevalencia y su impacto en la "
                             "masticación, el habla y la estética.", SANS, 11.5, 16, INK)
    s.line(R0, y + 18, W - M, y + 18, RULE, 0.5)
    s.label(R0, y + 44, "Prevención", VERM)
    y = s.para(R0, y + 66, 376, "Prevenirlas depende de hábitos de higiene oral que exigen constancia, técnica "
                                "correcta y, de manera crucial, tiempo para realizarlos.", SANS, 11.5, 16, INK)
    callout(s, R0, y + 52, 376, "Si la prevención exige tiempo, el tiempo disponible se convierte en un factor "
                                "de salud.", 17, 22)


def slide_gap(s):
    chrome(s, 4, "Argumento 2 · Conocimiento y práctica", "Saber cómo cepillarse no basta")
    s.label(M, 152, "Recomendación", INK2)
    s.text(M, 182, "Al menos tres veces al día", SERIF, 24, INK)
    for i, m in enumerate(["Mañana", "Tarde", "Noche"]):
        x = M + i * 128
        s.rect(x, 198, 116, 26, fill=TEAL, r=13)
        s.label(x + 58, 214.5, m, PAPER, size=7, anchor="c", cs=1.3)

    y0 = 270
    s.label(M, y0, "Brecha entre conocimiento y práctica", INK2)
    bars = [("Conocimiento", 1.0, INK), ("Práctica", 0.58, TEAL)]
    bw = 300
    for i, (name, v, col) in enumerate(bars):
        y = y0 + 20 + i * 34
        s.text(M, y + 13, name, SERIF, 15, INK)
        s.rect(M + 112, y + 2, bw, 14, fill=FAINT)
        s.rect(M + 112, y + 2, bw * v, 14, fill=col)
    gx0, gx1 = M + 112 + bw * 0.58, M + 112 + bw
    yb = y0 + 74
    s.line(gx0, yb, gx1, yb, VERM, 0.8)
    s.line(gx0, yb, gx0, yb - 5, VERM, 0.8)
    s.line(gx1, yb, gx1, yb - 5, VERM, 0.8)
    s.text((gx0 + gx1) / 2, yb + 16, "brecha", SERIF_I, 14, VERM, "c")
    s.label(M, yb + 46, "Esquema conceptual", MUTED, size=6)
    source(s, M + 112, yb + 46, "de Isabel, 2026")

    R0 = 530
    s.line(R0 - 26, 150, R0 - 26, 470, RULE, 0.5)
    s.label(R0, 152, "La adopción del hábito depende de…", INK2)
    factors = [("Rutinas diarias", False), ("Estilo de vida", False), ("Condiciones socioeconómicas", False),
               ("Disponibilidad de tiempo", True)]
    for i, (f, key) in enumerate(factors):
        y = 166 + i * 38
        if key:
            s.rect(R0 - 10, y + 2, W - M - R0 + 10, 36, fill=PANEL)
            s.rect(R0 - 10, y + 2, 2.2, 36, fill=VERM)
            s.label(W - M - 10, y + 24, "Barrera estructural", VERM, size=6.2, anchor="r")
        else:
            s.line(R0, y + 38, W - M, y + 38, FAINT, 0.5)
        s.text(R0 + 4, y + 26, f"{i + 1:02d}", MONO, 7.5, VERM if key else INK2)
        s.text(R0 + 30, y + 27, f, SERIF, 19, VERM if key else INK)
    callout(s, R0, 360, W - M - R0, "La percepción de falta de tiempo actúa como una barrera estructural que "
                                    "impide consolidar una higiene bucal adecuada.", 15, 19.5)


def slide_university(s):
    chrome(s, 5, "Argumento 3 · La etapa universitaria", "Entre los 18 y los 23, el día no alcanza")
    s.label(M, 152, "Demandas de la etapa universitaria", INK2)
    items = ["Jornadas académicas prolongadas", "Tareas y proyectos", "Periodos de exámenes",
             "Empleo, en muchos casos"]
    for i, it in enumerate(items):
        y = 162 + i * 34
        s.line(M, y + 34, M + 420, y + 34, FAINT, 0.5)
        s.rect(M, y + 15, 9, 5.5, fill=VERM if i == 3 else INK)
        s.text(M + 22, y + 24, it, SERIF, 19, INK)
    ya = 162 + 4 * 34
    s.arrow_down(M + 4.5, ya + 10, ya + 36, INK, 0.7, 4.5)
    s.label(M + 18, ya + 30, "Efecto en el cepillado", TEAL)
    x = M
    for chip in ["Menos frecuente", "Apresurado", "Omitido"]:
        w = s.width(chip.upper(), MONO, 7.2, 1.3) + 26
        s.rect(x, ya + 44, w, 20, stroke=TEAL, lw=0.7, r=10)
        s.label(x + 13, ya + 57.5, chip, TEAL, size=7.2, cs=1.3)
        x += w + 10
    s.para(M, ya + 96, 420, "Es una etapa de transición: cambian las rutinas, las responsabilidades y los hábitos "
                            "de autocuidado.", SANS_I, 11, 15, INK2)

    cx, cy, R = 724, 282, 116
    dial(s, cx, cy, R)
    legend_day(s, cx, 446)
    s.label(cx, 482, "Fig. 03 — Modelo ilustrativo de un día de estudiante", MUTED, size=6, anchor="c")


def node(s, x, y, w, h, label, title, desc, col, dashed=False):
    if dashed:
        s.c.setDash([2, 2])
        s.rect(x, y, w, h, stroke=col, lw=0.7, r=3)
        s.c.setDash([])
    else:
        s.rect(x, y, w, h, fill=PANEL, r=3)
        s.rect(x, y, w, 2.2, fill=col)
    s.label(x + 16, y + 24, label, col, size=6.6)
    yy = s.para(x + 16, y + 52, w - 32, title, SERIF, 19, 21, INK)
    s.para(x + 16, yy + 20, w - 32, desc, SANS, 10, 13.5, INK2)


def elbow(s, x1, y1, x2, y2, color, lw=0.7):
    xm = (x1 + x2) / 2
    s.line(x1, y1, xm, y1, color, lw)
    s.line(xm, y1, xm, y2, color, lw)
    s.arrow(xm, y2, x2, color, lw, 4.5)


def slide_stress(s):
    chrome(s, 6, "Argumento 4 · Evidencia empírica", "El estrés académico deja huella en la boca")
    top = 168
    node(s, M, top + 52, 210, 128, "Factor", "Estrés académico y laboral",
         "Exigencias universitarias, exámenes y empleo.", VERM)
    node(s, 336, top, 288, 104, "Vía conductual",
         "Menos cepillado", "Se reducen la frecuencia y la calidad del cepillado.", TEAL)
    node(s, 336, top + 128, 288, 104, "Vía fisiológica",
         "Defensas alteradas", "Cambios inmunológicos que favorecen la inflamación gingival y la placa.", INK2)
    node(s, W - M - 210, top + 52, 210, 128, "Resultado", "Peor salud periodontal",
         "Mayor riesgo de caries y enfermedad de las encías.", INK)
    mid = top + 52 + 64
    elbow(s, M + 210, mid, 336, top + 52, INK, 0.7)
    elbow(s, M + 210, mid, 336, top + 128 + 52, INK, 0.7)
    elbow(s, 624, top + 52, W - M - 210, mid, INK, 0.7)
    elbow(s, 624, top + 128 + 52, W - M - 210, mid, INK, 0.7)
    source(s, 480, top + 254, "Deinzer et al., 2001", anchor="c")

    y = 446
    s.line(M, y - 14, W - M, y - 14, RULE, 0.5)
    s.label(M, y + 6, "Evidencia en estudiantes", VERM)
    s.para(M + 190, y + 7, 680, "Ravishankar, Ain y Gowhar (2014): el estrés académico se asoció con mayor "
                                "prevalencia de enfermedad periodontal y peor higiene oral en estudiantes.",
           SANS, 11, 15, INK)


def slide_void(s):
    chrome(s, 7, "Vacío en el conocimiento", "Lo que aún no se ha medido")
    circles = [(200, "¿Cuánto", "saben?", "Conocimiento sobre el cepillado", "Ampliamente estudiado", False),
               (480, "¿Qué tan", "seguido?", "Frecuencia del cepillado", "Ampliamente estudiado", False),
               (760, "¿Cuánto tiempo", "tienen?", "Disponibilidad de tiempo", "Poco estudiado", True)]
    cy, r = 238, 66
    for x, l1, l2, desc, status, key in circles:
        if key:
            s.circle(x, cy, r, stroke=VERM, lw=1, dash=[3, 2.5])
        else:
            s.circle(x, cy, r, fill=PANEL, stroke=INK, lw=0.6)
        col = VERM if key else INK
        s.text(x, cy - 2, l1, SERIF_I if key else SERIF, 18, col, "c")
        s.text(x, cy + 19, l2, SERIF_I if key else SERIF, 18, col, "c")
        s.text(x, cy + r + 30, desc, SANS_B, 11, INK, "c")
        s.label(x, cy + r + 47, status, VERM if key else INK2, size=6.6, anchor="c")
    s.label(760, cy - r - 14, "Aporte de este proyecto", VERM, size=6.6, anchor="c")

    y = 410
    s.line(M, y - 16, W - M, y - 16, RULE, 0.5)
    s.label(M, y, "Contexto local", VERM)
    s.para(M + 150, y + 1, 300, "El problema no ha sido documentado de manera sistemática: se desconoce en qué "
                                "medida los horarios influyen en el cepillado.", SANS, 10.5, 14.5, INK)
    callout(s, 520, y + 4, 396, "La hipótesis se enfoca justo en la variable menos estudiada: el tiempo "
                                "disponible.", 16, 21)


def slide_chain(s):
    chrome(s, 8, "Síntesis del argumento", "Por qué esperamos esta relación")
    nodes = [("01 · Causa", "Horarios académicos y laborales", "Jornadas prolongadas, exámenes y empleo.", INK),
             ("02 · VI", "Menos tiempo disponible", "Barrera estructural para el autocuidado.", VERM),
             ("03 · VD", "Cepillado menos frecuente y de menor calidad", "Apresurado u omitido durante la jornada.",
              TEAL),
             ("04 · Consecuencia", "Mayor riesgo bucal", "Placa, caries y enfermedad periodontal.", INK2)]
    nw, gap = 196, 29.3
    top, nh = 196, 150
    xs = [M + i * (nw + gap) for i in range(4)]
    # corchete: lo que afirma la hipótesis
    bx0, bx1 = xs[0], xs[2] + nw
    s.line(bx0, 172, bx1, 172, VERM, 0.8)
    s.line(bx0, 172, bx0, 178, VERM, 0.8)
    s.line(bx1, 172, bx1, 178, VERM, 0.8)
    s.label((bx0 + bx1) / 2, 164, "Lo que afirma la hipótesis", VERM, size=6.8, anchor="c")
    s.label(xs[3] + nw / 2, 164, "Por qué importa", INK2, size=6.8, anchor="c")
    for i, (x, (lab, title, desc, col)) in enumerate(zip(xs, nodes)):
        node(s, x, top, nw, nh, lab, title, desc, col, dashed=(i == 3))
        if i < 3:
            s.arrow(x + nw + 4, top + nh / 2, x + nw + gap - 4, INK, 0.8, 5)
    ev = ["Marco teórico: etapa universitaria", "de Isabel (2026) · Deinzer et al. (2001)",
          "OMS · DGCS (2025) · Ravishankar et al. (2014)"]
    for i, e in enumerate(ev):
        x = xs[i] + nw + gap / 2
        s.line(x, top + nh / 2 + 8, x, top + nh + 18, RULE, 0.5, dash=[1.5, 1.5])
    for i, e in enumerate(ev):
        x = xs[i] + nw + gap / 2
        lines = s.wrap(e.upper(), MONO, 5.8, 214)
        for j, ln in enumerate(lines):
            s.text(x, top + nh + 30 + j * 9, ln, MONO, 5.8, MUTED, "c", cs=0.7)
    callout(s, M, 438, W - 2 * M, "Si los horarios reducen el tiempo disponible, y el tiempo condiciona el "
                                  "cepillado, entonces: a menor tiempo disponible, menor frecuencia y calidad del "
                                  "cepillado.", 16.5, 21)


def slide_congruence(s):
    chrome(s, 9, "Contrastación", "Cada parte de la hipótesis se puede medir")
    rows = [(VERM, "La disponibilidad de tiempo…", "Cuestionario · Sección III",
             "Horas diarias en clases, tareas y trabajo; percepción de falta de tiempo."),
            (VERM, "…condicionada por los horarios académicos y laborales…", "Cuestionario · Sección I",
             "Turno y si el estudiante trabaja además de estudiar."),
            (INK, "…influye de manera significativa…", "Análisis de correlación",
             "Coeficiente r y prueba de significancia (p < 0.05)."),
            (TEAL, "…en los hábitos de higiene bucal…", "Cuestionario · Sección II",
             "Frecuencia y momento del cepillado, hilo dental, enjuague y visitas al dentista."),
            (INK, "…de los estudiantes universitarios de 18 a 23 años…", "Población y muestra",
             "Estudiantes de 18 a 23 años de distintas carreras y turnos."),
            (INK, "…a menor tiempo disponible, menor frecuencia y calidad del cepillado.",
             "Dirección de la relación", "Un coeficiente r positivo: menos horas libres, menos cepillado.")]
    s.label(M, 146, "La hipótesis afirma…", INK2, size=6.5)
    s.label(530, 146, "…y se comprueba con", INK2, size=6.5)
    top, rh = 156, 52
    for i, (col, frag, comp, desc) in enumerate(rows):
        y = top + i * rh
        s.line(M, y, W - M, y, RULE if i else INK, 0.5 if i else 0.6)
        s.text(M, y + 20, f"{i + 1:02d}", MONO, 7.5, col)
        lines = s.wrap(frag, SERIF_I if i == 5 else SERIF, 16, 330)
        base = y + (rh - (len(lines) - 1) * 18) / 2 + 5
        for j, ln in enumerate(lines):
            s.text(M + 26, base + j * 18, ln, SERIF_I if i == 5 else SERIF, 16, INK)
        my = y + rh / 2
        s.circle(418, my, 2.6, fill=col)
        s.line(418, my, 512, my, col, 0.8)
        s.arrow(500, my, 514, col, 0.8, 4.5)
        s.label(530, y + 22, comp, col, size=7)
        s.text(530, y + 39, desc, SANS, 10.5, INK)
    s.line(M, top + 6 * rh, W - M, top + 6 * rh, INK, 0.6)


def slide_verification(s):
    chrome(s, 10, "Criterio de verificación", "Qué resultado la sostendría")
    X = M
    blocks = [("1", "Hipótesis de investigación",
               "Existe una relación significativa y directa entre el tiempo disponible y la frecuencia y calidad "
               "del cepillado dental.", VERM),
              ("0", "Hipótesis nula",
               "No existe una relación significativa entre el tiempo disponible y los hábitos de higiene bucal.",
               INK2)]
    y = 160
    for sub, lab, txt, col in blocks:
        s.hsub(X, y + 22, "H", sub, SERIF, 30, col)
        s.label(X + 44, y + 4, lab, col)
        yy = s.para(X + 44, y + 22, 370, txt, SANS, 10.5, 14.5, INK)
        y = yy + 34
    s.line(X, y - 12, X + 414, y - 12, RULE, 0.5)
    s.label(X, y + 8, "Prueba", VERM)
    y = s.para(X + 44, y + 9, 370, "Análisis de correlación entre las horas disponibles y la frecuencia y calidad "
                                   "del cepillado, con datos de una encuesta a estudiantes de 18 a 23 años.",
               SANS, 10.5, 14.5, INK)

    by = 404
    s.rect(X, by, 414, 62, stroke=INK, lw=0.6, r=3)
    s.label(X + 16, by + 20, "Regla de decisión", VERM, size=6.6)
    x = X + 16
    yy = by + 45
    x += s.text(x, yy, "Si  r > 0  y  p < 0.05", SERIF_I, 15, INK)
    x += s.text(x, yy, "   →   se rechaza ", SANS, 11.5, INK)
    x += s.hsub(x, yy, "H", "0", SERIF, 15, INK)
    s.text(x + 3, yy, "y se sostiene la hipótesis", SANS, 11.5, INK)

    px0, px1, py0, py1 = 540, 904, 168, 404
    s.label(px0 - 26, 152, "Fig. 04 — Patrón esperado si la hipótesis se cumple", INK2, size=6.4)
    for k in range(0, 9):
        x = px0 + k * (px1 - px0) / 8
        s.line(x, py0, x, py1, FAINT, 0.4)
        s.text(x, py1 + 14, str(k), MONO, 7, INK2, "c")
    for k in range(0, 6):
        y = py1 - k * (py1 - py0) / 5
        s.line(px0, y, px1, y, FAINT, 0.4)
        s.text(px0 - 8, y + 2.5, str(k * 2), MONO, 7, INK2, "r")
    s.line(px0, py1, px1, py1, INK2, 0.6)
    s.line(px0, py0, px0, py1, INK2, 0.6)
    s.label((px0 + px1) / 2, py1 + 32, "Tiempo disponible al día (horas)", INK2, size=6.4, anchor="c")
    c = s.c
    c.saveState()
    c.translate(px0 - 26, s.Y((py0 + py1) / 2))
    c.rotate(90)
    ylab = "ÍNDICE DE CEPILLADO (FRECUENCIA Y CALIDAD)"
    c.setFillColor(INK2)
    c.setFont(MONO, 6.4)
    c.drawString(-s.width(ylab, MONO, 6.4, 1.1) / 2, 0, ylab, charSpace=1.1)
    c.restoreState()

    rnd = random.Random(7)

    def to_px(xv, yv):
        return px0 + xv / 8 * (px1 - px0), py1 - yv / 10 * (py1 - py0)

    for _ in range(44):
        xv = rnd.uniform(0.4, 7.6)
        yv = max(0.4, min(9.6, 1.6 + 0.92 * xv + rnd.gauss(0, 1.05)))
        x, y = to_px(xv, yv)
        s.circle(x, y, 3.4, fill=INK, stroke=PAPER, lw=0.9)
    xa, ya = to_px(0.2, 1.6 + 0.92 * 0.2)
    xb, yb = to_px(7.8, 1.6 + 0.92 * 7.8)
    s.line(xa, ya, xb, yb, VERM, 1.4, cap=1)
    kx, ky = px1 - 132, py1 - 46
    s.line(kx, ky - 4.5, kx + 22, ky - 4.5, VERM, 1.4, cap=1)
    s.text(kx + 30, ky, "r > 0", SERIF_I, 16, INK)
    s.label(kx, ky + 17, "Tendencia · relación directa", INK2, size=6)
    s.label(px1, py1 + 48, "Ilustrativo · no son datos reales", MUTED, size=6, anchor="r")


def slide_relevance(s):
    chrome(s, 11, "Relevancia", "Si se confirma, se puede actuar")
    s.para(M, 160, 760, "Comprobar la hipótesis permitiría identificar qué factores limitan más el tiempo de los "
                        "estudiantes y diseñar soluciones a su medida.", SERIF, 20, 25, INK)
    cards = [("Campañas de concientización",
              "Sobre la importancia del cepillado y la organización del tiempo durante la jornada."),
             ("Espacios para el cepillado",
              "Lugares accesibles para lavarse los dientes dentro de las instalaciones."),
             ("Orientación práctica",
              "Técnicas de cepillado eficientes para mantener la higiene aun con poco tiempo.")]
    top, cw, ch, gap = 226, 278, 156, 19
    for i, (t, d) in enumerate(cards):
        x = M + i * (cw + gap)
        s.rect(x, top, cw, ch, fill=PANEL, r=3)
        s.rect(x, top, cw, 2.2, fill=TEAL)
        s.text(x + 18, top + 50, f"{i + 1}", SERIF, 36, TEAL)
        s.label(x + cw - 18, top + 24, "Propuesta", INK2, size=6.3, anchor="r")
        s.text(x + 18, top + 80, t, SANS_B, 12.5, INK)
        s.para(x + 18, top + 102, cw - 36, d, SANS, 10.5, 14.5, INK2)
    callout(s, M, 430, 700, "Las estrategias de prevención no deben limitarse a transmitir información: deben "
                            "adaptarse a las realidades y limitaciones de los estudiantes.", 15, 19.5, TEAL)
    source(s, W - M, 449, "José, 2025", anchor="r")


def slide_references(s):
    chrome(s, 12, "Referencias", "Fuentes que sustentan la hipótesis")
    refs = [
        "Deinzer, R., Hilpert, D., Bach, K., Schawacht, M., & Herforth, A. (2001). Effects of academic stress on "
        "oral hygiene—A potential link between stress and plaque-associated disease? Journal of Clinical "
        "Periodontology, 28(5), 459–464.",
        "de Isabel, V. (2026). La salud bucodental en universitarios: el eslabón olvidado del bienestar académico. "
        "Blog de ISAG [en línea]. Usal.es. Consultado el 16 de septiembre de 2026.",
        "DGCS-UNAM (2025). En México, 95 por ciento de la población padece caries o enfermedades en las encías. "
        "Boletín DGCS. https://www.dgcs.unam.mx/boletin/bdboletin/2025_184.html",
        "Hábitos de higiene bucal y su influencia sobre la frecuencia de caries. Universidad Nacional de Loja, "
        "Ecuador. https://dspace.unl.edu.ec/items/f83a95b0-cf2c-4758-8cfa-285621764e9b",
        "Hábitos de higiene oral en estudiantes de odontología de la Universidad de Chile. SciELO. "
        "https://www.scielo.cl/scielo.php?script=sci_arttext&pid=S0719-01072010000100002",
        "José, V. C. M. (2025). Gestión educativa y salud bucal en los estudiantes de la Universidad del Azuay. "
        "Universidad del Azuay.",
        "Ravishankar, T. L., Ain, T. S., & Gowhar, O. (2014). Effect of academic stress on plaque and gingival "
        "health among dental students of Moradabad, India. Journal of International Academy of Periodontology, "
        "16(4), 115–120.",
    ]
    y = 160
    for i, r in enumerate(refs):
        s.text(M, y, f"{i + 1:02d}", MONO, 7.5, VERM)
        y = s.para(M + 34, y, 838, r, SANS, 11, 15, INK)
        y += 15
        s.line(M + 34, y - 6, W - M, y - 6, FAINT, 0.4)
        y += 11


def slide_close(s):
    background(s)
    s.label(M, 30, "Salud bucal — Justificación de la hipótesis", INK2)
    s.label(W - M, 30, f"{N_SLIDES:02d} / {N_SLIDES:02d}", INK2, anchor="r")
    s.line(M, 40, W - M, 40, RULE, 0.5)
    s.label(M, 92, f"{N_SLIDES - 1:02d} — Conclusión", VERM, size=7.5, cs=1.4)
    s.text(M - 3, 170, "A menor tiempo,", SERIF, 62, INK)
    s.text(M - 3, 234, "¿menor cuidado?", SERIF_I, 62, VERM)
    s.para(M, 280, 450, "La evidencia teórica y empírica respalda que el tiempo disponible condiciona la higiene "
                        "bucal. El estudio busca comprobarlo con datos de los propios estudiantes.",
           SANS, 12.5, 18, INK2)
    s.text(M - 2, 392, "Gracias.", SERIF_I, 34, INK)

    # arcada ampliada, sin carátula: el objeto de estudio en silencio
    cx, cy = 738, 228
    arch(s, cx, cy, 1.55)
    xs = [cx - 70, cx, cx + 70]
    for x, (name, done) in zip(xs, [("Mañana", True), ("Tarde", False), ("Noche", True)]):
        if done:
            s.circle(x, 336, 4, fill=TEAL)
        else:
            s.circle(x, 336, 4, fill=PAPER, stroke=TEAL, lw=0.8, dash=[1.2, 1.2])
        s.label(x, 354, name, INK2, size=6, anchor="c")
    s.label(cx, 392, "Fig. 05 — Arcada superior · tres cepillados recomendados", MUTED, size=6, anchor="c")

    ruler(s, N_SLIDES)
    y = 452
    s.line(M, y, W - M, y, RULE, 0.5)
    names = "Romero Elías Esmeralda · Rodríguez Esquivel Megan · Nolasco Mejia Luis Diego · " \
            "Esquivel Soria Pablo · Rodríguez Hernández Tania"
    s.text(M, y + 23, names, SANS, 9.5, INK)
    s.logo(os.path.join(LOGOS, "itcj.png"), W - M - 64, y + 8, 28)
    s.logo(os.path.join(LOGOS, "tecnm.png"), W - M - 64 - 14 - 64, y + 8, 28)


SLIDES = [slide_cover, slide_hypothesis, slide_magnitude, slide_gap, slide_university, slide_stress,
          slide_void, slide_chain, slide_congruence, slide_verification, slide_relevance, slide_references,
          slide_close]
assert len(SLIDES) == N_SLIDES


def build_pdf():
    c = canvas.Canvas(OUT_PDF, pagesize=(W, H))
    c.setTitle("Justificación de la hipótesis — Salud bucal")
    c.setAuthor("Romero Elías, Rodríguez Esquivel, Nolasco Mejia, Esquivel Soria, Rodríguez Hernández")
    c.setSubject("Taller de Investigación II · Unidad II · TecNM / ITCJ")
    for fn in SLIDES:
        fn(Slide(c))
        c.showPage()
    c.save()
    print("PDF:", OUT_PDF)
    out_png = os.path.join(HERE, "laminas")
    os.makedirs(out_png, exist_ok=True)
    try:
        subprocess.run(["pdftoppm", "-png", "-r", "144", OUT_PDF, os.path.join(out_png, "lamina")], check=True)
        print("PNG:", out_png)
    except (OSError, subprocess.CalledProcessError) as e:
        print("Sin PNG (pdftoppm no disponible):", e)


# ── Versión editable (.pptx): fondo gráfico + cuadros de texto nativos ────
PPTX_FONTS = {  # fuente → (familia, negrita, cursiva, ascendente, descendente)
    SERIF: ("Instrument Serif", False, False, 0.99, 0.31),
    SERIF_I: ("Instrument Serif", False, True, 0.99, 0.31),
    SANS: ("Instrument Sans", False, False, 0.97, 0.25),
    SANS_B: ("Instrument Sans", True, False, 0.97, 0.25),
    SANS_I: ("Instrument Sans", False, True, 0.97, 0.25),
    MONO: ("DM Mono", False, False, 0.992, 0.31),
}


def build_pptx():
    from pptx import Presentation
    from pptx.dml.color import RGBColor
    from pptx.enum.text import MSO_ANCHOR, MSO_AUTO_SIZE, PP_ALIGN
    from pptx.util import Emu, Pt

    os.makedirs(BUILD, exist_ok=True)
    bg_pdf = os.path.join(BUILD, "fondos.pdf")
    c = canvas.Canvas(bg_pdf, pagesize=(W, H))
    records = []
    for fn in SLIDES:
        rec = []
        fn(Slide(c, rec))
        c.showPage()
        records.append(rec)
    c.save()
    subprocess.run(["pdftoppm", "-png", "-r", "192", bg_pdf, os.path.join(BUILD, "fondo")], check=True)

    prs = Presentation()
    prs.slide_width, prs.slide_height = Emu(W * 12700), Emu(H * 12700)
    align = {"l": PP_ALIGN.LEFT, "c": PP_ALIGN.CENTER, "r": PP_ALIGN.RIGHT}

    def style(run, font, size, color, cs=0.0):
        fam, bold, italic, _, _ = PPTX_FONTS[font]
        f = run.font
        f.name, f.bold, f.italic, f.size = fam, bold, italic, Pt(size)
        f.color.rgb = RGBColor.from_string(color.hexval()[2:].upper())
        if cs:
            run._r.get_or_add_rPr().set("spc", str(int(round(cs * 100))))

    def box(slide, left, top, width, height, wrap, al, line_spacing):
        tb = slide.shapes.add_textbox(Pt(left), Pt(top), Pt(width), Pt(height))
        tf = tb.text_frame
        tf.word_wrap = wrap
        tf.auto_size = MSO_AUTO_SIZE.NONE
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        tf.vertical_anchor = MSO_ANCHOR.TOP
        p = tf.paragraphs[0]
        p.alignment = al
        p.line_spacing = line_spacing
        return p

    for i, rec in enumerate(records):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        bg = os.path.join(BUILD, f"fondo-{i + 1:02d}.png")
        slide.shapes.add_picture(bg, 0, 0, prs.slide_width, prs.slide_height).name = "Fondo"
        for r in rec:
            if r["kind"] == "image":
                slide.shapes.add_picture(r["path"], Pt(r["x"]), Pt(r["y"]), Pt(r["w"]), Pt(r["h"]))
            elif r["kind"] == "text":
                _, _, _, asc, desc = PPTX_FONTS[r["font"]]
                slack = r["w"] * 0.08 + 6
                left = {"l": r["x"], "c": r["x"] - slack / 2, "r": r["x"] - slack}[r["anchor"]]
                p = box(slide, left, r["y"] - asc * r["size"], r["w"] + slack, (asc + desc) * r["size"], False,
                        align[r["anchor"]], 1.0)
                run = p.add_run()
                run.text = r["s"]
                style(run, r["font"], r["size"], r["color"], r["cs"])
            else:
                font0 = r["font"] if r["kind"] == "para" else r["segs"][0][1]
                _, _, _, asc, desc = PPTX_FONTS[font0]
                lead = r["lead"]
                top = r["y"] - lead * asc / (asc + desc)
                p = box(slide, r["x"], top, r["w"] * 1.03 + 2, lead * r["n"] + 4, True,
                        align[r.get("anchor", "l")], Pt(lead))
                segs = [(r["s"], r["font"], r["color"])] if r["kind"] == "para" else r["segs"]
                for txt, font, color in segs:
                    run = p.add_run()
                    run.text = txt
                    style(run, font, r["size"], color)
    prs.save(OUT_PPTX)
    print("PPTX:", OUT_PPTX)


def main():
    build_pdf()
    build_pptx()


if __name__ == "__main__":
    main()
