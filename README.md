# site-v2 —— 重做的新站

旧站（`~/Dwvelop/fragmented-chaos.github.io`）原样留在那里不动。这个目录是**从头重写**的新站，
技术栈按你的选择：**纯静态 HTML + CSS + JS，零构建** —— 双击 `index.html` 就能看，不需要
Ruby / Node / 任何打包工具，也没有任何外部请求（字体用系统字体、图标用 SVG 或字符）。

## 现在有什么（正式结构已开始）

```
index.html            起始页（根，语言中立）：手写体名字 + 进入按钮 + 语言/主题
zh/index.html         首页 · 简体
zh-hant/index.html    首页 · 繁體（台灣用詞）
en/index.html         首页 · English
zh/about/index.html   关于 · 简体      ← 参考旧站主页：头像 + 手写名字 + 亦用名 + 问候 + 「在别处」五个平台胶囊
zh-hant/about/index.html  关于 · 繁體
en/about/index.html   关于 · English
assets/images/avatar.jpg  头像（从旧站 logo.jpg 缩到 400×400，30 KB）
assets/base.css       共享样式：字体、明暗令牌、页头页脚、按钮、列表、panel/spec/chips
zh/music/index.html   音乐 · 简体      ← 曲目列表 + 懒加载网易官方播放器
zh-hant/music/index.html  音乐 · 繁體
en/music/index.html   音乐 · English
assets/site.js        共享脚本：主题切换 + 本地时间
zh/experience/index.html  经历 · 简体   ← 时间线组件（内容是占位，等站长给）
zh-hant/experience/index.html  经历 · 繁體
en/experience/index.html  经历 · English
zh/blog/index.html    博客 · 简体      ← 文章列表 + 文章页 + 评论（点了才加载 giscus）
zh-hant/blog/index.html  博客 · 繁體
en/blog/index.html    博客 · English
blog/posts/           文章目录（markdown 文件；写文章只动这里）
assets/blog.js        博客：读目录、渲染 markdown、挂评论（零依赖）
zh/mods/index.html    模组总览 · 简体   ← 三行：名称 / 版本·加载器 / 许可 / 详情
zh/mods/cursorkit/index.html      Cursor Kit 详情 · 简体（含整份文档 + 光标包文档 + 3 张截图）
zh/mods/charmofundying/index.html Charm of Undying：Reborn · 简体
zh/mods/safespawn/index.html      SafeSpawn · 简体
（以上三页 ×3 语，共 9 页）
tools/port_mods.py    旧站模组页搬运脚本（markdown→HTML，正文按原样搬）
assets/images/{cursorkit,charmofundying,safespawn}/  模组图标 + Cursor Kit 截图
zh-hant/mods/index.html  模组总览 · 繁體
en/mods/index.html    模组总览 · English
assets/music.js       音乐页：点曲目才创建播放器 iframe（点击前零外部请求）
tests/check.py        静态检查：链接、资源、三语一致、结构不变式
tests/browser_test.py 浏览器行为：JS 报错、主题切换、时钟、图片、播放器懒加载
tests/run.sh          一条命令跑全部测试
404.html              404 页（三语入口 + 主题切换；托管环境用绝对路径，因为 404 会出现在任意深度）
sitemap.xml           站点地图（由脚本生成，不许手改）
robots.txt            允许抓取 + 指向 sitemap
.nojekyll             关掉 GitHub Pages 的 Jekyll 处理，按原样发布
tools/make_sitemap.py 生成 sitemap.xml 与 robots.txt（域名只在这里改一处）
assets/downloads.js   模组页：读 Modrinth / CurseForge 下载量与最新版本
assets/fonts/         quicksand-latin.woff2 · caveat-latin.woff2 · OFL.txt
mockups/              早期样板（start / ab-mix / A / B / C），留作参照
screenshots/          各页截图（含明暗两版与手机版）
```

页面之间只用相对路径（`../assets/…`、`../zh-hant/`），所以既能被静态托管，也能 `file://` 直接打开。

### 首页内容（三语一致，逐条）

- 首屏：`欢迎来到 / Fragmented_Chaos（手写体）/ 个人网站`
- 状态行：`● 本地时间 14:xx:xx · 2026年10月16日星期五`（**不写"语言 简/繁/EN"**，页头已有）
- 站内：`01 音乐`、`02 经历`、`03 关于`（**没有「文档」**，文档随各模组页走）
- 底部两块面板（参考样板 B）：`关于` + `在别处`（等宽链接胶囊：mc百科 / GitHub / CurseForge / Modrinth / B 站）
- 首页**不含任何模组内容**

### 已删掉的"废话"

按你的要求删除了：首屏那句"这里放我听的歌、一些关于自己的记录……三个版本"，以及状态行里的"语言 简 / 繁 / EN"。三语页面均已核对为 0 处残留。

### 参考样板 B 的元素

| 元素 | 用在哪 |
|---|---|
| `.panel`（略浅底 + 细边 + 圆角 + 小标题） | 首页底部的「关于」「在别处」 |
| `.chips`（等宽字体 + 边框胶囊） | 「在别处」的五个链接 |
| `.spec`（等宽 dt/dd 规格表） | 已备好，给后面的模组页用 |
| 等宽状态行 + 圆点 | 首屏状态行 |

### 主题

- 默认跟随系统 `prefers-color-scheme`；右上角按钮切换，选择记入 `localStorage`（`site-v2.theme`）
- 首次绘制前由 `<head>` 内联脚本定好主题，避免闪白/闪黑
- 调试与截图：`?theme=light` / `?theme=dark`

### 内容事实（全部来自旧站，没有编造）

- 三个在维护的模组：Cursor Kit（26.3 · Fabric/NeoForge/Quilt · LGPL-3.0 · 纯客户端）、
  Charm of Undying: Reborn（26.1–26.3 · Fabric/NeoForge · MIT）、
  SafeSpawn（1.21.4–1.21.11, 26.1–26.3 · Fabric/NeoForge/Quilt · MIT）
- Cursor Kit 文档章节：快速上手 / 自定义光标 / 逐状态热区编辑器 / 点击特效 / 状态判定 / 配置项 / API / 常见问题
- 光标包：放进 `config/cursorkit/packs/`，文件夹或 `.zip` 都行
- 五个外部链接：mc百科 / GitHub / CurseForge / Modrinth / B 站

## 已定的决定

| 项 | 选择 |
|---|---|
| 目录 | `~/Dwvelop/site-v2/` |
| 技术栈 | 纯静态 HTML + CSS + JS（零构建） |
| 首版范围 | 核心页（首页 + 模组 + 文档 + 关于）× 3 语 |
| 设计 | A+B 混合（深色底 + 作品集排版），主页不含模组内容，可切深浅主题 |
| 旧站资产 | 不带（体素彩蛋、主页模块都留在旧站），新站从零写 |
| 一直生效的旧规矩 | 不用蓝紫渐变；不用 Minecraft 官方素材/名字；不编文案 |

## 正式站的结构规划（零构建下的三语方案）

```
site-v2/
  index.html                 ← 简体首页（也可做成语言入口）
  zh/index.html              简体：首页
  zh/mods/index.html         简体：模组总览
  zh/mods/cursorkit/index.html   简体：Cursor Kit（含文档）
  zh/mods/safespawn/index.html   简体：SafeSpawn
  zh/mods/charmofundying/index.html
  zh/about/index.html        简体：关于
  zh-hant/…  en/…            繁体、英文，目录结构与页面一一对应
  assets/style.css           全站样式（一个文件，定稿后写）
  assets/site.js             小脚本（主题切换、动效、细节）
```

要点：

- **URL 干净**：每页一个目录 + `index.html`，线上地址形如 `/zh/mods/cursorkit/`
- **资源用相对路径**（`../../assets/style.css`）：既能被服务器托管，也能 `file://` 直接打开
- **语言切换不用 JS**：每页在页头硬写三个对应链接（简 / 繁 / EN）
- **正文写在 HTML 里**（不做前端渲染），这样搜索引擎与无 JS 环境都能读到内容
- **一份 CSS 管全站**，用 `:root` 变量做设计令牌；深浅色若要，用 `prefers-color-scheme`
- 部署：把 `site-v2/` 整个目录推到任意静态托管即可（GitHub Pages 也能直接放）

## 下一步

页头的 模组 / 音乐 / 经历 / 关于 目前指向 `mods/`、`music/`、`experience/`、`about/` —— **这些页面还没做**，
本地点是 404，属于预期。按这个顺序继续：

0. ~~博客 ×3 语~~ ✅ 已完成（markdown 文章 + giscus 评论，写文章不改网页）
1. ~~`about/`（关于）×3 语~~ ✅ 已完成（参考旧站主页的结构）
2. ~~`music/`（音乐）×3 语~~ ✅ 已完成（懒加载官方播放器；点击前不发外部请求）
3. ~~`experience/`（经历）×3 语~~ ✅ 页面与时间线组件已完成；**内容仍是占位**（旧站那页也是占位），等站长给年份与事件
4. ~~`mods/`（模组总览 + 三个模组详情页）×3 语~~ ✅ 已完成（共 12 页）
5. ~~404、站点地图、部署~~ ✅ 已完成（`404.html` / `sitemap.xml` / `robots.txt` / `.nojekyll` / 部署说明）

## 模组页的下载量

模组详情页的规格面板里有 **Modrinth / CurseForge 下载量**与**最新版本**（旧站那张信息卡就是这两项）：

- Modrinth：官方 API `api.modrinth.com`（允许跨域）
- CurseForge：`api.cfwidget.com`（官方 API 需要 key 且不允许浏览器直连，旧站用的就是这个只读代理）
- 任一平台**没配置或取不到就整行删掉**（dt + dd 一起删，不留空壳），最新版本同理 ——
  Cursor Kit 没有这两个平台的项目页，那三行就是直接消失的
- 因此模组页打开时会向这两个接口发请求（站点其它页面仍然零外部请求）

## 模组页是怎么搬过来的

`tools/port_mods.py` 把旧站的模组页转成新站页面，**正文按原样搬运、不改写内容**，只做机械替换：

- markdown → HTML（标题 / 段落 / 列表 / 表格 / 代码块 / 引用 / 分隔线 / 行内标记 / 图片）
- Liquid `{{ '/x' | relative_url }}` → 相对路径；旧的站内绝对链接 → 相对路径
- 旧 `mod-hero` → 页头（图标 + 一句话说明 + **作者自己写的下载按钮**，原样用作「链接」一行）
- 旧 `mod-toc` → 丢掉（`<a id>` 锚点挂到标题上，原有目录链接仍然可用）
- 旧 `figure.shot` → `<figure>` + 图片说明；光标包文档（原独立页）并入同一页，并补 `#packs` 标题
  让文档里「见《制作光标包》」那两个旧链接有落点
- 删除并入同页后才出现的冗余（旧 packs 页头部的「← Cursor Kit」小链接）

重跑：`python3 tools/port_mods.py`（会把图标与截图一起复制过来）。

## 版面约定（几轮反馈定下来的）

- 主页**只有**：首屏（欢迎语 + 本地时间）→「站内」列表（01 博客 / 02 音乐 / 03 经历 / 04 关于）→ 页脚。
  底部的「关于」「在别处」两个面板**已移除**。
- 关于页有两个面板：**相关链接**（五个平台文字胶囊，平台名 + 小注，不用图标）
  与 **站点运行情况**（`.spec` 规格表）。`.platforms` 那套图标按钮样式已随引用一起删掉。
- 「站点运行情况」的内容都是可核对的事实：页面数、已运行天数、语言、字体、外部请求。
  **已运行天数由 JS 按建站日期实时算**（`data-since="2026-08-07"`，取自旧站 `_data/site.yml`），
  不写死；**页面数写死在 HTML 里，但静态测试会拿实际页面数比对**，对不上就报错（防止悄悄过期）。
- 页脚在短页面上也贴着窗口底部（`body` 纵向 flex + `main { flex: 1 0 auto }`）。

## 已部署的线上地址（2026-10-16）

| 地址 | 内容 |
|---|---|
| https://fragmented-chaos.github.io/ | **新站**（本目录，零构建静态站，Pages 从 `main` 根目录发布） |
| https://fragmented-chaos.github.io/old/ | **旧版**（独立仓库 `Fragmented-Chaos/old`，`baseurl: /old`） |
| https://fragmented-chaos.github.io/sitemap.xml · /robots.txt · /404.html | 站点地图 / 抓取规则 / 404 |

推送通道：这台机器上 `github.com:443` 不通，改用 **`ssh.github.com:443`**
（`ssh://git@ssh.github.com:443/<owner>/<repo>.git`）可以正常 push。

## 部署（零构建静态站）

站点没有任何构建步骤，**把 `site-v2` 整个目录当静态站点发布即可**：

1. 推到仓库（比如 `Fragmented-Chaos/fragmented-chaos.github.io` 或任意仓库）
2. GitHub → Settings → Pages → Source 选分支根目录（`/`）
3. 域名定了以后改 `tools/make_sitemap.py` 顶部的 `BASE`，重跑 `python3 tools/make_sitemap.py`
   （`sitemap.xml`、`robots.txt` 一起更新；`tests/check.py` 会检查 sitemap 是否漏页）
4. `404.html` 会被 GitHub Pages 自动用于 404；`.nojekyll` 已放好，不会被 Jekyll 处理

本地预览：`python3 -m http.server 8480 --bind 127.0.0.1` → http://127.0.0.1:8480/
（`404.html` 用绝对路径，所以只有走服务器/托管才能看到；直接双击 `index.html` 也行，其余页面都可用。）

## 博客：写文章不用改网页

文章就是仓库里的 markdown 文件，页面用 JS 现取现渲染。**写完不用动任何 HTML**。

```
blog/posts/2026-10-16-hello.md     ← 一篇文章一个文件（文件名建议 日期-slug.md）
blog/posts/index.json              ← 本地预览用的清单
```

文章开头一小段 front matter：

```markdown
---
title: 标题
date: 2026-10-16
lang: zh          # zh / zh-hant / en；不写则三种语言的博客页都会列出
summary: 列表里显示的一句话摘要
---
正文，支持标题、粗体/斜体、行内代码、代码块、列表、引用、分割线、链接、图片，
也可以直接写原始 HTML（作者是自己人，不做屏蔽）。
```

**目录怎么来的**（页面上 `data-blog` 的 `data-repo` 决定）：

| 模式 | 配置 | 写文章要做什么 |
|---|---|---|
| GitHub API（**已启用**） | `data-repo="Fragmented-Chaos/fragmented-chaos.github.io"` | 只把 `.md` 推进仓库，**什么都不用改** |
| 本地清单 | `data-repo` 留空 | 放 `.md` + 往 `index.json` 加一行文件名（浏览器列不了目录，本地预览用） |

线上就是 GitHub API 模式：新增文章 = 在 `blog/posts/` 放一个 `.md` 并 push，列表自动出现。
本地预览（`file://` 或没连网）时会走 `index.json` 清单，所以两种模式都保留。

**正文的取法**：优先从**本站路径**取（`/blog/posts/<file>.md`，文章就在站点仓库里，Pages 直接提供），
`raw.githubusercontent.com` 只作备用 —— 2026-10-16 线上排查发现这个主机在部分网络下 HTTPS 不通
（TCP 能连、请求直接失败），所以不能作为唯一来源。列目录仍然走 `api.github.com`（可达）。

列表按 `date` 倒序；`?p=<slug>` 打开单篇（URL 可直接分享）。

## 评论（utterances，基于 GitHub Issues）

- **默认不加载任何第三方脚本**：文章底部有个「加载评论」，点了才注入 utterances
- **每篇文章一个 Issue**：`issue-term="title"`（正文页标题由脚本按文章标题设置，所以每篇各自成帖）
- 站点切深浅色会 `postMessage` 同步评论框主题（utterances 只认 `github-light` / `github-dark`）
- 启用只差一步：在这个仓库装一次 **utterances App** → https://github.com/apps/utterances
  （装到 `Fragmented-Chaos/fragmented-chaos.github.io`，装完评论就能用；仓库名已经写在页面的
  `data-comments-repo` 上，三语都要一起填）

**为什么不用 giscus**：giscus 基于 Discussions，需要仓库开启 Discussions 并拿到
`repo-id` / `category` / `category-id` 三个值（每次调整都得跑一趟 giscus.app）。utterances 基于
Issues（仓库默认就有），只需要仓库名。2026-10-16 线上排查时该仓库 `has_discussions: false`，
而 `github.com` 在本机不通、抓不到分类 ID，于是改用 utterances。想换回 giscus 的话：
开 Discussions + 建分类 + 装 giscus App，拿到那三个值后换回 `assets/blog.js` 里的评论段落即可。

## 本地预览

```sh
cd ~/Dwvelop/site-v2 && python3 -m http.server 8480 --bind 127.0.0.1
# 起始页 http://127.0.0.1:8480/   三语 http://127.0.0.1:8480/zh/ · /zh-hant/ · /en/
```

零构建，所以也可以直接双击 `index.html`（字体与相对路径都能用，实测 `file://` 下正常）。

## 测试

```sh
sh tests/run.sh          # 静态检查 + 浏览器行为，全部通过才 exit 0
```

- **静态**（`tests/check.py`，10 个页面）：站内链接与资源是否存在、三语页面集合是否一致、
  每页是否有 title/description/viewport/导航四栏/语言切换（恰好一个 `aria-current`）/主题按钮/
  页脚/脚本，图片是否都有 width+height+alt，以及**已删内容不得回归**（导航无「文档」、无那句废话）。
  导航指向尚未制作的页面会记为「待做」而不是失败。
- **浏览器**（`tests/browser_test.py`，9 个场景，无头 Edge 真跑 JS）：每页零 JS 报错、
  主题按钮点两下能来回切且 body 背景色真的变、首页时钟在走、头像真的加载、音乐页点击前 0 个
  iframe / 点击后 1 个且地址正确。

测试抓到并已修的问题：**英文页日期显示成中文**（`toLocaleDateString([])` 跟浏览器语言走）——
现在改成跟页面 `<html lang>` 走，英文页显示 `Friday, October 16, 2026`。

### 音乐页说明

- 数据来自旧站 `_data/music.yml`：1 首（`拼接乌托邦` / Ciyo · 见过夏天P · 乌托邦P / 网易云 id 3379996850）
- 只有"选曲"这一个功能：官方播放器是跨域 iframe，外层拿不到它的 DOM，自建播放控件没有意义；
  也不用 `<audio>` 去取音频直链（那属于第三方逆向，不做）
- **点击前不发任何外部请求**：iframe 在第一次点曲目时才创建（实测点击前 0 个 iframe，点击后 1 个）
- 旧站那份"从下面选一首开始播放"的占位文案因为槽带 `hidden` 一直是死内容，新站改成初始可见
