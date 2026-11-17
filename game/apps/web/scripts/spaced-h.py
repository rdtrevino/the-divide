#!/usr/bin/env python3
"""Give the title font's decorative H room on its left, so it never touches the letter before it.

Cinzel Decorative's capital H has a curl that reaches toward the letter before it, which made "The"
look joined. This script keeps that decorative H but moves it right inside its own space (and adds a
little room after it), and makes lowercase h use the same H so every heading matches the logo.
Nothing else in the font changes, so other joined forms (the "oo" in "Rulebook") stay as they are.

Run from apps/web:  python3 scripts/spaced-h.py
It reads the original files in scripts/fonts-original/ and writes src/fonts/cinzel-decorative-*.woff2.
Requires fontTools and brotli (pip install fonttools brotli).
"""
from pathlib import Path

from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

HERE = Path(__file__).resolve().parent
ORIGINALS = HERE / "fonts-original"
OUT = HERE.parent / "src" / "fonts"
LEFT = 90   # extra room before the H, in font units (1000 per em)
RIGHT = 30  # extra room after it

for weight in (400, 700, 900):
    font = TTFont(ORIGINALS / f"cinzel-decorative-{weight}.woff2")
    glyphs = font.getGlyphSet()
    rec = DecomposingRecordingPen(glyphs)
    glyphs["H"].draw(rec)
    pen = TTGlyphPen(None)
    rec.replay(TransformPen(pen, (1, 0, 0, 1, LEFT, 0)))
    glyph = pen.glyph()
    font["glyf"].glyphs["H"] = glyph
    glyph.recalcBounds(font["glyf"])
    advance, _ = font["hmtx"].metrics["H"]
    font["hmtx"].metrics["H"] = (advance + LEFT + RIGHT, glyph.xMin)
    for table in font["cmap"].tables:
        if table.isUnicode() and ord("h") in table.cmap:
            table.cmap[ord("h")] = "H"
    font.flavor = "woff2"
    font.save(OUT / f"cinzel-decorative-{weight}.woff2")
    print(f"cinzel-decorative-{weight}.woff2: decorative H with room on both sides; h uses it too")
