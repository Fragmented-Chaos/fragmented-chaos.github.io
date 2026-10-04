# fragmented-chaos.github.io

个人主页 + 模组的说明站点。**Jekyll**（GitHub Pages 原生构建），不加载任何主题，样式和脚本全部自建。

线上地址：https://fragmented-chaos.github.io/

## 目录结构

```
index.md              落地页（唯一留在根的页面；URL 就是 /）

zh/                   简体中文页面（URL 前缀 /zh/）
zh-hant/              繁体中文页面（URL 前缀 /zh-hant/，OpenCC s2twp 台湾用词）
en/                   英文页面（URL 前缀 /en/）
                      三者文件名与结构完全一致，互为对照

每个语言目录下：
  home.md             主页（头像、社交按钮）
  about.md            关于我（含站点统计小卡）
  experience.md       经历（时间线）
  mods.md             模组列表
  mods/<模组>.md       各个模组页
  mods/cursorkit/packs.md   光标包教程（文档型长页）
  music.html          音乐播放器（用 HTML 写的）
  tetris.md           俄罗斯方块彩蛋
  404.md              404 页

**例外**：`zh/404.md` 的地址固定是 `/404.html`（不是 `/zh/404.html`）—— GitHub Pages 只在站点根目录找 404 页。

_layouts/             页面骨架
  default.html        全站基础：头部导航、页脚、主题切换、语言跳转
  page.html           普通文档页（正文包一层 .page-body）
  mod.html            模组页（正文 + 右侧信息卡）
  home.html / about.html / tetris.html / landing.html / bare.html

_data/                数据（Jekyll 自动加载为 site.data.*）
  i18n.yml            三语文案（zh / zh-hant / en）。**加文案时三种都要加**，少一个键会渲染成空白
  pages.yml           每个页面的三语地址。语言切换器靠它；新页面必须在这里登记三种
  site.yml            站点元信息（建站日期）
  music.yml           音乐播放器的曲目清单

_sass/                样式（SCSS partial，由 assets/main.scss 按顺序 @import）
assets/
  main.scss           样式入口（只有 front matter + @import）
  css 编译产物不在这里，由 Jekyll 现场编译
  images/             图标与截图
  fonts/              自托管字体（Google Fonts 在国内经常连不上，所以放本地）
  audio/              音乐播放器的音频
  js/
    site.js           全站组件：回到顶部、阅读进度条、代码复制、时钟、访客计数
    downloads.js      模组页的下载量与最新版本号
    music.js          音乐播放器

scripts/check-i18n.mjs 多语言数据完整性检查（本地和 CI 都跑）
.github/workflows/     推送时自动跑上面的检查

_config.yml           Jekyll 配置（含排除列表）
Gemfile               GitHub Pages 的依赖
robots.txt / sitemap.xml   给搜索引擎的文件
```

## 日常维护

**加一个页面**（比如「我在用的」）：

1. 建 `zh/tools.md`、`zh-hant/tools.md`、`en/tools.md`，照抄现有页面的 front matter：

   ```yaml
   ---
   layout: page
   lang: zh             # 另两个写 zh-hant / en
   key: tools           # 语言切换用的标识，三份必须一致
   title: 我在用的
   permalink: /zh/tools/    # 另两个写 /zh-hant/tools/、/en/tools/
   ---
   ```

2. 在 `_data/pages.yml` 里登记三个地址（**漏了语言切换会指向空链接**）：

   ```yaml
   tools:
     zh: /zh/tools/
     zh-hant: /zh-hant/tools/
     en: /en/tools/
   ```

3. 要出现在顶部导航的话，在 `_layouts/default.html` 的 `<nav>` 里加一行。

**页面的语言约定**：`permalink` 决定上线地址，**和文件放在哪无关**，所以移动源文件不会改变 URL。三种语言分别写 `/zh/xxx/`、`/zh-hant/xxx/`、`/en/xxx/`。

**旧地址怎么办**：简体页面原本在 `/xxx/`（没有 `/zh` 前缀），迁移时在每个页面的 front matter 里加了 `redirect_from`，靠 `jekyll-redirect-from` 插件发 301 跳转，旧链接不会失效。

**繁体文案怎么来的**：`opencc -c s2twp`（台湾用词，光標→游標、视频→影片、默认→預設）批量转换后人工过了一遍术语。以后改简体文案时，**繁体和英文都要同步更新**。

**音乐页**：页面只有「一个选曲列表 + 一个官方播放器槽」，点哪首就让官方播放器播哪首。

为什么不放自建播放控件：平台播放器是 **跨域 iframe** —— 外层拿不到它的 DOM（同源策略），
它也没有监听 `postMessage` 的入口（网易与 B站的播放器脚本都查过，只会往外发消息）。
播放/暂停/进度/音量只能用它自己的控件，摆一排点了没反应的按钮只会让人以为坏了。

配置在 `_data/music.yml`：

- **整张歌单**：`netease.playlist_id`（从分享链接取数字 ID）
- **逐首**：`netease.songs` 每条填 `id`，再填 `title` / `artist`（从歌曲页的公开信息里抄）
- 歌名/歌手是**手填**的，不抓接口。填了列表里就能看到，留空则显示「未命名曲目」。

**版权边界**：只嵌入平台官方播放器（歌是平台拿到授权的，广告与会员限制照旧）；
**不要把别人有版权的音频下载进仓库**，也不要用第三方逆向接口取音频直链喂给自建播放器。

## 本地预览

仓库里没有构建依赖，预览用隔壁 `~/Dwvelop/site-preview/`：

```bash
cd ~/Dwvelop/site-preview
node build.mjs        # 复刻 Jekyll 渲染链，输出到 _site，并检查死链与锚点
python3 serve.py 8080 # 本地服务（支持 Range 请求与自定义 404 回退）
```

## 推送前检查

```bash
node scripts/check-i18n.mjs
```

检查中英键是否一致、页面引用的 `t.xxx` 是否存在、`_data/pages.yml` 是否漏登记路由。
GitHub Actions 也会在每次推送时自动跑（但 GitHub Pages 的构建是独立的，这个检查只亮红叉，不会拦住发布）。
