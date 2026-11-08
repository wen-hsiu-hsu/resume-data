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

let copyFeedback;
function clearCopyFeedback() {
  if (!copyFeedback) return;
  clearTimeout(copyFeedback.timer);
  copyFeedback.status.textContent = '';
  copyFeedback.status.classList.remove('error');
  copyFeedback.target.classList.remove('copied');
  copyFeedback = null;
}

async function copy(text, field, target, selected = false) {
  clearCopyFeedback();
  const feedback = { status: field.querySelector('.copy-status'), target };
  copyFeedback = feedback;
  let message;
  let failed = false;
  try {
    await navigator.clipboard.writeText(text);
    message = selected ? `✓ 已複製選取的 ${[...text].length} 字` : '✓ 已複製';
  } catch {
    message = '複製失敗';
    failed = true;
  }
  // 只讓最後一次操作顯示回饋，避免較早的非同步請求覆蓋新狀態。
  if (copyFeedback !== feedback || !field.isConnected) return;
  feedback.status.textContent = message;
  feedback.status.classList.toggle('error', failed);
  target.classList.toggle('copied', !failed);
  feedback.timer = setTimeout(clearCopyFeedback, 1400);
}

const copyStatus = () => el('span', { class: 'copy-status', 'aria-live': 'polite' });
const copyButton = (text, what) => el('button', {
  class: 'copy', 'aria-label': `複製${what}`,
  onclick: (e) => {
    const field = e.currentTarget.closest('.copy-field');
    copy(text, field, field.querySelector('.value'));
  },
}, el('span', { class: 'copy-icon', 'aria-hidden': 'true' }), '複製');

function valueBox(text) {
  const pre = el('pre', { class: 'value', tabindex: '0' }, text);
  const copySelection = () => {
    const selection = getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;
    if (!pre.contains(selection.getRangeAt(0).commonAncestorContainer)) return;
    const selected = selection.toString();
    if (selected.trim()) copy(selected, pre.closest('.copy-field'), pre, true);
  };
  pre.addEventListener('mouseup', copySelection);
  pre.addEventListener('keyup', (e) => {
    if ((e.shiftKey && e.key.startsWith('Arrow')) || e.key === 'Shift') copySelection();
  });
  return pre;
}

function defaultPlatform(host) {
  const hit = state.index.find((p) => p.hosts.some((h) => host === h || host.endsWith(`.${h}`)));
  return (hit ?? state.index[0]).id;
}

// ---- 本站資料 ----
function renderField(f) {
  const near = f.limit != null && f.length <= f.limit && f.length >= f.limit * 0.9;
  const count =
    f.missing || f.length === undefined
      ? null
      : el('span', { class: `count${f.over ? ' over' : near ? ' near' : ''}` },
          `${f.over ? '⚠️ ' : ''}${f.length}${f.limit !== null ? ` / ${f.limit}` : ''}${f.list ? ' 項' : ' 字'}`);
  const head = el('div', { class: 'field-head' },
    el('span', { class: 'label' }, f.label),
    count, copyStatus(),
    f.missing ? null : copyButton(f.value, f.label));
  const body = f.missing
    ? el('div', { class: 'missing' }, '原始資料沒有，請在平台上自己填')
    : valueBox(f.value);
  const chips = f.list && f.list.length > 1
    ? el('div', { class: 'chips' }, el('span', { class: 'tag' }, '逐項複製'),
        f.list.map((x) => el('button', { onclick: (e) => copy(x, e.currentTarget.closest('.copy-field'), e.currentTarget) }, x)))
    : null;
  return el('div', { class: 'field copy-field' }, head, f.note ? el('p', { class: 'note' }, f.note) : null, body, chips);
}

function renderPlatform() {
  const out = state.outputs[`${state.platform}.${state.lang}`];
  $('#meta').textContent = `${state.index.find((p) => p.id === state.platform).platform} · 規格最後確認 ${out.checked ?? '未確認'}`;
  return out.sections.map((s) =>
    el('section', {},
      el('h2', {}, s.name),
      s.items.map((item) => el('div', { class: 'item' },
        item.title !== null ? el('h3', {}, item.title) : null, item.fields.map(renderField)))));
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
          el('div', { class: 'copy-field' },
            el('div', { class: 'field-head' },
              el('span', { class: 'tag' }, l === 'zh' ? '中' : '英'),
              copyStatus(), isEmpty(value[l]) ? null : copyButton(String(value[l]), `${path}（${l === 'zh' ? '中' : '英'}）`)),
            isEmpty(value[l]) ? el('div', { class: 'missing' }, '（空）') : valueBox(String(value[l])))))
    : el('div', { class: 'copy-field' },
        el('div', { class: 'field-head' }, el('span', { class: 'tag' }, '中英相同'), copyStatus(), copyButton(String(value), path)),
        valueBox(String(value)));
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
        return el('div', { class: 'item' }, el('h3', {}, `${i + 1}. ${title ?? ''}`), leaves(item, '', []).map(renderLeaf));
      });
    } else {
      blocks = leaves(val, '', []).map((leaf) => el('div', { class: 'item' }, renderLeaf(leaf)));
    }
    if (!blocks.length) return null;
    return el('section', {}, el('h2', {}, key), blocks);
  });
}

// ---- 共用 ----
function render() {
  clearCopyFeedback();
  document.querySelectorAll('[data-tab]').forEach((b) => {
    const active = b.dataset.tab === state.tab;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active);
  });
  document.querySelectorAll('[data-lang]').forEach((b) => {
    const active = b.dataset.lang === state.lang;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', active);
  });
  const onPlatform = state.tab === 'platform';
  $('.controls').hidden = !onPlatform;
  $('#platform').value = state.platform;
  $('#content').replaceChildren(...(onPlatform ? renderPlatform() : renderSource()).flat(Infinity).filter(Boolean));
  $('#sections').replaceChildren(...Array.from($('#content').querySelectorAll('section'), (section, i) => {
    section.id = `sec-${i}`;
    return el('a', {
      href: `#${section.id}`,
      onclick: (e) => { e.preventDefault(); section.scrollIntoView({ block: 'start' }); },
    }, section.querySelector('h2').textContent);
  }));
  $('#content').scrollTop = 0;
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
