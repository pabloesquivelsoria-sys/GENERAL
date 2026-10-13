import os
OUT = os.path.dirname(os.path.abspath(__file__))
INK, PAPER, MINT, SLATE, WHITE = "#0F1B2D", "#F6F8FB", "#2BD4A3", "#5B6B82", "#FFFFFF"

FONTS = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700&'
         'family=Sora:wght@600;700&display=swap">')

def mark(color_c, color_cursor=MINT, size=64):
    return f'''<svg width="{size}" height="{size}" viewBox="0 0 64 64" aria-hidden="true">
<rect x="6" y="6" width="46" height="13" rx="4" fill="{color_c}"/>
<rect x="6" y="6" width="13" height="52" rx="4" fill="{color_c}"/>
<rect x="6" y="45" width="46" height="13" rx="4" fill="{color_c}"/>
<rect x="42" y="23" width="9" height="18" rx="3" fill="{color_cursor}"/></svg>'''

def wordmark(color, size):
    return f'<span class="wm" style="color:{color};font-size:{size}px">clavonia</span>'

def page(w, h, bg, body, extra_css=""):
    return f'''<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">{FONTS}
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:{w}px;height:{h}px;overflow:hidden;background:{bg}}}
body{{font-family:Manrope,system-ui,sans-serif;color:{INK};position:relative}}
.wm{{font-family:Sora,system-ui,sans-serif;font-weight:700;letter-spacing:-0.02em;line-height:1}}
h1{{font-family:Sora,system-ui,sans-serif;font-weight:700;letter-spacing:-0.03em;line-height:1.05}}
p{{line-height:1.4}}
.abs{{position:absolute}}
.card{{background:{WHITE};border-radius:18px;box-shadow:0 1px 0 rgba(15,27,45,.06),0 8px 24px rgba(15,27,45,.08)}}
.bar{{height:14px;border-radius:7px;background:#DCE3EE}}
.bar.ink{{background:{INK}}}
.btn{{display:inline-block;background:{MINT};color:{INK};font-weight:700;border-radius:12px;padding:0 28px;height:64px;line-height:64px}}
{extra_css}
</style></head><body>{body}</body></html>'''

def editor_stack(scale=1.0):
    s = scale
    return f'''<div class="abs" style="left:0;top:0;width:{int(360*s)}px">
  <div class="card" style="padding:{int(22*s)}px;margin-bottom:{int(16*s)}px">
    <div class="bar ink" style="width:70%;height:{int(18*s)}px;margin-bottom:{int(12*s)}px"></div>
    <div class="bar" style="width:92%;margin-bottom:{int(8*s)}px"></div>
    <div class="bar" style="width:60%;margin-bottom:{int(18*s)}px"></div>
    <div style="display:inline-block;background:{INK};border-radius:{int(10*s)}px;height:{int(40*s)}px;width:{int(130*s)}px"></div>
  </div>
  <div class="card" style="padding:{int(22*s)}px;margin-bottom:{int(16*s)}px;display:flex;gap:{int(12*s)}px">
    <div style="flex:1;height:{int(78*s)}px;border-radius:{int(12*s)}px;background:{PAPER}"></div>
    <div style="flex:1;height:{int(78*s)}px;border-radius:{int(12*s)}px;background:{PAPER}"></div>
    <div style="flex:1;height:{int(78*s)}px;border-radius:{int(12*s)}px;background:{PAPER}"></div>
  </div>
  <div class="card" style="padding:{int(22*s)}px;display:flex;align-items:center;justify-content:space-between">
    <div class="bar" style="width:55%"></div>
    <div style="width:{int(14*s)}px;height:{int(34*s)}px;border-radius:{int(6*s)}px;background:{MINT}"></div>
  </div>
</div>'''

# 1. Avatar 1080x1080 (perfil): ink background, mark centered.
avatar_body = f'''<div class="abs" style="left:0;top:0;width:1080px;height:1080px;background:{INK};display:flex;align-items:center;justify-content:center">
  {mark(PAPER, MINT, 520)}
</div>'''
avatar = page(1080, 1080, INK, avatar_body)

# 2. Facebook cover 1640x624 (safe text area centered).
fb_body = f'''<div class="abs" style="left:0;top:0;width:1640px;height:624px;background:{PAPER}">
  <div class="abs" style="left:150px;top:150px;width:700px">
    <div style="display:flex;align-items:center;gap:20px;margin-bottom:44px">{mark(INK, MINT, 64)}{wordmark(INK, 40)}</div>
    <h1 style="font-size:64px;margin-bottom:24px">Tu página, lista en minutos.</h1>
    <p style="font-size:26px;color:{SLATE};max-width:620px">Elige una plantilla, edita por bloques y publica cuando quieras.</p>
  </div>
  <div class="abs" style="left:1030px;top:110px">{editor_stack(0.82)}</div>
</div>'''
fb = page(1640, 624, PAPER, fb_body)

# 3. X header 1500x500.
x_body = f'''<div class="abs" style="left:0;top:0;width:1500px;height:500px;background:{INK}">
  <div class="abs" style="left:130px;top:120px;width:640px;color:{PAPER}">
    <div style="display:flex;align-items:center;gap:18px;margin-bottom:36px">{mark(PAPER, MINT, 56)}<span class="wm" style="color:{PAPER};font-size:36px">clavonia</span></div>
    <h1 style="font-size:56px;margin-bottom:20px">Tu página, lista en minutos.</h1>
    <p style="font-size:24px;color:#C5CEDB">Landing pages y sitios para emprendedores.</p>
  </div>
  <div class="abs" style="left:1040px;top:70px">{editor_stack(0.7).replace(INK, PAPER).replace("background:"+PAPER+"\"", "background:#1E2D44\"")}</div>
</div>'''
x_header = page(1500, 500, INK, x_body)

# 4. LinkedIn banner 1584x396.
li_body = f'''<div class="abs" style="left:0;top:0;width:1584px;height:396px;background:{PAPER}">
  <div class="abs" style="left:160px;top:0;height:396px;display:flex;flex-direction:column;justify-content:center">
    <div style="display:flex;align-items:center;gap:18px;margin-bottom:28px">{mark(INK, MINT, 56)}{wordmark(INK, 36)}</div>
    <h1 style="font-size:52px;margin-bottom:16px">Tu página, lista en minutos.</h1>
    <p style="font-size:24px;color:{SLATE}">Landing pages y sitios web para emprendedores.</p>
  </div>
</div>'''
linkedin = page(1584, 396, PAPER, li_body)

# 5. Instagram post 1080x1350.
ig_body = f'''<div class="abs" style="left:0;top:0;width:1080px;height:1350px;background:{INK};color:{PAPER}">
  <div class="abs" style="left:90px;top:90px">{mark(PAPER, MINT, 60)}</div>
  <div class="abs" style="left:90px;top:360px;width:900px">
    <h1 style="font-size:104px;margin-bottom:40px">Tu página, lista en minutos.</h1>
    <p style="font-size:38px;color:#C5CEDB;max-width:820px">Elige una plantilla, edita por bloques y publica cuando quieras.</p>
  </div>
  <div class="abs" style="left:90px;bottom:90px;display:flex;align-items:center;gap:24px">
    <span class="btn" style="font-size:32px">Empieza hoy</span>
  </div>
</div>'''
ig_post = page(1080, 1350, INK, ig_body)

# 6. Instagram story 1080x1920 (safe area: keep text 250px from top/bottom).
st_body = f'''<div class="abs" style="left:0;top:0;width:1080px;height:1920px;background:{INK};color:{PAPER}">
  <div class="abs" style="left:90px;top:260px">{mark(PAPER, MINT, 60)}</div>
  <div class="abs" style="left:90px;top:520px;width:900px">
    <h1 style="font-size:118px;margin-bottom:48px">Tu página, lista en minutos.</h1>
    <p style="font-size:42px;color:#C5CEDB;max-width:860px">Elige una plantilla, edita por bloques y publica cuando quieras.</p>
  </div>
  <div class="abs" style="left:90px;top:1180px;width:900px">
    <div class="card" style="background:#1E2D44;box-shadow:none;padding:40px 44px;display:flex;flex-direction:column;gap:22px">
      <div style="height:22px;width:60%;border-radius:11px;background:{PAPER}"></div>
      <div style="height:16px;width:90%;border-radius:8px;background:#34445E"></div>
      <div style="height:16px;width:70%;border-radius:8px;background:#34445E"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px">
        <div style="height:64px;width:300px;border-radius:12px;background:{MINT}"></div>
        <div style="width:14px;height:44px;border-radius:6px;background:{MINT}"></div>
      </div>
    </div>
  </div>
  <div class="abs" style="left:90px;bottom:260px"><span class="btn" style="font-size:32px">Empieza hoy</span></div>
</div>'''
story = page(1080, 1920, INK, st_body)

files = {
    "avatar-1080x1080": avatar,
    "facebook-cover-1640x624": fb,
    "x-header-1500x500": x_header,
    "linkedin-banner-1584x396": linkedin,
    "instagram-post-1080x1350": ig_post,
    "instagram-story-1080x1920": story,
}
for name, html in files.items():
    with open(os.path.join(OUT, name + ".html"), "w") as f:
        f.write(html)
print("written", len(files))
