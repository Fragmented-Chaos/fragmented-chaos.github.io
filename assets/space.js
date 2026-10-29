/* 深空页（/space/）：一块全屏 WebGL 画布 —— 黑洞、吸积盘、星云、星空。
   无依赖；prefers-reduced-motion 时只画一帧；没有 WebGL 就把画布藏掉，页面照常可读。 */
(function () {
  var canvas = document.getElementById('space-canvas');
  var gl = canvas.getContext('webgl', { antialias: false, alpha: false })
        || canvas.getContext('experimental-webgl');
  if (!gl) { canvas.style.display = 'none'; return; }   // 没 WebGL 就把画布藏了，页面照常读

  var vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

  var fs = [
    'precision highp float;',
    'uniform vec2 uRes;',
    'uniform float uTime;',
    'uniform vec2 uMouse;',
    '',
    'float hash(vec2 p){',
    '  p = fract(p * vec2(123.34, 456.21));',
    '  p += dot(p, p + 45.32);',
    '  return fract(p.x * p.y);',
    '}',
    '',
    'float noise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),',
    '             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);',
    '}',
    '',
    'float fbm(vec2 p){',
    '  float v = 0.0, a = 0.5;',
    '  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }',
    '  return v;',
    '}',
    '',
    'void main(){',
    '  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);',
    '  // 宽屏时把黑洞推到右边，左边留给文字',
    '  uv.x -= smoothstep(1.15, 1.9, uRes.x / uRes.y) * 0.26;',
    '  // 窄屏时把黑洞抬高，底下留给文字',
    '  uv.y -= (1.0 - smoothstep(0.72, 1.05, uRes.x / uRes.y)) * 0.22;',,
    '  float d = length(uv);',
    '  float ang = atan(uv.y, uv.x);',
    '',
    '  // 引力透镜：越靠近视界，角度被拧得越厉害',
    '  float bend = 0.085 / max(d, 0.035);',
    '  ang += bend + uTime * 0.02;',
    '',
    '  vec3 col = vec3(0.0);',
    '',
    '  // 星云：两大层低频 fbm，冷暖各一层，慢慢飘',
    '  vec2 nuv = uv * 1.55 + vec2(uTime * 0.012, uTime * 0.006);',
    '  float neb1 = fbm(nuv * 1.1 + vec2(0.0, 3.2));',
    '  float neb2 = fbm(nuv * 1.8 - vec2(4.1, 0.0));',
    '  vec3 nebCol = mix(vec3(0.10, 0.20, 0.46), vec3(0.40, 0.14, 0.50), neb2);',
    '  col += nebCol * pow(neb1, 1.7) * 2.4 * smoothstep(0.12, 1.05, d);',
    '  col += vec3(0.06, 0.18, 0.36) * pow(neb2, 2.2) * 1.25;',
    '',
    '  // 星空：用未透镜的坐标，点状，不被拉成雨丝',
    '  vec2 cell = floor(uv * 78.0);',
    '  float h = hash(cell);',
    '  vec2 off = vec2(hash(cell + 3.1), hash(cell + 7.7)) - 0.5;',
    '  float dotd = length(fract(uv * 78.0) - 0.5 - off * 0.55);',
    '  float star = step(0.90, h) * smoothstep(0.30, 0.0, dotd) * (0.4 + 1.6 * hash(cell + 11.3));',
    '  col += mix(vec3(0.70, 0.78, 1.0), vec3(1.0, 0.86, 0.70), hash(cell + 5.5)) * star * smoothstep(0.24, 0.55, d);',
    '',
    '  // 吸积盘：窄环 + 螺旋，别把整张画面糊满',
    '  float band = abs(d - 0.255);',
    '  float ring = smoothstep(0.130, 0.010, band);',
    '  float spiral = ang + 5.5 * log(d + 0.08) + uTime * 0.55 + 2.2 * fbm(uv * 3.1 + uTime * 0.05);',
    '  vec2 dp = vec2(cos(spiral), sin(spiral)) * 2.1;',
    '  float gas = fbm(dp * 1.9 + 7.3) * fbm(dp * 4.4 - 2.1);',
    '  gas = pow(gas, 1.9);',
    '  vec3 hot = mix(vec3(1.0, 0.30, 0.06), vec3(1.0, 0.88, 0.66), pow(gas, 1.2));',
    '  col += hot * ring * (0.18 + 1.35 * gas);',
    '  col += vec3(1.0, 0.62, 0.28) * smoothstep(0.055, 0.0, abs(d - 0.205)) * 0.28 * gas;',
    '',
    '  // 光子环：细亮的一圈',
    '  float photon = smoothstep(0.0075, 0.0, abs(d - 0.166));',
    '  col += vec3(1.0, 0.84, 0.58) * photon * 1.15;',
    '',
    '  // 事件视界：纯黑，边缘一点点辉光',
    '  float horizon = smoothstep(0.152, 0.146, d);',
    '  col *= (1.0 - horizon);',
    '  col += vec3(1.0, 0.50, 0.20) * smoothstep(0.164, 0.150, d) * 0.22 * (1.0 - horizon);',
    '',
    '  // 鼠标轻微推移',
    '  col *= 1.0 + 0.06 * dot(normalize(uMouse + 0.0001), normalize(uv + 0.0001));',
    '',
    '  // 色调 + 暗角',
    '  col = pow(col, vec3(0.92));',
    '  col *= 1.0 - 0.55 * smoothstep(0.45, 1.0, d);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  }
  var prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog); gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, 'uRes');
  var uTime = gl.getUniformLocation(prog, 'uTime');
  var uMouse = gl.getUniformLocation(prog, 'uMouse');

  var mouse = [0, 0], target = [0, 0];
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t0 = performance.now();

  function resize() {
    var dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  addEventListener('resize', resize); resize();

  addEventListener('pointermove', function (e) {
    target[0] = (e.clientX / innerWidth) * 2 - 1;
    target[1] = -((e.clientY / innerHeight) * 2 - 1);
  });

  (function frame(now) {
    var t = reduce ? 12 : (now - t0) / 1000;
    mouse[0] += (target[0] - mouse[0]) * 0.06;
    mouse[1] += (target[1] - mouse[1]) * 0.06;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.uniform2f(uMouse, mouse[0], mouse[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduce) requestAnimationFrame(frame);
  })(t0);
})();
