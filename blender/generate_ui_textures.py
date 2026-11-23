import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT_DIR = os.path.join(os.path.dirname(__file__), "textures_v3")
os.makedirs(OUT_DIR, exist_ok=True)

FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_SEMI = r"C:\Windows\Fonts\seguisb.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        try:
            return ImageFont.truetype(FONT_BOLD, size)
        except Exception:
            return ImageFont.load_default()

def save_aa(img, name, scale=2):
    if scale > 1:
        img = img.resize((img.width // scale, img.height // scale), Image.Resampling.LANCZOS)
    img.save(os.path.join(OUT_DIR, name))

def draw_frosted_glass_card(w, h, tint=(14, 24, 44), accent=(16, 185, 129), radius=64, border_w=4, alpha_base=178):
    """
    Create a true frosted-glass (glassmorphism) card with:
    - Semi-transparent dark glass fill so animated 3D background lights glow through
    - Subtle frosted micro-blur noise texture inside the glass
    - Soft diagonal glass reflection sheen (top-left specular sweep)
    - Luminous glass rim highlight + colored accent inner glow
    """
    # Rounded mask
    mask = Image.new("L", (w, h), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.rounded_rectangle([12, 12, w - 12, h - 12], radius=radius, fill=255)

    # 1) Base translucent glass gradient (slightly brighter top-left -> deeper bottom-right)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    nx = xx / max(1, w)
    ny = yy / max(1, h)
    diag = (1.0 - nx) * 0.55 + (1.0 - ny) * 0.45  # 1 at top-left, 0 at bottom-right

    # Subtle frosted grain (low-frequency blurred noise)
    rng = np.random.default_rng(42 + w + h)
    grain = rng.normal(0.0, 6.0, (h // 4, w // 4)).astype(np.float32)
    grain_img = Image.fromarray(np.clip(grain + 128, 0, 255).astype(np.uint8), mode="L").resize((w, h), Image.Resampling.BILINEAR)
    grain_arr = (np.array(grain_img, dtype=np.float32) - 128.0) * 0.55

    # Diagonal specular sheen band across glass
    sheen_dist = np.abs((nx * 0.72 + ny * 0.52) - 0.34)
    sheen = np.exp(-((sheen_dist / 0.14) ** 2)) * 28.0

    # Soft colored ambient tint near top-right / border
    glow_spot = np.exp(-(((nx - 0.82) ** 2) / 0.18 + ((ny - 0.18) ** 2) / 0.25)) * 0.28

    r = np.clip(tint[0] + diag * 24.0 + sheen + glow_spot * accent[0] + grain_arr, 0, 255)
    g = np.clip(tint[1] + diag * 28.0 + sheen + glow_spot * accent[1] + grain_arr, 0, 255)
    b = np.clip(tint[2] + diag * 34.0 + sheen + glow_spot * accent[2] + grain_arr, 0, 255)
    a = np.clip(alpha_base + diag * 26.0 + sheen * 0.6, 0, 232)

    rgba = np.stack([r, g, b, a], axis=-1).astype(np.uint8)
    card = Image.fromarray(rgba, mode="RGBA")

    # Apply rounded mask to card fill
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    img.paste(card, (0, 0), mask)

    # Outer soft colored glow behind border
    glow_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow_layer)
    gdraw.rounded_rectangle([12, 12, w - 12, h - 12], radius=radius, outline=(accent[0], accent[1], accent[2], 130), width=10)
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=8))
    img = Image.alpha_composite(glow_layer, img)

    # Crisp glass specular border (bright frosted white-accent rim)
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([12, 12, w - 12, h - 12], radius=radius, outline=(accent[0], accent[1], accent[2], 200), width=border_w)
    # Inner top-left white glass reflection rim
    draw.rounded_rectangle([18, 18, w - 18, h - 18], radius=radius - 6, outline=(255, 255, 255, 62), width=3)

    return img, draw

def draw_pill(draw, xy, text, bg, fg, font, pad_x=34, pad_y=14, outline=None):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x, y = xy
    w_box = tw + pad_x * 2
    h_box = th + pad_y * 2
    draw.rounded_rectangle([x, y, x + w_box, y + h_box], radius=h_box // 2, fill=bg, outline=outline, width=3 if outline else 0)
    draw.text((x + pad_x - bbox[0], y + pad_y - bbox[1]), text, fill=fg, font=font)
    return w_box, h_box

def draw_centered_pill(draw, cx, y, text, bg, fg, font, pad_x=44, pad_y=16, outline=None):
    """Mathematically dead-center a pill horizontally around cx."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    w_box = tw + pad_x * 2
    h_box = th + pad_y * 2
    x = cx - w_box // 2
    draw.rounded_rectangle([x, y, x + w_box, y + h_box], radius=h_box // 2, fill=bg, outline=outline, width=3 if outline else 0)
    draw.text((x + pad_x - bbox[0], y + pad_y - bbox[1]), text, fill=fg, font=font)
    return w_box, h_box

def draw_centered_text(draw, cx, y, text, font, fill):
    """Mathematically dead-center text horizontally around cx."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    draw.text((cx - tw // 2 - bbox[0], y - bbox[1]), text, font=font, fill=fill)

def draw_sparkline(draw, x, y, w, h, points, color=(16, 185, 129, 255), width=11):
    min_p, max_p = min(points), max(points)
    span = max(0.001, max_p - min_p)
    coords = []
    for i, p in enumerate(points):
        px = x + (i / (len(points) - 1)) * w
        py = y + h - ((p - min_p) / span) * h
        coords.append((px, py))
    glow_col = (color[0], color[1], color[2], 85)
    draw.line(coords, fill=glow_col, width=width + 16, joint="curve")
    draw.line(coords, fill=color, width=width, joint="curve")
    lx, ly = coords[-1]
    draw.ellipse([lx - 15, ly - 15, lx + 15, ly + 15], fill=color, outline=(255, 255, 255, 255), width=5)

def draw_ring_gauge(draw, cx, cy, r, pct, stroke=46, track=(30, 41, 59, 175), active=(16, 185, 129, 255)):
    bbox = [cx - r, cy - r, cx + r, cy + r]
    draw.arc(bbox, 0, 360, fill=track, width=stroke)
    end_angle = -90 + (pct / 100.0) * 360.0
    draw.arc(bbox, -90, end_angle, fill=active, width=stroke)
    rad = math.radians(end_angle)
    ex = cx + (r - stroke / 2) * math.cos(rad)
    ey = cy + (r - stroke / 2) * math.sin(rad)
    cap_r = stroke / 2
    draw.ellipse([ex - cap_r, ey - cap_r, ex + cap_r, ey + cap_r], fill=active)

def draw_logo_mark(draw, cx, cy, r, stroke=28):
    bbox = [cx - r, cy - r, cx + r, cy + r]
    draw.arc(bbox, -60, 220, fill=(16, 185, 129, 255), width=stroke)
    draw.arc(bbox, 235, 285, fill=(56, 189, 248, 255), width=stroke)
    draw.ellipse([cx - r * 0.28, cy - r * 0.28, cx + r * 0.28, cy + r * 0.28], fill=(16, 185, 129, 255))

# ============================================================================
# SCENE 1: HOOK ("Masih cek pH tanah secara manual?") + 3 Frosted Problem Cards
# ============================================================================
def make_scene1():
    img = Image.new("RGBA", (1800, 740), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_centered_pill(draw, 900, 36, "MASALAH DI LAHAN", (245, 158, 11, 55), (253, 224, 71, 255), get_font(FONT_BOLD, 42), pad_x=48, pad_y=16, outline=(251, 191, 36, 190))
    draw_centered_text(draw, 900, 168, "Masih cek pH tanah", get_font(FONT_BOLD, 126), (255, 255, 255, 255))
    draw_centered_text(draw, 900, 326, "secara manual?", get_font(FONT_BOLD, 132), (251, 191, 36, 255))
    draw_centered_text(draw, 900, 520, "Data tercecer, telat tahu saat tanah bermasalah.", get_font(FONT_SEMI, 50), (203, 213, 225, 255))
    save_aa(img, "s1_headline.png")

    # Problem Card 1: pH Asam (Frosted Amber Glass)
    img, draw = draw_frosted_glass_card(1260, 360, tint=(32, 24, 18), accent=(245, 158, 11), alpha_base=182)
    draw.ellipse([64, 64, 96, 96], fill=(251, 191, 36, 255))
    draw.text((122, 52), "pH TANAH TIDAK TERPANTAU", fill=(226, 232, 240, 255), font=get_font(FONT_SEMI, 40))
    draw.text((64, 150), "5.2 pH", fill=(255, 255, 255, 255), font=get_font(FONT_BOLD, 122))
    draw_pill(draw, (760, 178), "TERLALU ASAM", (245, 158, 11, 65), (253, 224, 71, 255), get_font(FONT_BOLD, 38), pad_x=38, pad_y=16, outline=(251, 191, 36, 180))
    save_aa(img, "s1_prob_ph.png")

    # Problem Card 2: Tanah Kering (Frosted Rose Glass)
    img, draw = draw_frosted_glass_card(1260, 360, tint=(36, 16, 28), accent=(244, 63, 94), alpha_base=182)
    draw.ellipse([64, 64, 96, 96], fill=(251, 113, 133, 255))
    draw.text((122, 52), "KELEMBAPAN TANAH DROP", fill=(226, 232, 240, 255), font=get_font(FONT_SEMI, 40))
    draw.text((64, 150), "24 %", fill=(255, 255, 255, 255), font=get_font(FONT_BOLD, 122))
    draw_pill(draw, (760, 178), "TANAH KERING", (244, 63, 94, 65), (253, 164, 175, 255), get_font(FONT_BOLD, 38), pad_x=38, pad_y=16, outline=(251, 113, 133, 180))
    save_aa(img, "s1_prob_dms.png")

    # Problem Card 3: Cek Manual (Frosted Slate Glass)
    img, draw = draw_frosted_glass_card(1260, 320, tint=(18, 28, 48), accent=(148, 163, 184), alpha_base=182)
    draw_centered_text(draw, 630, 68, "TANPA RIWAYAT & NOTIFIKASI", get_font(FONT_SEMI, 38), (148, 163, 184, 255))
    draw_centered_text(draw, 630, 146, "Harus turun ke lahan setiap hari", get_font(FONT_BOLD, 58), (248, 250, 252, 255))
    save_aa(img, "s1_prob_manual.png")

# ============================================================================
# SCENE 2: SOLUTION REVEAL ("Tenang, kini ada..." -> Smart Soil Monitoring IoT)
# ============================================================================
def make_scene2():
    img = Image.new("RGBA", (1800, 420), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_centered_text(draw, 900, 110, "Tenang, kini ada...", get_font(FONT_BOLD, 126), (226, 232, 240, 255))
    save_aa(img, "s2_tenang.png")

    # Frosted glass hero badge behind Logo Lockup
    img, draw = draw_frosted_glass_card(1720, 960, tint=(10, 24, 38), accent=(16, 185, 129), radius=84, border_w=5, alpha_base=168)
    draw_logo_mark(draw, 860, 215, 118, stroke=28)
    draw_centered_text(draw, 860, 390, "Smart Soil", get_font(FONT_BOLD, 172), (255, 255, 255, 255))
    draw_centered_text(draw, 860, 585, "Monitoring IoT", get_font(FONT_BOLD, 118), (52, 211, 153, 255))
    draw_centered_pill(
        draw, 860, 765,
        "ESP32  ·  MODEM 4G  ·  TENAGA SURYA",
        (16, 185, 129, 48), (167, 243, 208, 255),
        get_font(FONT_BOLD, 38), pad_x=52, pad_y=18, outline=(52, 211, 153, 170),
    )
    save_aa(img, "s2_logo.png")

# ============================================================================
# SCENE 3: 3 MAIN SENSOR CARDS (Frosted Glass + Glowing Sparklines)
# ============================================================================
def make_scene3():
    img = Image.new("RGBA", (1800, 340), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_centered_text(draw, 900, 30, "3 Sensor Tanah Real-Time", get_font(FONT_BOLD, 110), (255, 255, 255, 255))
    draw_centered_text(draw, 900, 184, "Arsitektur Driver Modular · Akurat & Terkalibrasi", get_font(FONT_SEMI, 48), (167, 243, 208, 255))
    save_aa(img, "s3_title.png")

    # Card A: Soil pH
    img, draw = draw_frosted_glass_card(1640, 440, tint=(10, 26, 38), accent=(16, 185, 129), alpha_base=178)
    draw.ellipse([66, 62, 98, 94], fill=(16, 185, 129, 255))
    draw.text((122, 48), "SOIL pH  ·  SENSOR pH TANAH", fill=(203, 213, 225, 255), font=get_font(FONT_SEMI, 40))
    draw_pill(draw, (1330, 44), "ONLINE", (16, 185, 129, 55), (110, 231, 183, 255), get_font(FONT_BOLD, 34), pad_x=36, pad_y=12, outline=(52, 211, 153, 160))
    draw.text((66, 148), "6.52", fill=(255, 255, 255, 255), font=get_font(FONT_BOLD, 150))
    draw.text((410, 222), "pH", fill=(148, 163, 184, 255), font=get_font(FONT_SEMI, 54))
    draw_pill(draw, (66, 330), "NETRAL · OPTIMAL", (16, 185, 129, 50), (110, 231, 183, 255), get_font(FONT_BOLD, 34), pad_x=32, pad_y=12, outline=(52, 211, 153, 140))
    draw_sparkline(draw, 780, 160, 770, 200, [6.2, 6.3, 6.42, 6.36, 6.48, 6.55, 6.50, 6.52], color=(52, 211, 153, 255))
    save_aa(img, "s3_card_ph.png")

    # Card B: Soil Moisture DMS
    img, draw = draw_frosted_glass_card(1640, 440, tint=(10, 24, 44), accent=(14, 165, 233), alpha_base=178)
    draw.ellipse([66, 62, 98, 94], fill=(56, 189, 248, 255))
    draw.text((122, 48), "SOIL MOISTURE  ·  SENSOR DMS", fill=(203, 213, 225, 255), font=get_font(FONT_SEMI, 40))
    draw_pill(draw, (1330, 44), "ONLINE", (14, 165, 233, 55), (125, 211, 252, 255), get_font(FONT_BOLD, 34), pad_x=36, pad_y=12, outline=(56, 189, 248, 160))
    draw.text((66, 148), "58.2", fill=(255, 255, 255, 255), font=get_font(FONT_BOLD, 150))
    draw.text((420, 222), "%", fill=(148, 163, 184, 255), font=get_font(FONT_SEMI, 54))
    draw_pill(draw, (66, 330), "NORMAL · TERKALIBRASI", (14, 165, 233, 50), (125, 211, 252, 255), get_font(FONT_BOLD, 34), pad_x=32, pad_y=12, outline=(56, 189, 248, 140))
    draw_sparkline(draw, 780, 160, 770, 200, [52, 54, 53.5, 56, 57.5, 58.8, 58.0, 58.2], color=(56, 189, 248, 255))
    save_aa(img, "s3_card_dms.png")

    # Card C: DS18B20 Waterproof
    img, draw = draw_frosted_glass_card(1640, 440, tint=(26, 22, 34), accent=(245, 158, 11), alpha_base=178)
    draw.ellipse([66, 62, 98, 94], fill=(251, 191, 36, 255))
    draw.text((122, 48), "SUHU TANAH  ·  DS18B20 WATERPROOF", fill=(203, 213, 225, 255), font=get_font(FONT_SEMI, 40))
    draw_pill(draw, (1330, 44), "1-WIRE", (245, 158, 11, 55), (253, 224, 71, 255), get_font(FONT_BOLD, 34), pad_x=36, pad_y=12, outline=(251, 191, 36, 160))
    draw.text((66, 148), "28.4", fill=(255, 255, 255, 255), font=get_font(FONT_BOLD, 150))
    draw.text((420, 222), "°C", fill=(148, 163, 184, 255), font=get_font(FONT_SEMI, 54))
    draw_pill(draw, (66, 330), "SUHU OPTIMAL", (245, 158, 11, 50), (253, 224, 71, 255), get_font(FONT_BOLD, 34), pad_x=32, pad_y=12, outline=(251, 191, 36, 140))
    draw_sparkline(draw, 780, 160, 770, 200, [27.5, 27.9, 28.1, 28.6, 28.3, 28.5, 28.4, 28.4], color=(251, 191, 36, 255))
    save_aa(img, "s3_card_temp.png")

# ============================================================================
# SCENE 4: SOLAR 10Wp + 12V 7Ah + MODEM 4G FROSTED SPOTLIGHT CARD
# ============================================================================
def make_scene4():
    img, draw = draw_frosted_glass_card(1660, 2060, tint=(10, 20, 38), accent=(16, 185, 129), radius=82, border_w=5, alpha_base=182)
    draw_centered_pill(draw, 830, 90, "MANDIRI ENERGI & KONEKSI", (16, 185, 129, 50), (110, 231, 183, 255), get_font(FONT_BOLD, 38), pad_x=44, pad_y=14, outline=(52, 211, 153, 160))
    draw_centered_text(draw, 830, 200, "Pantau dari mana saja", get_font(FONT_BOLD, 96), (255, 255, 255, 255))
    draw_centered_text(draw, 830, 325, "Panel Surya 10 Wp · Baterai 12V 7Ah · Modem 4G", get_font(FONT_SEMI, 44), (167, 243, 208, 255))

    cx, cy = 830, 815
    draw_ring_gauge(draw, cx, cy, 310, 92, stroke=48, track=(30, 41, 59, 175), active=(16, 185, 129, 255))
    draw_centered_text(draw, cx, cy - 102, "92%", get_font(FONT_BOLD, 168), (255, 255, 255, 255))
    draw_centered_text(draw, cx, cy + 92, "Indeks Kesehatan Tanah", get_font(FONT_SEMI, 42), (110, 231, 183, 255))

    rows = [
        ("Panel Surya 10 Wp + SCC PWM", "CHARGING · 12.60 V", (251, 191, 36, 255)),
        ("Baterai 12V 7Ah + DC-DC 5V", "83% · AKTIF 24 JAM", (52, 211, 153, 255)),
        ("Modem 4G LTE + Supabase Cloud", "LIVE SYNC · PWA HP", (56, 189, 248, 255)),
    ]
    ry = 1260
    for label, val, col in rows:
        draw.rounded_rectangle([96, ry, 1564, ry + 195], radius=40, fill=(15, 28, 52, 185), outline=(255, 255, 255, 48), width=3)
        draw.ellipse([148, ry + 78, 184, ry + 114], fill=col)
        draw.text((220, ry + 46), label, fill=(248, 250, 252, 255), font=get_font(FONT_BOLD, 44))
        draw.text((220, ry + 112), val, fill=col, font=get_font(FONT_SEMI, 36))
        ry += 235

    save_aa(img, "s4_spotlight.png")

# ============================================================================
# SCENE 5: KINETIC TRANSFORMATION ("Dari ribet." -> "Jadi otomatis.")
# ============================================================================
def make_scene5():
    img = Image.new("RGBA", (1800, 520), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_centered_text(draw, 900, 140, "Dari ribet.", get_font(FONT_BOLD, 182), (203, 213, 225, 255))
    save_aa(img, "s5_ribet.png")

    img = Image.new("RGBA", (1800, 620), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_centered_text(draw, 900, 85, "Jadi otomatis.", get_font(FONT_BOLD, 174), (52, 211, 153, 255))
    draw_centered_pill(
        draw, 900, 355,
        "SOIL-001  ·  LIVE REAL-TIME",
        (16, 185, 129, 55), (167, 243, 208, 255),
        get_font(FONT_BOLD, 42), pad_x=52, pad_y=18, outline=(52, 211, 153, 185),
    )
    save_aa(img, "s5_otomatis.png")

# ============================================================================
# SCENE 6: FINAL OUTRO CTA (Frosted Glass Hero Card — 100% Centered)
# ============================================================================
def make_scene6():
    img, draw = draw_frosted_glass_card(1760, 1220, tint=(10, 22, 38), accent=(16, 185, 129), radius=86, border_w=5, alpha_base=172)
    draw_logo_mark(draw, 880, 220, 122, stroke=28)
    draw_centered_text(draw, 880, 398, "Smart Soil", get_font(FONT_BOLD, 168), (255, 255, 255, 255))
    draw_centered_text(draw, 880, 588, "Monitoring IoT", get_font(FONT_BOLD, 114), (52, 211, 153, 255))
    draw_centered_text(draw, 880, 770, "Pertanian cerdas di genggaman Anda.", get_font(FONT_SEMI, 54), (226, 232, 240, 255))
    draw_centered_pill(
        draw, 880, 900,
        "smart-soil-monitoring-iot.vercel.app",
        (10, 18, 34, 225), (52, 211, 153, 255),
        get_font(FONT_BOLD, 44), pad_x=58, pad_y=24, outline=(52, 211, 153, 195),
    )
    draw_centered_text(draw, 880, 1075, "PWA Ready  ·  Android & Desktop  ·  Supabase Cloud", get_font(FONT_SEMI, 38), (148, 163, 184, 255))
    save_aa(img, "s6_outro.png")

if __name__ == "__main__":
    make_scene1()
    make_scene2()
    make_scene3()
    make_scene4()
    make_scene5()
    make_scene6()
    print("Generated all v3 frosted-glass centered UI textures in:", OUT_DIR)
