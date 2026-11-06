# Field tools: no border, narrower (6 Nov 2026)

The lightning (dynamic data), V (variables) and unit buttons sit inside the right end of each text field. This round removes their borders and makes them narrower. Follows commit `b8a6170`, where they moved inside the field.

## What changed (`includes/blocks/assets/controls.css`)

| Part | Before (b8a6170) | Now |
|---|---|---|
| Button border | 1 px `#e5e5e5` | none |
| Button width | 20 px | 16 px (height 20 px) |
| Lightning icon | 12 px | 11 px |
| V position (from the field's right edge) | 24 px | 20 px |
| Unit position, no V | 24 px | 20 px |
| Unit position, with V | 46 px | 38 px |
| Input right padding, lightning only | 26 px | 22 px |
| Input right padding, V and lightning | 48 px | 40 px |
| Input right padding, unit | 50 px | 42 px |
| Input right padding, unit and V | 72 px | 60 px |

The button keeps its light grey fill (`#f6f7f7`). The unit width is now set by its text.

## Checks

Probe `snn-block-work/tools/field-tools-probe.js` on blocks.local, real editor. For every text field in the panel it checks:
- each tool lies inside the input's border box;
- each tool lies inside the input's right padding, so the typed text cannot run under it;
- no tool has a border.

Results: all tools pass on the Default tab (Column gap, Row gap), the Style tab (size rows with px, Opacity with %) and the Background tab (colour fields, swatch on the left). The input is the full field width (152 px) in every case.

## Screens

`screens/` holds 15 previews with the same names as the lab artifact's panel and Style previews (01 to 08 and 09 to 15). They were taken with `snn-block-work/tools/panel-capture.json`. Its lightning shot now uses the label "Posts per page". The old label no longer matched.

Not retaken: the GSAP header and Start animation previews (panel 09 to 11). They show no lightning or V buttons. The Duration and Delay fields in Start animation are plain number inputs with an "ms" label.

## Not done

- Start animation Duration and Delay have no lightning button. Your rule says every value field has one.
- Hover and focus styles of the buttons are unchanged.

## Rollback

`git revert` of the commit that added this note and the CSS change. Only on your say-so.
