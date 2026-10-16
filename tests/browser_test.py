#!/usr/bin/env python3
# site-v2 自测：浏览器行为（用无头 Edge 真跑 JS）
#
# 每个页面注入一段探针，检查：
#   · 有没有 JS 报错
#   · 主题按钮点两下能否来回切换，且 body 背景色真的跟着变
#   · 首页的本地时间是否在走（形如 14:23:05）
#   · 图片（头像）是否真的加载成功（naturalWidth > 0）
#   · 音乐页：点击前 0 个 iframe，点击后 1 个且地址正确、该行高亮
#
# 用法：python3 tests/browser_test.py
import os, re, html, shutil, subprocess, sys, time, socket

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/site-v2-browsertest'
EDGE = '/opt/microsoft/msedge/msedge'
PORT = 8390

# (标签, 路径, 主题, 虚拟时间预算ms)
CASES = [
    ('起始页', 'index.html', 'dark', 4000),
    ('首页·简 dark', 'zh/', 'dark', 4000),
    ('首页·简 light', 'zh/', 'light', 4000),
    ('首页·繁 dark', 'zh-hant/', 'dark', 4000),
    ('首页·EN light', 'en/', 'light', 4000),
    ('关于·简 dark', 'zh/about/', 'dark', 4000),
    ('关于·EN light', 'en/about/', 'light', 4000),
    ('博客·列表', 'zh/blog/', 'dark', 8000),
    ('博客·文章', 'zh/blog/?p=2026-10-16-hello', 'light', 8000),
    # 播放器要等 1~2 秒才画出来，探针本身等 3 秒 → 预算给到 9 秒
    ('音乐·简 dark', 'zh/music/', 'dark', 9000),
    ('音乐·EN light', 'en/music/', 'light', 9000),
]

PROBE = """
<script>
window.__err = [];
window.addEventListener('error', function (e) {
  window.__err.push((e.message || '') + '@' + (e.filename || '').split('/').pop() + ':' + e.lineno);
});
window.addEventListener('load', function () {
  setTimeout(function () {
    var out = document.createElement('pre');
    out.id = 'test';
    document.body.appendChild(out);          // 先挂上，后面随时代谢结果
    var L = [];
    function flush() { out.textContent = L.join('\\n'); }

    L.push('errors=' + window.__err.length + (window.__err.length ? ' [' + window.__err.join('; ') + ']' : ''));

    // 关掉过渡：虚拟时间下 CSS 过渡不推进，读数会停在起点
    document.body.style.transition = 'none';
    var root = document.documentElement;
    var btn = document.querySelector('[data-theme-toggle]');
    if (!btn) {
      L.push('theme=无按钮');
    } else {
      var initial = root.getAttribute('data-theme') || '(system)';
      var bg0 = getComputedStyle(document.body).backgroundColor;
      btn.click();
      var t1 = root.getAttribute('data-theme'), bg1 = getComputedStyle(document.body).backgroundColor;
      btn.click();
      var t2 = root.getAttribute('data-theme'), bg2 = getComputedStyle(document.body).backgroundColor;
      L.push('theme init=' + initial + ' bg=' + bg0 + ' | click1=' + t1 + ' bg=' + bg1 + ' | click2=' + t2 + ' bg=' + bg2);
    }

    var clock = document.querySelector('[data-clock]');
    if (clock) {
      var d = document.querySelector('[data-clock-date]');
      L.push('clock=' + clock.textContent + ' | date=' + (d ? d.textContent : '-'));
    }

    var days = document.querySelector('[data-stats-days]');
    if (days) {
      var pages = document.querySelector('[data-stats-pages]');
      L.push('stats pages=' + (pages ? pages.textContent.trim() : '-') + ' | days=' + days.textContent.trim() +
        ' | since=' + (days.getAttribute('data-since') || '-'));
    }

    var imgs = Array.prototype.slice.call(document.images);
    if (imgs.length) {
      L.push('images=' + imgs.map(function (im) {
        return im.getAttribute('src').split('/').pop() + ':' + (im.naturalWidth > 0 ? 'ok' : 'FAIL');
      }).join(','));
    }

    flush();

    // 博客：等列表/文章渲染出来（要先 fetch）
    var blog = document.querySelector('[data-blog]');
    if (blog) {
      setTimeout(function () {
        var list = document.querySelector('[data-blog-list]');
        var post = document.querySelector('[data-blog-post]');
        var title = document.querySelector('[data-blog-title]');
        var body = document.querySelector('[data-blog-body]');
        var comments = document.querySelector('[data-blog-comments]');
        L.push('blog list=' + (list.hidden ? 'hidden' : list.querySelectorAll('li').length + 'posts') +
          ' | post=' + (post.hidden ? 'hidden' : 'shown') +
          ' | title=' + (title.textContent ? title.textContent.slice(0, 24) : '(empty)') +
          ' | blocks=' + body.querySelectorAll('h2, ul, pre, blockquote, hr').length +
          ' | comments=' + (comments.hidden ? 'hidden' : 'shown'));
        flush();
      }, 2500);
      return;
    }

    // 音乐页：点击曲目 → 播放器是网易官方 iframe，实测要等 1~2 秒才画出来
    var track = document.querySelector('[data-kind="netease"]');
    if (!track) return;
    function withSrc() {
      return Array.prototype.filter.call(document.querySelectorAll('.embed-frame'), function (f) {
        return !!f.getAttribute('src');
      }).length;
    }
    var before = withSrc();
    track.click();
    var f = document.querySelector('.embed-frame');
    setTimeout(function () {
      var slot = document.querySelector('[data-embed-slot]');
      var ext = document.querySelector('.embed-external');
      L.push('music iframes ' + before + '→' + withSrc() +
        ' | src=' + (f && f.getAttribute('src') ? f.getAttribute('src').slice(0, 56) : '-') +
        ' | active=' + track.classList.contains('is-active') +
        ' | player=' + (slot.getAttribute('data-state') || 'none') +
        ' | ext=' + (ext && !ext.hidden ? 'ok' : 'missing'));
      flush();
    }, 3000);
  }, 700);
});
</script>
"""


def free_port(start):
    p = start
    while p < start + 40:
        with socket.socket() as s:
            if s.connect_ex(('127.0.0.1', p)) != 0:
                return p
        p += 1
    raise RuntimeError('没有空闲端口')


def prepare():
    if os.path.isdir(TMP):
        shutil.rmtree(TMP)
    shutil.copytree(ROOT, TMP, ignore=shutil.ignore_patterns('screenshots', '.git'))
    count = 0
    for dirpath, _, files in os.walk(TMP):
        for f in files:
            if f.endswith('.html'):
                p = os.path.join(dirpath, f)
                src = open(p, encoding='utf-8').read()
                if '</body>' in src:
                    open(p, 'w', encoding='utf-8').write(src.replace('</body>', PROBE + '</body>'))
                    count += 1
    return count


def dump(port, path, theme, budget=4000):
    sep = '&' if '?' in path else '?'
    url = f'http://127.0.0.1:{port}/{path}{sep}theme={theme}'
    r = subprocess.run([EDGE, '--headless=new', '--disable-gpu', f'--virtual-time-budget={budget}',
                        '--dump-dom', url], capture_output=True, text=True, timeout=120)
    m = re.search(r'<pre id="test">(.*?)</pre>', r.stdout, re.S)
    return html.unescape(m.group(1)) if m else '(没读到探针输出)'


def main():
    n = prepare()
    print(f'注入探针的页面：{n} 个 → {TMP}')
    port = free_port(PORT)
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'],
                           cwd=TMP, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.5)
    failures = []
    try:
        for label, path, theme, budget in CASES:
            out = dump(port, path, theme, budget)
            print(f'\n── {label}  ({path}{"&" if "?" in path else "?"}theme={theme})')
            for line in out.splitlines():
                print('   ' + line)
            if 'errors=0' not in out:
                failures.append(f'{label}: JS 报错 → {out.splitlines()[0] if out else "?"}')
            if 'FAIL' in out:
                failures.append(f'{label}: 资源加载失败 → {out}')
            if 'theme init=' in out:
                line = [l for l in out.splitlines() if l.startswith('theme ')][0]
                m = re.search(r'click1=(\w+).*?bg=(\S+).*?click2=(\w+)', line)
                arms = re.findall(r'bg=(rgb\([^)]*\))', line)
                if len(arms) == 3 and arms[0] == arms[1]:
                    failures.append(f'{label}: 点一次主题后背景色没变（{line}）')
                if m and m.group(1) == m.group(3):
                    failures.append(f'{label}: 点两次没回到相反主题（{line}）')
            if 'stats ' in out:
                m = re.search(r'stats pages=(\S+) \| days=(\S+) \| since=(\S+)', out)
                if not m:
                    failures.append(f'{label}: 站点运行情况解析失败 → {out}')
                else:
                    if not re.match(r'^\d+$', m.group(1)):
                        failures.append(f'{label}: 页面数不是数字（{m.group(1)}）')
                    if not re.match(r'^\d+$', m.group(2)):
                        failures.append(f'{label}: 运行天数没算出来（{m.group(2)}）')
                    if m.group(3) != '2026-08-07':
                        failures.append(f'{label}: 建站日期丢了（{m.group(3)}）')
            if 'clock=' in out:
                c = re.search(r'clock=(\S+)', out)
                if c and not re.match(r'^\d{2}:\d{2}:\d{2}$', c.group(1)):
                    failures.append(f'{label}: 时钟内容异常（{c.group(1)}）')
            if '关于' in label and 'stats ' not in out:
                failures.append(f'{label}: 站点运行情况没出现 → {out}')
            if '博客' in label and 'blog ' not in out:
                failures.append(f'{label}: 博客报告没出现 → {out}')
            if '博客' in label and 'blog ' in out:
                m = re.search(r'blog list=(\S+).*?post=(\w+).*?title=(.*?) \| blocks=(\d+).*?comments=(\w+)', out)
                if not m:
                    failures.append(f'{label}: 博客输出解析失败 → {out}')
                else:
                    if '列表' in label and (m.group(1) == 'hidden' or m.group(1) == '0posts'):
                        failures.append(f'{label}: 博客列表没渲染 → {out}')
                    if '文章' in label and (m.group(2) != 'shown' or m.group(3) == '(empty)' or int(m.group(4)) == 0):
                        failures.append(f'{label}: 文章没渲染出内容 → {out}')
                    if '文章' in label and m.group(5) != 'shown':
                        failures.append(f'{label}: 文章页评论区没出现 → {out}')
                    if '列表' in label and m.group(5) != 'hidden':
                        failures.append(f'{label}: 列表页不该出现评论区 → {out}')
            if '音乐' in label and 'music iframes' not in out:
                failures.append(f'{label}: 播放器报告没出现（探针未跑完或出错）→ {out}')
            if 'music iframes' in out:
                m = re.search(r'music iframes (\d+)→(\d+).*?active=(\w+).*?player=(\w+).*?ext=(\w+)', out)
                if not m or m.group(1) != '0' or m.group(2) != '1' or m.group(3) != 'true' or m.group(5) != 'ok':
                    failures.append(f'{label}: 播放器懒加载异常 → {out}')
    finally:
        srv.terminate()

    print('\n' + '=' * 60)
    if failures:
        print(f'浏览器测试失败 {len(failures)} 条：')
        for f in failures:
            print('  ✗ ' + f)
        sys.exit(1)
    print(f'浏览器测试全部通过 ✓（{len(CASES)} 个场景）')


if __name__ == '__main__':
    main()
