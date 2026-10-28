/* 关于页的「百科贡献」：把 data/wiki-stats.json 渲染成数字 + 按年切换的热力图。
   数据由 .github/workflows/wiki-stats.yml 每周抓一次写进仓库 —— 浏览器直连
   center.mcmod.cn 会被 CORS 挡，所以只能读自家这份快照。
   抓不到就什么都不做，页面保留 HTML 里的占位，不会出现空的框。 */
(function () {
  'use strict';

  var block = document.querySelector('[data-wiki]');
  if (!block) return;

  var src = block.getAttribute('data-src');
  if (!src || !window.fetch) return;

  var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  var labelEdit = block.getAttribute('data-label-edit') || '编辑';
  var labelReview = block.getAttribute('data-label-review') || '审核';
  var ariaTemplate = block.getAttribute('data-aria-template') || '{n}';
  var lang = document.documentElement.lang || 'zh';
  var monthFmt = new Intl.DateTimeFormat(lang, { month: 'short' });

  fetch(src, { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.days) return;

      var tpl = block.querySelector('[data-wiki-tpl]');
      var list = block.querySelector('[data-wiki-accounts-list]');
      var updated = block.querySelector('[data-wiki-updated]');
      if (data.generated_at && updated) updated.textContent = data.generated_at.slice(0, 10);

      // 每个账号单独一块，不合计
      if (tpl && list) {
        (data.accounts || []).forEach(function (acc) {
          if (acc.error) return;
          var wrap = document.createElement('div');
          wrap.className = 'wiki-account';

          var head = document.createElement('h4');
          head.className = 'wiki-acct';
          head.textContent = acc.name || ('#' + acc.uid);
          wrap.appendChild(head);

          var dl = tpl.cloneNode(true);
          dl.hidden = false;
          dl.removeAttribute('data-wiki-tpl');
          Array.prototype.forEach.call(dl.querySelectorAll('[data-f]'), function (el) {
            var key = el.getAttribute('data-f');
            var v = acc[key];
            // 只有数字才加千位分隔，日期之类的字符串原样显示
            el.textContent = v == null ? '—' : (typeof v === 'number' ? fmt(v) : v);
          });
          wrap.appendChild(dl);
          list.appendChild(wrap);
        });
        tpl.hidden = true;
      }

      var heat = block.querySelector('[data-wiki-heat]');
      var months = block.querySelector('[data-wiki-months]');
      var yearsBox = block.querySelector('[data-wiki-years]');
      var tip = block.querySelector('[data-wiki-tip]');
      if (!heat) return;

      var levels = [0, 2, 5, 10];

      // 有数据的年份，从旧到新
      var years = [];
      Object.keys(data.days).forEach(function (k) {
        var y = k.slice(0, 4);
        if (years.indexOf(y) < 0) years.push(y);
      });
      years.sort();
      var current = String(new Date().getFullYear());
      if (years.indexOf(current) < 0) current = years[years.length - 1];

      function render(year) {
        heat.innerHTML = '';
        if (months) months.innerHTML = '';

        // 该年 1/1 到 12/31，按周补满整行
        var first = new Date(Number(year), 0, 1);
        var start = new Date(first);
        start.setDate(start.getDate() - first.getDay());     // 退到那一周的周日
        var last = new Date(Number(year), 11, 31);
        var days = Math.round((last - start) / 86400000) + 1;
        var cells = Math.ceil(days / 7) * 7;
        var weeks = cells / 7;

        if (months) months.style.gridTemplateColumns = 'repeat(' + weeks + ', 9px)';

        var frag = document.createDocumentFragment();
        var active = 0, lastMonth = -1, lastLabelWeek = -1;

        for (var i = 0; i < cells; i++) {
          var d = new Date(start);
          d.setDate(d.getDate() + i);
          var inYear = d.getFullYear() === Number(year);
          var key = d.toISOString().slice(0, 10);
          var row = inYear ? data.days[key] : null;
          var edits = row ? (row[0] || 0) : 0;
          var reviews = row ? (row[1] || 0) : 0;
          var sum = edits + reviews;   // 格子深浅看当天总量，编辑和提交审核都算

          var lv = 0;
          for (var k = levels.length - 1; k >= 0; k--) {
            if (sum > levels[k]) { lv = k + 1; break; }
          }
          if (sum > 0 && lv === 0) lv = 1;
          if (sum > 0) active++;

          var cell = document.createElement('i');
          cell.className = 'wiki-cell lv' + lv + (inYear ? '' : ' out');
          cell.setAttribute('data-date', key);
          cell.setAttribute('data-edit', String(edits));
          cell.setAttribute('data-review', String(reviews));
          frag.appendChild(cell);

          // 月份标签：同一列只画一次，且至少隔 4 列，免得挤在一起
          if (months && i % 7 === 0 && inYear) {
            var m = d.getMonth();
            var week = Math.floor(i / 7);
            if (m !== lastMonth && (lastLabelWeek < 0 || week - lastLabelWeek >= 4)) {
              lastMonth = m;
              lastLabelWeek = week;
              var label = document.createElement('span');
              label.textContent = monthFmt.format(d);
              label.style.gridColumn = String(week + 1);
              months.appendChild(label);
            }
          }
        }

        heat.appendChild(frag);
        heat.hidden = false;
        if (months && months.childElementCount) months.hidden = false;
        heat.setAttribute('aria-label', ariaTemplate.replace('{n}', active).replace('{y}', year));
      }

      // 年份切换
      if (yearsBox && years.length > 1) {
        yearsBox.innerHTML = '';
        years.forEach(function (y) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'wiki-year';
          b.textContent = y;
          b.setAttribute('aria-pressed', y === current ? 'true' : 'false');
          if (y === current) b.classList.add('on');
          b.addEventListener('click', function () {
            current = y;
            Array.prototype.forEach.call(yearsBox.children, function (c) {
              var on = c === b;
              c.classList.toggle('on', on);
              c.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
            render(y);
          });
          yearsBox.appendChild(b);
        });
        yearsBox.hidden = false;
      }
      render(current);

      // 悬停提示：原生 title 太慢又难看，自己做一个小气泡
      if (!tip) return;

      function showTip(cell) {
        var date = cell.getAttribute('data-date');
        var e = cell.getAttribute('data-edit');
        var r = cell.getAttribute('data-review');
        tip.textContent = date + ' · ' + labelEdit + ' ' + e
          + (Number(r) ? ' · ' + labelReview + ' ' + r : '');

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
      heat.addEventListener('focusin', function (e) {
        if (e.target.classList && e.target.classList.contains('wiki-cell')) showTip(e.target);
      });
      heat.addEventListener('focusout', function () { tip.hidden = true; });
    })
    .catch(function () { /* 抓不到就保持占位，不报错 */ });
})();
