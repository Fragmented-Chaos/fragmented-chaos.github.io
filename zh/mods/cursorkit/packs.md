---
layout: page
lang: zh
key: cursorkit_packs
title: 制作光标包
permalink: /zh/mods/cursorkit/packs/
# 旧地址保留 301 重定向（原来在 /mods/cursorkit/packs/）
redirect_from:
  - /mods/cursorkit/packs/
---

<p class="mods-others"><a href="{{ '/mods/cursorkit/' | relative_url }}">← Cursor Kit 使用说明</a></p>

照着做就行，十分钟能做出一个自己的光标。不用写代码。

## 要准备的东西

- 一张**正方形的 PNG 图片**（背景留透明，建议 32×32 像素）
- 一个画图软件（Aseprite / Photoshop / GIMP / 系统画图都行）
- 记事本（用来写一个文本文件，内容后面照抄）

## 第一步：先让一张图变成光标

1. 把 PNG 复制到游戏的 `config/cursorkit/` 文件夹里
2. 文件名改成 `my_arrow.png` —— **用小写字母、数字、下划线**，别用中文和空格
3. 进游戏：**选项 → 视频设置 → `光标`**
4. 列表里会出现 `my_arrow`，点一下选中

现在整局游戏的光标就是这张图了（六个状态都用它）。

> 找不到 `config/cursorkit/`？在光标列表界面点右上角的 **`文件夹`**，它会帮你打开。

## 第二步：让不同状态用不同的图

先解释一下：游戏里光标不是只有一种样子 —— 指到按钮上会变手型、在输入框里会变 I 型…… 这些叫**状态**，一共六个：

| 状态 | 什么时候出现 |
|------|--------------|
| `default` | 平时（**必须有**） |
| `clickable` | 指到按钮等能点的东西上 |
| `text` | 在输入框、告示牌里打字时 |
| `drag` | 按住左键拖东西时 |
| `disabled` | 指到灰掉、不能点的按钮上 |
| `busy` | 加载中（转圈那种） |

想让它们各用一张图：

1. 再画几张图，都放进 `config/cursorkit/`
2. 在同一个文件夹里新建一个文本文件，命名成 `my_arrow.json`（**和 PNG 同名**，扩展名换成 json）
3. 把下面的内容抄进去，把文件名改成你自己的：

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

4. 存盘，回到游戏 —— 列表**会自己刷新，不用重启**，点一下右侧就能看到六个状态的预览

没写的状态（上面例子里是 `busy`）会自动用 `default` 的图，所以 `default` 是唯一必须有的。

## 第三步：把点击点放到正确的位置

点击光标时，真正生效的只有一个像素，叫**点击点**（热区）。它默认在图片的**左上角**，所以箭头类光标通常正好；但手型、I 型就该放中间。

不会算坐标没关系：在光标列表界面点右上角 **`热点…`**，在放大图上**点一下或拖一下**就设好了，方向键可以一格一格微调，点 `完成` 保存。改的是你的配置，不会动别人的包。

## 第四步：让"加载中"转起来（可选）

动画就是**把好几帧横着拼成一张长图**：比如 8 张 32×32 的转圈图，拼成一张 **256×32**（宽 = 帧数 × 高）。

在 JSON 里给这个状态加两个数字：

```json
"busy": { "texture": "my_spinner.png", "frames": 8, "frame_ms": 80 }
```

- `frames` = 几张帧
- `frame_ms` = 每帧显示多少毫秒（80 大约是每秒 12 帧）

两个要点：**每帧必须是正方形**，**所有帧必须在同一行**。

## 第五步：加点击特效（可选）

想让点下去有反馈，加一行就行：

```json
"click_effect": { "type": "ripple", "color": "#FFD479" }
```

| `type` | 点下去是什么样 |
|--------|----------------|
| `ripple` | 一圈光晕扩散开（最常用） |
| `burst` | 一堆粒子炸开 |
| `pulse` | 原地闪一下 |
| `image` | 用你自己画的动画（下面单独说） |
| `none` | 不要特效 |

想调大小、时长、粒子数，加 `"radius": 15`、`"duration_ms": 450`、`"particles": 6` 这些字段，不写就用默认值。

**用自己画的动画**：做成和上面动画一样的横向长图，然后写：

```json
"click_effect": { "type": "image", "texture": "my_ring.png", "frames": 6, "frame_ms": 60, "size": 24 }
```

`size` 是它画出来多大（屏幕像素），淡出效果要**画进图里**。

## 第六步：打包成一个能分享的包

如果要发给别人，就得做成**光标包**：一个文件夹（或压缩包），里面按固定结构放：

```
mypack/                                  ← 包名，随便起
└── assets/
    └── mypack/                          ← 随便起的名字，跟上面保持一致就行
        ├── cursor/
        │   └── my_arrow.json            ← 你的 JSON
        └── textures/
            └── cursor/
                ├── my_arrow.png         ← 你的图
                └── my_hand.png
```

注意 JSON 里的路径要**相对于 `textures/cursor/`**：上面这个例子里写 `"texture": "my_arrow.png"`。如果图放在子文件夹 `cursor/arrow/` 里，就写 `"texture": "arrow/my_arrow.png"`。

做完把 `mypack` 文件夹丢进 `config/cursorkit/packs/`，或者**直接拖进游戏界面**，就装好了。

想打成压缩包：**压缩包里第一层就要是 `assets/`**，别把 `mypack` 再套一层（套一层也能识别，但别套两层）。

```
mypack.zip
└── assets/...        ✓ 正确
```

> 这个包同样能当资源包用：丢进 `resourcepacks/` 并在资源包界面启用即可（这时需要一个 `pack.mcmeta`，内容照抄 `examples/` 里的）。但资源包**只能用 PNG**，`.cur` 只能用上面那种光标包。

## 遇到问题看这里

| 现象 | 原因 |
|------|------|
| 列表里找不到我的光标 | 文件名有大写/中文；或者没放在 `config/cursorkit/`；或者 JSON 里 `default` 写漏了（这种情况整个集合会被跳过，日志里有记录） |
| 只有 `default` 是我画的，其它状态不对 | 没写进 JSON 的状态会自动用 `default` 的图，这是正常的 |
| 光标又大又糊 | 图片分辨率既决定清晰度也决定大小。16×16 是普通大小，想要更清楚就画 32×32 / 64×64，**别把小图放大** |
| 动画不动 | 帧必须在**同一行**；图宽要等于「帧数 × 帧高」；`frames` 和图对不上时会以图为准 |
| 点下去的位置不对 | 用界面里的 `热点…` 调，别手算坐标 |
| 放资源包里没反应 | 资源包要在**资源包界面**里启用；放进 `config/cursorkit/packs/` 则是永远开启的 |

## 所有字段速查

| 字段 | 要写吗 | 不写的话 | 说明 |
|------|--------|----------|------|
| `states.default.texture` | **要** | — | 图片路径。本地单集合相对 `config/cursorkit/`；光标包/资源包相对 `textures/cursor/` |
| `states.<其它状态>.texture` | 不用 | 用 `default` 的图 | 六个状态：`clickable` `text` `drag` `disabled` `busy` |
| `hotspot` | 不用 | 左上角 `[0, 0]` | 点击点，单位是**图片像素**，写成 `[x, y]`；`.cur` 文件用自带的 |
| `frames` | 不用 | `1` | 动画帧数 |
| `frame_ms` | 不用 | `100` | 每帧毫秒数 |
| `name` | 不用 | 用文件名 | 只影响界面显示的名字 |
| `scale` | 不用 | `1` | 整体再放大几倍 |
| `click_effect` | 不用 | 模组自带水波纹 | 见第五步 |

## 想直接抄现成的

模组仓库的 `examples/` 里已经有能用的包，复制过来改图就行：

- `CursorKit-Test-Pack/` —— 六状态齐全的例子，还有 32×32、64×64 的高清例子
- `ClickFX-Cursor-Pack/` —— 三种点击特效 + 自带帧带动画的例子
- `config-cursorkit/` —— 直接复制到 `config/` 就能用的目录结构
