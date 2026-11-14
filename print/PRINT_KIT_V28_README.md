# The Divide — Print & Edit Kit (V28)

## What's here
- card_images/ — every card as a ~370 DPI JPEG, named by deck.
  host_v28/h01.jpg … h66.jpg are the current V28 Host deck in number order.
  fate_00=Faithful, fate_01=Fallen, fate_02=Forsaken, fate_03=Turn.
- scripts/ — the render-and-compose pipeline used to build the print PDFs.

## Editing card text (the workflow)
1. The Claude Design session is the source of truth for card visuals and text.
   Edit effects/descriptions there.
2. Export the changed deck sheet as standalone HTML (Export button, upper right).
3. Give the HTML file to Claude and ask for a rebuild. The pipeline:
   a. Renders the sheet in headless Chromium (cards are drawn by JavaScript,
      so the raw HTML alone is not enough).
   b. Screenshots every card at 3x scale. IMPORTANT: the gold frame overlay
      extends ~5.4px right and ~5.8px beyond each card's box, so captures
      clip to the full painted extent, with each card centered in the
      viewport first (edge-of-viewport cards otherwise get clamped).
   c. Composes letter-size PDFs: poker cards (2.5x3.5in) 9-up with cut ticks;
      Event cards (5x3.5in) rotated 90° and placed 4-up.
4. Print at 100% scale — never "fit to page".

## Reference data
The card list (CSV/JSON/MD, provided alongside this kit) is a text mirror of
V28 for spreadsheet edits and diffing. It is generated FROM the design session,
so treat it as read-out, not source: text edited only in the CSV will not
appear on printed cards until the change is made in the design session too.
