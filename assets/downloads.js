// 模组页：从公开接口读「下载量」与「最新版本」，填进规格面板（旧站那张信息卡就是这两项）。
//
//   · Modrinth：官方 API（api.modrinth.com，允许跨域直连）
//   · CurseForge：api.cfwidget.com —— 官方 API 需要 key 且不允许浏览器直连，旧站用的就是这个只读代理
//
// 任一平台没配置、或请求失败，就把那一整行（dt + dd 一对）删掉，不留空壳；
// 最新版本读不到也整行删掉。所以断网/接口挂掉时页面只是少两行，不会出现空占位或报错。
(function () {
  'use strict';

  var panels = document.querySelectorAll('[data-downloads]');
  if (!panels.length) return;

  function fmt(n) { return Number(n).toLocaleString(); }

  function get(url) {
    return fetch(url, { headers: { Accept: 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
  }

  function dropRow(panel, name) {
    var dt = panel.querySelector('[data-dl-row="' + name + '"]');
    var dd = panel.querySelector('[data-dl-cell="' + name + '"]');
    if (dt && dt.parentNode) dt.parentNode.removeChild(dt);
    if (dd && dd.parentNode) dd.parentNode.removeChild(dd);
  }

  function dropLatest(panel) {
    var dt = panel.querySelector('[data-latest-row]');
    var dd = panel.querySelector('[data-latest-version]');
    if (dt && dt.parentNode) dt.parentNode.removeChild(dt);
    if (dd && dd.parentNode) dd.parentNode.removeChild(dd);
  }

  Array.prototype.forEach.call(panels, function (panel) {
    var modrinth = panel.getAttribute('data-modrinth');
    var cfSlug = panel.getAttribute('data-curseforge');
    var cfId = panel.getAttribute('data-curseforge-id');

    if (!modrinth) {
      dropRow(panel, 'modrinth');
      dropLatest(panel);
    } else {
      get('https://api.modrinth.com/v2/project/' + encodeURIComponent(modrinth))
        .then(function (d) {
          if (d.downloads == null) throw new Error('no data');
          var el = panel.querySelector('[data-dl-count="modrinth"]');
          if (el) el.textContent = fmt(d.downloads);
        })
        .catch(function () { dropRow(panel, 'modrinth'); });

      // 最新版本号也从 Modrinth 读，省得每次发版都回来手改站点
      get('https://api.modrinth.com/v2/project/' + encodeURIComponent(modrinth) + '/version?limit=1')
        .then(function (list) {
          if (!list || !list.length) throw new Error('no versions');
          var v = list[0];
          var el = panel.querySelector('[data-latest-version]');
          if (!el) return;
          el.textContent = '';
          var a = document.createElement('a');
          a.href = 'https://modrinth.com/mod/' + encodeURIComponent(modrinth) + '/version/' + v.id;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = v.version_number;
          el.appendChild(a);
          if (v.date_published) {
            var when = document.createElement('span');
            when.className = 'when';
            when.textContent = ' ' + v.date_published.slice(0, 10);
            el.appendChild(when);
          }
        })
        .catch(function () { dropLatest(panel); });
    }

    var cfUrl = cfId
      ? 'https://api.cfwidget.com/' + encodeURIComponent(cfId)
      : (cfSlug ? 'https://api.cfwidget.com/minecraft/mc-mods/' + encodeURIComponent(cfSlug) : null);

    if (!cfUrl) {
      dropRow(panel, 'curseforge');
      return;
    }
    get(cfUrl)
      .then(function (d) {
        var total = d && d.downloads != null
          ? (typeof d.downloads === 'number' ? d.downloads : d.downloads.total)
          : null;
        if (total == null) throw new Error('no data');
        var el = panel.querySelector('[data-dl-count="curseforge"]');
        if (el) el.textContent = fmt(total);
      })
      .catch(function () { dropRow(panel, 'curseforge'); });
  });
})();
