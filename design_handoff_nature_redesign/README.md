# Handoff: Nature-themed portfolio redesign (davidseong.com)

## Overview

A redesign of the personal portfolio at `portfolio-website/` around a robotics-and-nature
theme. The existing site's information architecture is preserved — hero with rotating role
and fun-fact button, Current Projects, Robotics / Software / Free Build project grids,
contact form, footer — and the visual layer is replaced: a dark forest palette, serif
display type, digitalized real-plant cutouts as ambient decoration, a mouse-reactive point
cloud in the hero, a carousel for Current Projects, and a scroll-progress "stem" in the
left margin that unfurls a leaf at each section.

Three screens are included: **Home**, **Projects index** (new — a filterable index over all
projects), and **Project detail** (new — a template, built out with the Simon project).

## About the design files

The files in `design/` are **design references created in HTML** — prototypes that show the
intended look and behavior. They are not production code to copy.

They are written in a proprietary "Design Component" format (`.dc.html`, backed by
`support.js`) that compiles inline-styled templates to React at runtime. **Do not port that
format.** The target codebase (`portfolio-website/`) is plain static HTML + CSS +
vanilla JS with `styles.css`, `projects.css`, `script.js` and per-project pages under
`projects/`. Recreate these designs in that existing environment: extend `styles.css`,
keep the existing page files and their URLs, keep `script.js`'s existing behavior (typing
effect, fun facts, scroll reveals) and add to it. All styling in the design files is
inline purely because of the prototype format — in the real site it belongs in the
stylesheets.

## Fidelity

**High fidelity.** Colors, type, spacing, radii and motion timings below are final and
exact. Recreate pixel-for-pixel. Two known gaps:

- The prototype shows **stills where the real site uses autoplaying muted `<video>`
  thumbnails** (Simon, Patrick, Jediode, etc.). Keep the real site's videos; the card
  geometry and treatment in this design applies to them unchanged.
- Card descriptions and years on the Projects index were written for the prototype and are
  placeholders. Use the real copy from `projects.html` / each project page.

## Design tokens

### Color

| Token | Value | Use |
|---|---|---|
| Ink / page background | `#0d1110` | Body, hero, index, detail page |
| Surface raised | `#141a16` | Cards, form fields, spec cells |
| Surface sunken | `#0f1512` | Image wells inside cards |
| Band background | `#101614` | Alternating section bands, footer |
| Text primary | `#e9ede8` | Headings, body |
| Text secondary | `#c3ccc2` | Paragraph copy |
| Text tertiary | `#b9c3b8` | Hero role line, card subtitles |
| Text muted | `#a9b3a7` | Carousel body copy |
| Text dim | `#96a095` | Card descriptions |
| Text faint | `#8e988d` | Mono captions, counts |
| Text faintest | `#7f8a7e` | Footer copyright, placeholders |
| Accent | `oklch(0.72 0.13 152)` | Buttons, active chips, links |
| Accent light | `oklch(0.74 0.13 152)` | Accent text, eyebrows, icons |
| Accent bright | `oklch(0.78 0.14 152)` | Link hover, active dots |
| Accent hover fill | `oklch(0.80 0.14 152)` | Button hover |
| Accent wash | `rgba(120,215,160,0.14)` | Active nav pill, active chip fill |
| Accent glow | `rgba(110,215,150,0.14)` | Card hover box-shadow |
| Hairline | `rgba(233,237,232,0.1)` | Card and section borders |
| Hairline strong | `rgba(233,237,232,0.12)` | Divider rules |
| Field border | `rgba(233,237,232,0.22)` | Inputs, inactive chips |
| Hover wash | `rgba(233,237,232,0.07)` | Nav pill hover |

The accent is deliberately in `oklch` — a deep plant green rather than a neon tech green.
Keep the `oklch()` notation; browser support is fine for the target audience, and the
lightness steps above are what create the accent ramp.

### Type

- Display / headings: **Newsreader** (Google), weight 400. Serif, used at large sizes.
- UI / body: **Space Grotesk** (Google), weights 400/500/600.
- Mono eyebrows, captions, counts: **IBM Plex Mono** (Google), weights 400/500.

```html
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500&family=Space+Grotesk:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Scale actually used:

| Role | Size / weight / family | Notes |
|---|---|---|
| Hero H1 | 62px / 400 / Newsreader | line-height 1.04 |
| Page H1 (index, detail) | 54px / 52px / 400 / Newsreader | line-height 1.05–1.06 |
| Hero role line | 26px / 400 / Space Grotesk | cycling word scales, see below |
| Section H2 | 38px (home) · 34px · 32px / 400 / Newsreader | |
| Carousel H3 | 33px / 400 / Newsreader | |
| Card H3 | 16px / 600 / Space Grotesk | |
| Body | 15.5px / 400 / Space Grotesk | line-height 1.8 |
| Card body | 13px / 400 | line-height 1.6 |
| Mono eyebrow | 11px, letter-spacing 0.18em, uppercase | |
| Mono caption / count | 10.5–11px, letter-spacing 0.1–0.16em, uppercase | |

### Geometry and motion

- Radii: **18px** carousel panel and large containers · **16px** cards and spec strip ·
  **14px** form fields, image wells · **11–12px** images inside cards · **999px** pills,
  chips, buttons, social circles · **50%** avatar and social buttons.
- Card image padding: images sit inset by **10px** on three sides inside the card
  (`padding: 10px 10px 0`), so the image's own radius reads inside the card's.
- Page gutters: `46px` right / `76px` left on Home (the extra left gutter clears the scroll
  stem); `46px` both sides on index and detail. Content max-width `1320px` (home, index),
  `1100px` (detail).
- Transitions: card hover `transform 300ms ease, box-shadow 300ms ease, border-color 300ms
  ease`; carousel track `transform 600ms cubic-bezier(.3,.8,.3,1)`; scroll-stem leaves
  `transform 700ms cubic-bezier(.2,.8,.3,1), opacity 700ms ease`; filter chips `all 250ms
  ease`.
- Keyframes:
  ```css
  @keyframes sway   { 0%,100% { transform: rotate(-1.1deg); } 50% { transform: rotate(1.1deg); } }
  @keyframes blink  { 0%,45% { opacity: 1; } 50%,95% { opacity: 0; } }
  ```
- `html { scroll-behavior: smooth; }`
- The page wrapper uses `overflow-x: clip`, **not** `hidden`. `hidden` creates a scroll
  container that breaks the sticky header. This bit us; don't undo it.

## Assets

### The plant cutouts (the core of the look)

Five real plant photographs were background-keyed, cropped, downsampled to roughly a
60–90px grid, posterized to 4 luminance steps, mapped into the green ramp, and scaled back
up with nearest-neighbor. The result reads as a deliberate, chunky digitalization of a real
plant — not as an AI-drawn leaf, which is what earlier iterations were rejected for.

`assets/leafpix_*.png` — the finished art, ready to ship:

| File | Plant | Notes |
|---|---|---|
| `leafpix_monstera.png` | Monstera | largest, used for the hero's top-right |
| `leafpix_linden.png` | Linden | hero bottom-left, detail page |
| `leafpix_ovate.png` | Ovate leaf | third species, rail |
| `leafpix_cactus.png` | Prickly pear | rotated 90° clockwise from source |
| `leafpix_thistle.png` | Thistle | the only one that keeps non-green color (purple bloom) |

`assets/source_cutouts/leaf_*.png` are the keyed, un-posterized full-resolution cutouts,
in case you need to regenerate at a different grid size.

**Every one of these must be rendered with `image-rendering: pixelated`.** Without it the
browser smooths the upscale and the whole effect dies.

Color mapping used, for reference if you regenerate: luminance `L = (0.3R + 0.6G + 0.1B)/255`,
posterized to 4 steps as `t`, then `rgb(14 + 62t, 44 + 104t, 28 + 58t)`. Alpha is hard
thresholded at ~120/255 — no antialiased edges, which is what keeps the pixel grid crisp.

### Other assets

Logo (`assets/robodave_logo.png`), portrait (`image_1_reduced.webp`), and all project
imagery already exist in the repo under `Images/` and `projects/`. `sisyphus.jpeg`,
`somek.jpeg` and `gauntlet.jpeg` were pulled from `projects/3d_prints/`. Icons are
**boxicons 2.1.4** via CDN — the repo already uses it, so no change.

---

## Screen 1 — Home (`index.html`)

### Sticky header

Height ~64px. `position: sticky; top: 0; z-index: 8`, background `rgba(13,17,16,0.86)` with
`backdrop-filter: blur(10px)`, bottom border hairline. Padding `18px 46px 18px 76px`.

Left: logo only, 28px tall, linking to `#top`. **The "David Seong" wordmark was removed
from the nav** — the logo carries it.

Right: pill nav, `gap: 8px`, 14px text. Each item `padding: 8px 16px; border-radius: 999px`.
Active item gets `background: rgba(120,215,160,0.14); color: oklch(0.74 0.13 152)`; inactive
items get `background: rgba(233,237,232,0.07)` on hover. Items: Home, Current, Projects,
Contact.

### Scroll stem (left margin)

`position: fixed; left: 26px; top: 0; bottom: 0; width: 14px; z-index: 6; pointer-events: none`.

- A 2px track at `left: 6px`, full height, `rgba(233,237,232,0.09)`.
- A 2px fill on top of it, same x, height = scroll progress as a percentage, background
  accent, `box-shadow: 0 0 12px rgba(120,215,160,0.45)`.
- Five leaf nodes pinned at fixed scroll fractions — **0.16 monstera, 0.34 linden,
  0.56 ovate, 0.74 cactus, 0.90 thistle**. Each is 38px wide, `left: -11px`,
  `top: calc(<fraction>% - 16px)`, `transform-origin: 50% 92%` (the stem attachment point).
  Unreached: `transform: rotate(-72deg) scale(0.45); opacity: 0.25`. Once scroll progress
  reaches `fraction - 0.02`: `transform: rotate(0deg) scale(1); opacity: 0.95`. The leaf
  unfurls from the stem as you pass it.

Progress = `scrollTop / (scrollHeight - clientHeight)`, clamped to 1, on a passive scroll
listener.

This should be a `prefers-reduced-motion` opt-out, and hidden below ~900px viewport width
where the left gutter collapses.

### Hero

Two columns, `repeat(auto-fit, minmax(320px, 1fr))`, `gap: 48px`, `align-items: center`,
padding `76px 46px 78px 76px`. Collapses to one column under ~860px.

**Point-cloud canvas.** A `<canvas>` at `position: absolute; inset: 0`, 1180×560 backing
store, stretched to 100%/100%. Over it, a vignette:
`radial-gradient(72% 88% at 26% 50%, rgba(13,17,16,0.94), rgba(13,17,16,0.28) 76%)` — this
is what keeps the headline legible over the dots.

620 points. Each point's home position: `x` uniform across the width; `y` = a terrain-ish
baseline `H*0.6 + sin(x/140)*58 + sin(x/33)*16`, plus uniform jitter of `±H*0.45`. Radius
`0.5–2.0`, base alpha `0.14–0.60`. Per frame the whole field drifts `sin(t/3600)*6` px in x.
On mousemove over the canvas, points within **110px** of the cursor are pushed radially
outward by `(110 - distance) * 0.75` px; points within **190px** brighten to
`rgba(150,240,180, alpha+0.32)`. Base color `rgba(118,188,143, alpha)`. Cleared and redrawn
each frame on `requestAnimationFrame`.

**Important for performance:** the RAF loop must be gated on an `IntersectionObserver` so it
stops when the hero scrolls out of view, and cancelled on teardown. An earlier version
without this made the page unusable.

**Ambient plants.** Monstera at `right: -90px; top: -60px`, rotated 15°, height 520px,
`opacity: 0.3`, `animation: sway 15s ease-in-out infinite`. Linden at `left: -40px;
bottom: -60px`, rotated -24°, height 260px, `opacity: 0.22`, `sway 19s` with a 2s delay.
Cactus at `right: 210px; bottom: -70px`, rotated 9°, height 230px, `opacity: 0.16`,
`sway 23s` with a 1s delay. Each has a static rotation on an outer wrapper and the sway on
the `<img>` itself, with `transform-origin` at the corner it hangs from, so the sway reads
as hanging rather than spinning. All `pointer-events: none`.

**Copy column, in order:**

1. H1: `Hi, I'm ` + `David` in accent.
2. Role line, 26px, color `#b9c3b8`: the literal text `I'm a `, then a fixed-width slot,
   then ` ` + `Engineer` in accent.

   The slot is `display: inline-flex; align-items: baseline; justify-content: flex-end;
   width: 182px`, accent colored, containing the cycling word and then a blinking `|`
   (`animation: blink 1.1s steps(1) infinite`). Right-aligning inside a fixed slot is what
   keeps "Engineer" from sliding and keeps the caret tight against the word.

   The word cycles every **2800ms** through **Robotics, Perception, Mechatronics, Product**,
   and each is sized to fill the slot: **Robotics 40px, Perception 33px, Mechatronics 26px,
   Product 44px**, `line-height: 1`, `transition: font-size 350ms ease`. "Engineer" is
   fixed — only the qualifier changes.

3. Bio paragraph, 15.5px, `max-width: 62ch`:

   > Currently building [Hermes Vision](https://hermesvision.io/), using AI and computer
   > vision to make land management more efficient. In my free time, I love to explore the
   > outdoors, build robots, and turn my daily problems into overcomplicated engineering
   > projects.

   "Hermes Vision" is an accent-colored 600-weight link to `https://hermesvision.io/` with
   a 1px accent bottom border.

4. Two lines, 14.5px: `Master's:` (accent) ` Carnegie Mellon University` /
   `Bachelor's:` (accent) ` University of Wisconsin - Madison`.
5. Social row: four 42px circles, `gap: 12px`, 1px `rgba(120,215,160,0.5)` border, accent
   21px boxicons glyph. Hover fills accent with `#0d1110` glyph. LinkedIn, GitHub,
   Instagram, YouTube — wire to the real URLs already in the repo.
6. Action row, `gap: 14px`, wrapping: a filled accent pill **"Fun fact about me!"**
   (`padding: 12px 22px`, `#0d1110` text, hover `oklch(0.80 0.14 152)`), an outlined pill
   **"Contact"** (1px `rgba(233,237,232,0.3)`, hover border accent), and then the fact
   itself — 14px, `oklch(0.78 0.14 152)`, italic, `min-height: 20px` so the row doesn't jump
   when it appears. Clicking the button picks a random entry from the existing fun-facts
   array in `script.js`.

**Portrait.** Right column, centered, `max-width: 340px`. The image is
`width: 100%; max-width: 320px; aspect-ratio: 1/1; object-fit: cover; border-radius: 50%;
filter: saturate(0.85)` and — the point of it — a radial mask so the edge dissolves instead
of ending at a hard ring:

```css
mask-image: radial-gradient(circle at 50% 50%, #000 58%, rgba(0,0,0,0.25) 82%, transparent 100%);
```

(with `-webkit-mask-image` alongside). No frame, no window chrome, no concentric rings —
all of those were tried and rejected.

### Current Projects (carousel)

Section header: H2 38px "Current Projects", a flex-grow hairline rule, then two 36px round
prev/next buttons (1px `rgba(233,237,232,0.25)`, 20px chevron, hover border+icon accent).
No leaf marker in section headers — those were removed.

Viewport is `overflow: hidden; border-radius: 18px`. Inside, a flex track of full-width
slides, `transform: translateX(-<index * 100>%)`, transition as in tokens.

Each slide: two equal columns `minmax(0,1fr)`, `gap: 30px`, `align-items: center`, background
`#141a16`, hairline border, `border-radius: 18px`, `padding: 18px`.

- Left: a **fixed 320px-tall well** — `background: #0f1512; border-radius: 14px;
  display: flex; align-items: center; justify-content: center; overflow: hidden`, with the
  media inside at `max-width: 100%; max-height: 100%; object-fit: contain;
  border-radius: 10px; filter: saturate(0.85)`. Contain, not cover — these images and videos
  have wildly different aspect ratios and were being cropped badly.
- Right: mono eyebrow (accent, uppercase) · H3 33px Newsreader · 18px subtitle `#b9c3b8` ·
  body 14.5px/1.75 `#a9b3a7`.

Dots below, centered, `gap: 10px`, 9px circles — active accent, inactive
`rgba(233,237,232,0.22)`, `transition: background 300ms ease`. Auto-advances every
**7000ms**; any manual interaction (arrow or dot) clears the timer permanently.

Current Projects holds **Simon, Return of the Jediode, Pestroleum / Petmobility** — copy
verbatim from the existing site. E-Ducati-On moved out of Current and into Robotics.

### Project grids

Three sections on a `#101614` band, `padding: 56px 46px 64px 76px`, content `max-width: 1320px`.

Each header: H2 34px Newsreader, flex-grow hairline, and for Robotics a mono count on the
right (`11 PROJECTS` style, 11px, `letter-spacing: 0.14em`, `#8e988d`).

**Robotics Projects** — `repeat(auto-fill, minmax(280px, 1fr))`, `gap: 20px`. Card:
`#141a16`, hairline border, `radius: 16px`, `overflow: hidden`, `cursor: pointer`. Image
inset `10px 10px 0`, `height: 172px`, `object-fit: cover`, `radius: 11px`,
`filter: saturate(0.75) brightness(0.92)`. Text block `padding: 13px 16px 18px`: H3 16px/600,
body 13px/1.6 `#96a095`. Hover: `translateY(-6px)`, `box-shadow: 0 0 34px
rgba(110,215,150,0.14)`, border accent.

Order (this ordering is intentional — the power-plant CV project sits between T-Bone and
RoboMaster): Proprioceptive Traversal, Patrick, Mobot, Hydrone, T-Bone, **ComputerVision
Solution for Automated Power Plant Inspection** (moved here from Software), Wisconsin
Robotics RoboMaster, E-Ducati-On, Torsobot, Powder Spreader, CORD, WYBot, HOWL.

**Software Projects** — wider cards, `repeat(auto-fill, minmax(400px, 1fr))`. Full-bleed
media at `height: 230px` in a centered flex well with `object-fit: contain` (these are
screenshots; cropping them is wrong), then the title overlaid at the bottom on
`linear-gradient(transparent, rgba(6,10,8,0.93))`, `padding: 16px 18px`, 16px/500. Hover:
border accent only, no lift.

**Free Build Projects** — `minmax(280px, 1fr)`, image `height: 180px` cover, title only.

### Contact

Centered, `max-width: 720px` grid, `margin: 0 auto`. Header block is a centered column:
H2 34px "Contact " + "Me" in accent, a 14.5px `#a9b3a7` lead line (`max-width: 46ch`,
centered — *"Questions, collaborations, or a robot that needs building — send a note and
I'll get back to you."*), then a 56px × 1px `rgba(233,237,232,0.2)` rule. `gap: 12px`,
`margin-bottom: 34px`.

Fields: `repeat(auto-fit, minmax(240px, 1fr))`, `gap: 16px`. Each `padding: 15px 18px`,
14px text, `#141a16` background, 1px `rgba(233,237,232,0.22)` border, `radius: 14px`,
`color: #e9ede8`, placeholder `#7f8a7e`. Full Name, Email, Subject, Phone Number; then a
5-row textarea spanning both columns, `resize: none`. Submit is a centered filled accent
pill, `padding: 14px 34px`, `margin-top: 6px`.

Ambient plants behind it: thistle `right: -40px; bottom: -60px`, 6°, 300px, `opacity: 0.16`,
`sway 21s`; cactus `left: -46px; top: -40px`, -12°, 250px, `opacity: 0.12`, `sway 26s` with a
3s delay.

Keep whatever form backend the current site uses.

### Footer

`#101614`, `padding: 34px 46px 30px`, centered column, `gap: 18px`, top hairline. Social
circles (40px, same treatment as the hero), then a 14px link row (About Me · Projects ·
Contact, `gap: 26px`), then `© David Seong | All Rights Reserved` at 13px `#7f8a7e`.

---

## Screen 2 — Projects index (`projects.html`)

Replaces the current flat list with a filterable index.

**Header band** (bottom hairline, `padding: 60px 46px 40px`, `max-width: 1320px`):
mono eyebrow `<n> projects · <m> categories`, H1 54px "Projects", a 15.5px lead paragraph
(`max-width: 60ch`), then the filter chips.

**Filter chips**: `gap: 10px`, wrapping. Each `padding: 9px 18px; border-radius: 999px;
font-size: 13.5px; cursor: pointer`, with the count appended as an 11px mono span at
`opacity: 0.7`. Inactive: 1px `rgba(233,237,232,0.22)`, transparent fill, `#c3ccc2`.
Active: 1px accent, `rgba(120,215,160,0.14)` fill, `oklch(0.78 0.14 152)`.
Chips: **All · Robotics · Software · Free Build · 3D Printing**. Selecting one shows only
that category's group; All shows every group in order. Pure client-side show/hide — no
routing, no URL state (add `?filter=` if you want it shareable).

Ambient: monstera `right: -70px; top: -70px`, 13°, 420px, `opacity: 0.2`, `sway 17s`; cactus
`left: -30px; bottom: -80px`, -9°, 300px, `opacity: 0.14`, `sway 24s` delay 2s.

**Groups**: for each visible category, a header (H2 32px Newsreader, flex-grow hairline, mono
count right) then a `repeat(auto-fill, minmax(300px, 1fr))` / `gap: 20px` card grid.
`margin-bottom: 56px` between groups.

**Card** (an `<a>`, whole card is the hit target): `#141a16`, hairline, `radius: 16px`.
Image inset `10px 10px 0`, `height: 190px`, cover, `radius: 11px`,
`filter: saturate(0.78) brightness(0.92)`. Body `padding: 14px 16px 18px`: a baseline row
with the 16px/600 title left and a 10px mono accent year right (`white-space: nowrap`,
`gap: 12px`), then 13px/1.6 `#96a095` description. Hover: lift 6px, accent glow shadow,
accent border.

**Links.** Each card points at its existing page under `projects/` — `patrick.html`,
`planning.html`, `jediode.html`, `e_ducati_on.html`, `tbone.html`, `drag.html`,
`robomaster.html`, `torsobot.html`, `pbf.html`, `wybot.html`, `howl.html`,
`pestroleum.html`, `moldex.html`, `unity.html`, `yc-blocks.html`, `azsz1.html`,
`azsz2.html`, `sisyphys.html`, `somek.html`, `gauntlet.html`, `bambu.html`. Simon points at
the new detail page.

**Three mappings in the prototype are guesses and need checking**: Mobot → `cord.html`,
CORD → `laika.html`, Hydrone → `uwd.html`. The filenames in the repo don't obviously match
those project names. Also, `yc-blocks.html` exists but had no entry on the old projects
page, so the prototype invents a card for it (placeholder image and copy) — supply the real
ones or drop it.

Footer identical to Home's.

## Screen 3 — Project detail (`projects/simon.html` and every other project page)

A template. Content max-width **1100px** throughout, `padding: 46px` sides.

1. **Header band** (bottom hairline): a mono back link — `‹ ALL PROJECTS`, 11.5px,
   `letter-spacing: 0.14em`, uppercase, `#8e988d`, accent on hover, `margin-bottom: 26px`;
   a mono accent eyebrow for status/affiliation (`Active · Robomechanics Lab, CMU`); H1 52px
   Newsreader, `max-width: 22ch`; then a wrapping tag row — `padding: 7px 14px` pills, 1px
   `rgba(233,237,232,0.2)`, 12.5px `#c3ccc2`. Ambient linden `right: -60px; top: -60px`, 12°,
   340px, `opacity: 0.16`, `sway 18s`.
2. **Hero figure**: the media in a `#141a16` / hairline / `radius: 18px` / `padding: 14px`
   frame, image `height: 440px` cover, `radius: 12px`, `saturate(0.85)`. Below it a mono
   caption row, `justify-content: space-between`: `FIG. 01 — <what it is>` left, the date
   range right. **On the real site this is the project's video, autoplaying muted and
   looping.**
3. **Spec strip**: `repeat(auto-fit, minmax(240px, 1fr))` with `gap: 1px` over a
   `rgba(233,237,232,0.12)` background and a matching 1px border, `radius: 16px`,
   `overflow: hidden` — the gap shows through as hairline dividers. Each cell `#141a16`,
   `padding: 20px 22px`: a mono accent label (10.5px, `letter-spacing: 0.16em`, uppercase)
   over a 14.5px/1.6 `#dde3dc` value. Four cells for Simon: Platform, Sensing, Goal, Status.
4. **Body**: alternating two-column blocks, `repeat(auto-fit, minmax(300px, 1fr))`,
   `gap: 40px`, `align-items: start`. Text side is H2 32px Newsreader + 15.5px/1.8 `#c3ccc2`
   paragraphs (`margin-bottom: 16px`). Figure side is a `#141a16` framed image with a mono
   caption underneath (`FIG. 02 — …`). The second block sits on a `#101614` band with
   hairlines top and bottom, `padding: 56px 46px`, and puts the figures on the left — that
   alternation is the rhythm of the page. All prose is verbatim from the existing
   `projects/simon.html`.
5. **Similar work**: H2 28px + hairline, then a `repeat(auto-fill, minmax(280px, 1fr))` grid
   of three linked cards — image `height: 160px` cover, H3 15.5px/600, 12.5px/1.6 `#96a095`.
   Hover: lift 6px, accent border.
6. Footer identical to Home's.

## Interactions summary

| Behavior | Trigger | Detail |
|---|---|---|
| Role cycle | 2800ms interval | 4 words, per-word font size, blinking caret |
| Fun fact | click | random pick from existing facts array |
| Carousel auto-advance | 7000ms interval | cleared permanently on any manual nav |
| Carousel nav | arrows, dots | index state, translateX on the track |
| Scroll stem | passive scroll | fill height + per-leaf unfurl at fixed fractions |
| Point cloud | mousemove / mouseleave | 110px repulsion, 190px brighten; RAF gated by IntersectionObserver |
| Category filter | click chip | show/hide groups |
| Card hover | hover | lift, glow, accent border |

All intervals, listeners, the RAF loop and the IntersectionObserver must be torn down on
unload. Respect `prefers-reduced-motion`: disable sway, the point cloud animation (draw one
static frame), the carousel auto-advance and the stem transitions.

## Responsive notes

The prototype was built for desktop. The grids, hero and contact form are already
`auto-fit`/`auto-fill` and reflow on their own. Still needs doing for real mobile:
collapse the left gutter from 76px and hide the scroll stem below ~900px; drop the hero H1
from 62px and the page H1s from 54px; make the carousel slides stack (media over text) below
~760px; reduce the 440px detail hero image; ensure every tap target clears 44px — the 36px
carousel arrows and 40–42px social circles need padding on touch.

## Files in this bundle

```
design/
  Portfolio Home.dc.html    — Home
  Projects Index.dc.html    — Projects index
  Project Detail.dc.html    — Project detail (Simon)
  support.js                — prototype runtime; do not port
assets/
  leafpix_*.png             — the five finished plant cutouts (ship these)
  source_cutouts/leaf_*.png — full-res keyed cutouts, for regeneration
```

Open any `design/*.dc.html` in a browser to see it running. The design files reference
`assets/` paths from the original project — point them at this bundle's `assets/` or the
repo's, as convenient.
