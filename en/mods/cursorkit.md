---
layout: mod
lang: en
key: cursorkit
title: Cursor Kit
permalink: /en/mods/cursorkit/
modrinth: ""
curseforge: ""
curseforge_id: ""
card_mc: "26.3"
card_loaders: "Fabric · NeoForge · Quilt"
card_requires: "None (client-side)"
card_license: "LGPL-3.0"
---

<div class="mod-hero">
  <img class="mod-icon" src="{{ '/assets/images/cursorkit/icon.png' | relative_url }}" alt="Cursor Kit icon" width="96" height="96">
  <div>
    <p class="mod-tagline">Replaces Minecraft's mouse pointer with custom HD cursors: six states, frame animation, per-state hotspots, and click effects that follow the pack.</p>
  </div>
  <p class="mod-actions">
    <a class="btn btn-primary" href="https://github.com/Fragmented-Chaos/Cursor-Kit/releases" target="_blank" rel="noopener">Download</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/Cursor-Kit" target="_blank" rel="noopener">Source</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/Cursor-Kit/issues" target="_blank" rel="noopener">Report an issue</a>
  </p>
</div>

Every state's image comes from an external pack — resource packs, cursor packs or loose files in the `config` folder — so swapping cursors never means swapping mods or restarting the game.

<div class="mod-toc">
  <p>Contents</p>
  <ul>
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

<a id="start"></a>
## Getting started

**A fresh install has no cursor sets at all** — the list holds just `Default (system cursor)` and `Custom (per-state paths)`. Drop a cursor pack in and the rest appear:

- **Drag it in**: drop a `.zip`, a folder containing `assets/`, or loose PNG/JSON files onto the screen (name collisions get `-2`)
- **Place it yourself**: cursor packs go into `config/cursorkit/packs/` (folder or `.zip`), loose JSON + PNGs into `config/cursorkit/`

`config/cursorkit/` (including `packs/`) is watched continuously: any change re-reads and refreshes the list, keeping your search text and selection.

Controls:

- **Clicking a list entry selects and applies it immediately**
- Each row shows `name · origin · states · effect`, with a search box above; the first row is `Default (system cursor)`, the second is [`Custom (per-state paths)`](#custom)
- The right side previews all six states live (red dot = hotspot, missing states tagged `(default)`) plus a looping click-effect preview
- Bottom switches: `Animation`, `Click effect`, `Scale`, `Edge margin`; top-right: `Folder` and `Hotspots…`
- `Done` saves, `Cancel` restores the state from when the screen was opened

<figure class="shot">
  <img src="{{ '/assets/images/cursorkit/picker.png' | relative_url }}" alt="The cursor picker: pack list on the left, six state previews on the right">
  <figcaption>The picker: a searchable pack list on the left (each row shows its origin and effect), the six state previews and per-state hotspots on the right.</figcaption>
</figure>

<a id="custom"></a>
### Custom cursors

If you would rather use existing images than author a pack, select **`Custom (per-state paths)`** (second row) and click **`Edit paths…`**:

- One row per state; enter an **absolute path** to any local PNG / `.cur` (relative paths resolve against the game directory).
- Each row is validated on the spot: **gold = found**, **red with `?` = not found**, **grey = empty** (empty falls back to `default`). The button also tells you how many paths are invalid.
- The paths live in `custom_states` inside `config/cursorkit.json`, e.g. `{"default": "D:/cursors/arrow.png", "clickable": "hand.cur"}`.

<figure class="shot">
  <img src="{{ '/assets/images/cursorkit/states.png' | relative_url }}" alt="The per-state path editor">
  <figcaption>The per-state path editor: one path per state, gold when found and red with a question mark when not.</figcaption>
</figure>

<a id="hotspots"></a>
### Per-state hotspot editor

**Hotspots do not have to be hardcoded in JSON.** Click **`Hotspots…`** in the top-right corner of the picker to open a dedicated editor: every state of that set with its current value on the left (changed ones in gold), a magnified image with a pixel grid on the right.

- **Click or drag** on the image to put the hotspot on that pixel; the **arrow keys** nudge it one pixel at a time.
- `Center` jumps to the middle of the image, `Reset` drops that one change and returns to the value shipped by the set.
- Edits apply **live** (the real cursor follows along). `Done` writes them to `hotspots` in `config/cursorkit.json`, `Cancel` reverts everything.

Because this edits your config rather than the pack itself, **sets that live inside resource packs can be adjusted the same way** without touching somebody else's files. A state without its own image (say `text (default)`) borrows the `default` image, but its **hotspot is independent** — changing one never moves another.

<figure class="shot">
  <img src="{{ '/assets/images/cursorkit/hotspots.png' | relative_url }}" alt="The hotspot editor: state list on the left, magnified image with pixel grid on the right">
  <figcaption>The hotspot editor: click or drag to move it, arrow keys to fine-tune — every change applies instantly.</figcaption>
</figure>

<a id="features"></a>
## Features

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

<a id="packs"></a>
## Authoring cursor packs

A cursor set is one JSON file plus its textures. For a quick look: drop a 32×32 PNG into `config/cursorkit/` and it works, then add a JSON file with the same name for the other states.

```
Resource pack:  resourcepacks/<pack>/            or <pack>.zip
Cursor pack:    config/cursorkit/packs/<pack>/   or <pack>.zip
Loose set:      config/cursorkit/<set>.json
```

Resource packs and cursor packs share the same internal layout (`assets/<namespace>/cursor/<set>.json` + `textures/cursor/<texture>`), so one pack works as both; only the resource pack route needs `pack.mcmeta`. The file name (minus the extension) is the set's **id** and decides overriding.

**The full field table, image rules, hotspots, animation and effect parameters live in [Authoring cursor packs]({{ '/en/mods/cursorkit/packs/' | relative_url }})**; the repository's `examples/` folder has packs to copy from.

<a id="effects"></a>
## Click effects

`click_effect` is an optional block in the cursor set JSON and **travels with the pack**: a different pack gives different click feedback. Each press spawns the effect **at the click position**; the cursor itself never moves, so aiming is unaffected.

| `type` | Effect |
|--------|--------|
| `ripple` | Expanding ring plus a few particles (default) |
| `burst` | Particles only, bursting outwards |
| `pulse` | A solid dot that flashes in place |
| `image` | **Custom animation from the pack**: a horizontal strip played at the click position |
| `none` | No effect for this pack |

Colour, radius, duration, particle count and the `image` strip parameters are in [Authoring cursor packs]({{ '/en/mods/cursorkit/packs/' | relative_url }}). The `Click effect` switch at the bottom of the screen is the master switch, and it also plays for `Default (system cursor)`.

<a id="config"></a>
## Configuration

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
| `selected_set` | `""` | Id of the current set (file name without extension). **Empty = system cursor**; if it points at a deleted set the cursor is handed back to the system instead of jumping to another set |
| `scale` | `1` | Extra integer scale, multiplied with the set's own `scale` |
| `animate` | `true` | When off the cursor is **pinned to the static `default` image**: no state switching and no animation |
| `click_effect` | `true` | Master switch for click effects (a boolean) |
| `edge_margin` | `2` | How many pixels from the window edge the mod hands the cursor back, so you can always find the mouse |
| `custom_states` | none | Per-state custom image paths — the UI's `Custom (per-state paths)` entry |
| `custom_effect` | ripple | The handmade set's own click effect; same syntax as a pack's `click_effect` |
| `hotspots` | none | Click points changed in the hotspot editor, shaped `{"set-id": {"state": [x, y]}}` |

<a id="states"></a>
## State resolution

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

<a id="api"></a>
## API for other mods

```java
CursorStateProviders.register((screen, mouseX, mouseY, context) -> {
    if (screen instanceof MySpecialScreen) {
        return CursorState.DRAG;   // force this state for the frame
    }
    return null;                    // fall back to the built-in resolution
});
```

Providers are asked in registration order and the first non-`null` answer wins; `context` exposes the vanilla request type, whether a drag is in progress and whether the game is busy. The model classes (`CursorState`, `CursorSet`, …) are free of Minecraft types, which keeps them easy to write against and easy to test.

<a id="faq"></a>
## FAQ

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
Yes. One jar covers all three loaders — Fabric and Quilt share it (Quilt through its Fabric compatibility layer). NeoForge has no Mod Menu, so the mod list comes from NeoForge itself.

**How do I keep the custom cursor from turning back into the system cursor?**
Near the window edge the mod deliberately hands the cursor back (`edge_margin`, 2 pixels by default) so the mouse never gets stuck at the border. Set `edge margin` to `0` to keep the custom cursor everywhere.

