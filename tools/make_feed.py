#!/usr/bin/env python3
# 由 blog/posts/*.md 生成 feed.xml（Atom）。
# 只取 front matter 里的 title / date / summary，正文不塞进 feed（读者点链接回站点看），
# 这样 feed 永远很小、也不会因为 markdown 渲染差异出问题。
#
# 用法：python3 tools/make_feed.py
import io, os, re, html, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS = os.path.join(ROOT, 'blog', 'posts')
BASE = 'https://fragmented-chaos.github.io'
FEED_TITLE = 'Fragmented_Chaos'
FEED_SUBTITLE = {'zh': '个人网站 · 博客', 'zh-hant': '個人網站 · 部落格', 'en': 'Personal site · Blog'}


def front_matter(text):
    meta = {}
    m = re.match(r'^---\r?\n([\s\S]*?)\r?\n---', text)
    if m:
        for line in m.group(1).split('\n'):
            kv = re.match(r'^([A-Za-z_][\w-]*)\s*:\s*(.*)$', line)
            if kv:
                meta[kv.group(1).lower()] = kv.group(2).strip().strip('"')
    return meta


def main():
    items = []
    for f in sorted(os.listdir(POSTS)):
        if not f.endswith('.md'):
            continue
        meta = front_matter(io.open(os.path.join(POSTS, f), encoding='utf-8').read())
        slug = f[:-3]
        lang = meta.get('lang', 'zh')
        items.append({
            'slug': slug,
            'title': meta.get('title', slug),
            'summary': meta.get('summary', ''),
            'date': meta.get('date', ''),
            'lang': lang,
            'url': f'{BASE}/{lang}/blog/?p={slug}',
        })
    items.sort(key=lambda x: x['date'], reverse=True)
    updated = (items[0]['date'] + 'T00:00:00Z') if items and items[0]['date'] else \
        datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

    out = ['<?xml version="1.0" encoding="utf-8"?>',
           '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="zh-CN">',
           f'  <title>{FEED_TITLE}</title>',
           f'  <subtitle>{html.escape(FEED_SUBTITLE["zh"])}</subtitle>',
           f'  <link href="{BASE}/feed.xml" rel="self"/>',
           f'  <link href="{BASE}/zh/blog/"/>',
           f'  <id>{BASE}/</id>',
           f'  <updated>{updated}</updated>',
           '  <author><name>Fragmented_Chaos</name></author>']
    for it in items:
        out += ['  <entry>',
                f'    <title>{html.escape(it["title"])}</title>',
                f'    <link href="{it["url"]}"/>',
                f'    <id>{it["url"]}</id>']
        if it['date']:
            out.append(f'    <updated>{it["date"]}T00:00:00Z</updated>')
        if it['summary']:
            out.append(f'    <summary>{html.escape(it["summary"])}</summary>')
        out.append('  </entry>')
    out.append('</feed>')
    io.open(os.path.join(ROOT, 'feed.xml'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print(f'  feed.xml: {len(items)} 篇')
    for it in items:
        print('    ' + it['slug'])


if __name__ == '__main__':
    main()
