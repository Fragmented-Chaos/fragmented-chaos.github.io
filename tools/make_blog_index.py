#!/usr/bin/env python3
# 按 blog/posts/ 里的实际文件重生成 index.json（按文件名倒序 = 日期倒序）。
#
# 为什么需要它：线上博客列表用的是**同站**的 index.json（零外部依赖、不会卡），
# 而不是 GitHub API。写新文章只要放一个 .md，然后跑一次这个脚本即可。
#
# 用法：python3 tools/make_blog_index.py
import io, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS = os.path.join(ROOT, 'blog', 'posts')

files = sorted([f for f in os.listdir(POSTS) if f.endswith('.md')], reverse=True)
io.open(os.path.join(POSTS, 'index.json'), 'w', encoding='utf-8').write(
    json.dumps([{'file': f} for f in files], ensure_ascii=False, indent=2) + '\n')
print('  index.json: %d 篇' % len(files))
for f in files:
    print('    ' + f)
