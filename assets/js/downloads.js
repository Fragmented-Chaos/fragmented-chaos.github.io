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
    var jobs = [];

    if (modrinth) {
      jobs.push(load(card, 'modrinth',
        'https://api.modrinth.com/v2/project/' + encodeURIComponent(modrinth),
        function (d) { return d.downloads; }));
    } else {
      drop(card, 'modrinth');
    }

    if (curseforge) {
      jobs.push(load(card, 'curseforge',
        'https://api.cfwidget.com/minecraft/mc-mods/' + encodeURIComponent(curseforge),
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
})();
