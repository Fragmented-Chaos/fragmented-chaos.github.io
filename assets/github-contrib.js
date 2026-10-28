/* 关于页的「GitHub 贡献」：把 data/github-contrib.json 渲染成一年热力图。
   数据由 .github/workflows/stats.yml 每周用 Actions 自带的 token 抓一次。
   样式与百科贡献那块共用（.wiki-heat / .wiki-cell / .wiki-months / .wiki-tip）。 */
(function () {
  'use strict';

  var block = document.querySelector('[data-gh]');
  if (!block) return;

  var src = block.getAttribute('data-src');
  if (!src || !window.fetch) return;

  var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  var label = block.getAttribute('data-label') || '提交';
  var lang = document.documentElement.lang || 'zh';
  var monthFmt = new Intl.DateTimeFormat(lang, { month: 'short' });

  fetch(src, { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      // 空数据（第一次 Actions 还没跑）就整块不显示
      if (!data || !data.days || !Object.keys(data.days).length) return;
      block.hidden = false;   // 有数据才显示这块，没有就整块不出现

      var total = block.querySelector('[data-gh-total]');
      if (total) total.textContent = fmt(data.total || 0);
      var up = block.querySelector('[data-gh-updated]');
      if (up && data.generated_at) up.textContent = data.generated_at.slice(0, 10);

      var heat = block.querySelector('[data-gh-heat]');
      var months = block.querySelector('[data-gh-months]');
      var tip = block.querySelector('[data-gh-tip]');
      if (!heat) return;

      var WEEKS = 53, CELLS = WEEKS * 7;
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var end = new Date(today);
      end.setDate(end.getDate() + (6 - end.getDay()));
      var start = new Date(end);
      start.setDate(start.getDate() - (CELLS - 1));

      var levels = [0, 1, 3, 6];
      var frag = document.createDocumentFragment();
      var active = 0, lastMonth = -1, lastLabelWeek = -1;

      if (months) months.style.gridTemplateColumns = 'repeat(' + WEEKS + ', 9px)';

      for (var i = 0; i < CELLS; i++) {
        var d = new Date(start);
        d.setDate(d.getDate() + i);
        var key = d.toISOString().slice(0, 10);
        var n = data.days[key] || 0;

        var lv = 0;
        for (var k = levels.length - 1; k >= 0; k--) {
          if (n > levels[k]) { lv = k + 1; break; }
        }
        if (n > 0 && lv === 0) lv = 1;
        if (n > 0) active++;

        var cell = document.createElement('i');
        cell.className = 'wiki-cell lv' + lv;
        cell.setAttribute('data-date', key);
        cell.setAttribute('data-n', String(n));
        frag.appendChild(cell);

        if (months && i % 7 === 0) {
          var m = d.getMonth();
          var week = Math.floor(i / 7);
          if (m !== lastMonth && (lastLabelWeek < 0 || week - lastLabelWeek >= 4)) {
            lastMonth = m;
            lastLabelWeek = week;
            var el = document.createElement('span');
            el.textContent = monthFmt.format(d);
            el.style.gridColumn = String(week + 1);
            months.appendChild(el);
          }
        }
      }

      heat.appendChild(frag);
      heat.hidden = false;
      if (months) months.hidden = false;
      heat.setAttribute('role', 'img');
      heat.setAttribute('aria-label', active + ' / ' + CELLS);

      if (!tip) return;

      function showTip(cell) {
        tip.textContent = cell.getAttribute('data-date') + ' · ' + label + ' ' + cell.getAttribute('data-n');
        var cr = cell.getBoundingClientRect();
        var br = block.getBoundingClientRect();
        tip.hidden = false;
        var tw = tip.offsetWidth, th = tip.offsetHeight;
        var left = cr.left - br.left + cr.width / 2 - tw / 2;
        var top = cr.top - br.top - th - 8;
        left = Math.max(4, Math.min(left, br.width - tw - 4));
        if (top < 0) top = cr.bottom - br.top + 8;
        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
      }

      heat.addEventListener('pointerover', function (e) {
        var cell = e.target.closest ? e.target.closest('.wiki-cell') : null;
        if (cell) showTip(cell);
      });
      heat.addEventListener('pointerout', function (e) {
        if (e.target.closest && e.target.closest('.wiki-cell')) tip.hidden = true;
      });
    })
    .catch(function () { /* 抓不到就保持占位 */ });
})();
