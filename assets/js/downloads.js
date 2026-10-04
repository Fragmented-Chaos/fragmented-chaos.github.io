// 从 Modrinth 与 CurseForge 的公开接口读取下载量，填进模组页右侧信息卡。
// 两个接口都允许跨域（access-control-allow-origin: *），所以静态页面可以直接 fetch。
// 任一平台没有页面或请求失败时，只隐藏对应那一行；两边都拿不到就整行隐藏。
(function () {
  var cards = document.querySelectorAll('.version-downloads');
  if (!cards.length) return;

  function format(n) {
    return Number(n).toLocaleString();
  }

  function rowOf(card, src) {
    return card.querySelector('.dl-row[data-src="' + src + '"]');
  }

  function fill(card, src, value) {
    var count = card.querySelector('.dl-count[data-src="' + src + '"]');
    if (count && value != null) count.textContent = format(value);
  }

  function drop(card, src) {
    var row = rowOf(card, src);
    if (row) row.parentNode.removeChild(row);
  }

  function hideIfEmpty(card) {
    if (card.querySelector('.dl-row')) return;
    var label = card.previousElementSibling;
    if (label && label.tagName === 'DT') label.parentNode.removeChild(label);
    if (card.parentNode) card.parentNode.removeChild(card);
  }

  function load(card, src, url, pick) {
    return fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then(function (data) {
        var value = pick(data);
        if (value == null) throw new Error('no data');
        fill(card, src, value);
      })
      .catch(function () {
        drop(card, src);
      });
  }

  Array.prototype.forEach.call(cards, function (card) {
    var modrinth = card.getAttribute('data-modrinth');
    var curseforge = card.getAttribute('data-curseforge');
    var curseforgeId = card.getAttribute('data-curseforge-id');
    var jobs = [];

    if (modrinth) {
      jobs.push(load(card, 'modrinth',
        'https://api.modrinth.com/v2/project/' + encodeURIComponent(modrinth),
        function (d) { return d.downloads; }));
    } else {
      drop(card, 'modrinth');
    }

    // 数字 ID 比 slug 稳（slug 会变），有 ID 就优先用 ID
    var cfUrl = curseforgeId
      ? 'https://api.cfwidget.com/' + encodeURIComponent(curseforgeId)
      : (curseforge ? 'https://api.cfwidget.com/minecraft/mc-mods/' + encodeURIComponent(curseforge) : null);

    if (cfUrl) {
      jobs.push(load(card, 'curseforge',
        cfUrl,
        function (d) { return d && d.downloads ? d.downloads.total : null; }));
    } else {
      drop(card, 'curseforge');
    }

    if (!jobs.length) {
      hideIfEmpty(card);
      return;
    }
    Promise.all(jobs).then(function () { hideIfEmpty(card); });
  });

  /* 最新版本号：从 Modrinth 读，省得每次发版都回来手改站点。
     没有 Modrinth 项目（或接口失败）时整行连同标签一起消失，不留空壳。 */
  Array.prototype.forEach.call(document.querySelectorAll('.version-latest'), function (row) {
    var slug = row.getAttribute('data-modrinth');
    if (!slug) {
      dropLatest(row);
      return;
    }
    fetch('https://api.modrinth.com/v2/project/' + encodeURIComponent(slug) + '/version?limit=1',
      { headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.length) throw new Error('no versions');
        var latest = data[0];
        row.textContent = '';
        var link = document.createElement('a');
        link.className = 'version-latest-link';
        link.href = 'https://modrinth.com/mod/' + encodeURIComponent(slug) + '/version/' + latest.id;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = latest.version_number;
        row.appendChild(link);
        if (latest.date_published) {
          var when = document.createElement('span');
          when.className = 'version-latest-date';
          when.textContent = latest.date_published.slice(0, 10);
          row.appendChild(when);
        }
      })
      .catch(function () {
        dropLatest(row);
      });
  });

  function dropLatest(row) {
    var label = row.previousElementSibling;
    if (label && label.classList.contains('version-latest-label')) label.parentNode.removeChild(label);
    if (row.parentNode) row.parentNode.removeChild(row);
  }
})();
