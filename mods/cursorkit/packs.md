---
layout: page
lang: zh
key: cursorkit_packs
title: 制作光标包
permalink: /mods/cursorkit/packs/
---

<p class="mods-others"><a href="{{ '/mods/cursorkit/' | relative_url }}">← Cursor Kit 使用说明</a></p>

光标包就是「一份 JSON + 几张图」。最省事的做法：先只放一张 PNG 看效果，再逐步补状态、动画和特效。

## 1. 最小可用包 {: #minimal}

把一张 32×32 的 PNG 丢进 `config/cursorkit/`，就得到一个只有 `default` 状态的光标集：

```
config/cursorkit/my_cursor.png      ← 一个文件就够了（文件名就是集合 id）
```

进游戏打开选择界面，列表里就会出现 `my_cursor`。想要更多状态，再加一份同名 JSON。

## 2. 三种放法 {: #layout}

```
资源包：      resourcepacks/<包名>/            或 <包名>.zip
光标包：      config/cursorkit/packs/<包名>/   或 <包名>.zip
本地单集合：  config/cursorkit/<集合>.json
              config/cursorkit/<贴图路径>.png
```

资源包和光标包**内部结构完全一样**，只是入口不同：

```
assets/<命名空间>/cursor/<集合>.json
assets/<命名空间>/textures/cursor/<贴图路径>.png
```

| | 需要 `pack.mcmeta` | 需要在资源包界面启用 | 支持 `.cur` |
|---|---|---|---|
| 资源包（`resourcepacks/`） | 要 | 要 | 不支持，只能用 PNG |
| 光标包（`config/cursorkit/packs/`） | 不要 | 不要，永远开启 | 支持 |
| 本地单集合（`config/cursorkit/`） | 不要 | 不要 | 支持 |

**同一个包两种身份**：因为结构一致，一个包既能在资源包里用，也能丢进 `config/cursorkit/packs/`。建议**文件名一律用小写字母、数字、下划线**（Minecraft 的资源路径不接受大写，这样同一个包两边都能用）。

光标包可以是文件夹，也可以是 `.zip`；**zip 里多套一层目录也能识别**，但不要套两层。

## 3. 光标集 JSON {: #json}

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
    },
    "click_effect": { "type": "ripple", "color": "#FFD479" }
}
```

| 字段 | 必填 | 默认 | 说明 |
|------|------|------|------|
| `states.<状态>.texture` | ✅ | — | 贴图路径：资源包 / 光标包相对于 `textures/cursor/`，本地单集合相对于 `config/cursorkit/`。PNG 或 `.cur` |
| `states.<状态>.hotspot` | | `.cur` 用文件自带的，其它用 `[0, 0]` | 点击点在**图片像素**里的坐标 |
| `states.<状态>.frames` | | `1` | 横向帧带帧数，大于 1 即动画 |
| `states.<状态>.frame_ms` | | `100` | 每帧毫秒，最小 1 |
| `name` | | 同文件名 | 只影响界面显示 |
| `scale` | | `1` | 额外整数倍缩放 |
| `click_effect` | | 水波纹 | 见第 6 节 |

六个状态：`default`（必填）、`clickable`、`text`、`drag`、`disabled`、`busy`。

**回退与容错**：没写的状态自动用 `default` 的图（但点击点独立）；未知状态名、类型写错、缺 `default` 都只会**跳过那一条并写日志**，不会让整个包失效。

## 4. 图片规格 {: #images}

- **每帧是正方形**，一帧一张图或一条横向帧带（宽度 = 帧数 × 帧高）。
- **1 图片像素 = 1 屏幕物理像素**，按整数倍绘制、不插值。所以分辨率既是清晰度也是大小：16×16 是常规光标，32 / 64 / 128 依次更大更清晰，画多清晰就有多清晰。
- 背景透明，建议保存为 **8 位 RGBA PNG**。
- 动画帧必须排在**同一行**；`frames` 和图片实际帧数不一致时以图片为准并写日志。
- `.cur`（Windows 光标文件）可以直接用，会自动按真实尺寸绘制并采用文件里的热点；**只能放在 `config/cursorkit/` 或光标包里**。

## 5. 热区 {: #hotspots}

热区 = 点击时真正生效的那个像素，坐标是**图片像素**，可以逐状态不同。常见取值：

| 状态 | 热区放哪 |
|------|----------|
| `default` / `clickable` | 箭头的**尖端**（左上角画法就是 `[0, 0]`） |
| `text` | I 字竖线的正中间 |
| `drag` | 抓握的手心 |
| `disabled` | 和 `default` 保持一致，避免手感突变 |

不想手算坐标：先用任意值，进游戏在选择界面点右上角 **`热点…`**，在放大图上点/拖/用方向键调，改完点 `完成` 就会写进 `config/cursorkit.json`。写超界的坐标会在日志里告警。

## 6. 点击特效 {: #effects}

```json
"click_effect": {
    "type": "ripple",
    "color": "#FFD479",
    "radius": 15,
    "duration_ms": 450,
    "particles": 6
}
```

| `type` | 效果 | 用到哪些字段 |
|--------|------|--------------|
| `ripple` | 扩散圆环 + 粒子（默认） | `color` `radius` `duration_ms` `particles` |
| `burst` | 只有粒子，向外爆开 | `color` `radius` `duration_ms` `particles` |
| `pulse` | 原地闪一下的实心点 | `color` `radius` `duration_ms` |
| `image` | **包自带帧带**，点击位置播放 | `texture` `frames` `frame_ms` `size` |
| `none` | 这个包不要特效 | — |

- `color` 任意 RGB：`#RRGGBB`、`RRGGBB` 或十进制数字；`radius` 扩散距离（GUI 单位）；`duration_ms` 存活时间；`particles` 粒子数。
- `image` 的 `texture` 相对 `textures/cursor/`，`size` 是绘制边长（GUI 单位），不写 `duration_ms` 就以动画自身时长为准。
- `image` 的**淡出要画进图里**：贴图绘制不支持整体调透明度。
- 整个 `click_effect` 段不写就用模组自带的水波纹。

## 7. 打包与安装 {: #package}

```bash
# 正确：zip 根目录就是包根（assets/ 在第一层）
cd MyPack && zip -r ../MyPack.zip assets pack.mcmeta

# 也支持：zip 里套一层 MyPack/
zip -r MyPack.zip MyPack
```

做好之后三种装法：拖进游戏界面、放进 `config/cursorkit/packs/`、或放进 `resourcepacks/` 并在资源包界面启用。

## 8. 发布前检查清单 {: #checklist}

- [ ] `default` 存在，且 JSON 能被解析（游戏日志里没有这个包的跳过记录）
- [ ] 每帧正方形，动画帧在同一行
- [ ] 六个状态在界面右侧预览里都正常（缺的会标 `(default)`，确认是故意的）
- [ ] 热区对得上：进游戏点一下按钮，特效/点击位置正常
- [ ] 文件名全小写，`pack.mcmeta` 内容抄 `examples/` 里的（`min_format` 84 / `max_format` 999）
- [ ] 点击特效预览（详情面板右上角）看着是想要的效果
- [ ] 想同时当资源包用时，把包丢进 `resourcepacks/` 再验一次

## 9. 现成样例 {: #examples}

模组仓库的 `examples/` 里备好了同一套素材的多种形式，直接复制来改最快：

- `CursorKit-Test-Pack/` 与 `CursorKit-Test-Pack.zip`：同一个资源包的文件夹与压缩包两种形式，含六状态齐全的 `demo`、两状态 + 动画的 `packtest`、32×32 与 64×64 的高清集合
- `ClickFX-Cursor-Pack/`：三个包，分别用 `ripple` / `burst` / `pulse`，以及用 `image` 自带动画的集合
- `config-cursorkit/`：复制到 `config/` 即可，含本地单集合与文件夹包、zip 包各一个
