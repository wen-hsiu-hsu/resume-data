// 面板：從 GitHub Pages 抓 output/ 與 source/，顯示欄位並提供複製。
// 不接觸任何求職平台頁面；貼上一律由使用者自己操作。
const isExtension = location.protocol === 'chrome-extension:';
// 在本機用 http 開 extension/panel.html 測試時，改讀 repo 根目錄的檔案
const BASE = isExtension ? 'https://d.resume.hsiu.soy/' : new URL('../', location.href).href;
const PRIVATE_KEYS = new Set(['phone', 'birthDate', 'birthday', 'military']);

const state = { tab: 'platform', lang: 'zh', platform: null, host: '', index: [], outputs: {}, source: null };
const $ = (sel) => document.querySelector(sel);

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isLang = (v) => isObj(v) && Object.keys(v).sort().join() === 'en,zh';
const isEmpty = (v) => v === undefined || v === null || v === '';

async function fetchJson(path) {
  const res = await fetch(BASE + path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path}：HTTP ${res.status}`);
  return res.json();
}

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'onclick') node.addEventListener('click', v);
    else node.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

let toastTimer;
async function copy(text, what) {
  await navigator.clipboard.writeText(text);
  const t = $('#toast');
  t.textContent = `已複製${what ? `：${what}` : ''}`;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1200);
}

const copyButton = (text, what) => el('button', { class: 'copy', onclick: () => copy(text, what) }, '複製');

function defaultPlatform(host) {
  const hit = state.index.find((p) => p.hosts.some((h) => host === h || host.endsWith(`.${h}`)));
  return (hit ?? state.index[0]).id;
}

// ---- 本站資料 ----
function renderField(f) {
  const count =
    f.missing || f.length === undefined
      ? null
      : el('span', { class: `count${f.over ? ' over' : ''}` },
          `${f.over ? '⚠️ ' : ''}${f.length}${f.limit !== null ? ` / ${f.limit}` : ''}${f.list ? ' 項' : ' 字'}`);
  const head = el('div', { class: 'field-head' },
    el('span', { class: 'label' }, f.label),
    count,
    f.missing ? null : copyButton(f.value, f.label));
  const body = f.missing
    ? el('div', { class: 'missing' }, '原始資料沒有')
    : el('pre', {}, f.value);
  const chips = f.list && f.list.length > 1
    ? el('div', { class: 'chips' }, f.list.map((x) => el('button', { onclick: () => copy(x, x) }, x)))
    : null;
  return el('div', { class: 'field' }, head, f.note ? el('p', { class: 'note' }, f.note) : null, body, chips);
}

function renderPlatform() {
  const out = state.outputs[`${state.platform}.${state.lang}`];
  $('#meta').textContent = `規格最後確認：${out.checked ?? '未確認'}`;
  return out.sections.map((s) =>
    el('section', {},
      el('h2', {}, s.name),
      s.items.map((item) => [item.title !== null ? el('h3', {}, item.title) : null, item.fields.map(renderField)])));
}

// ---- 原始資料 ----
function leaves(node, path, out) {
  if (isLang(node)) {
    if (!isEmpty(node.zh) || !isEmpty(node.en)) out.push({ path, value: node });
  } else if (Array.isArray(node)) {
    node.forEach((x, i) => leaves(x, `${path}[${i}]`, out));
  } else if (isObj(node)) {
    for (const [k, v] of Object.entries(node)) {
      if (PRIVATE_KEYS.has(k)) continue;
      leaves(v, path ? `${path}.${k}` : k, out);
    }
  } else if (!isEmpty(node)) {
    out.push({ path, value: node });
  }
  return out;
}

function renderLeaf({ path, value }) {
  const body = isLang(value)
    ? el('div', { class: 'pair' },
        ['zh', 'en'].map((l) =>
          el('div', {},
            el('div', { class: 'field-head' },
              el('span', { class: 'tag' }, l === 'zh' ? '中' : '英'),
              isEmpty(value[l]) ? null : copyButton(String(value[l]), path)),
            isEmpty(value[l]) ? el('div', { class: 'missing' }, '（空）') : el('pre', {}, String(value[l])))))
    : el('div', {},
        el('div', { class: 'field-head' }, el('span', { class: 'tag' }, '中英相同'), copyButton(String(value), path)),
        el('pre', {}, String(value)));
  return el('div', { class: 'field' }, el('div', { class: 'path' }, path), body);
}

function renderSource() {
  $('#meta').textContent = 'source/resume.json';
  return Object.entries(state.source).map(([key, val]) => {
    if (PRIVATE_KEYS.has(key)) return null;
    let blocks;
    if (Array.isArray(val) && val.length && val.every(isObj)) {
      blocks = val.map((item, i) => {
        const name = item.name ?? item.institution ?? item.language;
        const title = isLang(name) ? name.zh : name;
        return [el('h3', {}, `${i + 1}. ${title ?? ''}`), leaves(item, '', []).map(renderLeaf)];
      });
    } else {
      blocks = leaves(val, '', []).map(renderLeaf);
    }
    if (!blocks.length) return null;
    return el('section', {}, el('h2', {}, key), blocks);
  });
}

// ---- 共用 ----
function render() {
  document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === state.tab));
  document.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('active', b.dataset.lang === state.lang));
  const onPlatform = state.tab === 'platform';
  $('#platform').hidden = !onPlatform;
  $('.lang').hidden = !onPlatform;
  $('#platform').value = state.platform;
  $('#content').replaceChildren(...(onPlatform ? renderPlatform() : renderSource()).flat(Infinity).filter(Boolean));
}

async function load() {
  $('#content').replaceChildren(el('p', { class: 'status' }, '載入中…'));
  try {
    state.index = await fetchJson('output/index.json');
    const files = state.index.flatMap((p) => ['zh', 'en'].map((l) => `${p.id}.${l}`));
    const [source, ...outs] = await Promise.all([
      fetchJson('source/resume.json'),
      ...files.map((f) => fetchJson(`output/${f}.json`)),
    ]);
    state.source = source;
    state.outputs = Object.fromEntries(files.map((f, i) => [f, outs[i]]));
    $('#platform').replaceChildren(...state.index.map((p) => el('option', { value: p.id }, p.platform)));
    state.platform ??= defaultPlatform(state.host);
    render();
  } catch (err) {
    $('#content').replaceChildren(el('p', { class: 'error' }, `讀取失敗：${err.message}`));
  }
}

document.querySelectorAll('[data-tab]').forEach((b) =>
  b.addEventListener('click', () => { state.tab = b.dataset.tab; render(); }));
document.querySelectorAll('[data-lang]').forEach((b) =>
  b.addEventListener('click', () => { state.lang = b.dataset.lang; render(); }));
$('#platform').addEventListener('change', (e) => { state.platform = e.target.value; render(); });
$('#reload').addEventListener('click', load);

// 再按一次工具列圖示時，依新的分頁網域切換預設平台
if (isExtension) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type !== 'host') return;
    state.host = msg.host;
    if (!state.index.length) return;
    state.platform = defaultPlatform(msg.host);
    render();
  });
}

state.host = new URLSearchParams(location.search).get('host') ?? '';
load();
