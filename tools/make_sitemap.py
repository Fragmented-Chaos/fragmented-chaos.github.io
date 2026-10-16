#!/usr/bin/env python3
# 生成 sitemap.xml 与 robots.txt。
#
# 站点是零构建静态站，所以这两个文件用脚本产出；**部署域名只需要改下面这一处**。
# 页面清单直接扫目录得到（排除 mockups / tests / tools / screenshots 等非页面目录），
# 所以新增页面后重跑一次即可，不会漏。
#
# 用法：python3 tools/make_sitemap.py
import io, os, datetime

# ↓↓↓ 部署域名（换域名只改这一行）↓↓↓
BASE = 'https://fragmented-chaos.github.io'
# ↑↑↑ 换域名只改这一行 ↑↑↑

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# old/ 是旧版静态快照（不是新站页面），不进 sitemap
SKIP_DIRS = {'mockups', 'tests', 'tools', 'screenshots', '.git', 'assets', 'old'}


def pages():
    found = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith('.')]
        if 'index.html' in filenames:
            rel = os.path.relpath(dirpath, ROOT)
            url = BASE + '/' if rel == '.' else BASE + '/' + rel.replace(os.sep, '/') + '/'
            mtime = os.path.getmtime(os.path.join(dirpath, 'index.html'))
            found.append((url, datetime.date.fromtimestamp(mtime).isoformat()))
    found.sort()
    return found


def main():
    rows = pages()
    xml = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url, lastmod in rows:
        xml.append('  <url>')
        xml.append('    <loc>%s</loc>' % url.replace('&', '&amp;'))
        xml.append('    <lastmod>%s</lastmod>' % lastmod)
        xml.append('  </url>')
    xml.append('</urlset>')
    io.open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write('\n'.join(xml) + '\n')

    io.open(os.path.join(ROOT, 'robots.txt'), 'w', encoding='utf-8').write(
        'User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n' % BASE)

    # GitHub Pages 默认会用 Jekyll 处理：放一个 .nojekyll 关掉它，按原样发布
    io.open(os.path.join(ROOT, '.nojekyll'), 'w', encoding='utf-8').write('')

    print('  sitemap.xml: %d 个页面' % len(rows))
    for url, _ in rows:
        print('    ' + url.replace(BASE, '') or '/')
    print('  robots.txt + .nojekyll 已写入')


if __name__ == '__main__':
    main()
