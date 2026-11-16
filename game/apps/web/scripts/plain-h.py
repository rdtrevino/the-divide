#!/usr/bin/env python3
"""Give the title font (Cinzel Decorative) a plain letter H.

Cinzel Decorative's capital H has a curl that runs into the letter before it, and its lowercase h is
drawn joined to the letter after it, so "The" always looks joined. This script takes the H from Cinzel
(the plain version of the same typeface, at the same weight) and makes both H and h use it. Nothing else
in the font changes, so other joined forms (the "oo" in "Rulebook") stay as they are.

Run from apps/web:  python3 scripts/plain-h.py
It reads the original files in scripts/fonts-original/ and writes public/fonts/cinzel-decorative-*.woff2.
Requires fontTools and brotli (pip install fonttools brotli).
"""
from pathlib import Path

from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = Path(__file__).resolve().parent
ORIGINALS = HERE / "fonts-original"
OUT = HERE.parent / "public" / "fonts"

for weight in (400, 700, 900):
    deco = TTFont(ORIGINALS / f"cinzel-decorative-{weight}.woff2")
    plain = instancer.instantiateVariableFont(TTFont(ORIGINALS / "cinzel.woff2"), {"wght": weight})
    # Copy Cinzel's H (outline and advance width) into the decorative font as a new glyph.
    rec = DecomposingRecordingPen(plain.getGlyphSet())
    plain.getGlyphSet()["H"].draw(rec)
    pen = TTGlyphPen(None)
    rec.replay(pen)
    name = "H.plain"
    deco["glyf"].glyphs[name] = pen.glyph()
    deco["glyf"].glyphOrder.append(name)
    deco.setGlyphOrder(deco.getGlyphOrder() + [name] if name not in deco.getGlyphOrder() else deco.getGlyphOrder())
    deco["hmtx"].metrics[name] = plain["hmtx"].metrics["H"]
    deco["glyf"].glyphs[name].recalcBounds(deco["glyf"])
    deco["maxp"].numGlyphs = len(deco.getGlyphOrder())
    for table in deco["cmap"].tables:
        if table.isUnicode():
            for ch in (ord("H"), ord("h")):
                if ch in table.cmap:
                    table.cmap[ch] = name
    deco.flavor = "woff2"
    deco.save(OUT / f"cinzel-decorative-{weight}.woff2")
    print(f"cinzel-decorative-{weight}.woff2: H and h now use Cinzel's plain H")
