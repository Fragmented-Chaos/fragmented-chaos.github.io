---
layout: mod
lang: zh
key: cursorkit
title: Cursor Kit
permalink: /mods/cursorkit/
modrinth: ""
curseforge: ""
curseforge_id: ""
card_mc: "26.3"
card_loaders: "Fabric · NeoForge · Quilt"
card_requires: "无（纯客户端）"
card_license: "LGPL-3.0"
---

<div class="mod-hero">
  <img class="mod-icon" src="{{ '/assets/images/cursorkit/icon.png' | relative_url }}" alt="Cursor Kit 图标" width="96" height="96">
  <div>
    <p class="mod-tagline">把 Minecraft 的鼠标指针换成自定义高清光标：六个状态、帧动画、逐状态热区，点击特效跟随光标包。</p>
  </div>
  <p class="mod-actions">
    <a class="btn btn-primary" href="https://github.com/Fragmented-Chaos/Cursor-Kit/releases" target="_blank" rel="noopener">下载</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/Cursor-Kit" target="_blank" rel="noopener">源码</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/Cursor-Kit/issues" target="_blank" rel="noopener">反馈问题</a>
  </p>
</div>

哪个状态用哪张图**完全由外部包决定** —— 资源包、光标包、或 `config` 里的散装图片都行；换一套光标不用换模组，也不用重启游戏。

<div class="mod-toc">
  <p>目录</p>
  <ul>
    <li><a href="#start">快速上手</a></li>
    <li><a href="#features">功能</a></li>
    <li><a href="#packs">做自己的光标包</a></li>
    <li><a href="#effects">点击特效</a></li>
    <li><a href="#config">配置项</a></li>
    <li><a href="#states">状态判定</a></li>
    <li><a href="#api">给其它模组用的 API</a></li>
    <li><a href="#faq">常见问题</a></li>
  </ul>
</div>

<a id="start"></a>
## 快速上手

**首次进游戏时还没有任何光标集**，列表里只有 `默认（系统光标）` 和 `自定义（逐状态填写）` 两行；放一个光标包进去，其它的就会出现：

- **拖进去**：`.zip`、带 `assets/` 的文件夹、或散装 PNG/JSON 直接拖到界面上（重名自动加 `-2`）
- **自己放**：光标包放 `config/cursorkit/packs/`（文件夹或 `.zip`），散装 JSON + PNG 放 `config/cursorkit/`

`config/cursorkit/`（含 `packs/`）会被持续监听，一有变化就重读刷新，搜索词与选中项保留。

界面操作：

- **点列表即选中并立刻生效**
- 左侧列表每行显示 `名字 · 来源 · 状态数 · 特效`，顶部有搜索框；第一行 `默认（系统光标）`，第二行 [`自定义（逐状态填写）`](#custom)
- 右侧是六个状态的实时预览（红点是点击点位置，缺失的状态标 `(default)`）和循环播放的特效预览
- 底部开关：`动画`、`点击特效`、`缩放`、`边界`；右上角 `文件夹` 与 `热点…`
- `完成` 保存，`取消` 恢复到打开界面时的状态

<figure class="shot">
  <img src="{{ '/assets/images/cursorkit/picker.png' | relative_url }}" alt="光标选择界面：左侧列表、右侧六个状态预览">
  <figcaption>选择界面：左边是可搜索的包列表（每行标出来源与特效），右边是六个状态的预览和逐状态点击点。</figcaption>
</figure>

<a id="custom"></a>
### 自定义光标

不想做包、只想用现成的图片时，选列表第二行的 **`自定义（逐状态填写）`**，点 **`编辑路径…`**：

- 六个状态各一行，填本机任意 PNG / `.cur` 的**绝对路径**（相对路径以游戏目录为基准）。
- 每行会当场校验：**金色 = 找到**、**红色带 `?` = 没找到**、**灰色 = 留空**（留空则该状态回退到 `default`）；按钮上会提醒有几个路径无效。
- 这些路径存在 `config/cursorkit.json` 的 `custom_states` 里，例如 `{"default": "D:/cursors/arrow.png", "clickable": "hand.cur"}`。

<figure class="shot">
  <img src="{{ '/assets/images/cursorkit/states.png' | relative_url }}" alt="逐状态路径编辑界面">
  <figcaption>逐状态自定义：每个状态一个路径，找到的显示金色，没找到的红色带问号。</figcaption>
</figure>

<a id="hotspots"></a>
### 逐状态热区编辑器

**点击点（热区）不一定要在 JSON 里写死**：选择界面右上角点 **`热点…`** 进入专门的编辑器，左边列出该集合每个状态的当前值（改过的显示金色），右边是放大后的图片 + 像素网格。

- 在图片上**点击或拖拽**即可把点击点放到那个像素，**方向键**逐像素微调。
- `居中` 一键放到图片正中，`恢复原值` 丢掉这条改动、用回集合自带的值。
- 编辑**实时生效**（真实光标会跟着动），`完成` 写入 `config/cursorkit.json` 的 `hotspots`，`取消` 全部还原。

因为改的是配置而不是包本身，**资源包里的集合也能这样调**，不用去动别人的文件。没有自己图片的状态（例如 `text (default)`）会借用 `default` 的图片，但**点击点是独立的**，改一个不会牵动别的。

<figure class="shot">
  <img src="{{ '/assets/images/cursorkit/hotspots.png' | relative_url }}" alt="点击点编辑器：左侧状态列表，右侧放大图片与像素网格">
  <figcaption>点击点编辑器：点或拖就能改，方向键微调，改完立刻生效。</figcaption>
</figure>

<a id="features"></a>
## 功能

<ul class="feature-grid">
  <li class="feature">
    <h3>六个光标状态</h3>
    <p>默认箭头 / 可点击（手型）/ 文本输入（I 型）/ 拖拽 / 忙碌 / 禁用，按界面上下文自动切换。</p>
  </li>
  <li class="feature">
    <h3>高清光标</h3>
    <p>一个图片像素 = 屏幕上的一个物理像素，和系统光标完全一致。16×16 是常规大小，32×32、64×64、128×128 依次更大更清晰，4K 上照样锐利。</p>
  </li>
  <li class="feature">
    <h3>绝不插值</h3>
    <p>按图片自身像素的整数倍绘制（1:1，或不足 16 GUI 单位时整数放大），和系统光标一样没有半点模糊。</p>
  </li>
  <li class="feature">
    <h3>逐状态热区</h3>
    <p>点击点默认左上角，可以在光标集 JSON 里写，也可以直接在界面里点选 / 拖拽 / 方向键微调。</p>
  </li>
  <li class="feature">
    <h3>三种来源，优先级明确</h3>
    <p><code>config/cursorkit/</code> 散装文件 &gt; <code>config/cursorkit/packs/</code> 光标包 &gt; 资源包。界面里会标出每个集合来自哪一层。</p>
  </li>
  <li class="feature">
    <h3>随包切换的点击特效</h3>
    <p>水波纹、粒子爆开、脉冲点，或包自带的自定义帧动画；换包就换一套点击反馈，也能单独关掉。</p>
  </li>
  <li class="feature">
    <h3>拖入即装</h3>
    <p>压缩包、文件夹、散装图片直接拖进界面，自动归类、自动避让重名、列表立刻刷新。</p>
  </li>
  <li class="feature">
    <h3>支持 <code>.cur</code></h3>
    <p>Windows 光标文件直接丢进 <code>config/cursorkit/</code> 或光标包即可，图片与自带热点自动读取（资源包里只能放 PNG）。</p>
  </li>
</ul>

<a id="packs"></a>
## 做自己的光标包

一个光标集 = 一份 JSON + 若干贴图。想先试效果：把一张 32×32 的 PNG 丢进 `config/cursorkit/` 就能用，再加一份同名 JSON 补其它状态。

```
资源包：      resourcepacks/<包名>/            或 <包名>.zip
光标包：      config/cursorkit/packs/<包名>/   或 <包名>.zip
本地单集合：  config/cursorkit/<集合>.json
```

资源包与光标包内部结构相同（`assets/<命名空间>/cursor/<集合>.json` + `textures/cursor/<贴图>`），所以同一个包两种身份都能用，只有资源包路线需要 `pack.mcmeta`。文件名（去掉扩展名）就是集合 **id**，决定覆盖关系。

**完整的字段表、图片规格、热区、动画与特效参数见[《制作光标包》]({{ '/mods/cursorkit/packs/' | relative_url }})**；仓库 `examples/` 里也有现成包可以直接改。

<a id="effects"></a>
## 点击特效

`click_effect` 是光标集 JSON 里的可选段，**跟着光标包走**：换一个包就换一套点击反馈。每次按下鼠标时在**点击位置**生成特效，光标本身不动，不影响瞄准。

| `type` | 效果 |
|--------|------|
| `ripple` | 扩散的圆环 + 少量粒子（默认） |
| `burst` | 只有粒子，向外爆开 |
| `pulse` | 原地闪一下的实心点 |
| `image` | **包自带的自定义动画**：一条横向帧带，点击时在点击位置播放 |
| `none` | 这个包不要特效 |

颜色、半径、时长、粒子数、`image` 的帧带参数都在[《制作光标包》]({{ '/mods/cursorkit/packs/' | relative_url }})里。界面底部的 `点击特效` 是总开关；选 `默认（系统光标）` 时也会播模组自带的水波纹。

<a id="config"></a>
## 配置项

配置在 `config/cursorkit.json`（首次启动自动生成）：

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

| 字段 | 默认 | 说明 |
|------|------|------|
| `enabled` | `true` | 总开关。关闭后完全还原系统光标 |
| `selected_set` | `""` | 当前光标集 **id**（文件名去掉扩展名）。**留空 = 使用系统光标**；指向已删除的集合时**立即交还系统光标**（不会跳去别的集合） |
| `scale` | `1` | 额外整数倍缩放，与集合自身的 `scale` 相乘 |
| `animate` | `true` | 关闭后光标**固定为 `default` 的静态图**：不切换状态、也不播放动画 |
| `click_effect` | `true` | 点击特效总开关（布尔值） |
| `edge_margin` | `2` | 距窗口边缘多少像素内不接管光标，避免找不到鼠标 |
| `custom_states` | 无 | 逐状态自定义图片路径，即界面里的「自定义（逐状态填写）」 |
| `custom_effect` | 水波纹 | 手工集合自己的点击特效，写法与包里的 `click_effect` 相同 |
| `hotspots` | 无 | 在热区编辑器里改过的点击点，形如 `{"集合id": {"状态": [x, y]}}` |

<a id="states"></a>
## 状态判定

| 状态 | 何时显示 | 判定来源 |
|------|----------|----------|
| `drag` | 按住左键拖拽（物品、滑块） | 原版 `Screen#isDragging` / 左键按下 |
| `text` | 文本框、告示牌编辑获得焦点 | 原版请求 `IBEAM` |
| `busy` | 加载遮罩存在 | 界面覆盖层非空 |
| `disabled` | 悬停不可用控件 | 原版请求 `NOT_ALLOWED` |
| `clickable` | 悬停可点击控件、可拖拽边缘 | 原版请求 `POINTING_HAND` / `RESIZE_*` |
| `default` | 其它情况 | — |

优先级：`drag > text > busy > disabled > clickable > default`。

Minecraft 26.3 起会为每个控件请求光标类型，所以**任何模组的界面都自动适用**；Cursor Kit 只补上原版表达不了的「拖拽」与「加载中」，并额外提供下面这个覆盖入口。

两个边界行为：**进入游戏（视角被锁定时）光标完全不接管**；把指针推到窗口最边缘时系统光标会回来（`edge_margin` 控制这个范围）。

<a id="api"></a>
## 给其它模组用的 API

```java
CursorStateProviders.register((screen, mouseX, mouseY, context) -> {
    if (screen instanceof MySpecialScreen) {
        return CursorState.DRAG;   // 本帧强制用这个状态
    }
    return null;                    // 交回内置判定
});
```

按注册顺序询问，第一个返回非 `null` 的胜出；`context` 里能看到原版请求的类型、是否拖拽、是否忙碌。`CursorState`、`CursorSet` 等模型类都与 Minecraft 无关，方便书写与测试。

<a id="faq"></a>
## 常见问题

**装了模组但光标没变？**
列表里选中项是不是 `默认（系统光标）`？`config/cursorkit.json` 的 `enabled` 是不是 `false`？另外先确认已经有光标集可选 —— 刚装好模组时一个包都还没有，往 `config/cursorkit/packs/` 放一个就会出现。

**光标模糊 / 不够精细？**
模组按整数倍绘制、不做插值，所以**素材分辨率就是清晰度的上限**。用 32×32、64×64、128×128 的图，不要用 16×16 放大。

**资源包里的光标没出现？**
资源包必须在**资源包界面启用**才会被加载；不想每次手动启用的话，把同一个包放进 `config/cursorkit/packs/`（结构完全一样），模组会直接读，永远是开启的。

**找不到鼠标了？**
把指针推到窗口最边缘就会交还系统光标，`边界` 开关（`edge_margin`）可以把这个范围调大；也可以随时在列表里选 `默认（系统光标）`。

**点击特效不显示？**
界面底部的 `点击特效` 开关是总开关；单个包也可以在 JSON 里写 `"type": "none"` 关掉。

**服务器上要装吗？**
不用。这是纯客户端模组，服务器装了也不做任何事，联机时服务端没装也不会报错。

**能在 NeoForge / Quilt 上用吗？**
能。同一个 jar 三端通用，Fabric 与 Quilt 共用（Quilt 走 Fabric 兼容层）；NeoForge 上没有 Mod Menu，模组列表由 NeoForge 自己提供。

**怎么让自定义光标一直显示，不要突然变回系统光标？**
指针靠近窗口边缘时模组会主动交还系统光标（`edge_margin`，默认 2 像素），这是为了避免鼠标贴边时点不到东西。把 `边界` 调到 `0` 就会一直用自定义光标。

