// 音乐页：一个曲目列表，点哪首就让卡片里的网易官方播放器播哪首。
//
// 两个刻意的设计（都是被坑出来的）：
//   1. **iframe 静态写在 HTML 里**，点击时只改它的 src。
//      原因是实测：动态 createElement 出来的 iframe 在某些渲染路径下会 load 成功但不绘制
//      （load 事件照常触发、尺寸也对，就是一片空白）；静态存在的 iframe 稳定渲染。
//   2. **不设 referrerpolicy="no-referrer"**。网易官方播放器需要 Referer 才渲染，
//      不给就只返回一张空白页（这也是旧站播放器一直空白的原因）。
//      浏览器默认的 strict-origin-when-cross-origin 会带上来源站，正好够用。
//
// 另外：点击前 iframe 没有 src，所以单纯打开这一页不会向网易发任何请求。
(function () {
  'use strict';

  var slot = document.querySelector('[data-embed-slot]');
  var frame = slot ? slot.querySelector('.embed-frame') : null;
  var external = slot ? slot.querySelector('.embed-external') : null;
  var rows = Array.prototype.slice.call(document.querySelectorAll('[data-kind="netease"]'));
  if (!slot || !frame || !rows.length) return;

  frame.addEventListener('load', function () { slot.setAttribute('data-state', 'ready'); });
  frame.addEventListener('error', function () { slot.setAttribute('data-state', 'error'); });

  function play(row) {
    var placeholder = slot.querySelector('.embed-slot-empty');
    if (placeholder) placeholder.hidden = true;
    slot.removeAttribute('data-state');

    frame.hidden = false;
    frame.src = row.getAttribute('data-src');
    frame.setAttribute('title', row.getAttribute('data-title-text') || 'player');

    if (external) {
      external.hidden = false;
      external.href = row.getAttribute('data-external') || '#';
      external.textContent = row.getAttribute('data-external-label') || '';
    }

    rows.forEach(function (other) {
      var active = other === row;
      other.classList.toggle('is-active', active);
      if (active) other.setAttribute('aria-current', 'true');
      else other.removeAttribute('aria-current');
    });
  }

  rows.forEach(function (row) {
    row.addEventListener('click', function () { play(row); });
  });
})();
