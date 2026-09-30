---
layout: mod
lang: en
key: charmofundying
title: "Charm of Undying: Reborn"
permalink: /en/mods/charmofundying/
modrinth: "charm-of-undying-reborn"
curseforge: "charm-of-undying-reborn"
curseforge_id: ""
card_mc: "26.1–26.3"
card_loaders: "Fabric · NeoForge"
card_requires: "Fabric: Fabric API + Trinkets; NeoForge: Curios or Trinkets"
card_license: "MIT"
---

<div class="mod-hero">
  <img class="mod-icon" src="{{ '/assets/images/charmofundying/icon.png' | relative_url }}" alt="Charm of Undying: Reborn icon" width="96" height="96">
  <div>
    <p class="mod-tagline">A Totem of Undying in your charm slot saves you from death automatically.</p>
  </div>
  <p class="mod-actions">
    <a class="btn btn-primary" href="https://github.com/Fragmented-Chaos/Charm-of-Undying-Reborn/releases" target="_blank" rel="noopener">Download</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/Charm-of-Undying-Reborn" target="_blank" rel="noopener">Source</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/Charm-of-Undying-Reborn/issues" target="_blank" rel="noopener">Report an issue</a>
  </p>
</div>

## Usage

You need a trinket mod first: Trinkets (plus Fabric API) on Fabric, or Curios / Trinkets on NeoForge.

1. Open the trinket screen (Trinkets' / Curios' default key)
2. Put a **Totem of Undying** into the **Charm** slot
3. On death the totem is consumed and you are revived


## Compatibility

- Totems are recognised through the `c:totems` tag, so **any item carrying that tag** works

## For mod authors

To make your own item trigger, or to hook up another trinket system, see the integration docs in the repository:

- [Integration guide (English)](https://github.com/Fragmented-Chaos/Charm-of-Undying-Reborn/blob/main/docs/INTEGRATION.md)
- [集成文档（中文）](https://github.com/Fragmented-Chaos/Charm-of-Undying-Reborn/blob/main/docs/INTEGRATION.zh_CN.md)

