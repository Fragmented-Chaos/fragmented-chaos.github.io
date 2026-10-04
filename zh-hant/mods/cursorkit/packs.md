---
layout: page
lang: zh-hant
key: cursorkit_packs
title: 製作游標包
permalink: /zh-hant/mods/cursorkit/packs/
---

<p class="mods-others"><a href="{{ '/mods/cursorkit/' | relative_url }}">← Cursor Kit 使用說明</a></p>

照著做就行，十分鐘能做出一個自己的游標。不用寫程式碼。

## 要準備的東西

- 一張**正方形的 PNG 圖片**（背景留透明，建議 32×32 畫素）
- 一個畫圖軟體（Aseprite / Photoshop / GIMP / 系統畫圖都行）
- 記事本（用來寫一個文字檔案，內容後面照抄）

## 第一步：先讓一張圖變成游標

1. 把 PNG 複製到遊戲的 `config/cursorkit/` 資料夾裡
2. 檔名改成 `my_arrow.png` —— **用小寫字母、數字、下劃線**，別用中文和空格
3. 進遊戲：**選項 → 影片設定 → `游標`**
4. 列表裡會出現 `my_arrow`，點一下選中

現在整局遊戲的游標就是這張圖了（六個狀態都用它）。

> 找不到 `config/cursorkit/`？在游標列表介面點右上角的 **`資料夾`**，它會幫你開啟。

## 第二步：讓不同狀態用不同的圖

先解釋一下：遊戲裡游標不是隻有一種樣子 —— 指到按鈕上會變手型、在輸入框裡會變 I 型…… 這些叫**狀態**，一共六個：

| 狀態 | 什麼時候出現 |
|------|--------------|
| `default` | 平時（**必須有**） |
| `clickable` | 指到按鈕等能點的東西上 |
| `text` | 在輸入框、告示牌裡打字時 |
| `drag` | 按住左鍵拖東西時 |
| `disabled` | 指到灰掉、不能點的按鈕上 |
| `busy` | 載入中（轉圈那種） |

想讓它們各用一張圖：

1. 再畫幾張圖，都放進 `config/cursorkit/`
2. 在同一個資料夾裡新建一個文字檔案，命名成 `my_arrow.json`（**和 PNG 同名**，副檔名換成 json）
3. 把下面的內容抄進去，把檔名改成你自己的：

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

4. 存檔，回到遊戲 —— 列表**會自己重新整理，不用重啟**，點一下右側就能看到六個狀態的預覽

沒寫的狀態（上面例子裡是 `busy`）會自動用 `default` 的圖，所以 `default` 是唯一必須有的。

## 第三步：把點選點放到正確的位置

點選游標時，真正生效的只有一個畫素，叫**點選點**（熱區）。它預設在圖片的**左上角**，所以箭頭類游標通常正好；但手型、I 型就該放中間。

不會算座標沒關係：在游標列表介面點右上角 **`熱點…`**，在放大圖上**點一下或拖一下**就設好了，方向鍵可以一格一格微調，點 `完成` 儲存。改的是你的配置，不會動別人的包。

## 第四步：讓"載入中"轉起來（可選）

動畫就是**把好幾幀橫著拼成一張長圖**：比如 8 張 32×32 的轉圈圖，拼成一張 **256×32**（寬 = 幀數 × 高）。

在 JSON 裡給這個狀態加兩個數字：

```json
"busy": { "texture": "my_spinner.png", "frames": 8, "frame_ms": 80 }
```

- `frames` = 幾張幀
- `frame_ms` = 每幀顯示多少毫秒（80 大約是每秒 12 幀）

兩個要點：**每幀必須是正方形**，**所有幀必須在同一行**。

## 第五步：加點選特效（可選）

想讓點下去有回饋，加一行就行：

```json
"click_effect": { "type": "ripple", "color": "#FFD479" }
```

| `type` | 點下去是什麼樣 |
|--------|----------------|
| `ripple` | 一圈光暈擴散開（最常用） |
| `burst` | 一堆粒子炸開 |
| `pulse` | 原地閃一下 |
| `image` | 用你自己畫的動畫（下面單獨說） |
| `none` | 不要特效 |

想調大小、時長、粒子數，加 `"radius": 15`、`"duration_ms": 450`、`"particles": 6` 這些欄位，不寫就用預設值。

**用自己畫的動畫**：做成和上面動畫一樣的橫向長圖，然後寫：

```json
"click_effect": { "type": "image", "texture": "my_ring.png", "frames": 6, "frame_ms": 60, "size": 24 }
```

`size` 是它畫出來多大（螢幕畫素），淡出效果要**畫進圖裡**。

## 第六步：打包成一個能分享的包

如果要發給別人，就得做成**游標包**：一個資料夾（或壓縮包），裡面按固定結構放：

```
mypack/                                  ← 包名，隨便起
└── assets/
    └── mypack/                          ← 隨便起的名字，跟上面保持一致就行
        ├── cursor/
        │   └── my_arrow.json            ← 你的 JSON
        └── textures/
            └── cursor/
                ├── my_arrow.png         ← 你的圖
                └── my_hand.png
```

注意 JSON 裡的路徑要**相對於 `textures/cursor/`**：上面這個例子裡寫 `"texture": "my_arrow.png"`。如果圖放在子資料夾 `cursor/arrow/` 裡，就寫 `"texture": "arrow/my_arrow.png"`。

做完把 `mypack` 資料夾丟進 `config/cursorkit/packs/`，或者**直接拖進遊戲介面**，就裝好了。

想打成壓縮包：**壓縮包裡第一層就要是 `assets/`**，別把 `mypack` 再套一層（套一層也能識別，但別套兩層）。

```
mypack.zip
└── assets/...        ✓ 正確
```

> 這個包同樣能當資源包用：丟進 `resourcepacks/` 並在資源包介面啟用即可（這時需要一個 `pack.mcmeta`，內容照抄 `examples/` 裡的）。但資源包**只能用 PNG**，`.cur` 只能用上面那種游標包。

## 遇到問題看這裡

| 現象 | 原因 |
|------|------|
| 列表裡找不到我的游標 | 檔名有大寫/中文；或者沒放在 `config/cursorkit/`；或者 JSON 裡 `default` 寫漏了（這種情況整個集合會被跳過，日誌裡有記錄） |
| 只有 `default` 是我畫的，其它狀態不對 | 沒寫進 JSON 的狀態會自動用 `default` 的圖，這是正常的 |
| 游標又大又糊 | 圖片解析度既決定清晰度也決定大小。16×16 是普通大小，想要更清楚就畫 32×32 / 64×64，**別把小圖放大** |
| 動畫不動 | 幀必須在**同一行**；圖寬要等於「幀數 × 幀高」；`frames` 和圖對不上時會以圖為準 |
| 點下去的位置不對 | 用介面裡的 `熱點…` 調，別手算座標 |
| 放資源包裡沒反應 | 資源包要在**資源包介面**裡啟用；放進 `config/cursorkit/packs/` 則是永遠開啟的 |

## 所有欄位速查

| 欄位 | 要寫嗎 | 不寫的話 | 說明 |
|------|--------|----------|------|
| `states.default.texture` | **要** | — | 圖片路徑。本地單集合相對 `config/cursorkit/`；游標包/資源包相對 `textures/cursor/` |
| `states.<其它狀態>.texture` | 不用 | 用 `default` 的圖 | 六個狀態：`clickable` `text` `drag` `disabled` `busy` |
| `hotspot` | 不用 | 左上角 `[0, 0]` | 點選點，單位是**圖片畫素**，寫成 `[x, y]`；`.cur` 檔案用自帶的 |
| `frames` | 不用 | `1` | 動畫幀數 |
| `frame_ms` | 不用 | `100` | 每幀毫秒數 |
| `name` | 不用 | 用檔名 | 隻影響介面顯示的名字 |
| `scale` | 不用 | `1` | 整體再放大幾倍 |
| `click_effect` | 不用 | 模組自帶水波紋 | 見第五步 |

## 想直接抄現成的

模組倉庫的 `examples/` 裡已經有能用的包，複製過來改圖就行：

- `CursorKit-Test-Pack/` —— 六狀態齊全的例子，還有 32×32、64×64 的高畫質例子
- `ClickFX-Cursor-Pack/` —— 三種點選特效 + 自帶幀帶動畫的例子
- `config-cursorkit/` —— 直接複製到 `config/` 就能用的目錄結構
