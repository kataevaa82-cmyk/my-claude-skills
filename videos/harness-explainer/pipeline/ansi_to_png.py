"""Render tmux `capture-pane -e` ANSI dumps into crisp terminal-looking PNGs.

Each cell gets a fixed-width box so box-drawing art and the /context grid stay aligned.
usage: python ansi_to_png.py <in.ansi> <out.png> [first_row] [last_row]
"""
import html
import os
import re
import subprocess
import sys
import tempfile

from wcwidth import wcwidth

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_CSS = [os.path.join(ROOT, "node_modules/@fontsource/jetbrains-mono", f) for f in ("400.css", "700.css")]
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

FG, BG = "#e8e6e3", "#161616"
BASE16 = ["#1c1c1c", "#e5534b", "#57ab5a", "#c69026", "#539bf5", "#b083f0", "#39c5cf", "#d0d0d0",
          "#636e7b", "#ff7b72", "#7ee787", "#e3b341", "#79c0ff", "#d2a8ff", "#56d4dd", "#ffffff"]


def xterm256(n):
    if n < 16:
        return BASE16[n]
    if n < 232:
        n -= 16
        steps = [0, 95, 135, 175, 215, 255]
        return "#%02x%02x%02x" % (steps[n // 36], steps[(n // 6) % 6], steps[n % 6])
    v = 8 + (n - 232) * 10
    return "#%02x%02x%02x" % (v, v, v)


SGR = re.compile(r"\x1b\[([0-9;]*)m")


def parse_line(line):
    cells = []  # (char, width, style dict)
    st = {"fg": None, "bg": None, "b": False, "dim": False, "i": False, "u": False, "inv": False}
    pos = 0
    for m in SGR.finditer(line + "\x1b[m"):
        for ch in line[pos:m.start()]:
            w = wcwidth(ch)
            if w < 0:
                continue
            if w == 0 and cells:
                c, cw, s = cells[-1]
                cells[-1] = (c + ch, cw, s)
                continue
            cells.append((ch, max(w, 1), dict(st)))
        pos = m.end()
        codes = [int(c) if c else 0 for c in m.group(1).split(";")] if m.group(1) else [0]
        i = 0
        while i < len(codes):
            c = codes[i]
            if c == 0:
                st.update(fg=None, bg=None, b=False, dim=False, i=False, u=False, inv=False)
            elif c == 1: st["b"] = True
            elif c == 2: st["dim"] = True
            elif c == 3: st["i"] = True
            elif c == 4: st["u"] = True
            elif c == 7: st["inv"] = True
            elif c == 22: st["b"] = st["dim"] = False
            elif c == 23: st["i"] = False
            elif c == 24: st["u"] = False
            elif c == 27: st["inv"] = False
            elif 30 <= c <= 37: st["fg"] = BASE16[c - 30]
            elif 90 <= c <= 97: st["fg"] = BASE16[c - 90 + 8]
            elif 40 <= c <= 47: st["bg"] = BASE16[c - 40]
            elif 100 <= c <= 107: st["bg"] = BASE16[c - 100 + 8]
            elif c == 39: st["fg"] = None
            elif c == 49: st["bg"] = None
            elif c in (38, 48) and i + 1 < len(codes):
                key = "fg" if c == 38 else "bg"
                if codes[i + 1] == 5 and i + 2 < len(codes):
                    st[key] = xterm256(codes[i + 2]); i += 2
                elif codes[i + 1] == 2 and i + 4 < len(codes):
                    st[key] = "#%02x%02x%02x" % tuple(codes[i + 2:i + 5]); i += 4
            i += 1
    return cells


def render(src, out, first=0, last=None, cols=110):
    raw = open(src, encoding="utf-8", errors="replace").read()
    raw = re.sub(r"\x1b\]8;[^;]*;[^\x07\x1b]*(?:\x07|\x1b\\)", "", raw)  # OSC 8 hyperlinks
    lines = raw.split("\n")
    if lines and lines[-1] == "":
        lines = lines[:-1]
    lines = lines[first:last]
    rows_html = []
    for line in lines:
        parts = []
        for ch, w, s in parse_line(line):
            fg, bg = s["fg"] or FG, s["bg"]
            if s["inv"]:
                fg, bg = (bg or BG), (s["fg"] or FG)
            css = [f"color:{fg}"]
            if bg: css.append(f"background:{bg}")
            if s["b"]: css.append("font-weight:700")
            if s["dim"]: css.append("opacity:.6")
            if s["i"]: css.append("font-style:italic")
            if s["u"]: css.append("text-decoration:underline")
            if w == 2: css.append("width:2ch")
            parts.append(f'<i style="{";".join(css)}">{html.escape(ch) if ch != " " else "&nbsp;"}</i>')
        rows_html.append(f'<div class="r">{"".join(parts)}</div>')
    font_links = "".join(f'<link rel="stylesheet" href="file://{p}">' for p in FONT_CSS)
    doc = f"""<!doctype html><html><head><meta charset="utf-8">{font_links}<style>
html,body{{margin:0;background:{BG};}}
.t{{padding:22px 26px;font-family:'JetBrains Mono','DejaVu Sans Mono','FreeMono','DejaVu Sans','Noto Color Emoji',monospace;font-size:22px;line-height:28px;}}
.r{{height:28px;white-space:pre;display:flex;}}
.r i{{font-style:normal;display:inline-block;width:1ch;text-align:center;overflow:visible;}}
</style></head><body><div class="t">{''.join(rows_html)}</div></body></html>"""
    width = int(cols * 13.2 + 52)
    height = len(lines) * 28 + 44 + 160  # headless viewport is shorter than the window; trimmed below
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(doc)
        tmp = f.name
    subprocess.run([CHROME, "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
                    "--force-device-scale-factor=1.5", f"--window-size={width},{height}",
                    f"--screenshot={out}", "file://" + tmp], check=True, capture_output=True)
    os.unlink(tmp)
    trim(out)
    print(out, width, height)


def trim(path, pad=30):
    """Crop away empty background below/right of the content."""
    from PIL import Image
    import numpy as np
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(int)
    bg = np.array([0x16, 0x16, 0x16])
    mask = np.abs(a - bg).sum(axis=2) > 30
    ys, xs = np.where(mask)
    if len(ys) == 0:
        return
    bottom = min(a.shape[0], ys.max() + pad)
    im.crop((0, 0, a.shape[1], bottom)).save(path)


if __name__ == "__main__":
    a = sys.argv
    render(a[1], a[2], int(a[3]) if len(a) > 3 else 0, int(a[4]) if len(a) > 4 else None)
