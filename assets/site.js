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

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    safe('Theme', setupTheme);
    safe('Clock', setupClock);
    safe('统计', setupStats);
    safe('导航折叠', setupNavToggle);
  });
})();
