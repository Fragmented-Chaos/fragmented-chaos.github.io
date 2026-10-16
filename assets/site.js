// site-v2 · 共享脚本：主题切换 + 本地时间
//
// 零依赖。主题的无闪烁由各页面 <head> 里的一小段内联脚本负责（在首次绘制前
// 就把 data-theme 定好），这里只做交互与后续维护。
//
// 主题规则：
//   · 默认不写 data-theme → 跟随系统 prefers-color-scheme
//   · 点按钮 → 显式在 light / dark 之间切换，并记进 localStorage
//   · 带 ?theme=light|dark 打开 → 只对本页生效，不写 localStorage（方便截图/分享）
// 按钮文案从 data-label-* 读，保持三语可本地化，JS 里不内嵌中文。
(function () {
  'use strict';

  var KEY = 'site-v2.theme';
  var root = document.documentElement;

  function mediaLight() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
  }

  function effective() {
    var t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return mediaLight() ? 'light' : 'dark';
  }

  function apply(theme, persist) {
    if (theme === 'light' || theme === 'dark') {
      root.setAttribute('data-theme', theme);
    } else {
      root.removeAttribute('data-theme');
    }
    if (persist) {
      try { localStorage.setItem(KEY, theme || ''); } catch (e) { /* 隐私模式忽略 */ }
    }
    syncButton();
  }

  function syncButton() {
    var btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    var next = effective() === 'light' ? 'dark' : 'light';
    var label = btn.getAttribute(next === 'dark' ? 'data-label-to-dark' : 'data-label-to-light');
    if (label) {
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    }
    btn.setAttribute('aria-pressed', effective() === 'light' ? 'true' : 'false');
  }

  function setupTheme() {
    var btn = document.querySelector('[data-theme-toggle]');
    if (btn) {
      btn.addEventListener('click', function () {
        apply(effective() === 'light' ? 'dark' : 'light', true);
      });
    }
    syncButton();
    // 没显式选过时，跟着系统变
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: light)');
      var onChange = function () { if (!root.getAttribute('data-theme')) syncButton(); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
    // 支持 ?theme=light|dark 临时覆盖（不写 localStorage）
    var m = /[?&]theme=(light|dark)\b/.exec(location.search);
    if (m) apply(m[1], false);
  }

  // 本地时间：页面上任何 [data-clock] / [data-clock-date] 都会被填上
  function setupClock() {
    var clocks = document.querySelectorAll('[data-clock]');
    var dates = document.querySelectorAll('[data-clock-date]');
    if (!clocks.length && !dates.length) return;

    // 用页面语言（<html lang>）而不是浏览器语言：英文页就该显示英文日期
    var locale = (document.documentElement.getAttribute('lang') || '').trim() || undefined;

    function tick() {
      var now = new Date();
      var time = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      var date = now.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
      Array.prototype.forEach.call(clocks, function (el) { el.textContent = time; });
      Array.prototype.forEach.call(dates, function (el) { el.textContent = date; });
    }

    tick();
    window.setInterval(tick, 1000);
  }


  // 站点运行天数：按建站日期实时算，不把天数写死
  function setupStats() {
    var els = document.querySelectorAll('[data-stats-days]');
    if (!els.length) return;
    Array.prototype.forEach.call(els, function (el) {
      var since = el.getAttribute('data-since');
      if (!since) return;
      var start = new Date(since + 'T00:00:00');
      if (isNaN(start.getTime())) return;
      var days = Math.floor((Date.now() - start.getTime()) / 86400000);
      el.textContent = days > 0 ? String(days) : '0';
    });
  }


  // 窄屏导航折叠：汉堡按钮切换；Esc 或点击面板外收起；窗口变宽自动复位
  function setupNavToggle() {
    var btn = document.querySelector('[data-nav-toggle]');
    var bar = btn ? btn.closest('.top-in') : null;
    if (!btn || !bar) return;

    function setOpen(open) {
      bar.setAttribute('data-nav-open', open ? 'true' : 'false');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    function isOpen() { return bar.getAttribute('data-nav-open') === 'true'; }

    setOpen(false);
    btn.addEventListener('click', function () { setOpen(!isOpen()); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) { setOpen(false); btn.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (isOpen() && !bar.contains(e.target)) setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 560 && isOpen()) setOpen(false);
    });
  }

  // 每个初始化独立兜底：任何一处出错都不影响其它功能（尤其是折叠菜单）
  function safe(label, fn) {
    try { fn(); } catch (err) { if (window.console) console.error('[site] ' + label + ' 初始化失败', err); }
  }

  // 起始页多语言：简/繁/EN 在页内切换文案（不跳转），「进入」跟随所选语言。
  // 链接的 href 仍指向对应语言首页 —— 没有 JS 时它们照样是可用入口（渐进增强）。
  function setupStartLang() {
    var links = document.querySelectorAll('.start-top .lang a[data-lang]');
    if (!links.length) return;

    var D = {
      'zh':      { kicker: '个人网站',    enter: '进入', old: '访问旧版', theme: '切换主题',
                   toDark: '切换到暗色主题', toLight: '切换到亮色主题', home: 'zh/', htmlLang: 'zh-CN' },
      'zh-hant': { kicker: '個人網站',    enter: '進入', old: '訪問舊版', theme: '切換主題',
                   toDark: '切換到暗色主題', toLight: '切換到亮色主題', home: 'zh-hant/', htmlLang: 'zh-Hant' },
      'en':      { kicker: 'Personal site', enter: 'Enter', old: 'Old version', theme: 'Toggle theme',
                   toDark: 'Switch to dark theme', toLight: 'Switch to light theme', home: 'en/', htmlLang: 'en' }
    };

    // 初始语言：?lang= → 上次选择 → 浏览器语言 → 中文
    var fromUrl = /[?&]lang=(zh-hant|zh|en)\b/.exec(location.search);
    var stored = null;
    try { stored = localStorage.getItem('site-v2.lang'); } catch (e) { /* 隐私模式忽略 */ }
    var nav = (navigator.language || 'en').toLowerCase();
    var guess = /^zh-(hant|tw|hk|mo)/.test(nav) ? 'zh-hant' : (/^zh/.test(nav) ? 'zh' : 'en');
    var lang = (fromUrl && fromUrl[1]) || stored || guess;
    if (!D[lang]) lang = 'zh';

    function apply(l) {
      var d = D[l];
      document.documentElement.setAttribute('lang', d.htmlLang);

      Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (el) {
        var v = d[el.getAttribute('data-i18n')];
        if (v === undefined) return;
        // 「进入 →」这种：只换前导文本节点，保留箭头 span
        if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.nodeValue = v + ' ';
        else el.textContent = v;
      });

      var enter = document.querySelector('.start-actions .btn-primary');
      if (enter) enter.setAttribute('href', d.home);

      var tt = document.querySelector('[data-theme-toggle]');
      if (tt) {
        tt.setAttribute('data-label-to-dark', d.toDark);
        tt.setAttribute('data-label-to-light', d.toLight);
      }

      Array.prototype.forEach.call(links, function (a) {
        if (a.getAttribute('data-lang') === l) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });

      try { localStorage.setItem('site-v2.lang', l); } catch (e) { /* 忽略 */ }
    }

    Array.prototype.forEach.call(links, function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();                       // 页内切换，不跳转
        apply(a.getAttribute('data-lang'));
      });
    });

    apply(lang);
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    safe('起始页语言', setupStartLang);
    safe('Theme', setupTheme);
    safe('Clock', setupClock);
    safe('统计', setupStats);
    safe('导航折叠', setupNavToggle);
  });
})();
