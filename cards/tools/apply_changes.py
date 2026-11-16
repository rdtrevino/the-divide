#!/usr/bin/env python3
"""Apply a card-text change set to every card data file at once.

Usage (from the repo root):
    python3 cards/tools/apply_changes.py cards/changes/V37.json

Reads cards/changes/<VERSION>.json: {"version", "date", "previous", "changes": {Host name: {text, why,
cadence?, wording?}}, "celestials": {Celestial name: {text, why}}}
and updates, in step:
  - cards/cards.json and game/packages/engine/src/cards.data.json (card text, version, date)
  - cards/The_Divide_Cards_<previous>.xlsx -> cards/The_Divide_Cards_<VERSION>.xlsx
    (Cards V33, Open Game Deck, Changes since V32, Reprint List); the old workbook moves to
    sources/card-data/
  - cards/cards.csv, regenerated from the workbook's main sheet

Every changed card is marked "Reprint: rules changed", unless its entry has "wording": true (a wording-only
change). Requires openpyxl.
"""
import csv
import json
import shutil
import sys
from pathlib import Path

import openpyxl
from copy import copy

ROOT = Path(__file__).resolve().parents[2]


def main(change_path: str) -> None:
    spec = json.loads(Path(change_path).read_text())
    ver, prev, date = spec["version"], spec["previous"], spec["date"]
    # Changes keyed by (deck, name). "changes" holds Host cards; "celestials" holds Celestials.
    changes = {("Host", n): c for n, c in spec.get("changes", {}).items()}
    changes.update({("Celestial", n): c for n, c in spec.get("celestials", {}).items()})

    # 1. JSON card data
    data_path = ROOT / "cards/cards.json"
    data = json.loads(data_path.read_text())
    old_text, number = {}, {}
    for deck, key in (("Host", "hosts"), ("Celestial", "celestials")):
        for card in data[key]:
            k = (deck, card["name"])
            if k in changes:
                old_text[k] = card["text"]
                number[k] = card.get("number", card.get("numeral"))
                card["text"] = changes[k]["text"]
                if "cadence" in changes[k]:
                    card["cadence"] = changes[k]["cadence"]
    missing = set(changes) - set(old_text)
    if missing:
        sys.exit(f"Unknown cards: {sorted(missing)}")
    data["version"], data["date"] = ver, date
    out = json.dumps(data, indent=2, ensure_ascii=False)
    data_path.write_text(out)
    (ROOT / "game/packages/engine/src/cards.data.json").write_text(out)

    # 2. Workbook
    old_xlsx = ROOT / f"cards/The_Divide_Cards_{prev}.xlsx"
    new_xlsx = ROOT / f"cards/The_Divide_Cards_{ver}.xlsx"
    wb = openpyxl.load_workbook(old_xlsx)

    main_ws = wb["Cards V33"]
    head = [c.value for c in main_ws[1]]
    eff = head.index(next(h for h in head if str(h).startswith("Effect")))
    main_ws.cell(1, eff + 1).value = f"Effect ({ver})"
    status_col = head.index("Print status")
    note_col = head.index("Rules change vs printed card")
    cad_col = head.index("Cadence")
    for row in main_ws.iter_rows(min_row=2):
        k = (row[0].value, row[2].value)
        if k in changes:
            row[eff].value = changes[k]["text"]
            if "cadence" in changes[k]:
                row[cad_col].value = changes[k]["cadence"]
            if changes[k].get("wording"):
                if row[status_col].value == "Up to date":
                    row[status_col].value = "Reprint when convenient: wording only"
            else:
                row[status_col].value = "Reprint: rules changed"
            prior = row[note_col].value
            row[note_col].value = f"{prior}; {changes[k]['why']}" if prior else changes[k]["why"]

    deck_ws = wb["Open Game Deck"]
    for row in deck_ws.iter_rows(min_row=2):
        k = (row[0].value, row[2].value)
        if k in changes:
            row[5].value = changes[k]["text"]

    ch_ws = wb["Changes since V32"]
    seen = set()
    for row in ch_ws.iter_rows(min_row=2):
        k = (row[0].value, row[2].value)
        if k in changes:
            row[4].value = changes[k]["text"]
            row[5].value = f"{row[5].value}; {changes[k]['why']}" if row[5].value else changes[k]["why"]
            seen.add(k)
    for k in changes:
        if k not in seen:
            append_styled(ch_ws, [k[0], number[k], k[1], old_text[k], changes[k]["text"], changes[k]["why"]])
    sort_rows(ch_ws, key=lambda r: (deck_order(r[0]), num_key(r[1])))

    rp_ws = wb["Reprint List"]
    seen = set()
    for row in rp_ws.iter_rows(min_row=2):
        k = (row[1].value, row[3].value)
        if k in changes:
            if row[0].value != "New card" and not changes[k].get("wording"):
                row[0].value = "Rules changed"
                row[4].value = changes[k]["why"] if row[4].value == "Wording or format only" else f"{row[4].value}; {changes[k]['why']}"
            row[6].value = changes[k]["text"]
            seen.add(k)
    for k in changes:
        if k not in seen:
            if changes[k].get("wording"):
                append_styled(rp_ws, ["Wording only", k[0], number[k], k[1], "Wording or format only", old_text[k], changes[k]["text"]])
            else:
                append_styled(rp_ws, ["Rules changed", k[0], number[k], k[1], changes[k]["why"], old_text[k], changes[k]["text"]])
    prio = {"New card": 0, "Rules changed": 1, "Wording only": 2}
    sort_rows(rp_ws, key=lambda r: (prio.get(r[0], 9), deck_order(r[1]), num_key(r[2])))

    wb.save(new_xlsx)
    archive = ROOT / "sources/card-data" / old_xlsx.name
    shutil.move(str(old_xlsx), archive)

    # 3. CSV from the main sheet
    wb2 = openpyxl.load_workbook(new_xlsx)
    with open(ROOT / "cards/cards.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        for r in wb2["Cards V33"].iter_rows(values_only=True):
            w.writerow(["" if v is None else v for v in r])
    print(f"{ver}: {len(changes)} cards updated; wrote {new_xlsx.name}, cards.csv, cards.json; archived {old_xlsx.name}")


def deck_order(d):
    return {"Host": 0, "Celestial": 1, "Event": 2, "Fate": 3}.get(d, 9)


def num_key(n):
    roman = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9}
    if isinstance(n, (int, float)):
        return float(n)
    return float(roman.get(str(n), 999)) if n else 999.0


def append_styled(ws, values):
    src = ws.max_row
    ws.append(values)
    for i in range(1, len(values) + 1):
        a, b = ws.cell(src, i), ws.cell(ws.max_row, i)
        b.font, b.alignment, b.border, b.fill, b.number_format = copy(a.font), copy(a.alignment), copy(a.border), copy(a.fill), a.number_format
    if ws.auto_filter.ref:
        first = ws.auto_filter.ref.split(":")[0]
        last_col = ws.auto_filter.ref.split(":")[1].rstrip("0123456789")
        ws.auto_filter.ref = f"{first}:{last_col}{ws.max_row}"


def sort_rows(ws, key):
    rows = [list(r) for r in ws.iter_rows(min_row=2, values_only=True)]
    rows.sort(key=key)
    for i, r in enumerate(rows, start=2):
        for j, v in enumerate(r, start=1):
            ws.cell(i, j).value = v


if __name__ == "__main__":
    main(sys.argv[1])
