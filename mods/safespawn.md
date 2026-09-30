---
layout: mod
lang: zh
key: safespawn
title: SafeSpawn
permalink: /mods/safespawn/
card_mc: "1.21.4–1.21.11, 26.1+"
card_loaders: "Fabric · NeoForge"
card_requires: "无"
card_license: "MIT"
---

<div class="mod-hero">
  <img class="mod-icon" src="{{ '/assets/images/safespawn/icon.png' | relative_url }}" alt="SafeSpawn 图标" width="96" height="96">
  <div>
    <p class="mod-tagline">把「重进存档摔死」和「重生后没有无敌」这两个原版问题修回来。</p>
  </div>
  <p class="mod-actions">
    <a class="btn btn-primary" href="https://modrinth.com/mod/safespawn" target="_blank" rel="noopener">Modrinth</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/SafeSpawn" target="_blank" rel="noopener">源码</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/SafeSpawn/issues" target="_blank" rel="noopener">反馈问题</a>
  </p>
</div>

## 修复内容

| 原版问题 | 现在的行为 |
|----------|------------|
| **MC-212** / **MC-21650** | 重进存档时豁免坠落伤害 —— 从高处掉下去时退出再进，不会摔死 |
| **MC-278261** | 重生后正常获得无敌时间 |

这两条原先在 24w45a 被改掉了，SafeSpawn 把旧行为还原回来。

## 配置

配置在 `config/safespawn.properties`：

```properties
# 无敌持续时间（游戏刻，20 刻 = 1 秒）
invulnerableTicks=60
# 死亡重生时是否给无敌
enableRespawnImmunity=true
# 登录（重进存档）时是否给无敌
enableLoginImmunity=true
```

| 字段 | 默认 | 说明 |
|------|------|------|
| `invulnerableTicks` | `60` | 无敌持续时间，单位是游戏刻（20 刻 = 1 秒，60 刻 = 3 秒） |
| `enableRespawnImmunity` | `true` | 死亡重生时是否启用无敌 |
| `enableLoginImmunity` | `true` | 登录 / 重进存档时是否启用无敌 |

