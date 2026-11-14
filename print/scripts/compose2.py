import json, os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

CARDS = "cards2_jpg"
OUT = "/mnt/user-data/outputs"
PW, PH = letter

def ticks(c, xs, ys, x0, x1, y0, y1):
    c.setStrokeColorRGB(0.55, 0.55, 0.55)
    c.setLineWidth(0.5)
    t = 14
    for x in xs:
        c.line(x, y1 + 2, x, min(y1 + 2 + t, PH - 2))
        c.line(x, y0 - 2, x, max(y0 - 2 - t, 2))
    for y in ys:
        c.line(x0 - 2, y, max(x0 - 2 - t, 2), y)
        c.line(x1 + 2, y, min(x1 + 2 + t, PW - 2), y)

def layout(c, images, cw, ch, cols, rows, footer):
    per = cols * rows
    gw, gh = cols * cw, rows * ch
    x0, y0 = (PW - gw) / 2, (PH - gh) / 2
    x1, y1 = x0 + gw, y0 + gh
    xs = [x0 + i * cw for i in range(cols + 1)]
    ys = [y0 + i * ch for i in range(rows + 1)]
    for p in range(0, len(images), per):
        batch = images[p:p + per]
        for i, img in enumerate(batch):
            r, col = divmod(i, cols)
            x = x0 + col * cw
            y = y1 - (r + 1) * ch
            c.drawImage(img, x, y, width=cw, height=ch, mask='auto')
        ticks(c, xs, ys, x0, x1, y0, y1)
        c.setFillColorRGB(0.5, 0.5, 0.5)
        c.setFont("Helvetica", 6)
        c.drawCentredString(PW / 2, 6, f"THE DIVIDE — {footer} — sheet {p // per + 1}")
        c.showPage()

POKER_W, POKER_H = 2.5 * inch, 3.5 * inch
EVROT_W, EVROT_H = 3.5 * inch, 5.0 * inch  # event rotated 90°: 2x2 per portrait sheet

m = json.load(open(f"{CARDS}/manifest.json"))
host = [f"{CARDS}/host_{i:02d}.jpg" for i in range(len(m["host"]))]
cel  = [f"{CARDS}/celestial_{i:02d}.jpg" for i in range(len(m["celestial"]))]
evt  = [f"{CARDS}/event_{i:02d}_rot.jpg" for i in range(len(m["event"]))]
f = lambda i: f"{CARDS}/fate_{i:02d}.jpg"
# fate order 0-3: faithful, fallen, forsaken, turn
fate_main = [f(0)] * 4 + [f(1)] * 4 + [f(2)]          # 9 -> one full sheet
fate_overflow = [f(2)] + [f(3)] * 2                    # spare forsaken + 2 turn
fate_all = fate_main + fate_overflow

# standalone PDFs (unchanged structure, events now 4-up)
jobs = [
    ("The_Divide_Host_Deck_Print.pdf", host, POKER_W, POKER_H, 3, 3, "Host Deck (66)"),
    ("The_Divide_Celestials_Print.pdf", cel, POKER_W, POKER_H, 3, 3, "Celestials (9)"),
    ("The_Divide_Fate_and_Turn_Print.pdf", fate_all, POKER_W, POKER_H, 3, 3, "Fate & Turn cards"),
    ("The_Divide_Event_Deck_Print.pdf", evt, EVROT_W, EVROT_H, 2, 2, "Event Deck (20), rotated 90°"),
]
for name, imgs, cw, ch, cols, rows, footer in jobs:
    c = canvas.Canvas(os.path.join(OUT, name), pagesize=letter)
    layout(c, imgs, cw, ch, cols, rows, footer)
    c.save()
    print(name, "pages:", (len(imgs) + cols * rows - 1) // (cols * rows))

# combined: host 66 + fate overflow 3 share the final host sheet
c = canvas.Canvas(os.path.join(OUT, "The_Divide_All_Cards_Print.pdf"), pagesize=letter)
layout(c, host + fate_overflow, POKER_W, POKER_H, 3, 3, "Host Deck (66) + Fate & Turn overflow")
layout(c, fate_main, POKER_W, POKER_H, 3, 3, "Fate & Turn cards")
layout(c, cel, POKER_W, POKER_H, 3, 3, "Celestials (9)")
layout(c, evt, EVROT_W, EVROT_H, 2, 2, "Event Deck (20), rotated 90°")
c.save()
pages = (66 + 3 + 8) // 9 + 1 + 1 + 5
print("combined pages:", pages)
