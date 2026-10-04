---
layout: mod
lang: zh-hant
key: cursorkit
title: Cursor Kit
permalink: /zh-hant/mods/cursorkit/
modrinth: ""
curseforge: ""
curseforge_id: ""
card_mc: "26.3"
card_loaders: "Fabric · NeoForge · Quilt"
card_requires: "無（純客戶端）"
card_license: "LGPL-3.0"
---

<div class="mod-hero">
  <img class="mod-icon" src="{{ '/assets/images/cursorkit/icon.png' | relative_url }}" alt="Cursor Kit 圖示" width="96" height="96">
  <div>
    <p class="mod-tagline">把 Minecraft 的滑鼠指標換成自定義高畫質游標：六個狀態、幀動畫、逐狀態熱區，點選特效跟隨游標包。</p>
  </div>
  <p class="mod-actions">
    <a class="btn btn-primary" href="https://github.com/Fragmented-Chaos/Cursor-Kit/releases" target="_blank" rel="noopener">下載</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/Cursor-Kit" target="_blank" rel="noopener">原始碼</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/Cursor-Kit/issues" target="_blank" rel="noopener">回報問題</a>
  </p>
</div>

哪個狀態用哪張圖**完全由外部包決定** —— 資源包、游標包、或 `config` 裡的散裝圖片都行；換一套游標不用換模組，也不用重啟遊戲。

<div class="mod-toc">
  <p>目錄</p>
  <ul>
    <li><a href="#start">快速上手</a></li>
    <li><a href="#features">功能</a></li>
    <li><a href="#packs">做自己的游標包</a></li>
    <li><a href="#effects">點選特效</a></li>
    <li><a href="#config">配置項</a></li>
    <li><a href="#states">狀態判定</a></li>
    <li><a href="#api">給其它模組用的 API</a></li>
    <li><a href="#faq">常見問題</a></li>
  </ul>
</div>

<a id="start"></a>
## 快速上手

**首次進遊戲時還沒有任何游標集**，列表裡只有 `預設（系統游標）` 和 `自定義（逐狀態填寫）` 兩行；放一個游標包進去，其它的就會出現：

- **拖進去**：`.zip`、帶 `assets/` 的資料夾、或散裝 PNG/JSON 直接拖到介面上（重名自動加 `-2`）
- **自己放**：游標包放 `config/cursorkit/packs/`（資料夾或 `.zip`），散裝 JSON + PNG 放 `config/cursorkit/`

`config/cursorkit/`（含 `packs/`）會被持續監聽，一有變化就重讀重新整理，搜尋詞與選中項保留。

介面操作：

- **點列表即選中並立刻生效**
- 左側列表每行顯示 `名字 · 來源 · 狀態數 · 特效`，頂部有搜尋框；第一行 `預設（系統游標）`，第二行 [`自定義（逐狀態填寫）`](#custom)
- 右側是六個狀態的即時預覽（紅點是點選點位置，缺失的狀態標 `(default)`）和迴圈播放的特效預覽
- 底部開關：`動畫`、`點選特效`、`縮放`、`邊界`；右上角 `資料夾` 與 `熱點…`
- `完成` 儲存，`取消` 恢復到開啟介面時的狀態

<figure class="shot">
  <img src="{{ '/assets/images/cursorkit/picker.png' | relative_url }}" alt="游標選擇介面：左側列表、右側六個狀態預覽">
  <figcaption>選擇介面：左邊是可搜尋的包列表（每行標出來源與特效），右邊是六個狀態的預覽和逐狀態點選點。</figcaption>
</figure>

<a id="custom"></a>
### 自定義游標

不想做包、只想用現成的圖片時，選列表第二行的 **`自定義（逐狀態填寫）`**，點 **`編輯路徑…`**：

- 六個狀態各一行，填本機任意 PNG / `.cur` 的**絕對路徑**（相對路徑以遊戲目錄為基準）。
- 每行會當場校驗：**金色 = 找到**、**紅色帶 `?` = 沒找到**、**灰色 = 留空**（留空則該狀態回退到 `default`）；按鈕上會提醒有幾個路徑無效。
- 這些路徑存在 `config/cursorkit.json` 的 `custom_states` 裡，例如 `{"default": "D:/cursors/arrow.png", "clickable": "hand.cur"}`。

<figure class="shot">
  <img src="{{ '/assets/images/cursorkit/states.png' | relative_url }}" alt="逐狀態路徑編輯介面">
  <figcaption>逐狀態自定義：每個狀態一個路徑，找到的顯示金色，沒找到的紅色帶問號。</figcaption>
</figure>

<a id="hotspots"></a>
### 逐狀態熱區編輯器

**點選點（熱區）不一定要在 JSON 裡寫死**：選擇介面右上角點 **`熱點…`** 進入專門的編輯器，左邊列出該集合每個狀態的當前值（改過的顯示金色），右邊是放大後的圖片 + 畫素網格。

- 在圖片上**點選或拖拽**即可把點選點放到那個畫素，**方向鍵**逐畫素微調。
- `居中` 一鍵放到圖片正中，`恢復原值` 丟掉這條改動、用回集合自帶的值。
- 編輯**即時生效**（真實游標會跟著動），`完成` 寫入 `config/cursorkit.json` 的 `hotspots`，`取消` 全部還原。

因為改的是配置而不是包本身，**資源包裡的集合也能這樣調**，不用去動別人的檔案。沒有自己圖片的狀態（例如 `text (default)`）會借用 `default` 的圖片，但**點選點是獨立的**，改一個不會牽動別的。

<figure class="shot">
  <img src="{{ '/assets/images/cursorkit/hotspots.png' | relative_url }}" alt="點選點編輯器：左側狀態列表，右側放大圖片與畫素網格">
  <figcaption>點選點編輯器：點或拖就能改，方向鍵微調，改完立刻生效。</figcaption>
</figure>

<a id="features"></a>
## 功能

<ul class="feature-grid">
  <li class="feature">
    <h3>六個游標狀態</h3>
    <p>預設箭頭 / 可點選（手型）/ 文字輸入（I 型）/ 拖拽 / 忙碌 / 停用，按介面上下文自動切換。</p>
  </li>
  <li class="feature">
    <h3>高畫質游標</h3>
    <p>一個圖片畫素 = 螢幕上的一個物理畫素，和系統游標完全一致。16×16 是常規大小，32×32、64×64、128×128 依次更大更清晰，4K 上照樣銳利。</p>
  </li>
  <li class="feature">
    <h3>絕不插值</h3>
    <p>按圖片自身畫素的整數倍繪製（1:1，或不足 16 GUI 單位時整數放大），和系統游標一樣沒有半點模糊。</p>
  </li>
  <li class="feature">
    <h3>逐狀態熱區</h3>
    <p>點選點預設左上角，可以在游標集 JSON 裡寫，也可以直接在介面裡點選 / 拖拽 / 方向鍵微調。</p>
  </li>
  <li class="feature">
    <h3>三種來源，優先順序明確</h3>
    <p><code>config/cursorkit/</code> 散裝檔案 &gt; <code>config/cursorkit/packs/</code> 游標包 &gt; 資源包。介面裡會標出每個集合來自哪一層。</p>
  </li>
  <li class="feature">
    <h3>隨包切換的點選特效</h3>
    <p>水波紋、粒子爆開、脈衝點，或包自帶的自定義幀動畫；換包就換一套點選回饋，也能單獨關掉。</p>
  </li>
  <li class="feature">
    <h3>拖入即裝</h3>
    <p>壓縮包、資料夾、散裝圖片直接拖進介面，自動歸類、自動避讓重名、列表立刻重新整理。</p>
  </li>
  <li class="feature">
    <h3>支援 <code>.cur</code></h3>
    <p>Windows 游標檔案直接丟進 <code>config/cursorkit/</code> 或游標包即可，圖片與自帶熱點自動讀取（資源包裡只能放 PNG）。</p>
  </li>
</ul>

<a id="packs"></a>
## 做自己的游標包

一個游標集 = 一份 JSON + 若干貼圖。想先試效果：把一張 32×32 的 PNG 丟進 `config/cursorkit/` 就能用，再加一份同名 JSON 補其它狀態。

```
資源包：      resourcepacks/<包名>/            或 <包名>.zip
游標包：      config/cursorkit/packs/<包名>/   或 <包名>.zip
本地單集合：  config/cursorkit/<集合>.json
```

資源包與游標包內部結構相同（`assets/<名稱空間>/cursor/<集合>.json` + `textures/cursor/<貼圖>`），所以同一個包兩種身份都能用，只有資源包路線需要 `pack.mcmeta`。檔名（去掉副檔名）就是集合 **id**，決定覆蓋關係。

**完整的欄位表、圖片規格、熱區、動畫與特效引數見[《製作游標包》]({{ '/mods/cursorkit/packs/' | relative_url }})**；倉庫 `examples/` 裡也有現成包可以直接改。

<a id="effects"></a>
## 點選特效

`click_effect` 是游標集 JSON 裡的可選段，**跟著游標包走**：換一個包就換一套點選回饋。每次按下滑鼠時在**點選位置**生成特效，游標本身不動，不影響瞄準。

| `type` | 效果 |
|--------|------|
| `ripple` | 擴散的圓環 + 少量粒子（預設） |
| `burst` | 只有粒子，向外爆開 |
| `pulse` | 原地閃一下的實心點 |
| `image` | **包自帶的自定義動畫**：一條橫向幀帶，點選時在點選位置播放 |
| `none` | 這個包不要特效 |

顏色、半徑、時長、粒子數、`image` 的幀帶引數都在[《製作游標包》]({{ '/mods/cursorkit/packs/' | relative_url }})裡。介面底部的 `點選特效` 是總開關；選 `預設（系統游標）` 時也會播模組自帶的水波紋。

<a id="config"></a>
## 配置項

配置在 `config/cursorkit.json`（首次啟動自動生成）：

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

| 欄位 | 預設 | 說明 |
|------|------|------|
| `enabled` | `true` | 總開關。關閉後完全還原系統游標 |
| `selected_set` | `""` | 當前游標集 **id**（檔名去掉副檔名）。**留空 = 使用系統游標**；指向已刪除的集合時**立即交還系統游標**（不會跳去別的集合） |
| `scale` | `1` | 額外整數倍縮放，與集合自身的 `scale` 相乘 |
| `animate` | `true` | 關閉後游標**固定為 `default` 的靜態圖**：不切換狀態、也不播放動畫 |
| `click_effect` | `true` | 點選特效總開關（布林值） |
| `edge_margin` | `2` | 距視窗邊緣多少畫素內不接管游標，避免找不到滑鼠 |
| `custom_states` | 無 | 逐狀態自定義圖片路徑，即介面裡的「自定義（逐狀態填寫）」 |
| `custom_effect` | 水波紋 | 手工集合自己的點選特效，寫法與包裡的 `click_effect` 相同 |
| `hotspots` | 無 | 在熱區編輯器裡改過的點選點，形如 `{"集合id": {"狀態": [x, y]}}` |

<a id="states"></a>
## 狀態判定

| 狀態 | 何時顯示 | 判定來源 |
|------|----------|----------|
| `drag` | 按住左鍵拖拽（物品、滑塊） | 原版 `Screen#isDragging` / 左鍵按下 |
| `text` | 文字框、告示牌編輯獲得焦點 | 原版請求 `IBEAM` |
| `busy` | 載入遮罩存在 | 介面覆蓋層非空 |
| `disabled` | 懸停不可用控制元件 | 原版請求 `NOT_ALLOWED` |
| `clickable` | 懸停可點選控制元件、可拖拽邊緣 | 原版請求 `POINTING_HAND` / `RESIZE_*` |
| `default` | 其它情況 | — |

優先順序：`drag > text > busy > disabled > clickable > default`。

Minecraft 26.3 起會為每個控制元件請求游標型別，所以**任何模組的介面都自動適用**；Cursor Kit 只補上原版表達不了的「拖拽」與「載入中」，並額外提供下面這個覆蓋入口。

兩個邊界行為：**進入遊戲（視角被鎖定時）游標完全不接管**；把指標推到視窗最邊緣時系統游標會回來（`edge_margin` 控制這個範圍）。

<a id="api"></a>
## 給其它模組用的 API

```java
CursorStateProviders.register((screen, mouseX, mouseY, context) -> {
    if (screen instanceof MySpecialScreen) {
        return CursorState.DRAG;   // 本幀強制用這個狀態
    }
    return null;                    // 交回內建判定
});
```

按註冊順序詢問，第一個返回非 `null` 的勝出；`context` 裡能看到原版請求的型別、是否拖拽、是否忙碌。`CursorState`、`CursorSet` 等模型類都與 Minecraft 無關，方便書寫與測試。

<a id="faq"></a>
## 常見問題

**裝了模組但游標沒變？**
列表裡選中項是不是 `預設（系統游標）`？`config/cursorkit.json` 的 `enabled` 是不是 `false`？另外先確認已經有游標集可選 —— 剛裝好模組時一個包都還沒有，往 `config/cursorkit/packs/` 放一個就會出現。

**游標模糊 / 不夠精細？**
模組按整數倍繪製、不做插值，所以**素材解析度就是清晰度的上限**。用 32×32、64×64、128×128 的圖，不要用 16×16 放大。

**資源包裡的游標沒出現？**
資源包必須在**資源包介面啟用**才會被載入；不想每次手動啟用的話，把同一個包放進 `config/cursorkit/packs/`（結構完全一樣），模組會直接讀，永遠是開啟的。

**找不到滑鼠了？**
把指標推到視窗最邊緣就會交還系統游標，`邊界` 開關（`edge_margin`）可以把這個範圍調大；也可以隨時在列表裡選 `預設（系統游標）`。

**點選特效不顯示？**
介面底部的 `點選特效` 開關是總開關；單個包也可以在 JSON 裡寫 `"type": "none"` 關掉。

**伺服器上要裝嗎？**
不用。這是純客戶端模組，伺服器裝了也不做任何事，聯機時服務端沒裝也不會報錯。

**能在 NeoForge / Quilt 上用嗎？**
能。同一個 jar 三端通用，Fabric 與 Quilt 共用（Quilt 走 Fabric 相容層）；NeoForge 上沒有 Mod Menu，模組列表由 NeoForge 自己提供。

**怎麼讓自定義游標一直顯示，不要突然變回系統游標？**
指標靠近視窗邊緣時模組會主動交還系統游標（`edge_margin`，預設 2 畫素），這是為了避免滑鼠貼邊時點不到東西。把 `邊界` 調到 `0` 就會一直用自定義游標。

