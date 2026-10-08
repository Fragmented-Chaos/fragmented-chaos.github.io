// 站点通用交互，纯原生、零依赖，随 default 布局在所有页面加载：
// 1. 回到顶部 —— 滚过一屏后右下角浮出；
// 2. 代码块复制 —— 文档页里全是 JSON / 配置片段，点一下复制，省掉手工选中。
// 两件各自判断前提：页面太短就不建按钮，没有代码块就不加按钮。
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ---------- 回到顶部 ---------- */
  function setupBackToTop(label) {
    // 一屏以内不需要它：先按文档高度做一次便宜判断，短页面根本不建按钮。
    if (document.documentElement.scrollHeight < window.innerHeight * 1.8) return;

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'back-to-top';
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
      ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>';
    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
    });
    document.body.appendChild(button);

    var visible = false;
    function update() {
      var next = window.scrollY > window.innerHeight * 0.8;
      if (next === visible) return;
      visible = next;
      button.classList.toggle('is-visible', next);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------- 代码块复制 ---------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // http 页面或老浏览器没有异步剪贴板，退回到 execCommand。
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (e) {
        ok = false;
      }
      document.body.removeChild(area);
      ok ? resolve() : reject(new Error('copy failed'));
    });
  }

  function setupCopyButtons(labels) {
    var blocks = document.querySelectorAll('.page-body pre');
    if (!blocks.length) return;

    Array.prototype.forEach.call(blocks, function (pre) {
      var code = pre.querySelector('code');
      if (!code) return;

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy';
      button.textContent = labels.copy;
      button.setAttribute('aria-label', labels.copy);
      button.addEventListener('click', function () {
        copyText(code.innerText.replace(/\n$/, '')).then(function () {
          button.textContent = labels.copied;
          button.classList.add('is-copied');
        }, function () {
          button.textContent = labels.failed;
          button.classList.add('is-failed');
        });
        window.setTimeout(function () {
          button.textContent = labels.copy;
          button.classList.remove('is-copied', 'is-failed');
        }, 1600);
      });
      pre.appendChild(button);
    });
  }

  /* ---------- 404：随便看看 ---------- */
  // 目标列表由 404 页在 data 属性里给出（按当前语言生成），这里只负责随机挑一个，
  // 并在跳转前把目的地名字滚一遍，让“随机”这件事看得见。
  function setupRandomTeleport() {
    var button = document.querySelector('.error-random');
    if (!button) return;

    var urls = (button.getAttribute('data-random-urls') || '').split('|').filter(Boolean);
    var names = (button.getAttribute('data-random-names') || '').split('|');
    if (!urls.length) {
      button.parentNode.removeChild(button);
      return;
    }

    var label = button.textContent;
    button.addEventListener('click', function () {
      var index = Math.floor(Math.random() * urls.length);
      var url = urls[index];

      if (reducedMotion()) {
        window.location.href = url;
        return;
      }

      // 400ms 内把名字快速滚过去，停在被选中的那个，然后跳转。
      var ticks = 9;
      var step = 0;
      button.disabled = true;
      var timer = window.setInterval(function () {
        button.textContent = names[step % names.length] || label;
        step++;
        if (step >= ticks) {
          window.clearInterval(timer);
          button.textContent = names[index] || label;
          window.location.href = url;
        }
      }, 45);
    });
  }

  /* ---------- 阅读进度条 ---------- */
  // 只给真正需要滚动的页面装：短页面顶部多一条线是纯噪音。
  function setupReadingProgress(label) {
    var doc = document.documentElement;
    if (doc.scrollHeight < window.innerHeight * 2) return;

    var bar = document.createElement('div');
    bar.className = 'reading-progress';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', label);
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    bar.setAttribute('aria-valuenow', '0');
    document.body.appendChild(bar);

    function update() {
      var scrollable = doc.scrollHeight - window.innerHeight;
      var ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      var percent = Math.round(ratio * 100);
      bar.style.transform = 'scaleX(' + ratio + ')';
      bar.setAttribute('aria-valuenow', String(percent));
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- 访客计数 ---------- */
  // 为什么不在这里放第三方计数器：不蒜子那类服务实测经常整站无响应，挂了数字就变 0。
  // 数据来自自建 Cloudflare Worker（~/Dwvelop/visitor-worker），地址写在外层元素的 data 属性上。
  //
  // 「站长自己不计数」靠三层判断，注意是**在发请求之前**就返回，所以站长访问根本到不了服务端：
  //   1. 站长标记：访问一次 /?owner=1 写进 localStorage，之后这台设备永久不计数（?owner=0 取消）
  //   2. 本地/预览环境（localhost、127.0.0.1、file://）只读 /stats，能看到状态和现有数字但**不计数**
  //   3. 停留 5 秒且页面可见才请求，且一个会话同一页面只计一次 —— 调样式时反复刷新不会产生数据
  //
  // 显示三态：请求开始 → 「连接中…」；成功 → 数字；失败/超时 → 「连接失败」。
  // 宁可让访客看到"连接失败"，也不要静默消失——否则出问题时看不出是坏了还是没数据。
  function setupVisitorCounter(labels) {
    var box = document.querySelector('.footer-visits');
    if (!box) return;

    // 预渲染（<script type="speculationrules">）时会先把页面在后台渲染好，
    // 但访客可能根本没点进来 —— 那样就会多算一次访问。
    // 所以预渲染阶段什么都不做，等页面真的被激活再继续。
    if (document.prerendering) {
      document.addEventListener('prerenderingchange', function () {
        setupVisitorCounter(labels);
      }, { once: true });
      return;
    }

    var api = (box.getAttribute('data-counter-api') || '').replace(/\/+$/, '');
    var target = box.getAttribute('data-counter-target') || 'site';
    var OWNER_KEY = 'fragmentedchaos-owner';

    function store(fn, fallback) {
      try {
        return fn();
      } catch (e) {
        return fallback; // 隐私模式下 localStorage 可能直接抛异常
      }
    }

    // 先处理站长标记：即便这次不显示数字，也要能通过网址把标记设上。
    var ownerParam = /[?&]owner=([01])/.exec(window.location.search);
    if (ownerParam) {
      store(function () { window.localStorage.setItem(OWNER_KEY, ownerParam[1]); }, null);
    }
    if (store(function () { return window.localStorage.getItem(OWNER_KEY); }, null) === '1') return;

    // 没配地址是配置问题，不是连接失败：整块不出现。
    if (!api) return;

    var host = window.location.hostname;
    var isLocal = host === 'localhost' || host === '127.0.0.1' || window.location.protocol === 'file:';

    // 同一个会话、同一个页面只报一次
    var sessionKey = 'cursorkit-counted:' + window.location.pathname;
    if (!isLocal && store(function () { return window.sessionStorage.getItem(sessionKey); }, null) === '1') {
      return;
    }

    var value = box.querySelector('.footer-visits-value');

    function show(text) {
      if (value) value.textContent = text;
      box.hidden = false;
    }

    function visitorId() {
      var id = store(function () { return window.localStorage.getItem('fragmentedchaos-visitor'); }, null);
      if (!id) {
        id = '';
        var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < 24; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
        store(function () { window.localStorage.setItem('fragmentedchaos-visitor', id); }, null);
      }
      return id;
    }

    function count() {
      if (document.visibilityState !== 'visible') return;
      var headers = { Accept: 'application/json' };
      var id = visitorId();
      if (id) headers['X-Visitor-Id'] = id;

      // 本地预览只读：能看到状态和现有数字，但不会把自己的调试访问算进去。
      var endpoint = isLocal ? '/stats' : '/hit';

      // 先亮出「连接中…」，让访客知道正在取数字，而不是一片空白。
      show(labels.connecting);

      // 接口在部分网络下会被拦，浏览器自己要等几十秒才放弃。给个 8 秒上限，早点给出结论。
      var options = { headers: headers, cache: 'no-store' };
      var abortTimer = 0;
      try {
        var controller = new window.AbortController();
        options.signal = controller.signal;
        abortTimer = window.setTimeout(function () { controller.abort(); }, 8000);
      } catch (e) {
        // 老浏览器没有 AbortController：就让它自然超时，功能不变
      }

      function done() {
        if (abortTimer) {
          window.clearTimeout(abortTimer);
          abortTimer = 0;
        }
      }

      fetch(api + endpoint + '?t=' + encodeURIComponent(target), options)
        .then(function (res) {
          if (!res.ok) throw new Error(String(res.status));
          return res.json();
        })
        .then(function (data) {
          done();
          if (!data || !data.site || typeof data.site.pv !== 'number') {
            show(labels.failed);
            return;
          }
          show(Number(data.site.pv).toLocaleString());
          if (!isLocal) {
            store(function () { window.sessionStorage.setItem(sessionKey, '1'); }, null);
          }
        }, function () {
          done();
          // 被拦、worker 没部署、额度用完、超过 8 秒：明确告诉访客连接失败
          show(labels.failed);
        });
    }

    // 满足“停留 5 秒”再请求；页面隐藏时不动。
    window.setTimeout(count, 5000);
  }

  /* ---------- 页脚实时时钟 ---------- */
  // 显示访客自己时区的时间，每秒走一格。用 <time> 标签，datetime 放机器可读值、
  // title 放完整日期，鼠标停上去能看到"2026年10月4日 星期日"。
  // 时钟是纯装饰，页面里没有这个元素时什么都不做。
  // 关于页的统计数字：滚到眼前时从 0 递增到实际值。
  // 只是"数一下"的观感，所以数字本身在 HTML 里就是最终值 ——
  // 万一这段脚本没跑（禁用 JS、旧浏览器、减少动态效果），看到的也是正确数字。
  function setupStatsCountUp() {
    var nodes = document.querySelectorAll('.site-stats-value');
    if (!nodes.length) return;

    function numberNode(el) {
      var first = el.firstChild;
      return first && first.nodeType === 3 ? first : null; // 只动最前面的纯文本数字
    }

    // 「已运行天数」是构建时算出来的，而 GitHub Pages 只在推送时重建 ——
    // 两次推送之间这个数字不会变。所以带 data-since 的数字在这里按建站日期重算，
    // 访客看到的永远是当前天数（构建值作为无 JS 时的兜底）。
    function liveTarget(el) {
      var since = el.getAttribute('data-since');
      if (!since) return null;
      var start = new Date(since + 'T00:00:00');
      if (isNaN(start.getTime())) return null;
      var days = Math.floor((Date.now() - start.getTime()) / 86400000);
      return days >= 0 ? days : null;
    }

    // 第一步与动画无关：先把数字改对。
    // 这样"减少动态效果"或没有 rAF 的环境下，看到的也是正确天数。
    Array.prototype.forEach.call(nodes, function (el) {
      var node = numberNode(el);
      var live = liveTarget(el);
      if (node && live !== null) node.nodeValue = String(live);
    });

    if (reducedMotion() || !window.requestAnimationFrame) return;

    function animate(el) {
      var node = numberNode(el);
      if (!node) return;

      var target = liveTarget(el);
      if (target === null) target = parseInt(node.nodeValue.replace(/[^0-9]/g, ''), 10);
      if (!target || target > 100000) return;

      var duration = 900;
      var started = null;
      function step(now) {
        if (started === null) started = now;
        var progress = Math.min((now - started) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); // 先快后慢
        node.nodeValue = String(Math.round(target * eased));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          node.nodeValue = String(target); // 收尾对回精确值
        }
      }
      window.requestAnimationFrame(step);
    }

    if (!window.IntersectionObserver) {
      Array.prototype.forEach.call(nodes, animate);
      return;
    }
    var observer = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        animate(entry.target);
      });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(nodes, function (node) { observer.observe(node); });
  }

  function setupClock() {
    var el = document.querySelector('[data-clock]');
    if (!el) return;

    function tick() {
      var now = new Date();
      el.textContent = now.toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      });
      el.setAttribute('datetime', now.toISOString());
      el.setAttribute('title', now.toLocaleDateString([], {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
      }));
    }

    tick();
    window.setInterval(tick, 1000);
  }

  /* ---------- 页脚「最后更新」按访客时区显示 ---------- */
  // 服务端渲染的是站点时区（Asia/Shanghai）的时间，所有访客看到的都一样；
  // 这里按 datetime 属性里的绝对时刻换算成访客本地时间，和旁边的实时时钟保持一致。
  // 格式仍用 YYYY-MM-DD HH:MM:SS（不跟系统区域格式走，免得同一站出现多种写法）。
  // JS 不可用时保留服务端那份北京时间，不会空白。
  function setupLocalTimes() {
    var nodes = document.querySelectorAll('.footer-updated-value[datetime]');
    Array.prototype.forEach.call(nodes, function (el) {
      var when = new Date(el.getAttribute('datetime'));
      if (isNaN(when.getTime())) return; // 时间解析不了就保持服务端渲染的内容

      function pad(n) {
        return (n < 10 ? '0' : '') + n;
      }
      var text = when.getFullYear() + '-' + pad(when.getMonth() + 1) + '-' + pad(when.getDate())
        + ' ' + pad(when.getHours()) + ':' + pad(when.getMinutes()) + ':' + pad(when.getSeconds());
      el.textContent = text;

      // 悬停能看到换算到哪个时区，避免读者猜
      var offset = -when.getTimezoneOffset();
      var sign = offset >= 0 ? '+' : '-';
      var abs = Math.abs(offset);
      el.setAttribute('title', text + ' (UTC' + sign + pad(Math.floor(abs / 60)) + ':' + pad(abs % 60) + ')');
    });
  }

  ready(function () {
    var labels = window.__CURSORKIT_SITE_LABELS__ || {};
    setupClock();
    setupLocalTimes();
    setupBackToTop(labels.backToTop || 'Back to top');
    setupReadingProgress(labels.progress || 'Reading progress');
    setupRandomTeleport();
    setupVisitorCounter({
      connecting: labels.visitsConnecting || 'Connecting…',
      failed: labels.visitsFailed || 'Connection failed',
    });
    setupCopyButtons({
      copy: labels.copy || 'Copy',
      copied: labels.copied || 'Copied',
      failed: labels.failed || 'Copy failed',
    });
    setupStatsCountUp();
  });
})();
