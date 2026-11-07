// 104 履歷編輯頁的同步面板，由擴充功能以 world: MAIN 注入（見 manifest.json）。selector 依據 specs/104.md 的「編輯方式」各表。
// 規則：只有使用者按面板按鈕時才動作；只會點「編輯」「新增」，不點儲存、刪除、取消。
(() => {
  if (window.top !== window || location.hostname !== 'pda.104.com.tw') return;

  const VERSION = 'v10'; // 改了這個檔就加一，面板標題會顯示，用來確認擴充功能有重新載入
  let DATA = {};
  // 經由 bridge.js 向擴充功能要最新的本地資料（每次按「比對」都重讀，改了 output/ 再跑 npm run sync 就會生效）
  function loadData() {
    return new Promise((resolve) => {
      const onMsg = (e) => {
        if (e.source !== window || e.data?.source !== 'resume-sync-bridge') return;
        window.removeEventListener('message', onMsg);
        DATA = e.data.data || {};
        resolve(DATA);
      };
      window.addEventListener('message', onMsg);
      window.postMessage({ source: 'resume-sync-page', type: 'load', platform: '104' }, location.origin);
    });
  }
  const LIMITS = { 'work.name': 200, 'work.position': 200, 'work.description': 2000, 'work.skills': 6, 'bio.zh': 4000, 'bio.en': 8000 };
  const LABELS = {
    'work.name': '公司名稱', 'work.position': '職務名稱', 'work.start': '開始年月', 'work.end': '結束年月',
    'work.current': '仍在職', 'work.description': '工作描述', 'work.skills': '工作技能', 'bio.zh': '中文自傳', 'bio.en': '英文自傳',
  };
  const COLOR = { diff: '#f5b800', done: '#22a861', none: '#9aa0a6' };

  const log = (...a) => console.log('[resume-sync]', ...a);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (s) => String(s ?? '').replace(/\r/g, '').replace(/[ \t ]+/g, ' ').replace(/ *\n */g, '\n').trim();
  // 清單畫面的描述：用 Quill 存過的是 <p> 段落（空行是 <p><br></p>），舊資料是含換行的純文字
  const blockText = (el) => {
    if (!el) return '';
    const ps = el.querySelectorAll(':scope > p');
    return ps.length ? [...ps].map((p) => p.textContent).join('\n') : el.textContent;
  };
  const ymText = (v) => (v ? `${v.year}/${v.month}` : '');
  const localWork = () => DATA.zh?.fields?.work || [];
  const localBio = (lang) => DATA[lang]?.fields?.[`bio.${lang}`];

  // ---------- 安全點擊 ----------
  function safeClick(el) {
    const tag = el.closest('[data-gtm-cprofile]')?.getAttribute('data-gtm-cprofile') || '';
    if (/刪除|儲存|取消/.test(tag + ' ' + el.textContent.trim()) || el.closest('[data-e2e="sidebar__item-delete"]')) {
      throw new Error(`拒絕點擊：${tag || el.textContent.trim()}`);
    }
    el.click();
  }

  // ---------- 標色 ----------
  const marked = new Set();
  function mark(el, kind) {
    if (!el || !kind) return;
    el.style.outline = `3px solid ${COLOR[kind]}`;
    el.style.outlineOffset = '2px';
    marked.add(el);
  }
  function clearMarks() {
    marked.forEach((el) => { el.style.outline = ''; el.style.outlineOffset = ''; });
    marked.clear();
  }

  // ---------- 讀取：清單畫面 ----------
  function readWorkList() {
    return [...document.querySelectorAll('[data-e2e="experience-list"]')].map((card) => {
      const company = card.querySelector('.experience-list-list__companyName')?.textContent.trim() || '';
      const dur = card.querySelector('[data-e2e="experience-list__duration"] span')?.textContent.trim() || '';
      const m = dur.match(/(\d{4})\/(\d{1,2})\s*~\s*(?:(\d{4})\/(\d{1,2}))?/);
      return {
        card,
        values: {
          'work.name': company.split('（')[0].trim(),
          'work.position': card.querySelector('.experience-list-list__jobName')?.textContent.trim() || '',
          'work.start': m ? `${+m[1]}/${+m[2]}` : '',
          'work.end': /仍在職/.test(dur) ? '仍在職' : m && m[3] ? `${+m[3]}/${+m[4]}` : '',
          'work.description': blockText(card.querySelector('pre.experience-list-list__description__inner')),
          // 工作技能在清單上是一個 span：「#Vue #Git #Git flow」（標籤本身含 # 時會拆錯，例如 C#）
          'work.skills': ([...card.querySelectorAll('span.t4')].find((x) => /^#/.test(x.textContent.trim()))?.textContent || '')
            .split(/\s*#/).map((t) => t.trim()).filter(Boolean),
        },
        rawDuration: dur,
        hiddenName: /暫不公開/.test(company),
      };
    });
  }

  function matchLocal(pageValues, used) {
    const list = localWork();
    if (/暫不公開/.test(pageValues['work.name'])) pageValues = { ...pageValues, 'work.name': '' };
    let i = list.findIndex((w, k) => !used.has(k) && norm(w['work.name']) === norm(pageValues['work.name']));
    if (i < 0) i = list.findIndex((w, k) => !used.has(k) && ymText(w['work.start']) === pageValues['work.start']);
    return i;
  }

  function localWorkValues(w) {
    return {
      'work.name': w['work.name'],
      'work.position': w['work.position'],
      'work.start': ymText(w['work.start']),
      'work.current': !!w['work.current'], // 要在 work.end 之前寫：取消「仍在職」後結束年月才可以填
      'work.end': w['work.current'] ? '仍在職' : ymText(w['work.end']),
      'work.description': w['work.description'],
      'work.skills': w['work.skills'] || [],
    };
  }

  const same = (a, b) => (Array.isArray(a) || Array.isArray(b)
    ? JSON.stringify([...(a || [])].map(norm).sort()) === JSON.stringify([...(b || [])].map(norm).sort())
    : norm(a) === norm(b));

  function diffFields(pageV, localV, keys) {
    return keys.filter((k) => k in localV && !same(pageV[k], localV[k])).map((k) => ({ key: k, page: pageV[k], local: localV[k] }));
  }

  function compareList() {
    clearMarks();
    const used = new Set();
    const work = readWorkList().map((p) => {
      const i = matchLocal(p.values, used);
      if (i >= 0) used.add(i);
      // 勾選「不顯示公司名稱」時清單只顯示「公司名暫不公開」，真正的名稱要打開表單才看得到
      const keys = ['work.position', 'work.start', 'work.end', 'work.description', 'work.skills'];
      if (!p.hiddenName) keys.unshift('work.name');
      const diffs = i >= 0 ? diffFields(p.values, localWorkValues(localWork()[i]), keys).map((d) => (/^work\.(start|end)$/.test(d.key) ? { ...d, raw: p.rawDuration } : d)) : [];
      mark(p.card, i < 0 ? 'none' : diffs.length ? 'diff' : null);
      return { ...p, localIndex: i, diffs };
    });
    const localOnly = localWork().map((w, i) => ({ w, i })).filter(({ i }) => !used.has(i));
    const bio = ['zh', 'en'].map((lang) => {
      const el = document.querySelector(`[data-e2e="bio-${lang === 'zh' ? 'chi' : 'eng'}"]`);
      const local = localBio(lang);
      const page = blockText(el);
      const diff = local != null && !same(page, local);
      if (diff) mark(el, 'diff');
      return { lang, el, page, local, diff };
    });
    log('清單比對', { work: work.map((w) => ({ name: w.values['work.name'], localIndex: w.localIndex, diffs: w.diffs.map((d) => d.key) })), localOnly: localOnly.map((x) => x.w['work.name']), bio: bio.map((b) => [b.lang, b.diff]) });
    return { work, localOnly, bio };
  }

  // ---------- 讀取／寫入：表單 ----------
  // 104 表單每一列是 .form-element-form-row，標題在 .form-element-form-row__title（例如「公司名稱 *」，星號在子元素裡）
  const rowOf = (form, label) => [...form.querySelectorAll('.form-element-form-row__title')]
    .find((t) => t.textContent.replace(/\s|\*/g, '') === label)?.closest('.form-element-form-row') || null;

  function workFormEls(form) {
    const startYear = form.querySelector('input[placeholder="開始年份(西元)"]');
    const endYear = form.querySelector('input[placeholder="結束年份(西元)"]');
    const monthOf = (yearInput) => yearInput?.closest('.col-6')?.nextElementSibling?.querySelector('.form-element-tag-region');
    const currentBox = [...form.querySelectorAll('input[type=checkbox]')].find((c) => /仍在職/.test(c.parentElement?.textContent || ''));
    const skillsRow = rowOf(form, '工作技能');
    return {
      name: rowOf(form, '公司名稱')?.querySelector('input.multiselect'),
      position: form.querySelector('input[placeholder="例如：行銷企劃專員"]'),
      startYear, endYear, startMonth: monthOf(startYear), endMonth: monthOf(endYear), currentBox,
      quill: form.querySelector('.ql-container'),
      skillsRow,
    };
  }

  const monthValue = (region) => (region?.querySelector('.multiselect__single, .form-control--category-menu')?.textContent || '').replace(/\D/g, '');

  function readWorkForm(form) {
    const e = workFormEls(form);
    const ym = (y, m) => (y?.value ? `${+y.value}/${+monthValue(m) || ''}` : '');
    return {
      els: e,
      values: {
        'work.name': e.name?.value || '',
        'work.position': e.position?.value || '',
        'work.start': ym(e.startYear, e.startMonth),
        'work.end': e.currentBox?.checked ? '仍在職' : ym(e.endYear, e.endMonth),
        'work.current': !!e.currentBox?.checked,
        'work.description': e.quill?.__quill?.getText() || '',
        'work.skills': [...(e.skillsRow?.querySelectorAll('span.form-element-tag') || [])].map((t) => t.textContent.trim()),
      },
    };
  }

  function setNativeValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    input.focus();
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function pickMonth(region, month) {
    safeClick(region);
    await sleep(300);
    // 點擊事件掛在 span.multiselect__option 上，點外層的 li 不會選取
    const options = [...region.querySelectorAll('span.multiselect__option')];
    const opt = options.find((o) => o.textContent.replace(/\D/g, '') === String(month));
    if (!opt) {
      log('找不到月份選項', month, options.slice(0, 15).map((o) => `${o.tagName}.${o.className}:${o.textContent.trim()}`));
      throw new Error('找不到月份選項，請看終端機 log');
    }
    safeClick(opt);
    await sleep(200);
    if (monthValue(region) !== String(month)) throw new Error(`月份沒有選上（目前：${monthValue(region) || '空'}）`);
  }

  async function setTags(row, wanted) {
    const current = () => [...row.querySelectorAll('span.form-element-tag')];
    for (const tag of current()) {
      if (!wanted.some((w) => norm(w) === norm(tag.textContent))) safeClick(tag.querySelector('i.jb_icon_delete'));
      await sleep(150);
    }
    for (const w of wanted) {
      if (current().some((t) => norm(t.textContent) === norm(w))) continue;
      // 輸入框平常是隱藏的（maxlength 40），可見的優先，沒有就用隱藏的那個
      const inputs = [...row.querySelectorAll('input[type=text]')];
      const input = inputs.find((i) => i.getClientRects().length) || inputs[0];
      if (!input) { log('找不到工作技能的輸入框', row.outerHTML.slice(0, 500)); throw new Error('找不到工作技能的輸入框'); }
      setNativeValue(input, w);
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      await sleep(300);
    }
  }

  async function writeWorkField(e, key, value) {
    switch (key) {
      case 'work.name': if (!e.name) throw new Error('找不到公司名稱輸入框'); setNativeValue(e.name, value); return e.name;
      case 'work.position': setNativeValue(e.position, value); return e.position;
      case 'work.start':
      case 'work.end': {
        if (value === '仍在職') return e.currentBox; // 由 work.current 處理
        const [y, m] = value.split('/');
        const yearEl = key === 'work.start' ? e.startYear : e.endYear;
        setNativeValue(yearEl, y);
        await pickMonth(key === 'work.start' ? e.startMonth : e.endMonth, +m);
        return yearEl.closest('.row') || yearEl;
      }
      case 'work.current': if (e.currentBox.checked !== value) safeClick(e.currentBox); return e.currentBox;
      case 'work.description': e.quill.__quill.setText(value, 'user'); return e.quill;
      case 'work.skills': await setTags(e.skillsRow, value); return e.skillsRow;
    }
  }

  function bioQuill(form, lang) {
    const h = [...form.querySelectorAll('div.h4')].find((x) => x.textContent.trim() === (lang === 'zh' ? '中文自傳' : '英文自傳'));
    return h?.closest('.m-6')?.querySelector('.ql-container');
  }

  // ---------- 狀態 ----------
  let target = null; // 打開表單時對應的本地工作經驗 index
  const done = new Set();

  function currentForm() {
    const work = document.querySelector('.experience-editor');
    if (work) return { kind: 'work', form: work };
    const bio = document.querySelector('.bio-editor');
    if (bio) return { kind: 'bio', form: bio };
    return null;
  }

  function compareForm(f) {
    clearMarks();
    if (f.kind === 'bio') {
      const diffs = ['zh', 'en'].map((lang) => {
        const q = bioQuill(f.form, lang);
        const local = localBio(lang);
        return { key: `bio.${lang}`, el: q, page: q?.__quill?.getText() || '', local };
      }).filter((d) => d.local != null && (done.has(d.key) || !same(d.page, d.local)));
      diffs.forEach((d) => mark(d.el, done.has(d.key) ? 'done' : 'diff'));
      return { diffs };
    }
    const r = readWorkForm(f.form);
    if (target == null) {
      const i = matchLocal(r.values, new Set());
      if (i >= 0) target = i;
    }
    if (target == null) return { needTarget: true };
    const localV = localWorkValues(localWork()[target]);
    const diffs = Object.keys(localV).filter((k) => done.has(k) || !same(r.values[k], localV[k]))
      .map((k) => ({ key: k, page: r.values[k], local: localV[k], el: elFor(r.els, k) }));
    diffs.forEach((d) => mark(d.el, done.has(d.key) ? 'done' : 'diff'));
    return { diffs, els: r.els };
  }

  function elFor(e, key) {
    return { 'work.name': e.name, 'work.position': e.position, 'work.start': e.startYear?.closest('.row'), 'work.end': e.endYear?.closest('.row'),
      'work.current': e.currentBox?.parentElement, 'work.description': e.quill, 'work.skills': e.skillsRow }[key];
  }

  const tooLong = (key, v) => LIMITS[key] && (Array.isArray(v) ? v.length : norm(v).length) > LIMITS[key];

  async function syncFields(f, diffs) {
    for (const d of diffs) {
      if (tooLong(d.key, d.local)) { log('超過上限，略過', d.key); continue; }
      try {
        let el;
        if (f.kind === 'bio') { el = bioQuill(f.form, d.key.slice(4)); el.__quill.setText(d.local, 'user'); }
        else el = await writeWorkField(workFormEls(f.form), d.key, d.local);
        done.add(d.key);
        log('已寫入', d.key);
        await sleep(200);
        mark(el, 'done');
      } catch (err) {
        log('寫入失敗', d.key, err.message);
        alertBox(`${LABELS[d.key]} 寫入失敗：${err.message}`);
      }
    }
    render();
  }

  // ---------- 面板 ----------
  const host = document.createElement('div');
  host.id = 'resume-sync-panel';
  host.style.cssText = 'position:fixed;top:80px;right:12px;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      .p{width:380px;max-height:calc(100vh - 120px);overflow:auto;background:#fff;border:1px solid #ccc;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.15);font:13px/1.5 system-ui,sans-serif;color:#222}
      .h{display:flex;align-items:center;gap:6px;padding:8px 10px;background:#ff7800;color:#fff;border-radius:8px 8px 0 0;position:sticky;top:0;cursor:move;user-select:none}
      .h b{flex:1}
      button{font:inherit;cursor:pointer;border:1px solid #ccc;background:#fff;border-radius:4px;padding:2px 8px}
      button.pri{background:#ff7800;color:#fff;border-color:#ff7800}
      button:disabled{opacity:.4;cursor:not-allowed}
      .b{padding:8px 10px}
      .sec{margin:8px 0 4px;font-weight:600}
      .item{border:1px solid #eee;border-radius:6px;padding:6px;margin:6px 0}
      .d{margin:4px 0;padding:4px;border-left:3px solid ${COLOR.diff};background:#fffbea}
      .d.ok{border-color:${COLOR.done};background:#effaf3}
      .v{white-space:pre-wrap;max-height:80px;overflow:auto;font-size:12px;color:#555}
      .warn{color:#c00}
      .muted{color:#888}
      .msg{padding:6px 10px;background:#fff3f3;color:#c00}
    </style>
    <div class="p"><div class="h"><b>履歷同步 · 104 <small style="font-weight:400;opacity:.8">${VERSION}</small></b><button id="cmp">比對</button><button id="min">－</button></div><div id="msg"></div><div class="b" id="body"><span class="muted">進到履歷編輯頁後按「比對」。</span></div></div>`;
  const $ = (s) => root.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const show = (v) => esc(Array.isArray(v) ? v.join('、') : typeof v === 'boolean' ? (v ? '是' : '否') : v) || '<span class="muted">（空）</span>';
  function alertBox(t) { $('#msg').innerHTML = t ? `<div class="msg">${esc(t)}</div>` : ''; }

  $('#min').onclick = () => { const b = $('#body'); b.hidden = !b.hidden; };

  // 拖曳標題列移動面板（按鈕除外）
  $('.h').addEventListener('mousedown', (ev) => {
    if (ev.target.closest('button')) return;
    const r = host.getBoundingClientRect();
    const dx = ev.clientX - r.left, dy = ev.clientY - r.top;
    const move = (e) => {
      host.style.left = `${Math.max(0, Math.min(innerWidth - 60, e.clientX - dx))}px`;
      host.style.top = `${Math.max(0, Math.min(innerHeight - 40, e.clientY - dy))}px`;
      host.style.right = 'auto';
    };
    const up = () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up); };
    addEventListener('mousemove', move);
    addEventListener('mouseup', up);
    ev.preventDefault();
  });
  $('#cmp').onclick = async () => {
    alertBox('');
    done.clear();
    await loadData();
    if (!DATA.zh && !DATA.en) return alertBox('讀不到本地資料：請先在 repo 執行 npm run sync -- 104，再按「比對」。');
    render();
  };

  function diffHtml(d, withBox) {
    const over = tooLong(d.key, d.local);
    const ok = done.has(d.key);
    return `<div class="d ${ok ? 'ok' : ''}">
      ${withBox && !ok ? `<input type="checkbox" data-k="${d.key}" ${over ? 'disabled' : 'checked'}>` : ''}
      <b>${LABELS[d.key]}</b> ${ok ? '✅ 已更改，請按儲存' : ''} ${over ? `<span class="warn">⚠️ 超過上限 ${LIMITS[d.key]}，不能同步</span>` : ''}
      ${withBox && !ok && !over ? `<button data-one="${d.key}">同步這筆</button>` : ''}
      <div class="muted">頁面${d.raw ? `（原文：${esc(d.raw)}）` : ''}</div><div class="v">${show(d.page)}</div>
      <div class="muted">本地</div><div class="v">${show(d.local)}</div></div>`;
  }

  function render() {
    if (!DATA.zh && !DATA.en) { $('#body').innerHTML = '<span class="muted">按「比對」載入本地資料。</span>'; return; }
    if (!location.pathname.startsWith('/profile/edit')) { $('#body').innerHTML = '<span class="muted">請進到履歷編輯頁。</span>'; return; }
    const f = currentForm();
    if (!f) { target = null; return renderList(); }
    const r = compareForm(f);
    if (r.needTarget) return renderPickTarget();
    // 104 的必填檢查訊息（例如「職務類別 請填寫」），有的話儲存會被擋下
    const invalid = [...f.form.querySelectorAll('.form-element-inputbox__valid')].filter((e) => e.textContent.trim())
      .map((e) => `${e.closest('.form-element-form-row')?.querySelector('.form-element-form-row__title')?.textContent.replace(/\s|\*/g, '') || '某欄位'}：${e.textContent.trim()}`);
    const title = f.kind === 'bio' ? '自傳' : `工作經驗：本地「${esc(localWork()[target]['work.name'])}」`;
    $('#body').innerHTML = `<div class="sec">目前打開：${title}</div>
      ${invalid.length ? `<div class="warn">⚠️ 104 的必填檢查沒過，儲存會被擋下（這些欄位不在本地資料裡，請手動處理）：<br>${invalid.map(esc).join('<br>')}</div>` : ''}
      ${f.kind === 'work' ? `<div class="muted">對應錯了？<button id="repick">重選本地項目</button></div>` : ''}
      ${r.diffs.length ? `<div><button id="all">全選</button> <button class="pri" id="sel">同步選取的</button></div>${r.diffs.map((d) => diffHtml(d, true)).join('')}` : '<p>這一筆和本地一致。</p>'}
      <p class="muted">寫入後請自己檢查，再按頁面上的「儲存」。儲存後按「比對」看下一筆。</p>`;
    const byKey = Object.fromEntries(r.diffs.map((d) => [d.key, d]));
    root.querySelectorAll('[data-one]').forEach((b) => (b.onclick = () => syncFields(f, [byKey[b.dataset.one]])));
    $('#all') && ($('#all').onclick = () => root.querySelectorAll('input[data-k]:not(:disabled)').forEach((c) => (c.checked = true)));
    $('#sel') && ($('#sel').onclick = () => syncFields(f, [...root.querySelectorAll('input[data-k]:checked')].map((c) => byKey[c.dataset.k])));
    $('#repick') && ($('#repick').onclick = () => { target = null; renderPickTarget(); });
  }

  function renderPickTarget() {
    $('#body').innerHTML = `<div class="sec">這個表單要對應哪一筆本地資料？</div>
      ${localWork().map((w, i) => `<div><button data-t="${i}">${esc(w['work.name'])}（${ymText(w['work.start'])}）</button></div>`).join('')}`;
    root.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { target = +b.dataset.t; render(); }));
  }

  function renderList() {
    const r = compareList();
    const workHtml = r.work.map((w, k) => {
      const hiddenNote = w.hiddenName ? '<div class="muted">公司名稱設為不公開，打開後才能比對公司名稱。</div>' : '';
      if (w.localIndex < 0) return `<div class="item"><b>${esc(w.values['work.name'])}</b> <span class="muted">頁面有、本地沒有（不會刪除）</span></div>`;
      return `<div class="item"><b>${esc(w.values['work.name'])}</b>
        ${w.localIndex >= 0 ? `<span class="muted">對應本地：${esc(localWork()[w.localIndex]['work.name'])}</span>` : ''}${hiddenNote}
        ${w.diffs.length ? `<button class="pri" data-open="${k}">打開並同步</button>${w.diffs.map((d) => diffHtml(d, false)).join('')}` : ' <span class="muted">一致</span>'}</div>`;
    }).join('');
    const addHtml = r.localOnly.map(({ w, i }) => `<div class="item"><b>${esc(w['work.name'])}</b> <span class="muted">本地有、頁面沒有</span> <button data-add="${i}">新增到頁面</button></div>`).join('');
    const bioHtml = r.bio.map((b) => (b.diff ? diffHtml({ key: `bio.${b.lang}`, page: b.page, local: b.local }, false) : `<div class="muted">${LABELS[`bio.${b.lang}`]}：${b.local == null ? '本地沒有資料' : '一致'}</div>`)).join('');
    $('#body').innerHTML = `<div class="sec">工作經驗</div>${workHtml}${addHtml}
      <div class="sec">自傳 ${r.bio.some((b) => b.diff) ? '<button class="pri" id="openBio">打開並同步</button>' : ''}</div>${bioHtml}`;
    root.querySelectorAll('[data-open]').forEach((b) => (b.onclick = () => openWork(r.work[+b.dataset.open])));
    root.querySelectorAll('[data-add]').forEach((b) => (b.onclick = () => addWork(+b.dataset.add)));
    $('#openBio') && ($('#openBio').onclick = () => openBio());
  }

  async function waitForm(sel) {
    for (let i = 0; i < 30; i++) { if (document.querySelector(sel)) return; await sleep(200); }
    throw new Error('表單沒有打開');
  }

  async function guardNoForm() {
    if (currentForm()) { alertBox('已經有表單打開，請先儲存或關閉目前那一筆。'); return false; }
    return true;
  }

  async function openWork(w) {
    if (!(await guardNoForm())) return;
    try {
      w.card.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      w.card.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await sleep(200);
      safeClick(w.card.querySelector('[data-gtm-cprofile="edit-工作經歷-編輯"]'));
      target = w.localIndex;
      await waitForm('.experience-editor');
      await sleep(300);
      render();
    } catch (err) { log('打開失敗', err.message); alertBox(`打開失敗：${err.message}`); }
  }

  async function addWork(i) {
    if (!(await guardNoForm())) return;
    try {
      safeClick(document.querySelector('button[data-gtm-cprofile="edit-工作經歷-新增"]'));
      target = i;
      await waitForm('.experience-editor');
      await sleep(300);
      render();
    } catch (err) { log('新增失敗', err.message); alertBox(`新增失敗：${err.message}`); }
  }

  async function openBio() {
    if (!(await guardNoForm())) return;
    try {
      safeClick(document.querySelector('button[data-e2e="btn-edit-bio"]'));
      await waitForm('.bio-editor');
      await sleep(300);
      render();
    } catch (err) { log('打開失敗', err.message); alertBox(`打開失敗：${err.message}`); }
  }

  // 表單開關時自動重新比對
  let lastState = '';
  setInterval(() => {
    const f = currentForm();
    const state = `${location.pathname}|${f?.kind || ''}`;
    if (state !== lastState) {
      lastState = state;
      if (!f) done.clear();
      if (document.body.contains(host)) render();
    }
    if (!document.body.contains(host) && document.body) document.body.appendChild(host);
  }, 1000);

  loadData().then(() => log('面板已載入', DATA.zh || DATA.en ? '有本地資料' : '沒有本地資料'));
})();
