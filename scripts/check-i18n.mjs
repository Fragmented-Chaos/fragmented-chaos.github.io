#!/usr/bin/env node
/**
 * 检查站点的多语言数据有没有出问题。零依赖，只用 Node 自带能力。
 *
 * 为什么需要它：页面里写的是 {{ t.xxx }}，键在 _data/i18n.yml 里。少一个键时
 * Liquid 不会报错，只会**渲染成空白** —— 线上就是这样静默坏掉的。这个脚本把这类
 * 问题挡在推送之前。
 *
 * 检查三件事：
 *   1. i18n 的 zh / en 键集合是否一致（少键、多键都报）
 *   2. 模板和页面里用到的 t.xxx 是否都有定义（按页面语言分别查）
 *   3. _data/pages.yml 里每个页面是否都给了 zh 和 en 两个地址
 * 另外会列出「定义了但没人用」的键（警告，不算失败，方便清理死键）
 *
 * 用法：node scripts/check-i18n.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 不用 import.meta.dirname：那个要 Node 20.11+，写兼容点更省心
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 所有语言组的键必须完全一致（加语言时在这里补一项） */
const LANGS = ['zh', 'zh-hant', 'en'];

/** 页面路径前缀 → 语言。zh-hant 必须在 zh 之前判断，否则会被前者吃掉 */
const LANG_DIRS = [['en', 'en'], ['zh-hant', 'zh-hant'], ['zh', 'zh']];

/** 只取 front matter 的键值，够用即可（这个数据文件都是 `键: 值` 一层结构） */
function splitFrontMatterLite(text) {
  const match = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) return { data: {} };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return { data };
}

const problems = [];
const warnings = [];

function fail(message) {
  problems.push(message);
}

/**
 * 极简 YAML 解析，只覆盖本站这两个数据文件的结构：
 *   顶层分组（zh: / en: / 页面名:），下面是一层 `键: 值`。
 * 遇到看不懂的结构（列表、缩进块、更深的层级）直接报错退出 ——
 * 宁可让人来改脚本，也不要静默地把文件解析错。
 */
function parseFlatGroups(file) {
  const text = fs.readFileSync(file, 'utf8');
  const groups = {};
  let current = null;

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const lineNo = index + 1;
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) return;

    const topLevel = /^([A-Za-z0-9_-]+):\s*$/.exec(rawLine);
    if (topLevel) {
      current = topLevel[1];
      groups[current] = {};
      return;
    }

    const entry = /^ {2}([A-Za-z0-9_-]+):\s*(.*)$/.exec(rawLine);
    if (entry && current) {
      let value = entry[2].trim();
      // YAML 里没加引号的 “: ”（冒号+空格）会被当成嵌套映射，直接让构建挂掉。
      // 这个坑本站踩过两次（英文文案很常见），所以在这里先拦一道。
      if (!/^["']/.test(value) && /:\s/.test(value)) {
        fail(`${path.relative(ROOT, file)}:${lineNo} 值里含未加引号的 ": "，会让 YAML 解析失败，请整体加双引号： ${entry[1]}`);
      }
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      groups[current][entry[1]] = value;
      return;
    }

    fail(`${path.relative(ROOT, file)}:${lineNo} 结构超出本脚本能解析的范围，请更新 scripts/check-i18n.mjs： ${rawLine.trim()}`);
  });

  return groups;
}

/* ---------- 1. i18n 键集合 ---------- */
const i18nPath = path.join(ROOT, '_data/i18n.yml');
const i18n = parseFlatGroups(i18nPath);

for (const lang of LANGS) {
  if (!i18n[lang]) fail(`_data/i18n.yml 缺少语言组 "${lang}:"`);
}
for (const lang of Object.keys(i18n)) {
  if (!LANGS.includes(lang)) warnings.push(`_data/i18n.yml 里有未在脚本登记的语言组 "${lang}"（LANGS 里补上才会检查它）`);
}

const LANG_PAIRS = [];
for (const a of LANGS) for (const b of LANGS) if (a !== b) LANG_PAIRS.push([a, b]);
for (const [a, b] of LANG_PAIRS) {
  if (!i18n[a] || !i18n[b]) continue;
  const missing = Object.keys(i18n[a]).filter((key) => !(key in i18n[b]));
  for (const key of missing) {
    fail(`_data/i18n.yml: "${key}" 在 ${a} 里有、${b} 里没有 —— 对应语言的页面会显示空白`);
  }
}

/* ---------- 2. 页面/模板里引用的键是否都有定义 ---------- */
/** 读 _config.yml 的 exclude 列表：被 Jekyll 排除的文件（如 README.md）不是页面，不该扫 */
function readExcludes() {
  const lines = fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8').split(/\r?\n/);
  const excludes = new Set();
  let inside = false;
  for (const line of lines) {
    if (/^exclude:\s*$/.test(line)) { inside = true; continue; }
    if (!inside) continue;
    const item = /^\s+-\s*([^#\s]+)/.exec(line);
    if (item) excludes.add(item[1].replace(/\/$/, ''));
    else if (/^\S/.test(line)) inside = false; // 回到顶层键，exclude 段结束
  }
  return excludes;
}

const EXCLUDES = readExcludes();

function collectFiles(dir, extension, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['_site', 'node_modules', '.git', 'assets', '_sass', 'scripts', '_layouts'].includes(entry.name)) continue;
    if (EXCLUDES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, extension, acc);
    else if (full.endsWith(extension)) acc.push(full);
  }
  return acc;
}

const templates = [
  ...collectFiles(path.join(ROOT, '_layouts'), '.html'),
  ...collectFiles(ROOT, '.md'),
  ...collectFiles(ROOT, '.html'), // 用 HTML 写的页面同样要查（_layouts 已在 collectFiles 里排除）
];

const used = new Set();
for (const file of templates) {
  const rel = path.relative(ROOT, file);
  // 页面语言由所在目录决定（zh/ en/ zh-hant/），根目录的 index.md 视为 zh
  const first = rel.split(/[\\/]/)[0];
  const dir = LANG_DIRS.find(([prefix]) => prefix === first);
  const lang = dir ? dir[1] : 'zh';
  const table = i18n[lang] || {};
  let text = fs.readFileSync(file, 'utf8');

  // 注释里的 t.xxx 只是说明文字，不该当成引用，先剥掉
  text = text.replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, ' ');
  text = text.replace(/<!--[\s\S]*?-->/g, ' ');

  for (const match of text.matchAll(/\bt\.([A-Za-z0-9_]+)/g)) {
    const key = match[1];
    used.add(key);
    if (!(key in table)) {
      fail(`${rel}: 用到 t.${key}，但 _data/i18n.yml 的 ${lang} 里没有这个键（页面会显示空白）`);
    }
  }
}

for (const lang of LANGS) {
  if (!i18n[lang]) continue;
  for (const key of Object.keys(i18n[lang])) {
    if (!used.has(key)) warnings.push(`_data/i18n.yml: "${key}"（${lang}）定义了但没有任何页面用到，可以考虑删掉`);
  }
}

/* ---------- 3. pages.yml 每个页面都要有中英地址 ---------- */
const pagesPath = path.join(ROOT, '_data/pages.yml');
const pages = parseFlatGroups(pagesPath);
for (const [name, langs] of Object.entries(pages)) {
  for (const lang of LANGS) {
    if (!langs[lang] || !String(langs[lang]).trim()) {
      fail(`_data/pages.yml: 页面 "${name}" 缺少 ${lang} 地址 —— 语言切换会指向空链接`);
    }
  }
}

/* ---------- 3b. 同一个页面的各语言地址不能重复 ---------- */
// 语言切换靠这些地址。两个语言指向同一个地址时，切换脚本会"跳到当前页 → 又判断该跳"
// → 无限重载（起始页就踩过这个坑：landing 的 zh-hant 被写成了 /）。
for (const [name, langs] of Object.entries(pages)) {
  const seen = new Map();
  for (const lang of Object.keys(langs)) {
    const url = String(langs[lang]).trim();
    if (!url) continue;
    if (seen.has(url)) {
      fail(`_data/pages.yml: 页面 "${name}" 的 ${seen.get(url)} 和 ${lang} 指向同一个地址 ${url} —— 语言切换会陷入无限重载`);
    } else {
      seen.set(url, lang);
    }
  }
}

/* ---------- 4. 页面里写的 key 必须能在 pages.yml 里找到 ---------- */
// default 布局的语言切换按钮靠 site.data.pages[page.key][other] 取另一语言地址。
// key 拼错或漏登记时，那个链接会变成空的（线上不报错，只是点了没反应）。
for (const file of templates) {
  if (!file.endsWith('.md') && !file.endsWith('.html')) continue;
  const rel = path.relative(ROOT, file);
  const { data } = splitFrontMatterLite(fs.readFileSync(file, 'utf8'));
  if (!data.key) continue;
  const route = pages[data.key];
  if (!route) {
    fail(`${rel}: front matter 里的 key "${data.key}" 在 _data/pages.yml 里没有对应路由 —— 语言切换按钮会指向空链接`);
  }
}

/* ---------- 输出 ---------- */
const keysOf = (lang) => Object.keys(i18n[lang] || {}).length;
const counts = LANGS.map((lang) => `${lang} ${keysOf(lang)} 键`).join(' / ');
console.log(`i18n: ${counts}；检查了 ${templates.length} 个模板与页面（含 .html）、${Object.keys(pages).length} 个路由`);

if (warnings.length) {
  console.log(`\n警告 (${warnings.length})：`);
  for (const w of warnings) console.log('  · ' + w);
}

if (problems.length) {
  console.log(`\n错误 (${problems.length})：`);
  for (const p of problems) console.log('  ✗ ' + p);
  console.log('\n检查未通过');
  process.exit(1);
}

console.log('\n检查通过');
