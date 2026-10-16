#!/usr/bin/env python3
# site-v2 自测：静态检查（不依赖浏览器）
#
# 检查项：
#   1. 页面清单完整（起始页 + 三语 × 首页/关于/音乐）
#   2. 站内链接指向的目标存在（含语言切换、导航）
#   3. 引用的资源（css/js/图片/字体）存在
#   4. 每页的结构不变式：title/description、导航四栏、语言切换三项且只有一个当前、
#      主题按钮、页脚、图片有 width/height/alt、脚本引入正确
#   5. 已删内容不得回归：导航里没有「文档」、没有那句废话
#   6. 三语一致：三种语言的页面集合一致
#
# 用法：python3 tests/check.py
import os, re, sys, html, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGS = ['zh', 'zh-hant', 'en']
SUBPAGES = ['', 'about/', 'music/', 'experience/', 'mods/', 'blog/']
# 模组详情页（比板块页深一层）
MOD_PAGES = ['mods/cursorkit/', 'mods/charmofundying/', 'mods/safespawn/']
# 尚未制作的页面（测试里记为"待做"，不算失败）
# 已规划但尚未制作的页面：记为「待做」而不是失败（当前没有）
PENDING = []

NAV_LABELS = {
    'zh': ['模组', '博客', '音乐', '经历', '关于'],
    'zh-hant': ['模組', '部落格', '音樂', '經歷', '關於'],
    'en': ['Mods', 'Blog', 'Music', 'Experience', 'About'],
}

problems = []
notes = []


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def page_path(lang, sub):
    return os.path.join(ROOT, lang, sub, 'index.html')


def pages():
    out = [('start', os.path.join(ROOT, 'index.html'))]
    for lang in LANGS:
        for sub in SUBPAGES + MOD_PAGES:
            out.append((f'{lang}/{sub or "home"}', page_path(lang, sub)))
    return out


def check_pages_exist():
    for name, path in pages():
        if not os.path.isfile(path):
            problems.append(f'缺页面：{name} → {path}')


ATTR = re.compile(r'(href|src)="([^"]+)"')


def is_external(url):
    return url.startswith(('http://', 'https://', 'mailto:', '#', 'data:'))


def target_exists(page_file, url):
    url = url.split('#')[0].split('?')[0]
    if not url:
        return True
    base = os.path.dirname(page_file)
    path = os.path.normpath(os.path.join(base, url))
    if os.path.isdir(path):
        return os.path.isfile(os.path.join(path, 'index.html'))
    return os.path.isfile(path)


def check_links_and_assets(name, path):
    src = read(path)
    for kind, url in ATTR.findall(src):
        if is_external(url):
            continue
        if not target_exists(path, url):
            rel = os.path.relpath(path, ROOT)
            if any(p in url for p in PENDING):
                notes.append(f'待做页面（导航已指过去）：{rel} → {url}')
            else:
                problems.append(f'链接/资源不存在：{rel} → {url}')


def check_invariants(name, path):
    src = read(path)
    rel = os.path.relpath(path, ROOT)
    lang = name.split('/')[0] if '/' in name else 'zh'

    if not re.search(r'<title>[^<]{2,}</title>', src):
        problems.append(f'{rel}: 缺 title')
    if 'name="description"' not in src:
        problems.append(f'{rel}: 缺 meta description')
    if 'viewport' not in src:
        problems.append(f'{rel}: 缺 viewport')

    # 起始页（根 index.html）按设计只有名字 + 进入 + 语言 + 主题，不设导航与站点页脚
    is_start = name == 'start'

    # 导航四栏
    if is_start:
        pass
    elif 'class="nav"' not in src:
        problems.append(f'{rel}: 缺导航')
    else:
        nav = re.search(r'<nav class="nav">(.*?)</nav>', src, re.S).group(1)
        for label in NAV_LABELS[lang]:
            if f'>{label}</a>' not in nav:
                problems.append(f'{rel}: 导航缺「{label}」')
        if '文档' in nav:
            problems.append(f'{rel}: 导航里还有「文档」（应已移除）')

    # 语言切换：三项，恰好一个 aria-current
    marks = re.findall(r'<span class="lang">(.*?)</span>', src, re.S)
    if not marks:
        problems.append(f'{rel}: 缺语言切换')
    else:
        block = marks[0]
        links = re.findall(r'<a [^>]*>', block)
        if len(links) != 3:
            problems.append(f'{rel}: 语言切换应为 3 项，实际 {len(links)}')
        cur = len(re.findall(r'aria-current="true"', block))
        if cur != 1:
            problems.append(f'{rel}: 语言切换应有 1 个 aria-current，实际 {cur}')

    # 主题按钮
    if 'data-theme-toggle' not in src:
        problems.append(f'{rel}: 缺主题切换按钮')
    if 'data-label-to-dark' not in src or 'data-label-to-light' not in src:
        problems.append(f'{rel}: 主题按钮缺 data-label-*（无障碍文案）')

    # 页脚与脚本（起始页按设计没有页脚）
    if is_start:
        pass
    elif 'site-footer' not in src:
        problems.append(f'{rel}: 缺页脚')
    if 'assets/site.js' not in src:
        problems.append(f'{rel}: 未引入 site.js')
    if '/music/' in rel and 'assets/music.js' not in src:
        problems.append(f'{rel}: 音乐页未引入 music.js')

    # 图片必须有尺寸与 alt（避免布局跳动/无障碍缺失）
    for tag in re.findall(r'<img[^>]*>', src):
        if 'width=' not in tag or 'height=' not in tag:
            problems.append(f'{rel}: 有 <img> 缺 width/height')
        if 'alt=' not in tag:
            problems.append(f'{rel}: 有 <img> 缺 alt')

    # 已删内容不得回归
    for banned in ['这里放我听的歌', '三个版本', '语言 <b>']:
        if banned in src:
            problems.append(f'{rel}: 出现已删内容「{banned}」')


def check_site_files():
    """收尾文件：404、sitemap、robots、.nojekyll，且 sitemap 与实际页面一一对应。"""
    for name in ('404.html', 'sitemap.xml', 'robots.txt', '.nojekyll'):
        if not os.path.isfile(os.path.join(ROOT, name)):
            problems.append(f'缺收尾文件：{name}')
    sm = os.path.join(ROOT, 'sitemap.xml')
    if os.path.isfile(sm):
        locs = set(re.findall(r'<loc>([^<]+)</loc>', read(sm)))
        paths = set()
        for name, path in pages():
            rel = os.path.relpath(os.path.dirname(path), ROOT)
            paths.add('/' if rel == '.' else '/' + rel.replace(os.sep, '/') + '/')
        in_sitemap = set(re.sub(r'^https?://[^/]+', '', u) for u in locs)
        for missing in sorted(paths - in_sitemap):
            problems.append(f'sitemap 漏了页面：{missing}（重跑 tools/make_sitemap.py）')
        for extra in sorted(in_sitemap - paths):
            problems.append(f'sitemap 多了页面：{extra}')
    rb = os.path.join(ROOT, 'robots.txt')
    if os.path.isfile(rb) and 'sitemap.xml' not in read(rb):
        problems.append('robots.txt 没指向 sitemap.xml')


def check_feed_and_og():
    """feed.xml 必须列出所有文章；每个生产页面都要有社交卡片标签。"""
    feed = os.path.join(ROOT, 'feed.xml')
    if not os.path.isfile(feed):
        problems.append('缺 feed.xml（跑 tools/make_feed.py）')
    else:
        f = read(feed)
        posts = os.path.join(ROOT, 'blog', 'posts')
        for name in sorted(os.listdir(posts)):
            if name.endswith('.md') and name[:-3] not in f:
                problems.append(f'feed.xml 漏了文章：{name}（跑 tools/make_feed.py）')
        if '<urlset' in f:
            problems.append('feed.xml 内容不对（像是 sitemap）')
    for name, path in pages():
        src = read(path)
        if 'property="og:title"' not in src:
            problems.append(f'{os.path.relpath(path, ROOT)}: 缺社交卡片标签（og:title）')
        if 'property="og:image"' not in src:
            problems.append(f'{os.path.relpath(path, ROOT)}: 缺 og:image')


def check_blog_index():
    """博客清单 blog/posts/index.json 必须与目录里的 .md 一一对应（防止写完文章忘了登记）。"""
    posts = os.path.join(ROOT, 'blog', 'posts')
    if not os.path.isdir(posts):
        return
    real = sorted(f for f in os.listdir(posts) if f.endswith('.md'))
    idx_path = os.path.join(posts, 'index.json')
    if not os.path.isfile(idx_path):
        problems.append('缺 blog/posts/index.json（跑 tools/make_blog_index.py）')
        return
    try:
        listed = sorted(x['file'] for x in json.loads(read(idx_path)))
    except Exception as e:
        problems.append(f'blog/posts/index.json 解析失败：{e}')
        return
    for f in real:
        if f not in listed:
            problems.append(f'文章没登记进 index.json：{f}（跑 tools/make_blog_index.py）')
    for f in listed:
        if f not in real:
            problems.append(f'index.json 记了不存在的文章：{f}')


def check_stats_numbers():
    """关于页「站点运行情况」里写的页面数必须等于真实页面数 —— 防止数字悄悄过期。"""
    real = len(pages())
    for lang in LANGS:
        p = page_path(lang, 'about/')
        if not os.path.isfile(p):
            continue
        src = read(p)
        m = re.search(r'<span data-stats-pages>(\d+)</span>', src)
        if not m:
            problems.append(f'{lang}/about/: 缺「站点运行情况」里的页面数')
            continue
        if int(m.group(1)) != real:
            problems.append(f'{lang}/about/: 写的页面数 {m.group(1)} ≠ 实际 {real}（该更新了）')
        if 'data-since=' not in src:
            problems.append(f'{lang}/about/: 缺建站日期 data-since')


def check_lang_parity():
    for sub in SUBPAGES + MOD_PAGES:
        for lang in LANGS:
            p = page_path(lang, sub)
            if not os.path.isfile(p):
                problems.append(f'三语不一致：缺 {lang}/{sub or "home"}')
    # 语言切换目标必须存在
    for name, path in pages():
        src = read(path)
        block = re.search(r'<span class="lang">(.*?)</span>', src, re.S)
        if not block:
            continue
        for url in re.findall(r'href="([^"]+)"', block.group(1)):
            if not target_exists(path, url):
                problems.append(f'{os.path.relpath(path, ROOT)}: 语言切换指向不存在的 {url}')


def main():
    check_pages_exist()
    for name, path in pages():
        if os.path.isfile(path):
            check_links_and_assets(name, path)
            check_invariants(name, path)
    check_lang_parity()
    check_stats_numbers()
    check_blog_index()
    check_feed_and_og()
    check_site_files()

    print(f'检查页面：{len(pages())} 个')
    if notes:
        print(f'\n待做（不计失败）{len(notes)} 条：')
        for n in sorted(set(notes)):
            print('  · ' + n)
    if problems:
        print(f'\n失败 {len(problems)} 条：')
        for p in problems:
            print('  ✗ ' + p)
        sys.exit(1)
    print('\n静态检查全部通过 ✓')


if __name__ == '__main__':
    main()
