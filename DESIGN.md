# Design notes

What follows is the reasoning behind the page, not a description of it. Read
[README.md](README.md) for how to run it.

---

## 1. The reference, read properly

The Dribbble shot is a **video**, so a screenshot would have lied about it. Extracting frames
from the `.mp4` showed the real grammar of the DOSS design:

| Observed                                  | What it is                                    |
| ----------------------------------------- | --------------------------------------------- |
| Off-black `#0a0a0b` beside warm paper      | two grounds, alternating, never a third       |
| 1px rules at 16% opacity                   | the only dividers; no cards, no shadows       |
| Mono uppercase labels at 12px, wide track  | standing information, not decoration          |
| One grotesque display face, very large     | the argument is carried by type size          |
| Isometric boxes, wireframe + one solid     | the product, drawn instead of screenshotted   |
| Electric blue, then yellow, then red       | blue = the thing, yellow = a second object, red = a problem |
| Tables with hairline rows and mono numerals| the product *is* the table                    |
| Starfield + giant wordmark in the footer   | a deliberate ending, not a link dump          |

Every one of those is reproduced. Nothing else was imported — no layout, no copy, no asset.

## 2. Two grounds, and the discipline of alternating them

The page is a sequence of bands: **ink → ink → paper → ink → paper → ink**. The switch is the
only structural gesture available, so it has to mean something:

- **Ink** = the product talking (hero, the platform board, the products, the close).
- **Paper** = the company talking (the statement, the proof, the industries).

That is why the statement band is paper: it is the one place the page stops selling and says
something flat. The band change does the work an eyebrow label would otherwise do — and
eyebrows above headings are the first thing the design discipline forbids.

## 3. Type

```
--step--1  13px    mono labels, table meta, legal line
--step-0   16px    body
--step-1   19px    lede, sheet links
--step-2   24px    section sub-heads, statement lines
--step-3   clamp(28 → 40)    card titles, quote
--step-4   clamp(36 → 60)    section headlines
--step-5   clamp(40 → 72)    the hero
```

Two families, no third:

- **Archivo** — a grotesque with real personality at display size and a stable text colour at
  16px. Not a system face, because a system display face is the fastest way to look like a
  template.
- **IBM Plex Mono** — every number, every label, every standing datum. Mono numerals mean the
  table columns line up without `font-variant-numeric` gymnastics, and the label voice is
  visibly different from the prose voice.

Rules that were enforced rather than intended:

- **Nothing functional below 12px.** The first pass had 10px and 10.5px labels; the detector
  counted them and they were raised. A 12px mono label at 0.12em tracking reads as *technical*
  at arm's length, which is the point.
- **Tracking only on uppercase.** 0.12–0.13em on mono caps; 0 on body, and negative tracking
  only on the display sizes where Archivo needs closing up.
- **Tabular numerals in every table cell.** `.num` is right-aligned and mono, so a column of
  quantities reads as a column.
- Line length capped at 62ch for prose; the statement lines are deliberately longer because
  they are set at 24px and read as two or three lines, not a paragraph.

## 4. Colour

| Token         | Hex       | Job                                                  |
| ------------- | --------- | ---------------------------------------------------- |
| `--ink`       | `#0a0a0b` | ground. Not black — black is a screenshot artefact.  |
| `--ink-raise` | `#101013` | the board panel, one step up from the ground          |
| `--paper`     | `#efede6` | the warm ground. Not white — white is a form.        |
| `--blue`      | `#2222f5` | the one solid. Buttons, the active tab, the hero box.|
| `--blue-text` | `#6d6dff` | the same blue where it has to be *read* on ink.      |
| `--yellow`    | `#f2c230` | a second object in a diagram. Never type.            |
| `--red`       | `#e8503a` | a status that needs attention. Never decoration.     |

Blue is used **once per viewport**. In the hero it is the central solid and the word "one"; in
the board it is the active tab's rule and the count; in the diagrams it is the box that
matters. When everything can be blue, nothing is.

Two blues exist because one cannot do both jobs: `#2222f5` on `#0a0a0b` is 3.1:1 — fine for a
solid shape, illegal for text. `#6d6dff` clears 4.5:1 and is used for every blue word. This is
the kind of thing a single token would have hidden.

Muted text is set at 0.74 / 0.58 of the ground colour rather than the usual 0.6 / 0.45,
because the second value has to clear AA on both grounds. The first pass failed at 3.9:1.

## 5. Geometry instead of photography

There is no photograph on the page and no icon set. The visual is **drawn**, in `.bun`, at
request time:

```
sx = (x − y) · cos30°
sy = (x + y) · sin30° − z
```

Each box contributes three visible faces — top, left, right — shaded from a single hex by
factors derived from a fixed light direction (top brightest, right mid, left darkest). So a
box is described by six numbers and one colour:

```bun
{ "x": 4, "y": 0, "z": 0, "w": 2, "d": 2, "h": 1.2, "fill": "#2222f5" }
```

Boxes are painted back to front, sorted by `x + y + z`. Wireframe boxes (`"tone": "wire"`) get
no fill and a dashed edge, which is how the diagrams say "this is a space, not a thing" —
inventory to be filled, a lane to be used, a module not yet installed.

Two details that took iterations:

1. **`vector-effect="non-scaling-stroke"` on every path.** The diagrams are drawn in a viewBox
   and scaled to the container; without this, a 1px hairline becomes a 3px smear on a wide
   screen and vanishes on a phone. With it, the line weight is a constant 1px at every size —
   which is what makes the whole thing read as a technical drawing rather than a chart.
2. **Callouts live outside the scaled group.** `INVENTORY`, `LEDGER`, `ORDERS` are placed in
   screen coordinates after the transform, because text inside a scaled group would render at
   9px on a 390px phone.

The result is a diagram that is genuinely generated, not a picture of a diagram: change a
number and the drawing changes, with no asset pipeline.

## 6. The table is the product

The platform section is six tabs and six datasets. Most sites would show a screenshot here.
Instead the tables are **real HTML tables**, server-rendered from `content.bun`, with:

- a search field that filters rows in place and shows a real empty state ("Nothing matches
  *xyz* — clear the filter or widen the term.")
- a "Needs attention" chip that filters to non-`Active` rows, with `aria-pressed`
- a footer that states the row count and the total (`Showing 6 of 1,284`) — honest, and it
  makes the table feel like a window onto something larger
- status rendered as a bordered tag, not a coloured dot: a dot needs a legend, a word does not

The tab strip is the one place the page uses a strong horizontal rule as an active indicator,
because a filled tab would have competed with the blue.

## 7. Motion

One authored motion, and it is about the product:

- the board's rows and grid fade in when the section first enters the viewport
  (IntersectionObserver, once, 25% threshold)
- everything else is a 0.25s colour or transform transition on hover

There is no parallax, no scroll-jacking, no counter that counts up. The reveal is **scoped
under `html.reveal-ready`**, which the script adds only when it is about to observe — so with
JavaScript off, or in a full-page screenshot, the content is visible rather than hidden behind
an animation that never runs. That was a real bug caught by looking at a screenshot.

`prefers-reduced-motion` collapses every duration to 0.001ms and turns off smooth scrolling.

## 8. States

Each interactive thing has all of its states, because a control without an error state is a
lie:

| Control        | Default | Hover | Focus | Active | Disabled | Loading | Error | Empty |
| -------------- | ------- | ----- | ----- | ------ | -------- | ------- | ----- | ----- |
| Nav link       | ✓       | ✓     | ✓     | ✓      | —        | —       | —     | —     |
| Button         | ✓       | ✓     | ✓     | ✓      | ✓        | ✓       | —     | —     |
| Capability tab | ✓       | ✓     | ✓     | ✓      | —        | —       | —     | —     |
| Search         | ✓       | ✓     | ✓     | ✓      | —        | —       | —     | ✓     |
| Filter chip    | ✓       | ✓     | ✓     | ✓      | —        | —       | —     | —     |
| Email field    | ✓       | ✓     | ✓     | ✓      | ✓        | —       | ✓     | —     |
| Menu sheet     | ✓       | ✓     | ✓     | ✓      | —        | —       | —     | —     |

The form's loading state disables the button and swaps its label; the error state prints the
server's actual reason, not "Something went wrong"; the success state prints the sentence the
server returned.

## 9. Browser surfaces

Theming stops at the viewport edge for most sites. Here:

- `::selection` is blue on white
- the scrollbar is themed on WebKit, with a 2px inset border so it reads as a rule
- `:focus-visible` is a 2px outline at 3px offset, in `currentColor`, so it works on both
  grounds
- `color-scheme` is set on the root, so form controls and the caret follow the page
- the favicon is the same mark as the header, as an SVG

## 10. What the language forced

Writing this in Bun shaped the code more than the design did:

- **No template literals**, so HTML is built by `+` concatenation. The sections read as one
  statement per line, which turns out to be easier to scan than nested interpolation.
- **No `import *`**, and imports must be relative. Every module is an explicit named import,
  which makes the dependency graph readable at the top of each file.
- **`let` is immutable**; reassignment needs `var`. The section builders are therefore `var`
  accumulators, and anything that is not reassigned stays `let`.
- **No `in` operator**, no ternary, no `??`, no `?.`. Substitutes: `list.contains(x)`,
  `if/else` blocks, explicit `if x == none`.
- **`/` truncates integers**, which is fine for the LCG in the starfield and the projection
  maths, and a trap everywhere else.
- **`len()` counts characters, not bytes** — so `Content-Length` is computed from
  `utf8_bytes(body)` in `http.bun`, not from `len(body)`. That is why the em dashes and the
  middle dots in the copy do not truncate responses.

None of these are complaints. They are the shape of the file, and the shape is legible.

## 11. What was rejected

| Tempting                            | Why not                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| Gradient text on the hero           | It is the fastest way to date a page, and it hurts the word.   |
| Glassmorphism on the fixed header   | A blurred bar over a technical drawing muddies both.          |
| A card grid for the six capabilities| Six identical cards say "we had six things". A tab strip + one table says "these are six views of one record". |
| A marquee ticker                    | Motion with no destination. It is a static strip now.         |
| Screenshots of the product          | There is no product. A drawn diagram does not lie.            |
| A count-up on the statistics        | The numbers are not a performance. They are set in mono and left alone. |
| Side-stripe borders on callouts     | The 2010s are over.                                           |
| An eyebrow label above each heading | The band change and the type size already say what section this is. |

## 12. How it was checked

- **impeccable detect** — 0 anti-patterns. The 9 remaining notes are all
  `shape-assembled-illustration` on the isometric scenes, which is the deliberate medium.
  Suppressing them would be dishonest; they are listed and accepted.
- **19 smoke assertions** — every route, every MIME type, byte-accurate `Content-Length`,
  form validation in both directions, 404 and 405.
- **12 viewports, 320 → 1920px** — zero horizontal overflow at every one.
- **Interaction pass in a real browser** — tabs, search, empty state, filter chip, both rails,
  the form, the menu sheet; zero console errors.
