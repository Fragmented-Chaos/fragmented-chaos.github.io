---
layout: page
lang: en
key: charmofundying
title: "Charm of Undying: Reborn"
permalink: /en/mods/charmofundying/
---

<div class="mod-hero">
  <img class="mod-icon" src="{{ '/assets/images/charmofundying/icon.png' | relative_url }}" alt="Charm of Undying: Reborn icon" width="96" height="96">
  <div>
    <p class="mod-tagline">Put a Totem of Undying in your charm slot and it saves you from death automatically — no need to hold it.</p>
    <p class="mod-badges">
      <span class="badge">Minecraft 26.3</span>
      <span class="badge">Fabric · NeoForge</span>
      <span class="badge">Trinket mod required</span>
    </p>
  </div>
  <p class="mod-actions">
    <a class="btn btn-primary" href="https://github.com/Fragmented-Chaos/Charm-of-Undying-Reborn/releases" target="_blank" rel="noopener">Download</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/Charm-of-Undying-Reborn" target="_blank" rel="noopener">Source</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/Charm-of-Undying-Reborn/issues" target="_blank" rel="noopener">Report an issue</a>
  </p>
</div>

## Install

This mod **requires a trinket/curio mod**, so install one of these first:

| Platform | Requirement |
|----------|-------------|
| Fabric | [Fabric API](https://modrinth.com/mod/fabric-api) + [Trinkets Updated](https://modrinth.com/mod/trinkets) |
| NeoForge | [Curios API](https://modrinth.com/mod/curios) **or** [Trinkets Updated](https://modrinth.com/mod/trinkets) (either one) |

1. Install the matching requirement above
2. Download `charmofundyingreborn-<version>-universal.jar` (works on Fabric and NeoForge) and drop it into `.minecraft/mods/`
3. Launch the game

## Usage

1. Open the trinket screen (Trinkets' / Curios' default key)
2. Put a **Totem of Undying** into the **Charm** slot
3. On death the totem is consumed and you are revived

The totem does **not** have to be held — sitting in the trinket slot is enough.

## Compatibility

- Totems are recognised through the `c:totems` tag, so **any item carrying that tag** works, including items added by other mods
- Current version `1.1.0-alpha.2+26.3` for Minecraft 26.3

## For mod authors

To make your own item trigger, or to hook up another trinket system, see the integration docs in the repository:

- [Integration guide (English)](https://github.com/Fragmented-Chaos/Charm-of-Undying-Reborn/blob/main/docs/INTEGRATION.md)
- [集成文档（中文）](https://github.com/Fragmented-Chaos/Charm-of-Undying-Reborn/blob/main/docs/INTEGRATION.zh_CN.md)

Licensed under **MIT**.
