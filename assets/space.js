/* 深空页（/space/）：整场一块 WebGL —— 星空、星云、黑洞、吸积盘在同一个场景里。
   光线步进积分光子轨道（史瓦西近似 a = -3/2·h²·p/r⁵）：
   逃出来的光线去采样星空，所以星星会被引力真正弯折（贴着影的那圈会拖成弧），
   掉进视界的就是纯黑。这和"星星画一层、黑洞贴一层"是两回事。
   交互：点一下进入漫游，拖动平移、滚轮缩放、方向键走、Esc 退出。 */
(function () {
  'use strict';

  var canvas = document.getElementById('space-canvas');
  if (!canvas || !canvas.getContext) return;
  var gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' });
  if (!gl) { canvas.style.display = 'none'; return; }
  var root = document.documentElement;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, DPR = 1;

  var ptr = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  var cam = { x: 0, y: 0, z: 1, tz: 1 };
  var cruise = false, drag = null, keys = {};

  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPan;      // 平移（相机在盘面上的偏移）
uniform float uZoom;    // 缩放
uniform sampler2D uSky;
uniform float uAspect;   // 宽/高，窄屏要把相机偏移收回来，否则黑洞在画外

float hash(vec2 p){p=fract(p*vec2(127.1,311.7));p+=dot(p,p+34.23);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.05;a*=.5;}return v;}

const float RS = 1.0;
const float RIN = 1.7;
const float ROUT = 16.0;
const int STEPS = 170;

/* 天空：星云 + 星点。用「最终方向」的球面坐标取，所以被引力弯过的光线
   会落到别的星上 —— 这就是贴着影那一圈星星被拖成弧的原因。 */
/* 天空：采样一张等距圆柱投影的星空贴图。
   贴图本身是用 2D 画布画的（三层星、星云、银河带，就是之前那套质感），
   这里用「被引力弯折后的方向」去取 —— 所以星星会被黑洞真正扭曲。 */
vec3 sky(vec3 dir){
  // 天球缓慢自转（约 7 分钟一圈，盯着看能看出来）
  float az = atan(dir.z, dir.x) + uTime * 0.0038;   // 约 28 分钟一圈，几乎察觉不到在动
  float el = asin(clamp(dir.y, -1.0, 1.0));
  vec2 uv = vec2(az / 6.2831853 + 0.5, el / 3.1415927 + 0.5);

  vec3 s = texture2D(uSky, uv).rgb;

  // 拆成两层：底子（星云）和星点。
  // 闪烁只能乘在星点上 —— 乘到整片天空上，星云会被压出一块块暗斑，
  // 天球一动那些暗斑就跟着飘，看着就像"会动的黑点"。
  vec3 base  = s * 1.05;
  vec3 stars = s * s * 2.4;

  // 闪烁和呼吸先关掉（保留代码，想开把系数改回非零即可）
  float ph = noise(uv * vec2(340.0, 260.0)) * 6.2831853;
  float tw = 1.0;                 // 原：0.72 + 0.28 * sin(uTime * 2.1 + ph)
  float breathe = 1.0;            // 原：1.0 + 0.03 * sin(uTime * 0.35 + uv.x * 5.0)

  return base * breathe + stars * tw;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / (0.5 * uRes.y);

  // 相机：稍微俯视盘面；uPan 平移，uZoom 缩放
  float k = 1.12 / max(uZoom, 0.001);
  // 窄屏（手机）横向视野小，偏移要按比例收回，黑洞才留在画里
  float spread = clamp(uAspect / 1.6, 0.34, 1.0);
  vec3 ro = vec3((33.7 + uPan.x * k * 8.0) * spread,
                 (-14.3 + uPan.y * k * 8.0) * spread,
                 -40.0);
  vec3 fwd = normalize(vec3(0.0, -0.022, 1.0));
  vec3 rt = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fwd);
  vec3 rd = normalize(fwd + uv.x * k * rt + uv.y * k * up);

  vec3 p = ro, v = rd;
  vec3 h = cross(p, v);
  float h2 = dot(h, h);

  vec3 col = vec3(0.0);
  float skyVis = 1.0;      // 穿过盘之后天空被遮挡的程度
  bool captured = false;

  for (int i = 0; i < STEPS; i++) {
    float r2 = dot(p, p);
    float r = sqrt(r2);
    if (r < RS) { captured = true; break; }
    if (r > 75.0) break;

    float ds = clamp(0.05 * r, 0.01, 0.85);
    vec3 acc = -1.5 * h2 * p / pow(r, 5.0);
    v += acc * ds;
    vec3 np = p + v * ds;

    // 穿过盘面：把这条光线的贡献叠上去
    if (p.y * np.y < 0.0) {
      float t = p.y / (p.y - np.y);
      vec3 hit = mix(p, np, t);
      float rr = length(hit.xz);
      if (rr > RIN && rr < ROUT) {
        float ang = atan(hit.z, hit.x);
        // lg 加时间是让纹理往内流（物质落向视界），不是单纯自转
        float lg = log(rr) + uTime * 0.55;
        float t1 = fbm(vec2(ang * 3.2, lg * 4.5) + vec2(uTime * 0.85, 0.0));
        float t2 = fbm(vec2(ang * 7.5, lg * 10.0) - vec2(uTime * 1.45, 0.0));
        float t3 = fbm(vec2(ang * 15.0, lg * 20.0) + vec2(uTime * 2.30, 0.0));
        float raw = t1 * 0.50 + t2 * 0.33 + t3 * 0.26;
        float tex = smoothstep(0.18, 0.92, raw) * (0.35 + 0.85 * pow(raw, 2.2));

        float dens = pow(smoothstep(ROUT, RIN + 2.2, rr), 1.9) * smoothstep(RIN, RIN + 0.35, rr);
        float dop = 0.22 + 0.78 * smoothstep(-1.0, 1.0, hit.x / max(rr, 0.001));
        vec3 hot = mix(vec3(1.0, 0.48, 0.13), vec3(1.0, 0.99, 0.96), smoothstep(ROUT * 0.85, RIN, rr));
        float inner = 1.0 + 0.9 * smoothstep(ROUT * 0.55, RIN + 0.3, rr);

        // 一颗绕着转的亮团：盘太扁、相机又远，靠它才看得出在动
        float HA = uTime * 1.15;
        vec2 hs = vec2(cos(HA), sin(HA)) * (RIN + 2.6);
        float hd = length(hit.xz - hs);
        float blob = smoothstep(2.6, 0.0, hd) * 2.4;

        float a = dens * dop * (0.25 + 1.05 * tex);
        vec3 emission = hot * (a + blob * dens) * 1.5 * inner;
        col += emission * skyVis;          // 盘自身也受更前面的盘遮挡
        skyVis *= 1.0 - clamp(a * 1.9, 0.0, 1.0);   // 这层盘挡住了多少后面的东西
      }
    }
    p = np;
  }

  // 没被吞掉的光线 → 去采样星空（这就是"星星在同一个场景里"）
  if (!captured) {
    // 逃出来的光线去采样星空；盘挡掉的部分按 skyVis 衰减
    col += sky(normalize(v)) * skyVis;
  } else {
    col = vec3(0.0);
  }

  col = vec3(1.0) - exp(-col * 1.45);
  col *= vec3(1.02, 0.94, 0.88);
  gl_FragColor = vec4(col, 1.0);
}
`;

  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  }
  var prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog); gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, 'uRes');
  var uTime = gl.getUniformLocation(prog, 'uTime');
  var uPan = gl.getUniformLocation(prog, 'uPan');
  var uZoom = gl.getUniformLocation(prog, 'uZoom');
  var uSky = gl.getUniformLocation(prog, 'uSky');
  var uAspect = gl.getUniformLocation(prog, 'uAspect');

  /* 星空贴图：用 2D 画布画一张等距圆柱投影的全天球图。
     就是之前那套质感的星（三层深度、大小色温不同、有星云和银河带），
     画好之后交给着色器按"被引力弯折的方向"去采样。 */
  function makeSkyTexture() {
    // 贴图尺寸受 GPU 限制，超了会整块变黑 —— 先问一下上限再定
    var maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
    var TW = Math.min(4096, maxTex), TH = Math.round(TW / 2);
    var cv = document.createElement('canvas');
    cv.width = TW; cv.height = TH;
    var c = cv.getContext('2d');

    // 底：深空蓝
    c.fillStyle = '#05060c';
    c.fillRect(0, 0, TW, TH);

    function wrapDraw(fn) {          // 左右接缝处画两遍，保证环绕连续
      fn(-TW); fn(0); fn(TW);
    }

    // ---- 每次进站都换一片天空：色板、云量、银河带有无都随机 ----
    var rnd = function (a, b) { return a + Math.random() * (b - a); };
    var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

    // 几套色板，冷暖差别很大 —— 一眼就能看出不是同一片天
    var THEMES = [
      ['96,132,255', '150,104,240', '70,160,220'],    // 蓝紫（经典）
      ['70,190,200', '60,150,255', '120,220,210'],    // 青蓝
      ['200,90,150', '150,90,240', '90,120,230'],     // 玫紫
      ['230,150,90', '200,110,120', '120,140,230'],   // 暖橙
      ['110,90,220', '60,80,180', '160,140,255']      // 深靛
    ];
    var palette = pick(THEMES);

    // 星云：团数、大小、浓度都随机
    var puffCount = Math.round(rnd(10, 26));
    for (var k = 0; k < puffCount; k++) {
      var n = {
        x: Math.random(),
        y: rnd(0.08, 0.92),
        r: rnd(0.05, 0.26),
        col: pick(palette),
        a: rnd(0.05, 0.17),
        squash: rnd(0.45, 1.45)
      };
      wrapDraw(function (ox) {
        var cx = n.x * TW + ox, cy = n.y * TH, r = n.r * TW;
        var g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(' + n.col + ',' + n.a + ')');
        g.addColorStop(0.35, 'rgba(' + n.col + ',' + (n.a * 0.55) + ')');
        g.addColorStop(0.7, 'rgba(' + n.col + ',' + (n.a * 0.18) + ')');
        g.addColorStop(1, 'rgba(' + n.col + ',0)');
        c.fillStyle = g;
        c.save();
        c.translate(cx, cy); c.scale(1.0, n.squash); c.translate(-cx, -cy);
        c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.fill();
        c.restore();
      });
    }

    // 银河带：六成概率出现，位置/厚度/浓度随机
    var hasBand = Math.random() < 0.62;
    var bandY = rnd(0.26, 0.76);
    var bandH = rnd(0.16, 0.34);
    var bandA = rnd(0.06, 0.20);
    if (hasBand) {
      wrapDraw(function (ox) {
        var g = c.createLinearGradient(0, TH * (bandY - bandH / 2), 0, TH * (bandY + bandH / 2));
        g.addColorStop(0, 'rgba(' + palette[0] + ',0)');
        g.addColorStop(0.42, 'rgba(' + palette[0] + ',' + (bandA * 0.6) + ')');
        g.addColorStop(0.5, 'rgba(226,236,255,' + bandA + ')');
        g.addColorStop(0.58, 'rgba(' + palette[0] + ',' + (bandA * 0.6) + ')');
        g.addColorStop(1, 'rgba(' + palette[0] + ',0)');
        c.fillStyle = g;
        c.fillRect(ox, TH * (bandY - bandH / 2), TW, TH * bandH);
      });
    }

    function gauss() { return (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2; }

    var areaFactor = (TW * TH) / (2048 * 1024);

    // 银河带里的密星（没有带就没有这一段）
    if (hasBand) {
      var bandStars = Math.round(rnd(1200, 3600) * areaFactor);
      for (var i = 0; i < bandStars; i++) {
        c.fillStyle = 'rgba(236,242,255,' + rnd(0.08, 0.42) + ')';
        c.beginPath();
        c.arc(Math.random() * TW, TH * bandY + gauss() * TH * bandH * 0.42,
              rnd(0.35, 1.0), 0, 6.2832);
        c.fill();
      }
    }

    // 普通星：总数、色温比例都随机
    var warmRatio = rnd(0.04, 0.26);
    var blueRatio = rnd(0.18, 0.52);
    var totalStars = rnd(0.75, 1.45);
    [
      { n: Math.round(1500 * areaFactor * totalStars), r: [0.35, 0.85], a: [0.16, 0.45] },
      { n: Math.round(520 * areaFactor * totalStars),  r: [0.65, 1.35], a: [0.35, 0.72] },
      { n: Math.round(150 * areaFactor * totalStars),  r: [1.1, 2.3],  a: [0.55, 1.0] }
    ].forEach(function (L) {
      for (var j = 0; j < L.n; j++) {
        var x = Math.random() * TW, y = Math.random() * TH;
        var r = rnd(L.r[0], L.r[1]), a = rnd(L.a[0], L.a[1]);
        var t = Math.random();
        var col = t < warmRatio ? '255,226,190' : (t < warmRatio + blueRatio ? '190,214,255' : '255,255,255');

        if (r > 1.2) {
          var g2 = c.createRadialGradient(x, y, 0, x, y, r * 4.5);
          g2.addColorStop(0, 'rgba(' + col + ',' + (a * 0.5) + ')');
          g2.addColorStop(1, 'rgba(' + col + ',0)');
          c.fillStyle = g2;
          c.beginPath(); c.arc(x, y, r * 4.5, 0, 6.2832); c.fill();
        }
        c.fillStyle = 'rgba(' + col + ',' + a + ')';
        c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill();
      }
    });

    return cv;
  }

  var skyTex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, skyTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, makeSkyTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(uSky, 0);

  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 1.6);   // 步进很吃像素，封个上限
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  addEventListener('resize', resize);
  resize();

  /* ---------- 交互 ---------- */
  function onChrome(target) {
    return !!(target.closest && target.closest('a, button, input, select, textarea, summary'));
  }

  document.addEventListener('pointerdown', function (e) {
    if (onChrome(e.target)) return;
    drag = { x: e.clientX, y: e.clientY, moved: false, t: Date.now() };
  });

  addEventListener('pointermove', function (e) {
    ptr.x = (e.clientX / W) * 2 - 1;
    ptr.y = (e.clientY / H) * 2 - 1;
    if (!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    if (cruise) { cam.x -= dx * 0.012; cam.y -= dy * 0.012; drag.x = e.clientX; drag.y = e.clientY; }
  });

  var HINT = {
    'zh': '拖动平移 · 滚轮缩放 · 方向键也能走 · Esc 退出',
    'zh-Hant-TW': '拖動平移 · 滾輪縮放 · 方向鍵也能走 · Esc 退出',
    'en': 'Drag to pan · scroll to zoom · arrows work too · Esc to leave'
  };
  var hintEl = null;

  function enter() {
    if (cruise) return;
    cruise = true;
    root.classList.add('is-cruising');
    cam.tz = 1.1;
    if (!hintEl) {
      hintEl = document.createElement('p');
      hintEl.className = 'space-cruise-tip';
      hintEl.textContent = HINT[document.documentElement.lang] || HINT.zh;
      document.body.appendChild(hintEl);
    }
    hintEl.classList.add('on');
    setTimeout(function () { hintEl.classList.remove('on'); }, 4500);
  }

  function leave() {
    if (!cruise) return;
    cruise = false;
    root.classList.remove('is-cruising');
    cam.tz = 1;
  }

  addEventListener('pointerup', function (e) {
    var wasClick = drag && !drag.moved && Date.now() - drag.t < 350;
    drag = null;
    if (!wasClick || onChrome(e.target)) return;
    enter();
  });

  addEventListener('wheel', function (e) {
    if (!cruise) return;
    e.preventDefault();
    cam.tz = Math.min(3.2, Math.max(0.45, cam.tz * (e.deltaY > 0 ? 0.92 : 1.08)));
  }, { passive: false });

  addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { leave(); return; }
    keys[e.key] = true;
    if (cruise && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd'].indexOf(e.key) >= 0) e.preventDefault();
  });
  addEventListener('keyup', function (e) { keys[e.key] = false; });

  /* ---------- 主循环 ---------- */
  var t0 = performance.now();
  var last = t0;

  function frame(now) {
    var dt = Math.min(now - last, 50);
    last = now;

    cur.x += (ptr.x - cur.x) * 0.05;
    cur.y += (ptr.y - cur.y) * 0.05;
    cam.z += (cam.tz - cam.z) * 0.12;

    if (cruise) {
      var sp = 0.010 * (1 / cam.z);
      if (keys.ArrowLeft || keys.a) cam.x -= sp;
      if (keys.ArrowRight || keys.d) cam.x += sp;
      if (keys.ArrowUp || keys.w) cam.y += sp;
      if (keys.ArrowDown || keys.s) cam.y -= sp;
    }

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (now - t0) / 1000);
    gl.uniform2f(uPan, cam.x + cur.x * 0.010, cam.y + cur.y * 0.010);
    gl.uniform1f(uZoom, cam.z);
    gl.uniform1f(uAspect, W / H);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
