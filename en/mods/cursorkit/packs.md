---
layout: page
lang: en
key: cursorkit_packs
title: Authoring cursor packs
permalink: /en/mods/cursorkit/packs/
---

<p class="mods-others"><a href="{{ '/en/mods/cursorkit/' | relative_url }}">← Cursor Kit guide</a></p>

A cursor pack is one JSON file plus a few images. The quickest route: start with a single PNG, then add states, animation and effects.

## 1. Smallest working pack {: #minimal}

Drop one 32×32 PNG into `config/cursorkit/` and you have a set with only the `default` state:

```
config/cursorkit/my_cursor.png      ← one file is enough (the file name is the set id)
```

Open the picker and `my_cursor` is in the list. Add a JSON file with the same name when you want more states.

## 2. Where packs live {: #layout}

```
Resource pack:  resourcepacks/<pack>/            or <pack>.zip
Cursor pack:    config/cursorkit/packs/<pack>/   or <pack>.zip
Loose set:      config/cursorkit/<set>.json
                config/cursorkit/<texture>.png
```

Resource packs and cursor packs use **exactly the same internal layout**, only the entry point differs:

```
assets/<namespace>/cursor/<set>.json
assets/<namespace>/textures/cursor/<texture>.png
```

| | `pack.mcmeta` | Must be enabled in the resource pack screen | `.cur` support |
|---|---|---|---|
| Resource pack (`resourcepacks/`) | required | yes | no, PNG only |
| Cursor pack (`config/cursorkit/packs/`) | not needed | no, always on | yes |
| Loose set (`config/cursorkit/`) | not needed | no | yes |

**One pack, two identities**: the identical layout means a pack works both as a resource pack and inside `config/cursorkit/packs/`. Keep file names **lowercase letters, digits and underscores** (Minecraft resource paths reject uppercase), and both uses keep working.

A cursor pack can be a folder or a `.zip`; a zip with **one extra wrapping folder** is still recognised, but do not nest two.

## 3. The set JSON {: #json}

```json
{
    "name": "Demo Set",
    "scale": 1,
    "states": {
        "default":   { "texture": "demo/arrow.png", "hotspot": [0, 0] },
        "clickable": { "texture": "demo/hand.png",  "hotspot": [7, 1] },
        "text":      { "texture": "demo/ibeam.png", "hotspot": [7, 7] },
        "drag":      { "texture": "demo/fist.png",  "hotspot": [7, 5] },
        "disabled":  { "texture": "demo/disabled.png" },
        "busy":      { "texture": "demo/spinner.png", "frames": 8, "frame_ms": 80 }
    },
    "click_effect": { "type": "ripple", "color": "#FFD479" }
}
```

| Field | Required | Default | Meaning |
|-------|----------|---------|---------|
| `states.<state>.texture` | ✅ | — | Path relative to `textures/cursor/` (resource / cursor packs) or to `config/cursorkit/` (loose set). PNG or `.cur` |
| `states.<state>.hotspot` | | `.cur` uses the file's own hotspot, others `[0, 0]` | Click point in **image pixels** |
| `states.<state>.frames` | | `1` | Frames in a horizontal strip; above 1 makes it animated |
| `states.<state>.frame_ms` | | `100` | Milliseconds per frame, minimum 1 |
| `name` | | file name | Display only |
| `scale` | | `1` | Extra integer scale |
| `click_effect` | | ripple | See section 6 |

The six states: `default` (required), `clickable`, `text`, `drag`, `disabled`, `busy`.

**Fallback and tolerance**: a state you leave out uses the `default` image (its hotspot stays independent); unknown state names, wrong types and a missing `default` only **skip that one entry with a log line**, they never break the whole pack.

## 4. Image rules {: #images}

- **Every frame is square**, either one image per frame or one horizontal strip (width = frames × frame height).
- **One image pixel = one physical screen pixel**, drawn at integer scale with no interpolation. Resolution is therefore both sharpness and size: 16×16 is a normal cursor, 32 / 64 / 128 get progressively larger and sharper.
- Transparent background; save as **8-bit RGBA PNG**.
- Animation frames must sit on **one row**; if `frames` disagrees with the image, the image wins and a note goes to the log.
- Windows `.cur` files work as-is — real size and the file's own hotspot are used — but only in `config/cursorkit/` or a cursor pack.

## 5. Hotspots {: #hotspots}

The hotspot is the pixel that actually clicks, given in **image pixels**, and it can differ per state. Typical choices:

| State | Where to put it |
|-------|-----------------|
| `default` / `clickable` | The **tip** of the arrow (`[0, 0]` if it points to the top-left corner) |
| `text` | Dead centre of the I-beam |
| `drag` | The palm of the grabbing hand |
| `disabled` | Same as `default`, so the feel does not jump |

Do not want to compute coordinates? Put any value in, then click **`Hotspots…`** in the picker, adjust on the magnified image with clicks, drags or the arrow keys, and hit `Done` — it is written to `config/cursorkit.json`. Out-of-range values are reported in the log.

## 6. Click effects {: #effects}

```json
"click_effect": {
    "type": "ripple",
    "color": "#FFD479",
    "radius": 15,
    "duration_ms": 450,
    "particles": 6
}
```

| `type` | Effect | Fields used |
|--------|--------|-------------|
| `ripple` | Expanding ring plus particles (default) | `color` `radius` `duration_ms` `particles` |
| `burst` | Particles only, bursting outwards | `color` `radius` `duration_ms` `particles` |
| `pulse` | A solid dot flashing in place | `color` `radius` `duration_ms` |
| `image` | **Frame strip shipped by the pack**, played at the click position | `texture` `frames` `frame_ms` `size` |
| `none` | No effect for this pack | — |

- `color` is any RGB (`#RRGGBB`, `RRGGBB` or decimal), `radius` the spread in GUI units, `duration_ms` the lifetime, `particles` the particle count.
- For `image`, `texture` is relative to `textures/cursor/` and `size` is the drawn edge length in GUI units; omit `duration_ms` and the animation's own length is used.
- For `image` the **fade-out must be drawn into the artwork** — texture drawing cannot fade the whole thing.
- Leave the whole `click_effect` block out and the mod's own ripple is used.

## 7. Packaging and install {: #package}

```bash
# Correct: the zip root is the pack root (assets/ at the top level)
cd MyPack && zip -r ../MyPack.zip assets pack.mcmeta

# Also fine: one wrapping folder inside the zip
zip -r MyPack.zip MyPack
```

Three ways to install: drag it onto the screen, put it in `config/cursorkit/packs/`, or put it in `resourcepacks/` and enable it in the resource pack screen.

## 8. Pre-release checklist {: #checklist}

- [ ] `default` exists and the JSON parses (no "skipped" line for this pack in the log)
- [ ] Every frame is square and animation frames share one row
- [ ] All six states look right in the preview pane (missing ones show `(default)` — make sure that is intended)
- [ ] Hotspots line up: click a button in game and check where the effect appears
- [ ] File names are lowercase and `pack.mcmeta` is copied from `examples/` (`min_format` 84 / `max_format` 999)
- [ ] The click-effect preview (top-right of the detail pane) shows what you want
- [ ] If it should double as a resource pack, drop it into `resourcepacks/` and verify again

## 9. Working examples {: #examples}

The repository's `examples/` folder has the same assets in several shapes — copy one and edit:

- `CursorKit-Test-Pack/` and `CursorKit-Test-Pack.zip`: one resource pack as a folder and as a zip, with a complete six-state `demo`, a two-state animated `packtest`, and 32×32 / 64×64 HD sets
- `ClickFX-Cursor-Pack/`: three packs using `ripple` / `burst` / `pulse`, plus a set with its own `image` animation
- `config-cursorkit/`: copy into `config/` as-is — a loose set plus one folder pack and one zip pack
