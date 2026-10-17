/* 图片灯箱：点击正文/模组页里的图片，全屏浮层看大图。
   设计约束：
   - 不上传、不依赖任何库，纯原生；file:// 直接打开也能用；
   - 无 JS 时图片照常显示，只是点不开（渐进增强）；
   - 尊重 prefers-reduced-motion；Esc 关闭、←/→ 切换、点遮罩关闭；
   - 关闭后把焦点还给原来那张图（键盘用户不会丢位置）。 */
(function () {
  'use strict';

  var IMG_SEL = '.post-body img, .mod-body img, main img';
  var MIN_NATURAL = 120;          // 太小的图标/徽标不接管

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    var images = [].filter.call(document.querySelectorAll(IMG_SEL), function (img) {
      if (img.closest('[data-no-zoom]')) return false;
      if (img.closest('a')) return false;              // 图被链接包着时，交给链接
      return true;
    });
    if (!images.length) return;

    var overlay = null, bigImg = null, capEl = null, countEl = null, closeBtn = null;
    var index = 0, lastFocus = null;

    function build() {
      overlay = document.createElement('div');
      overlay.className = 'lb';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', '查看大图');
      overlay.hidden = true;

      var figure = document.createElement('figure');
      figure.className = 'lb-figure';

      bigImg = document.createElement('img');
      bigImg.className = 'lb-img';
      bigImg.alt = '';

      capEl = document.createElement('figcaption');
      capEl.className = 'lb-cap';

      countEl = document.createElement('span');
      countEl.className = 'lb-count';

      closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'lb-close';
      closeBtn.setAttribute('aria-label', '关闭');
      closeBtn.textContent = '×';

      figure.appendChild(bigImg);
      figure.appendChild(capEl);
      figure.appendChild(countEl);
      overlay.appendChild(closeBtn);
      overlay.appendChild(figure);
      document.body.appendChild(overlay);

      closeBtn.addEventListener('click', close);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close();            // 点遮罩关闭
      });
    }

    function caption(img) {
      return img.getAttribute('title') || img.getAttribute('alt') || '';
    }

    function show(i) {
      index = (i + images.length) % images.length;
      var img = images[index];
      bigImg.src = img.currentSrc || img.src;
      bigImg.alt = img.getAttribute('alt') || '';
      capEl.textContent = caption(img);
      capEl.hidden = !capEl.textContent;
      countEl.textContent = images.length > 1 ? (index + 1) + ' / ' + images.length : '';
    }

    function open(i) {
      if (!overlay) build();
      lastFocus = document.activeElement;
      show(i);
      overlay.hidden = false;
      document.documentElement.classList.add('lb-open');
      closeBtn.focus();
      // 预载相邻两张，翻页时不闪
      [images[(index + 1) % images.length], images[(index - 1 + images.length) % images.length]]
        .forEach(function (im) { if (im && im !== images[index]) new Image().src = im.currentSrc || im.src; });
    }

    function close() {
      if (!overlay || overlay.hidden) return;
      overlay.hidden = true;
      document.documentElement.classList.remove('lb-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function isOpen() { return overlay && !overlay.hidden; }

    images.forEach(function (img, i) {
      img.classList.add('lb-zoomable');
      img.addEventListener('click', function () {
        if (img.naturalWidth && img.naturalWidth < MIN_NATURAL) return;
        open(i);
      });
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
    });

    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
      else if (e.key === 'Tab') {                     // 焦点锁在浮层里
        e.preventDefault();
        closeBtn.focus();
      }
    });
  });
})();
