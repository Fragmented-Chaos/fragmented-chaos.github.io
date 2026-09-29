---
layout: page
lang: en
key: cursorkit_packs
title: Authoring cursor packs
permalink: /en/mods/cursorkit/packs/
---

<p class="mods-others"><a href="{{ '/en/mods/cursorkit/' | relative_url }}">← Cursor Kit guide</a></p>

Just follow along — you can have your own cursor in about ten minutes. No coding involved.

## What you need

- A **square PNG image** (transparent background, 32×32 pixels is a good size)
- Any drawing program (Aseprite, Photoshop, GIMP, even Paint)
- A text editor for one small text file (you can copy the contents below)

## Step 1: Turn one image into a cursor

1. Copy your PNG into the game's `config/cursorkit/` folder
2. Rename it to `my_arrow.png` — **lowercase letters, digits and underscores only**, no spaces or non-English characters
3. In game, open **Options → Video Settings → `Cursor`**
4. `my_arrow` shows up in the list; click it once

Every cursor in the game is now that image (all six states use it).

> Cannot find `config/cursorkit/`? Click the **`Folder`** button in the top-right corner of the cursor screen and it opens for you.

## Step 2: Give different states different images

A cursor is not just one picture: hover a button and it becomes a hand, click into a text box and it becomes an I-beam. Those are **states**, and there are six:

| State | When it shows |
|-------|---------------|
| `default` | The rest of the time (**required**) |
| `clickable` | Hovering something clickable, like a button |
| `text` | Typing in a text field or a sign |
| `drag` | Holding the left button while dragging |
| `disabled` | Hovering a greyed-out, unavailable button |
| `busy` | While the game is loading |

To use a different image per state:

1. Draw the extra images and put them in `config/cursorkit/` too
2. Create a text file in the same folder named `my_arrow.json` (**same name as your PNG**, with a `.json` extension)
3. Copy this in and change the file names to yours:

```json
{
    "states": {
        "default":   { "texture": "my_arrow.png" },
        "clickable": { "texture": "my_hand.png" },
        "text":      { "texture": "my_ibeam.png" },
        "drag":      { "texture": "my_fist.png" },
        "disabled":  { "texture": "my_gray.png" }
    }
}
```

4. Save and go back to the game — the list **refreshes by itself, no restart needed**. Click your set and the six previews appear on the right.

A state you leave out (here `busy`) simply uses the `default` image, so `default` is the only one you must write.

## Step 3: Put the click point in the right place

Only one pixel actually clicks, and that pixel is called the **hotspot**. It defaults to the **top-left corner**, which is right for an arrow but wrong for a hand or an I-beam.

No need to count pixels: click **`Hotspots…`** in the top-right of the cursor screen, then **click or drag** on the magnified image to set it. The arrow keys nudge one pixel at a time; `Done` saves it. This only changes your config, never someone else's pack.

## Step 4: Make the loading state spin (optional)

An animation is **several frames laid out side by side in one image**. For example eight 32×32 spinner frames become one **256×32** image (width = frames × height).

Add two numbers to that state in the JSON:

```json
"busy": { "texture": "my_spinner.png", "frames": 8, "frame_ms": 80 }
```

- `frames` = how many frames
- `frame_ms` = how long each frame stays (80 is about 12 frames per second)

Two rules: **every frame is square**, and **all frames must sit in one row**.

## Step 5: Add a click effect (optional)

To make clicking feel good, add one line:

```json
"click_effect": { "type": "ripple", "color": "#FFD479" }
```

| `type` | What happens when you click |
|--------|-----------------------------|
| `ripple` | A ring spreads out (the usual choice) |
| `burst` | A burst of particles |
| `pulse` | A quick flash in place |
| `image` | Plays an animation you drew (see below) |
| `none` | No effect |

Add `"radius": 15`, `"duration_ms": 450`, `"particles": 6` to tune size, lifetime and particle count; anything you leave out uses the default.

**Using your own animation**: make it the same kind of horizontal strip and write:

```json
"click_effect": { "type": "image", "texture": "my_ring.png", "frames": 6, "frame_ms": 60, "size": 24 }
```

`size` is how big it is drawn (in screen pixels), and the fade-out has to be **drawn into the artwork**.

## Step 6: Pack it up to share

To hand it to someone else, make it a **cursor pack**: a folder (or a zip) with a fixed layout:

```
mypack/                                  ← the pack folder, any name
└── assets/
    └── mypack/                          ← any name, just be consistent
        ├── cursor/
        │   └── my_arrow.json            ← your JSON
        └── textures/
            └── cursor/
                ├── my_arrow.png         ← your images
                └── my_hand.png
```

Inside the JSON, paths are **relative to `textures/cursor/`**: in the example above write `"texture": "my_arrow.png"`. If you keep images in a subfolder like `cursor/arrow/`, write `"texture": "arrow/my_arrow.png"`.

Then put the `mypack` folder into `config/cursorkit/packs/`, or simply **drag it onto the game screen** to install it.

To make a zip: **the first level inside the zip must be `assets/`**. Do not wrap the `mypack` folder again (one wrapping folder is tolerated, two are not).

```
mypack.zip
└── assets/...        ✓ correct
```

> The same pack also works as a resource pack: drop it into `resourcepacks/` and enable it in the resource pack screen (that route needs a `pack.mcmeta`, which you can copy from `examples/`). Resource packs accept **PNG only** — `.cur` works in cursor packs.

## When something is wrong

| What you see | Why |
|--------------|-----|
| My cursor is not in the list | File name has uppercase or non-English characters, or it is not in `config/cursorkit/`, or `default` is missing from the JSON (that set is skipped, and the log says so) |
| Only `default` shows my image, the others look wrong | States you did not write fall back to the `default` image — that is intended |
| The cursor is huge or blurry | Resolution sets both sharpness and size. 16×16 is normal; draw 32×32 / 64×64 for more detail, do not upscale a small image |
| The animation does not move | Frames must be in **one row** and the image width must equal `frames × frame height`; if `frames` disagrees, the image wins |
| Clicks land in the wrong spot | Fix it with `Hotspots…` instead of computing coordinates |
| Nothing happens in `resourcepacks/` | Resource packs must be enabled in the resource pack screen; `config/cursorkit/packs/` is always on |

## All fields at a glance

| Field | Required | Default | Meaning |
|-------|----------|---------|---------|
| `states.default.texture` | **yes** | — | Image path. Relative to `config/cursorkit/` for a loose set, or to `textures/cursor/` inside a pack |
| `states.<other>.texture` | no | the `default` image | The six states: `clickable` `text` `drag` `disabled` `busy` |
| `hotspot` | no | top-left `[0, 0]` | Click point in **image pixels**, written `[x, y]`; `.cur` files use their own |
| `frames` | no | `1` | Animation frame count |
| `frame_ms` | no | `100` | Milliseconds per frame |
| `name` | no | the file name | Display name only |
| `scale` | no | `1` | Extra integer upscale |
| `click_effect` | no | the mod's ripple | See step 5 |

## Copy a ready-made pack

The repository's `examples/` folder already contains working packs — copy one and swap the images:

- `CursorKit-Test-Pack/` — a complete six-state example, plus 32×32 and 64×64 HD ones
- `ClickFX-Cursor-Pack/` — three click effects and a pack with its own animated strip
- `config-cursorkit/` — a ready-to-copy folder layout for `config/`
