---
layout: mod
lang: zh-hant
key: safespawn
title: SafeSpawn
permalink: /zh-hant/mods/safespawn/
modrinth: "safespawn"
curseforge: "safe-spawn"
curseforge_id: "1608764"
card_mc: "1.21.4–1.21.11, 26.1–26.3"
card_loaders: "Fabric · NeoForge · Quilt"
card_requires: "無"
card_license: "MIT"
---

<div class="mod-hero">
  <img class="mod-icon" src="{{ '/assets/images/safespawn/icon.png' | relative_url }}" alt="SafeSpawn 圖示" width="96" height="96">
  <div>
    <p class="mod-tagline">還原 MC-212 與 MC-21650（在 24w45a 版本被修復），並修復 MC-278261。</p>
  </div>
  <p class="mod-actions">
    <a class="btn btn-primary" href="https://modrinth.com/mod/safespawn" target="_blank" rel="noopener">Modrinth</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/SafeSpawn" target="_blank" rel="noopener">原始碼</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/SafeSpawn/issues" target="_blank" rel="noopener">回報問題</a>
  </p>
</div>

## 修復內容

| 原版問題 | 現在的行為 |
|----------|------------|
| **MC-212** / **MC-21650** | 重進存檔時豁免墜落傷害 —— 從高處掉下去時退出再進，不會摔死 |
| **MC-278261** | 重生後正常獲得無敵時間 |

這兩條原先在 24w45a 被改掉了，SafeSpawn 把舊行為還原回來。

## 配置

配置在 `config/safespawn.properties`：

```properties
# 無敵持續時間（遊戲刻，20 刻 = 1 秒）
invulnerableTicks=60
# 死亡重生時是否給無敵
enableRespawnImmunity=true
# 登入（重進存檔）時是否給無敵
enableLoginImmunity=true
```

| 欄位 | 預設 | 說明 |
|------|------|------|
| `invulnerableTicks` | `60` | 無敵持續時間，單位是遊戲刻（20 刻 = 1 秒，60 刻 = 3 秒） |
| `enableRespawnImmunity` | `true` | 死亡重生時是否啟用無敵 |
| `enableLoginImmunity` | `true` | 登入 / 重進存檔時是否啟用無敵 |

