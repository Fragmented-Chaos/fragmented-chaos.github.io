---
layout: mod
lang: en
key: safespawn
title: SafeSpawn
permalink: /en/mods/safespawn/
card_mc: "1.21.4–1.21.11, 26.1–26.3"
card_loaders: "Fabric · NeoForge · Quilt"
card_requires: "None"
card_license: "MIT"
---

<div class="mod-hero">
  <img class="mod-icon" src="{{ '/assets/images/safespawn/icon.png' | relative_url }}" alt="SafeSpawn icon" width="96" height="96">
  <div>
    <p class="mod-tagline">Brings back the old behaviour for fall damage on relog, and fixes the missing spawn invulnerability.</p>
  </div>
  <p class="mod-actions">
    <a class="btn btn-primary" href="https://modrinth.com/mod/safespawn" target="_blank" rel="noopener">Modrinth</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/SafeSpawn" target="_blank" rel="noopener">Source</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/SafeSpawn/issues" target="_blank" rel="noopener">Report an issue</a>
  </p>
</div>

## What it fixes

| Vanilla issue | Behaviour now |
|---------------|---------------|
| **MC-212** / **MC-21650** | Leaving and rejoining grants fall-damage immunity — falling from a height and relogging no longer kills you |
| **MC-278261** | Respawning grants invulnerability again |

Both were changed in 24w45a; SafeSpawn restores the earlier behaviour.

## Configuration

The config lives in `config/safespawn.properties`:

```properties
# Invulnerability duration in game ticks (20 ticks = 1 second)
invulnerableTicks=60
# Grant invulnerability when respawning after death
enableRespawnImmunity=true
# Grant invulnerability when logging in / rejoining
enableLoginImmunity=true
```

| Field | Default | Meaning |
|-------|---------|---------|
| `invulnerableTicks` | `60` | How long the immunity lasts, in game ticks (20 ticks = 1 second, so 60 = 3 seconds) |
| `enableRespawnImmunity` | `true` | Grant immunity when respawning after death |
| `enableLoginImmunity` | `true` | Grant immunity when logging in / rejoining |

