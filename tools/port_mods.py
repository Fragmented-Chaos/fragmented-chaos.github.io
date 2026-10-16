#!/usr/bin/env python3
# 把旧站的三个模组页搬到 site-v2（含 Cursor Kit 的文档与光标包文档）。
#
# 原则：**正文按原样搬运，不改写内容**。脚本只做这些机械替换：
#   · markdown → HTML（标题 / 段落 / 列表 / 表格 / 代码块 / 引用 / 分隔线 / 行内标记 / 图片）
#   · Liquid `{{ '/x' | relative_url }}` → 对应的相对路径
#   · 旧 class（mod-hero / mod-toc / figure.shot）→ 新结构（页头规格面板 / 自动目录 / 正文图片）
#   · `<a id="x"></a>` 锚点 → 标题上的 id（目录链接仍可用）
#
# 用法：python3 tools/port_mods.py
import io, os, re, shutil, sys

OLD = os.path.expanduser('~/Dwvelop/fragmented-chaos.github.io')
NEW = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGS = ['zh', 'zh-hant', 'en']

MODS = {
    'cursorkit': dict(
        name={'zh': 'Cursor Kit', 'zh-hant': 'Cursor Kit', 'en': 'Cursor Kit'},
        icon='cursorkit/icon.png',
        repo='https://github.com/Fragmented-Chaos/Cursor-Kit',
        extra_doc='cursorkit/packs.md',           # 光标包文档并入同一页
    ),
    'charmofundying': dict(
        name={'zh': 'Charm of Undying：Reborn', 'zh-hant': 'Charm of Undying：Reborn',
              'en': 'Charm of Undying: Reborn'},
        icon='charmofundying/icon.png',
        repo='https://github.com/Fragmented-Chaos/Charm-of-Undying-Reborn',
        extra_doc=None,
    ),
    'safespawn': dict(
        name={'zh': 'SafeSpawn', 'zh-hant': 'SafeSpawn', 'en': 'SafeSpawn'},
        icon='safespawn/icon.png',
        repo='https://github.com/Fragmented-Chaos/SafeSpawn',
        extra_doc=None,
    ),
}

SPEC_LABELS = {
    'zh': ['版本', '加载器', '前置', '许可', '链接'],
    'zh-hant': ['版本', '載入器', '前置', '授權', '連結'],
    'en': ['Version', 'Loaders', 'Requires', 'License', 'Links'],
}
DOC_TITLE = {'zh': '文档', 'zh-hant': '文件', 'en': 'Documentation'}
MOD_LABEL = {'zh': '模组', 'zh-hant': '模組', 'en': 'Mods'}
KICKER = {'zh': 'MOD · 简体', 'zh-hant': 'MOD · 繁體', 'en': 'MOD · English'}
FOOT = {'zh': '模组', 'zh-hant': '模組', 'en': 'Mods'}
LABELS = {'zh': ('切换到暗色主题', '切换到亮色主题', '切换主题'),
          'zh-hant': ('切換到暗色主題', '切換到亮色主題', '切換主題'),
          'en': ('Switch to dark theme', 'Switch to light theme', 'Toggle theme')}
# 模组总览在上一层（../），其余板块在 ../../ 层
NAV = {'zh': [('模组', '../'), ('博客', '../../blog/'), ('音乐', '../../music/'),
              ('经历', '../../experience/'), ('关于', '../../about/')],
       'zh-hant': [('模組', '../'), ('部落格', '../../blog/'), ('音樂', '../../music/'),
                   ('經歷', '../../experience/'), ('關於', '../../about/')],
       'en': [('Mods', '../'), ('Blog', '../../blog/'), ('Music', '../../music/'),
              ('Experience', '../../experience/'), ('About', '../../about/')]}

HEAD = '''<script>
  (function () {
    try {
      var m = /[?&]theme=(light|dark)\\b/.exec(location.search);
      var t = m ? m[1] : localStorage.getItem('site-v2.theme');
      if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    } catch (e) { /* 隐私模式忽略 */ }
  })();
</script>'''


def read(p):
    with io.open(p, encoding='utf-8') as f:
        return f.read()


def front_matter(text):
    m = re.match(r'^---\r?\n([\s\S]*?)\r?\n---\r?\n?', text)
    meta, body = {}, text
    if m:
        for line in m.group(1).split('\n'):
            kv = re.match(r'^([A-Za-z_][\w-]*)\s*:\s*(.*)$', line)
            if kv:
                meta[kv.group(1)] = kv.group(2).strip().strip('"')
        body = text[m.end():]
    return meta, body


def slug_of(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


# ---------- markdown → HTML ----------
def inline(s):
    s = s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'!\[([^\]]*)\]\(([^)\s]+)\)', r'<img src="\2" alt="\1" loading="lazy" decoding="async">', s)
    s = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', r'<a href="\2">\1</a>', s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'(?<![\w*])\*([^*\n]+)\*(?![\w*])', r'<em>\1</em>', s)
    return s


def md_block(lines, pending_anchor):
    """把一段正文行转成 HTML。返回 (html, 用掉的锚点)。"""
    out, i = [], 0
    anchor = pending_anchor
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            i += 1
            continue

        # 代码块
        if stripped.startswith('```'):
            i += 1
            buf = []
            while i < len(lines) and not lines[i].strip().startswith('```'):
                buf.append(lines[i])
                i += 1
            i += 1
            out.append('<pre><code>' + '\n'.join(buf).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;') + '</code></pre>')
            continue

        # 表格
        if stripped.startswith('|') and i + 1 < len(lines) and re.match(r'^\|[\s:|-]+\|$', lines[i + 1].strip()):
            def cells(row):
                return [c.strip() for c in row.strip().strip('|').split('|')]
            head = cells(lines[i])
            i += 2
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                rows.append(cells(lines[i]))
                i += 1
            t = ['<table><thead><tr>' + ''.join('<th>' + inline(c) + '</th>' for c in head) + '</tr></thead><tbody>']
            for r in rows:
                t.append('<tr>' + ''.join('<td>' + inline(c) + '</td>' for c in r) + '</tr>')
            t.append('</tbody></table>')
            out.append('\n'.join(t))
            continue

        # 标题（吃掉前面挂着的锚点）
        h = re.match(r'^(#{1,6})\s+(.*)$', stripped)
        if h:
            n = len(h.group(1))
            n = 2 if n == 1 else n          # 页面自己的 h1 在页头，正文从 h2 起
            aid = (' id="%s"' % anchor) if anchor else ''
            anchor = None
            out.append('<h%d%s>%s</h%d>' % (n, aid, inline(h.group(2)), n))
            i += 1
            continue

        # 原始 HTML 块（文档里的 <figure> 等）原样透传，不能被 inline() 转义
        if stripped.startswith('<'):
            raw = [line]
            i += 1
            while i < len(lines) and lines[i].strip() and not re.match(
                    r'^\s*(#{1,6}\s|[-*+]\s|\d+\.\s|>|\|)', lines[i]):
                raw.append(lines[i])
                i += 1
            out.append('\n'.join(raw))
            continue

        # 分隔线
        if re.match(r'^(-{3,}|\*{3,}|_{3,})$', stripped):
            out.append('<hr>')
            i += 1
            continue

        # 引用
        if stripped.startswith('>'):
            out.append('<blockquote>' + inline(stripped.lstrip('> ').strip()) + '</blockquote>')
            i += 1
            continue

        # 列表（支持一层缩进嵌套）
        if re.match(r'^\s*[-*+]\s+', line) or re.match(r'^\s*\d+\.\s+', line):
            ordered = bool(re.match(r'^\s*\d+\.\s+', line))
            tag = 'ol' if ordered else 'ul'
            out.append('<%s>' % tag)
            while i < len(lines) and (re.match(r'^\s*[-*+]\s+', lines[i]) or re.match(r'^\s*\d+\.\s+', lines[i])):
                indent = len(lines[i]) - len(lines[i].lstrip())
                text = re.sub(r'^\s*(?:[-*+]|\d+\.)\s+', '', lines[i])
                if indent >= 2 and out and out[-1].startswith('<li>'):
                    out[-1] = out[-1][:-len('</li>')] + '<ul><li>' + inline(text) + '</li></ul></li>'
                else:
                    out.append('<li>' + inline(text) + '</li>')
                i += 1
            out.append('</%s>' % tag)
            continue

        # 段落（把连续行并成一段）
        buf = [stripped]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(
                r'^\s*(#{1,6}\s|[-*+]\s|\d+\.\s|>|\||```|<)', lines[i]):
            buf.append(lines[i].strip())
            i += 1
        out.append('<p>' + inline(' '.join(buf)) + '</p>')

    return '\n'.join(out), anchor


def convert(body, lang, slug):
    """旧页正文 → 新页正文 HTML。返回 (html, icon_src, tagline, actions)。"""
    # 页面在 {lang}/mods/{slug}/ → 站点根是往上三层
    prefix = '../../../'
    src = body
    icon, tagline, actions = None, None, []

    # Liquid {{ '/x' | relative_url }} → /x（后面统一转相对路径）
    src = re.sub(r"\{\{\s*'([^']+)'\s*\|\s*relative_url\s*\}\}", r'\1', src)

    # mod-hero：按 div 配平整块取出（图标 / 一句话说明 / 作者写的下载按钮）
    hero = src.find('<div class="mod-hero">')
    if hero >= 0:
        depth, end = 0, None
        for m in re.finditer(r'<div\b|</div>', src[hero:]):
            depth += 1 if m.group(0) == '<div' else -1
            if depth == 0:
                end = hero + m.end()
                break
        if end:
            block = src[hero:end]
            im = re.search(r'<img[^>]*src="([^"]+)"', block)
            tm = re.search(r'<p class="mod-tagline">(.*?)</p>', block, re.S)
            if im:
                icon = im.group(1)
            if tm:
                tagline = tm.group(1).strip()
            actions = [(re.sub(r'<[^>]+>', '', label).strip(), href)
                       for href, label in re.findall(
                           r'<a class="btn[^"]*" href="([^"]+)"[^>]*>(.*?)</a>', block, re.S)]
            src = src[:hero] + src[end:]

    # mod-toc：丢掉（目录链接仍可用，锚点会挂到标题上）
    src = re.sub(r'<div class="mod-toc">.*?</div>', '', src, flags=re.S)

    # 旧 packs 页头部的「← Cursor Kit」小链接：并入同页后属于冗余
    src = re.sub(r'<p class="mods-others">.*?</p>', '', src, flags=re.S)

    # figure.shot → 新 figure（这个在前面做，后面统一改写 src）
    def fig(m):
        block = m.group(1)
        im = re.search(r'<img[^>]*>', block)
        cap = re.search(r'<figcaption>(.*?)</figcaption>', block, re.S)
        img = re.sub(r'\s*class="[^"]*"', '', im.group(0)) if im else ''
        cap_html = '<figcaption>%s</figcaption>' % cap.group(1).strip() if cap else ''
        return '<figure>%s%s</figure>' % (img, cap_html)

    src = re.sub(r'<figure class="shot">(.*?)</figure>', fig, src, flags=re.S)

    # <a id="x"></a> → 锚点挂到下一个标题
    html_parts, buf, pending = [], [], None
    for line in src.split('\n'):
        a = re.match(r'^\s*<a id="([^"]+)"></a>\s*$', line)
        if a:
            if buf:
                h, pending = md_block(buf, pending)
                html_parts.append(h)
                buf = []
            pending = a.group(1)
            continue
        buf.append(line)
    if buf:
        h, pending = md_block(buf, pending)
        html_parts.append(h)

    html = '\n'.join(x for x in html_parts if x.strip())

    # 站内绝对链接 → 相对路径（放在 markdown 转换之后：此时 [文本](/x) 已是 <a href="/x">）
    def link(m):
        href = m.group(1)
        if re.match(r'^/(?:(?:zh-hant|zh|en)/)?mods/[a-z]+/packs/?$', href):
            return 'href="#packs"'            # 光标包文档已并入本页
        cross = re.match(r'^/(zh-hant|zh|en)/mods/([a-z]+)/?$', href)
        if cross:
            return 'href="%s%s/mods/%s/"' % (prefix, cross.group(1), cross.group(2))
        if re.match(r'^/mods/[a-z]+/?$', href):
            return 'href="./"'                # 旧的同页链接
        if href.startswith('/assets/'):
            return 'href="%s%s"' % (prefix, href.lstrip('/'))
        return m.group(0)

    html = re.sub(r'href="([^"]+)"', link, html)
    html = re.sub(r'src="([^"]+)"', lambda m: 'src="%s%s"' % (prefix, m.group(1).lstrip('/'))
                  if m.group(1).startswith('/assets/') else m.group(0), html)
    return html, icon, tagline, actions



# ---------- 页面组装 ----------
def page(lang, slug, meta, doc_html, icon, tagline, links):
    name = MODS[slug]['name'][lang]
    L = SPEC_LABELS[lang]
    DL_WORD = {'zh': '次下载', 'zh-hant': '次下載', 'en': 'downloads'}[lang]
    LATEST = {'zh': '最新版本', 'zh-hant': '最新版本', 'en': 'Latest version'}[lang]
    nav = '\n'.join('      <a href="%s"%s>%s</a>' % (href, ' aria-current="page"' if i == 0 else '', label)
                    for i, (label, href) in enumerate(NAV[lang]))
    langs = '\n'.join('        <a href="../../../%s/mods/%s/"%s>%s</a>' % (c, slug, ' aria-current="true"' if c == lang else '', lab)
                      for c, lab in (('zh', '简'), ('zh-hant', '繁'), ('en', 'EN')))
    td, tl, sw = LABELS[lang]
    chips = '\n'.join('            <li><a href="%s" target="_blank" rel="noopener">%s</a></li>' % (u, n) for n, u in links)
    icon_html = ''
    if icon:
        icon_html = ('        <img class="mod-icon" src="%s%s" width="72" height="72" alt="%s 图标" loading="lazy" decoding="async">\n'
                     % ('../../../', icon.lstrip('/'), name))
    dl_attrs = ' data-downloads'
    if meta.get('modrinth'):
        dl_attrs += ' data-modrinth="%s"' % meta['modrinth']
    if meta.get('curseforge'):
        dl_attrs += ' data-curseforge="%s"' % meta['curseforge']
    if meta.get('curseforge_id'):
        dl_attrs += ' data-curseforge-id="%s"' % meta['curseforge_id']
    return f'''<!DOCTYPE html>
<html lang="{ {'zh': 'zh-CN', 'zh-hant': 'zh-Hant-TW', 'en': 'en'}[lang] }">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{name} · Fragmented_Chaos</title>
<meta name="description" content="{tagline or name}">
{HEAD}
<link rel="stylesheet" href="../../../assets/base.css">
</head>
<body>

<header class="top">
  <div class="wrap top-in">
    <a class="mark" href="../../../index.html">Fragmented<b>_</b>Chaos</a>
    <nav class="nav">
{nav}
      <span class="lang">
{langs}
      </span>
      <button type="button" class="theme-toggle" data-theme-toggle
              aria-pressed="false"
              data-label-to-dark="{td}" data-label-to-light="{tl}">
        <span class="sr-only">{sw}</span>
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2"/>
          <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/>
        </svg>
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z"/>
        </svg>
      </button>
    </nav>
  </div>
</header>

<main>
  <section class="wrap page-head" style="padding-bottom:1.5rem">
    <p class="kicker" style="margin:0 0 1.25rem;font-size:.74rem;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--soft)">{KICKER[lang]}</p>
    <div class="mod-head">
{icon_html}      <div>
        <h1>{name}</h1>
        <p class="mod-tagline">{tagline or ''}</p>
      </div>
    </div>
  </section>

  <section class="wrap" style="padding-bottom:2rem">
    <div class="panel"{dl_attrs}>
      <dl class="spec">
        <dt>{L[0]}</dt><dd>{meta.get('card_mc', '')}</dd>
        <dt>{L[1]}</dt><dd>{meta.get('card_loaders', '')}</dd>
        <dt>{L[2]}</dt><dd>{meta.get('card_requires', '')}</dd>
        <dt>{L[3]}</dt><dd>{meta.get('card_license', '')}</dd>
        <dt data-dl-row="modrinth">Modrinth</dt><dd data-dl-cell="modrinth"><span data-dl-count="modrinth">—</span> {DL_WORD}</dd>
        <dt data-dl-row="curseforge">CurseForge</dt><dd data-dl-cell="curseforge"><span data-dl-count="curseforge">—</span> {DL_WORD}</dd>
        <dt data-latest-row>{LATEST}</dt><dd data-latest-version>—</dd>
        <dt>{L[4]}</dt><dd>
          <ul class="chips">
{chips}
          </ul>
        </dd>
      </dl>
    </div>
  </section>

  <section class="wrap" style="padding-bottom:3.5rem">
    <article class="post-body">
{doc_html}
    </article>
  </section>
</main>

<footer class="site-footer">
  <div class="wrap foot">
    <span>Fragmented_Chaos · StewedTuba73416 / Rending_Void</span>
    <span>{FOOT[lang]}</span>
  </div>
</footer>

<script src="../../../assets/site.js" defer></script>
<script src="../../../assets/downloads.js" defer></script>
</body>
</html>
'''



def spec_links(lang, slug, meta, actions):
    """规格面板里的链接：优先用作者在页头自己写的按钮，没写才按 front matter 兜底。"""
    if actions:
        return actions
    out = []
    if meta.get('modrinth'):
        out.append(('Modrinth', 'https://modrinth.com/mod/' + meta['modrinth']))
    if meta.get('curseforge'):
        out.append(('CurseForge', 'https://www.curseforge.com/minecraft/mc-mods/' + meta['curseforge']))
    out.append(('GitHub', MODS[slug]['repo']))
    return out


def main():
    # 1) 图片资源
    for slug, cfg in MODS.items():
        dst_dir = os.path.join(NEW, 'assets/images', slug)
        os.makedirs(dst_dir, exist_ok=True)
        src_icon = os.path.join(OLD, 'assets/images', cfg['icon'])
        shutil.copy2(src_icon, os.path.join(dst_dir, 'icon.png'))
        print('  图片 %s/icon.png' % slug)
    for img in ('picker.webp', 'states.webp', 'hotspots.webp'):
        shutil.copy2(os.path.join(OLD, 'assets/images/cursorkit', img),
                     os.path.join(NEW, 'assets/images/cursorkit', img))
        print('  图片 cursorkit/%s' % img)

    # 2) 三个模组 × 三语
    for slug, cfg in MODS.items():
        for lang in LANGS:
            md = os.path.join(OLD, lang, 'mods', slug + '.md')
            if not os.path.isfile(md):
                sys.exit('缺源文件：' + md)
            meta, body = front_matter(read(md))
            doc, icon, tagline, actions = convert(body, lang, slug)

            if cfg['extra_doc']:
                extra = os.path.join(OLD, lang, 'mods', cfg['extra_doc'])
                emeta, ebody = front_matter(read(extra))
                edoc, _, _, _ = convert(ebody, lang, slug)
                # 并入同一页：给光标包文档一节标题，旧链接 #packs 才有落点
                etitle = emeta.get('title') or DOC_TITLE[lang]
                doc = doc + '\n<hr>\n<h2 id="packs">%s</h2>\n' % etitle + edoc

            html = page(lang, slug, meta, doc, icon or ('assets/images/%s/icon.png' % slug),
                        tagline, spec_links(lang, slug, meta, actions))
            dst = os.path.join(NEW, lang, 'mods', slug, 'index.html')
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            with io.open(dst, 'w', encoding='utf-8') as f:
                f.write(html)
            print('  页面 %s/mods/%s/index.html  (%d KB, 表格 %d, 图 %d, h2 %d)'
                  % (lang, slug, len(html) // 1024, html.count('<table>'),
                     html.count('<img'), html.count('<h2')))


if __name__ == '__main__':
    main()
