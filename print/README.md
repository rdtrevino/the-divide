# Printing

The Divide's printed cards are drawn in the Claude Design session. These scripts turn an exported deck sheet into print-ready PDFs.

## Workflow

1. Make card text or art changes in the Claude Design session. Use the **Reprint List** tab in the card spreadsheet in `cards/` (`The_Divide_Cards_V<version>.xlsx`) to see which cards need it.
2. Export the changed deck sheet as standalone HTML (Export button, upper right).
3. Give the HTML file to Claude and ask for a print rebuild. The pipeline:
   - renders the sheet in headless Chromium (the cards are drawn by JavaScript, so the raw HTML alone is not enough),
   - screenshots every card at 3x scale, capturing the full gold frame (it extends about 5.4 px to the right and 5.8 px beyond each card's box, so each card is centered in the viewport first and the capture includes the overhang),
   - composes letter-size PDFs: poker cards (2.5 x 3.5 in) 9-up with cut ticks, and Event cards (5 x 3.5 in) rotated and placed 4-up.
4. Print at 100% scale, never "fit to page".

## Files

- `scripts/capture_update.js`: renders and captures cards from an exported sheet.
- `scripts/compose2.py`: lays captured cards onto print pages.
