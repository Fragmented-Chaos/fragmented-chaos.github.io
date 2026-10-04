// 音乐页：一个列表，点哪首就让卡片里的网易官方播放器播哪首。
//
// 为什么只有"选曲"这一个功能：官方播放器是 **跨域 iframe** ——
// 外层拿不到它的 DOM（同源策略），它也没有监听 postMessage 的入口
// （查过它的脚本：它只会往外发消息）。播放/暂停/进度/音量只能用它自己的控件，
// 所以自建播放控件没有意义，页面上不摆。
// 同理也不用自建 <audio> 去播平台歌曲：那需要带签名的接口取音频直链，属于第三方逆向，不做。
(function () {
  'use strict';

  var slot = document.querySelector('[data-embed-slot]');
  var rows = Array.prototype.slice.call(document.querySelectorAll('[data-kind="netease"]'));
  if (!slot || !rows.length) return;

  var frame = null;
  var external = null;

  function play(row) {
    // 第一次点：把提示换成播放器，并加一个“在新标签打开”的兜底
    //（手机端或版权受限时官方播放器可能放不了）
    if (!frame) {
      var placeholder = slot.querySelector('.embed-slot-empty');
      if (placeholder) placeholder.hidden = true;

      frame = document.createElement('iframe');
      frame.className = 'embed-frame';
      frame.height = slot.getAttribute('data-height') || '86';
      frame.loading = 'lazy';
      frame.setAttribute('frameborder', '0');
      frame.setAttribute('allow', 'autoplay; encrypted-media');
      frame.setAttribute('referrerpolicy', 'no-referrer');
      slot.appendChild(frame);

      external = document.createElement('a');
      external.className = 'embed-external';
      external.target = '_blank';
      external.rel = 'noopener';
      slot.appendChild(external);
    }

    // 换台：始终是同一个播放器实例，只是改地址
    frame.src = row.getAttribute('data-src');
    external.href = row.getAttribute('data-external') || '#';
    external.textContent = row.getAttribute('data-external-label') || row.getAttribute('data-external') || '';
    slot.hidden = false;

    rows.forEach(function (other) {
      var active = other === row;
      other.classList.toggle('is-active', active);
      if (active) {
        other.setAttribute('aria-current', 'true');
      } else {
        other.removeAttribute('aria-current');
      }
    });
  }

  rows.forEach(function (row) {
    row.addEventListener('click', function () { play(row); });
  });
})();
