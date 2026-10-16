// 博客：列表 + 文章渲染 + 评论（giscus），零依赖、零构建。
//
// 写文章不用改网页：
//   · 文章是仓库里的 markdown 文件（blog/posts/<日期>-<slug>.md），带一小段 front matter
//   · 列目录有两种方式，页面用 data-repo 自动选：
//       data-repo="owner/repo"  → 走 GitHub API 列 blog/posts（零维护：文件放进去就出现）
//       没填 data-repo          → 走本地清单 blog/posts/index.json（本地预览用，浏览器列不了目录）
//   · 正文在浏览器里渲染：支持标题、段落、粗体/斜体、行内代码、代码块、列表、引用、分割线、
//     链接、图片；**原始 HTML 原样输出**（作者是自己人，正是为了能写表格/视频之类）
//
// 评论用 giscus（GitHub Discussions），并且：
//   · 默认不加载任何第三方脚本，点了「加载评论」才注入
//   · 每篇文章一个讨论：data-mapping="specific" + data-term=<slug>
//   · 站点的深浅色切换会同步给评论框（postMessage）
(function () {
  'use strict';

  var root = document.querySelector('[data-blog]');
  if (!root) return;

  var I18N = {};
  (function collect() {
    var host = root.querySelector('[data-blog-i18n]');
    if (!host) return;
    Array.prototype.forEach.call(host.querySelectorAll('[data-i18n]'), function (el) {
      I18N[el.getAttribute('data-i18n')] = (el.textContent || '').trim();
    });
  })();
  function t(k) { return I18N[k] != null ? I18N[k] : k; }

  var postsBase = root.getAttribute('data-posts') || '../../blog/posts';
  var repo = (root.getAttribute('data-repo') || '').trim();
  var pageLang = (document.documentElement.getAttribute('lang') || 'zh').slice(0, 2) === 'zh'
    ? (document.documentElement.getAttribute('lang') || '').toLowerCase().indexOf('hant') >= 0 ? 'zh-hant' : 'zh'
    : 'en';

  var els = {
    list: root.querySelector('[data-blog-list]'),
    post: root.querySelector('[data-blog-post]'),
    title: root.querySelector('[data-blog-title]'),
    meta: root.querySelector('[data-blog-meta]'),
    body: root.querySelector('[data-blog-body]'),
    back: root.querySelector('[data-blog-back]'),
    status: root.querySelector('[data-blog-status]'),
    comments: root.querySelector('[data-blog-comments]'),
  };

  // ---------- 极简 markdown ----------
  function inline(s) {
    return s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" decoding="async">')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  }

  function markdown(src) {
    var out = [], code = null, list = null;

    function closeList() { if (list) { out.push('</' + list + '>'); list = null; } }
    function openList(kind) { if (list !== kind) { closeList(); out.push('<' + kind + '>'); list = kind; } }

    src.split(/\r?\n/).forEach(function (line) {
      if (/^\s*```/.test(line)) {
        if (code === null) { closeList(); code = []; return; }
        out.push('<pre><code>' + escapeHtml(code.join('\n')) + '</code></pre>');
        code = null;
        return;
      }
      if (code !== null) { code.push(line); return; }

      if (/^\s*$/.test(line)) { closeList(); return; }

      var h = /^(#{1,6})\s+(.*)$/.exec(line);
      if (h) {
        closeList();
        var n = h[1].length;
        out.push('<h' + n + '>' + inline(h[2]) + '</h' + n + '>');
        return;
      }
      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { closeList(); out.push('<hr>'); return; }
      if (/^\s*>/.test(line)) { closeList(); out.push('<blockquote>' + inline(line.replace(/^\s*>\s?/, '')) + '</blockquote>'); return; }

      var ul = /^\s*[-*+]\s+(.*)$/.exec(line);
      var ol = /^\s*\d+\.\s+(.*)$/.exec(line);
      if (ul || ol) {
        openList(ul ? 'ul' : 'ol');
        out.push('<li>' + inline((ul || ol)[1]) + '</li>');
        return;
      }

      closeList();
      out.push('<p>' + inline(line) + '</p>');
    });

    if (code !== null && code.length) out.push('<pre><code>' + escapeHtml(code.join('\n')) + '</code></pre>');
    closeList();
    return out.join('\n');
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // ---------- front matter ----------
  function parsePost(text) {
    var meta = {}, body = text;
    var m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
    if (m) {
      m[1].split(/\r?\n/).forEach(function (line) {
        var kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
        if (kv) meta[kv[1].toLowerCase()] = kv[2].trim().replace(/^["']|["']$/g, '');
      });
      body = text.slice(m[0].length);
    }
    return { meta: meta, body: body };
  }

  function slugOf(path) {
    return path.split('/').pop().replace(/\.md$/i, '');
  }

  function formatDate(s) {
    if (!s) return '';
    var d = new Date(s);
    if (isNaN(d.getTime())) return s;
    var locale = document.documentElement.getAttribute('lang') || undefined;
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // ---------- 目录 ----------
  function loadIndex(done) {
    if (repo) {
      fetch('https://api.github.com/repos/' + repo + '/contents/blog/posts', {
        headers: { Accept: 'application/vnd.github+json' },
      })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (list) {
          done(list.filter(function (f) { return /\.md$/i.test(f.name); })
            .map(function (f) {
              return {
                path: f.path,
                // 正文优先从**本站**取（文章就在站点仓库里，Pages 直接能提供）；
                // raw.githubusercontent.com 在部分网络下不通，所以只当备用地址。
                download: postsBase + '/' + f.name,
                fallback: f.download_url,
                name: f.name,
              };
            }));
        })
        .catch(function (err) { done(null, err); });
      return;
    }
    fetch(postsBase + '/index.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (list) {
        done(list.map(function (p) {
          return { path: postsBase + '/' + p.file, download: postsBase + '/' + p.file, name: p.file };
        }));
      })
      .catch(function (err) { done(null, err); });
  }

  function fetchText(url, fallback) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).catch(function (err) {
      if (fallback) return fetchText(fallback);   // 备用地址（例如 raw.githubusercontent.com）
      throw err;
    });
  }

  // ---------- 列表 ----------
  function showList(items) {
    if (!items.length) { els.status.textContent = t('empty'); els.status.hidden = false; return; }
    var html = items.map(function (it) {
      var date = it.meta.date ? '<span class="post-date">' + formatDate(it.meta.date) + '</span>' : '';
      var sum = it.meta.summary ? '<span class="post-summary">' + escapeHtml(it.meta.summary) + '</span>' : '';
      return '<li><a class="post-link" href="?p=' + encodeURIComponent(it.slug) + '">' +
        '<span class="post-title">' + escapeHtml(it.meta.title || it.slug) + '</span>' +
        date + sum + '</a></li>';
    }).join('\n');
    els.list.innerHTML = html;
    els.list.hidden = false;
    els.post.hidden = true;
    els.status.hidden = true;
  }

  // ---------- 文章 ----------
  function showPost(item) {
    els.title.textContent = item.meta.title || item.slug;
    var bits = [];
    if (item.meta.date) bits.push(formatDate(item.meta.date));
    if (item.meta.author) bits.push(item.meta.author);
    els.meta.textContent = bits.join(' · ');
    els.body.innerHTML = markdown(item.body);
    els.list.hidden = true;
    els.post.hidden = false;
    els.status.hidden = true;
    if (document.title.indexOf(item.meta.title || item.slug) < 0) {
      document.title = (item.meta.title || item.slug) + ' · ' + document.title;
    }
    mountComments(item.slug);
  }

  // ---------- 评论（giscus，点击才加载） ----------
  var giscusTheme = function () {
    var explicit = document.documentElement.getAttribute('data-theme');
    if (explicit === 'light' || explicit === 'dark') return explicit;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  };

  function mountComments(slug) {
    var host = els.comments;
    if (!host || !slug) return;
    host.hidden = false;

    // 注意：评论仓库与「文章从哪列目录」是两件事，用各自的属性
    var commentsRepo = host.getAttribute('data-giscus-repo') || '';
    var repoId = host.getAttribute('data-giscus-repo-id');
    var category = host.getAttribute('data-giscus-category');
    var categoryId = host.getAttribute('data-giscus-category-id');
    var configured = commentsRepo && repoId && category && categoryId;

    var slot = host.querySelector('[data-comments-slot]');
    var button = host.querySelector('[data-comments-load]');
    var note = host.querySelector('[data-comments-note]');
    if (!configured) {
      if (button) button.hidden = true;
      if (note) {
        note.hidden = false;
        note.textContent = t('comments_unconfigured');
      }
      return;
    }

    if (button) {
      button.hidden = false;
      button.onclick = function () {
        button.hidden = true;
        if (note) note.hidden = true;
        var s = document.createElement('script');
        s.src = 'https://giscus.app/client.js';
        s.async = true;
        s.crossOrigin = 'anonymous';
        var attrs = {
          'data-repo': commentsRepo,
          'data-repo-id': repoId,
          'data-category': category,
          'data-category-id': categoryId,
          'data-mapping': 'specific',
          'data-term': slug,
          'data-reactions-enabled': '1',
          'data-emit-metadata': '0',
          'data-input-position': 'top',
          'data-theme': giscusTheme(),
          'data-lang': document.documentElement.getAttribute('lang') || 'zh-CN',
          'data-loading': 'lazy',
        };
        Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
        slot.appendChild(s);
      };
    }

    // 主题切换时同步评论框
    if (window.MutationObserver) {
      new MutationObserver(function () {
        var frame = slot.querySelector('iframe.giscus-frame');
        if (frame && frame.contentWindow) {
          frame.contentWindow.postMessage({ giscus: { setConfig: { theme: giscusTheme() } } }, 'https://giscus.app');
        }
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
  }

  // ---------- 入口 ----------
  var want = /[?&]p=([^&]+)/.exec(location.search);
  els.status.textContent = t('loading');
  els.status.hidden = false;

  loadIndex(function (files, err) {
    if (!files) {
      els.status.textContent = t('load_failed').replace('{err}', err ? String(err.message || err) : '?');
      return;
    }
    var wanted = files.slice(0, 60);
    Promise.all(wanted.map(function (f) {
      return fetchText(f.download, f.fallback).then(function (text) {
        var parsed = parsePost(text);
        return {
          slug: slugOf(f.name), path: f.path, download: f.download,
          meta: parsed.meta, body: parsed.body,
        };
      }).catch(function () { return null; });
    })).then(function (items) {
      items = items.filter(Boolean).filter(function (it) {
        // 文章可以标 lang：只在自己语言的博客页出现；不标则三语都出现
        return !it.meta.lang || it.meta.lang === pageLang;
      });
      items.sort(function (a, b) {
        return String(b.meta.date || '').localeCompare(String(a.meta.date || ''));
      });
      if (want) {
        var key = decodeURIComponent(want[1]);
        var hit = items.filter(function (it) { return it.slug === key; })[0];
        if (hit) { showPost(hit); return; }
      }
      showList(items);
    });
  });
})();
