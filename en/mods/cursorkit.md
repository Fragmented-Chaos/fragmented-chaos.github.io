---
layout: page
lang: en
key: cursorkit
title: Cursor Kit
permalink: /en/mods/cursorkit/
---

<div class="mod-hero">
  <img class="mod-icon" src="{{ '/assets/images/cursorkit/icon.png' | relative_url }}" alt="Cursor Kit icon" width="96" height="96">
  <div>
    <p class="mod-tagline">Replaces Minecraft's mouse pointer with custom HD cursors: six states, frame animation, per-state hotspots, and click effects that follow the pack.</p>
    <p class="mod-badges">
      <span class="badge">Minecraft 26.3</span>
      <span class="badge">Fabric · NeoForge · Quilt</span>
      <span class="badge">Client-side only</span>
    </p>
  </div>
  <p class="mod-actions">
    <a class="btn btn-primary" href="https://github.com/Fragmented-Chaos/Cursor-Kit/releases" target="_blank" rel="noopener">Download</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/Cursor-Kit" target="_blank" rel="noopener">Source</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/Cursor-Kit/issues" target="_blank" rel="noopener">Report an issue</a>
  </p>
</div>

Cursor Kit takes over cursor drawing and hides the system cursor, painting the image that matches the current UI state. Which image belongs to which state is decided **entirely by external packs** — resource packs, cursor packs or loose files in the `config` folder — so swapping cursors never means swapping mods or restarting the game.

<div class="mod-toc">
  <p>Contents</p>
  <ul>
    <li><a href="#install">Install</a></li>
    <li><a href="#start">Getting started</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#packs">Authoring cursor packs</a></li>
    <li><a href="#effects">Click effects</a></li>
    <li><a href="#config">Configuration</a></li>
    <li><a href="#states">State resolution</a></li>
    <li><a href="#api">API for other mods</a></li>
    <li><a href="#faq">FAQ</a></li>
  </ul>
</div>

## Install {: #install}

1. Make sure the game is **Minecraft 26.3** on **Fabric**, **NeoForge** or **Quilt** (Quilt runs through its Fabric compatibility layer).
2. Download `cursorkit-<version>-universal.jar` (one jar for all three loaders).
3. Drop it into `.minecraft/mods/`.
4. Launch the game and open **Options → Video Settings → `Cursor`**.

No Fabric API or dependencies. **Nothing to install on the server**: it is client-side, and joining a server without it never errors.

With [Sodium](https://modrinth.com/mod/sodium) installed, Sodium owns the video settings screen — the mod then registers `Cursor` into Sodium's own page list at runtime through its config API, adding a **Cursor Kit** section on the left (with a hand-drawn arrow icon and the mod's gold colour theme) that opens the picker in one click. Mods that replace the video settings screen in other ways (Embeddium, OptiFine, …) fall back to a floating button in the bottom-left corner of the screen, with the same effect.

## Getting started {: #start}

**A fresh install only lists `Default (system cursor)`** (the mod ships no cursor sets). Two ways to add one:

- **Drag it in**: drop a `.zip`, a folder containing `assets/`, or loose PNG/JSON files **straight onto the screen**. Archives and complete folders are installed into `config/cursorkit/packs/`, loose files into `config/cursorkit/`; name collisions never overwrite, they get `-2`, `-3`. The list refreshes immediately and the bottom of the screen reports what was installed.
- **Place it yourself**: put the pack into `config/cursorkit/packs/` (a folder or a `.zip`), or drop the cursor JSON and its PNGs directly into `config/cursorkit/`. The **`Folder`** button in the top-right corner opens that directory for you.

While the screen is open, `config/cursorkit/` (including `packs/`) is watched continuously: any change re-reads and refreshes the list, keeping your search text and selection.

**Controls (same idea as the shader pack selector):**

- **Clicking a list entry selects it and applies it immediately** — no confirm button needed.
- The right side shows the selected set: its origin, **live previews of all six states** (animations play, the red dot marks the hotspot, missing states are tagged `(default)`), and a **looping click-effect preview in the top-right corner**.
- Each list row shows `name`, `origin · state count · effect: …`, with a search box above. The first row is always **`Default (system cursor)`** — selecting it means the mod does not touch the cursor at all.
- The second row is **`Custom (per-state paths)`**, where you can point each state at any local PNG / `.cur` file (see <a href="#custom">Custom cursors</a>).
- Four switches along the bottom: `Animation`, `Click effect`, `Scale`, `Edge margin`.
- Top-right: `Folder` (opens the config directory) and `Hotspots…` (opens the hotspot editor).
- `Done` writes the config, `Cancel` restores the state from when the screen was opened.

<figure class="shot">
  <img src="{{ '/assets/images/cursorkit/picker.png' | relative_url }}" alt="The cursor picker: pack list on the left, six state previews on the right">
  <figcaption>The picker: a searchable pack list on the left (each row shows its origin and effect), the six state previews and per-state hotspots on the right.</figcaption>
</figure>

### Custom cursors {: #custom}

If you would rather use existing images than author a pack, select **`Custom (per-state paths)`** (second row) and click **`Edit paths…`**:

- One row per state; enter an **absolute path** to any local PNG / `.cur` (relative paths resolve against the game directory).
- Each row is validated on the spot: **gold = found**, **red with `?` = not found**, **grey = empty** (empty falls back to `default`). The button also tells you how many paths are invalid.
- The paths live in `custom_states` inside `config/cursorkit.json`, e.g. `{"default": "D:/cursors/arrow.png", "clickable": "hand.cur"}`.

<figure class="shot">
  <img src="{{ '/assets/images/cursorkit/states.png' | relative_url }}" alt="The per-state path editor">
  <figcaption>The per-state path editor: one path per state, gold when found and red with a question mark when not.</figcaption>
</figure>

### Per-state hotspot editor {: #hotspots}

**Hotspots do not have to be hardcoded in JSON.** Click **`Hotspots…`** in the top-right corner of the picker to open a dedicated editor: every state of that set with its current value on the left (changed ones in gold), a magnified image with a pixel grid on the right.

- **Click or drag** on the image to put the hotspot on that pixel; the **arrow keys** nudge it one pixel at a time.
- `Center` jumps to the middle of the image, `Reset` drops that one change and returns to the value shipped by the set.
- Edits apply **live** (the real cursor follows along). `Done` writes them to `hotspots` in `config/cursorkit.json`, `Cancel` reverts everything.

Because this edits your config rather than the pack itself, **sets that live inside resource packs can be adjusted the same way** without touching somebody else's files. A state without its own image (say `text (default)`) borrows the `default` image, but its **hotspot is independent** — changing one never moves another.

<figure class="shot">
  <img src="{{ '/assets/images/cursorkit/hotspots.png' | relative_url }}" alt="The hotspot editor: state list on the left, magnified image with pixel grid on the right">
  <figcaption>The hotspot editor: click or drag to move it, arrow keys to fine-tune — every change applies instantly.</figcaption>
</figure>

## Features {: #features}

<ul class="feature-grid">
  <li class="feature">
    <h3>Six cursor states</h3>
    <p>Default arrow / clickable hand / text I-beam / dragging / busy / disabled, switched automatically by UI context.</p>
  </li>
  <li class="feature">
    <h3>HD cursors</h3>
    <p>One image pixel equals one physical screen pixel, exactly like the system cursor. 16×16 is the normal size; 32×32, 64×64 and 128×128 get progressively larger and sharper, and stay native on 4K.</p>
  </li>
  <li class="feature">
    <h3>Never interpolated</h3>
    <p>Drawn at integer multiples of the image's own pixels (1:1, or integer-upscaled when under 16 GUI units), so nothing is ever blurry.</p>
  </li>
  <li class="feature">
    <h3>Per-state hotspots</h3>
    <p>The click point defaults to the top-left corner and can be set in the set's JSON, or picked by clicking, dragging and nudging right inside the UI.</p>
  </li>
  <li class="feature">
    <h3>Three origins, clear priority</h3>
    <p>Loose files in <code>config/cursorkit/</code> &gt; cursor packs in <code>config/cursorkit/packs/</code> &gt; resource packs. The UI labels where each set came from.</p>
  </li>
  <li class="feature">
    <h3>Click effects that travel with the pack</h3>
    <p>Ripple, particle burst, pulse dot — or a custom animated strip shipped by the pack itself. Change packs, change the feedback; switch it off if you like.</p>
  </li>
  <li class="feature">
    <h3>Drag and drop install</h3>
    <p>Archives, folders and loose images can be dropped straight onto the screen: filed automatically, never overwriting, list refreshed at once.</p>
  </li>
  <li class="feature">
    <h3><code>.cur</code> support</h3>
    <p>Drop a Windows cursor file into <code>config/cursorkit/</code> or a cursor pack and its image and built-in hotspot are read automatically (resource packs must ship PNG).</p>
  </li>
</ul>

## Authoring cursor packs {: #packs}

A cursor set is **one JSON file plus its textures**. Three places to put it:

```
Resource pack:  resourcepacks/<pack>/            or <pack>.zip
Cursor pack:    config/cursorkit/packs/<pack>/   or <pack>.zip
                └─ both use exactly the same layout:
                   assets/<namespace>/cursor/<set>.json
                   assets/<namespace>/textures/cursor/<texture>.png

Loose set:      config/cursorkit/<set>.json
                config/cursorkit/<texture>.png   (texture paths are relative to this folder)
```

**One pack, two identities**: the layout matches a resource pack, so the same pack can go into `resourcepacks/` (enable it there) or into `config/cursorkit/packs/` (read directly by the mod, always on). `pack.mcmeta` is only needed for the resource pack route.

The file name (minus `.json`) is the set's **id** and decides overriding; the `name` inside the JSON is only a display name.

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
    }
}
```

| Field | Required | Default | Meaning |
|-------|----------|---------|---------|
| `states.<state>.texture` | ✅ | — | Texture path, relative to `textures/cursor/` (resource / cursor packs) or to `config/cursorkit/` (loose set). **PNG** and **`.cur`** are supported (Windows cursor files: image and built-in hotspot are read automatically) |
| `states.<state>.hotspot` | | `[0, 0]` | Click point in **image pixels**, can differ per state. When omitted, `.cur` uses the hotspot stored in the file and other formats use the top-left corner |
| `states.<state>.frames` | | `1` | Number of frames in a horizontal strip; more than 1 makes it animated |
| `states.<state>.frame_ms` | | `100` | Milliseconds per frame, minimum 1 |
| `name` | | same as id | Display name only, never used for overriding |
| `scale` | | `1` | Extra integer scale for this set |

**Rules and requirements**

- Every frame must be **square**; resolution decides both sharpness and size. Hotspots are given in image pixels.
- Animation frames must sit on **one row**, image width = `frames × frame height`. If `frames` disagrees with the image, the image wins and a note is written to the log.
- A missing state **falls back to `default`**, which is therefore the only required state.
- Unknown state names, wrong types and a missing `default` are **skipped one by one with a log entry** — they never break the whole mod.
- `.cur` works **only in `config/cursorkit/` and cursor packs**: Minecraft's own resource pack loader understands PNG only, so ship PNG inside resource packs.

**Working examples**: the repository's `examples/` folder has the same assets in four shapes you can copy from — the same resource pack as a folder and as a zip, the `config/` layout (including a folder pack and a zip pack), a complete six-state set, a two-state animated set, 32×32 and 64×64 HD sets, and the ClickFX pack with click effects.

## Click effects {: #effects}

`click_effect` is an optional block in the cursor set JSON and **travels with the pack**: a different pack gives you different click feedback. Each mouse press spawns the effect **at the click position** (the cursor itself never moves, so aiming is unaffected).

```json
"click_effect": {
    "type": "ripple",
    "color": "#FFD479",
    "radius": 15,
    "duration_ms": 450,
    "particles": 6
}
```

| `type` | Effect |
|--------|--------|
| `ripple` | Expanding ring plus a few particles (default) |
| `burst` | Particles only, bursting outwards |
| `pulse` | A solid dot that flashes in place |
| `image` | **Custom animation from the pack**: a horizontal frame strip played at the click position |
| `none` | No effect for this pack |

| Field | Default | Meaning |
|-------|---------|---------|
| `color` | gold | Any RGB: `#RRGGBB`, `RRGGBB` or a decimal number |
| `radius` | `15` | How far it spreads (GUI units) |
| `duration_ms` | `450` | Lifetime; for `image` the animation's own length is used when omitted |
| `particles` | `6` | Particle count (used by `ripple` / `burst`) |
| `texture` / `frames` / `frame_ms` / `size` | — | `image` only: strip path (relative to `textures/cursor/`), frame count, frame duration, drawn edge length |

- Every field is optional; leave the whole `click_effect` block out and the mod's own ripple is used.
- For `image`, the fade-out must be **drawn into the artwork** — texture drawing cannot fade the whole thing.
- The `Click effect` switch at the bottom of the screen is the master switch; with it off no pack plays anything. It also plays for `Default (system cursor)`, so even the vanilla cursor gets click feedback.

## Configuration {: #config}

The config lives in `config/cursorkit.json` (created on first launch):

```json
{
  "enabled": true,
  "selected_set": "",
  "scale": 1,
  "animate": true,
  "click_effect": true,
  "edge_margin": 2
}
```

| Field | Default | Meaning |
|-------|---------|---------|
| `enabled` | `true` | Master switch; when off the system cursor is fully restored |
| `selected_set` | `""` | Id of the current set (file name without extension). **Empty = system cursor**; if it points at a deleted set the loader falls back to the first available one |
| `scale` | `1` | Extra integer scale, multiplied with the set's own `scale` |
| `animate` | `true` | When off the cursor is **pinned to the static `default` image**: no state switching and no animation |
| `click_effect` | `true` | Master switch for click effects (a boolean) |
| `edge_margin` | `2` | How many pixels from the window edge the mod hands the cursor back, so you can always find the mouse |
| `custom_states` | none | Per-state custom image paths — the UI's `Custom (per-state paths)` entry |
| `custom_effect` | ripple | The handmade set's own click effect; same syntax as a pack's `click_effect` |
| `hotspots` | none | Click points changed in the hotspot editor, shaped `{"set-id": {"state": [x, y]}}` |

## State resolution {: #states}

| State | Shown when | Source |
|-------|-----------|--------|
| `drag` | Dragging with the left button held (items, sliders) | Vanilla `Screen#isDragging` / left button down |
| `text` | A text field or sign editor has focus | Vanilla `IBEAM` request |
| `busy` | A loading overlay is present | Non-empty GUI overlay |
| `disabled` | Hovering an unavailable widget | Vanilla `NOT_ALLOWED` request |
| `clickable` | Hovering a clickable widget or a resizable edge | Vanilla `POINTING_HAND` / `RESIZE_*` requests |
| `default` | Everything else | — |

Priority: `drag > text > busy > disabled > clickable > default`.

Since Minecraft 26.3 requests a cursor type for every widget, this works **in every mod's UI automatically**; Cursor Kit only adds what vanilla cannot express (dragging and loading) plus the override hook below.

Two edge behaviours: **while in-game with the camera locked the cursor is not taken over at all**, and pushing the pointer to the very edge of the window brings the system cursor back (`edge_margin` controls how wide that band is).

## API for other mods {: #api}

```java
CursorStateProviders.register((screen, mouseX, mouseY, context) -> {
    if (screen instanceof MySpecialScreen) {
        return CursorState.DRAG;   // force this state for the frame
    }
    return null;                    // fall back to the built-in resolution
});
```

Providers are asked in registration order and the first non-`null` answer wins; `context` exposes the vanilla request type, whether a drag is in progress and whether the game is busy. The model classes (`CursorState`, `CursorSet`, …) are free of Minecraft types, which keeps them easy to write against and easy to test.

## FAQ {: #faq}

**I installed the mod but the cursor did not change.**
Is the selected entry `Default (system cursor)`? Is `enabled` in `config/cursorkit.json` set to `false`? And check that there is anything to pick at all — a fresh install has no packs, so put one into `config/cursorkit/packs/` and it will show up.

**The cursor is blurry / not sharp enough.**
The mod draws at integer scale without interpolation, so **the artwork's resolution is the ceiling on sharpness**. Use 32×32, 64×64 or 128×128 images instead of upscaling a 16×16 one.

**Cursors from my resource pack do not appear.**
Resource packs must be **enabled in the resource pack screen** before they are loaded. If you would rather not do that every time, put the very same pack into `config/cursorkit/packs/` — identical layout, read directly by the mod, always on.

**I lost the mouse.**
Push the pointer to the very edge of the window and the system cursor comes back; the `edge margin` switch (`edge_margin`) widens that band, and you can always select `Default (system cursor)` in the list.

**No click effect shows up.**
The `Click effect` switch at the bottom of the screen is the master switch, and an individual pack can turn effects off with `"type": "none"` in its JSON.

**Do I need it on the server?**
No. It is a client-side mod; installing it on a server does nothing, and joining a server without it does not error.

**Does it work on NeoForge / Quilt?**
Yes. The `universal.jar` covers all three loaders — Fabric and Quilt share one jar (Quilt through its Fabric compatibility layer). NeoForge has no Mod Menu, so the mod list comes from NeoForge itself, but the in-game entry (`Cursor` in video settings) is identical.

**How do I keep the custom cursor from turning back into the system cursor?**
Near the window edge the mod deliberately hands the cursor back (`edge_margin`, 2 pixels by default) so the mouse never gets stuck at the border. Set `edge margin` to `0` to keep the custom cursor everywhere.

Licensed under **LGPL-3.0** · current version **0.1.0+26.3**.
