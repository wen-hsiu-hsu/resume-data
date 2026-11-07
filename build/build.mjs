// 從 source/resume.json 產生 data/、output/，並把 output/ 的變動寫進 logs/。
// 純取值、確定性，不改寫內容；超過字數上限只標 ⚠️，不截斷。
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, appendFileSync, rmSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const LANGS = { zh: 'resume_zh_TW.json', en: 'resume_en.json' };
const LANG_NAME = { zh: '中文', en: '英文' };
const PRESENT = { zh: '至今', en: 'Present' };

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isLang = (v) => isObj(v) && Object.keys(v).sort().join() === 'en,zh';
const readJson = (p) => JSON.parse(readFileSync(root + p, 'utf8'));
const toJson = (v) => JSON.stringify(v, null, 2) + '\n';
const isEmpty = (v) => v === undefined || v === null || v === '';

// 選語言；dropExt 時去掉所有 ext
function pick(node, lang, dropExt) {
  if (isLang(node)) return node[lang];
  if (Array.isArray(node)) return node.map((x) => pick(x, lang, dropExt));
  if (isObj(node)) {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (dropExt && k === 'ext') continue;
      out[k] = pick(v, lang, dropExt);
    }
    return out;
  }
  return node;
}

// "a.b[].c"：`[]` 展開陣列並略過 hidden: true 的項目
function resolve(obj, path) {
  let cur = [obj];
  let multi = false;
  for (const seg of path.split('.')) {
    if (seg.endsWith('[]')) {
      const key = seg.slice(0, -2);
      cur = cur.flatMap((o) => (o?.[key] ?? []).filter((x) => !x?.hidden));
      multi = true;
    } else {
      cur = cur.map((o) => o?.[seg]);
    }
  }
  return multi ? cur : cur[0];
}

const ym = (d) => (isEmpty(d) ? '' : d.replace('-', '/'));

// 回傳 { value, list? }；list 只在 lines、tags 出現，字數上限算的是項目數
function format(values, fmt, lang) {
  const flat = values.flat(Infinity).filter((v) => !isEmpty(v)).map(String);
  switch (fmt) {
    case 'lines':
      return { value: flat.join('\n'), list: flat };
    case 'tags':
      return { value: flat.join(', '), list: flat };
    case 'ym': {
      const [start, end] = values;
      if (values.length === 1 || isEmpty(start)) return { value: ym(start) };
      return { value: `${ym(start)} – ${isEmpty(end) ? PRESENT[lang] : ym(end)}` };
    }
    case 'summary+bullets': {
      const [summary, bullets = []] = values;
      const parts = [];
      if (!isEmpty(summary)) parts.push(summary);
      const b = bullets.filter((x) => !isEmpty(x));
      if (b.length) parts.push(b.map((x) => `• ${x}`).join('\n'));
      return { value: parts.join('\n\n') };
    }
    case undefined:
    case 'text':
      return { value: flat.join(', ') };
    default:
      throw new Error(`未知的 format：${fmt}`);
  }
}

function buildField(field, base, defaultLang) {
  const out = { label: field.label };
  if (field.path === null) {
    out.missing = true;
  } else {
    const lang = field.lang ?? defaultLang;
    const scope = base(lang);
    const paths = Array.isArray(field.path) ? field.path : [field.path];
    const { value, list } = format(paths.map((p) => resolve(scope, p)), field.format, lang);
    if (value === '') out.missing = true;
    out.value = value;
    if (list) out.list = list;
    out.length = list ? list.length : [...value].length;
  }
  out.limit = field.limit ?? null;
  if (out.limit !== null && out.length > out.limit) out.over = true;
  if (field.note) out.note = field.note;
  return out;
}

function buildPlatform(spec, resumes, lang) {
  const sections = spec.sections.map((section) => {
    let items;
    if (section.each) {
      items = resumes[lang][section.each].map((_, i) => {
        const base = (l) => resumes[l][section.each][i];
        const fields = section.fields.map((f) => buildField(f, base, lang));
        const title = section.title ? resolve(base(lang), section.title) : fields.find((f) => !f.missing)?.value;
        return { title: isEmpty(title) ? `#${i + 1}` : String(title), fields };
      });
    } else {
      items = [{ title: null, fields: section.fields.map((f) => buildField(f, (l) => resumes[l], lang)) }];
    }
    return { name: section.name, items };
  });
  return { platform: spec.platform, lang, checked: spec.checked, sections };
}

// 攤平成「區塊 › 項目 › 欄位」→ 值，給 log 比對
function flatten(out) {
  const map = new Map();
  for (const s of out.sections) {
    s.items.forEach((item, i) => {
      const title = item.title === null ? null : `${i + 1}. ${item.title}`;
      for (const f of item.fields) {
        const key = [s.name, title, f.label].filter((x) => x !== null).join(' › ');
        map.set(key, f.missing ? '' : f.value);
      }
    });
  }
  return map;
}

const show = (v) => {
  if (v === '') return '（空）';
  if (!v.includes('\n')) return `\`${v}\``;
  return '\n\n    ```\n' + v.split('\n').map((l) => `    ${l}`).join('\n') + '\n    ```';
};

// ---- data/ ----
const source = readJson('source/resume.json');
for (const [lang, file] of Object.entries(LANGS)) {
  writeFileSync(`${root}data/${file}`, toJson(pick(source, lang, true)));
}

// ---- output/ ----
const resumes = { zh: pick(source, 'zh', false), en: pick(source, 'en', false) };
const specFiles = readdirSync(`${root}specs`).filter((f) => f.endsWith('.json')).sort();
const logLines = [];
const warnings = [];
const written = new Set();

for (const file of specFiles) {
  const id = file.replace(/\.json$/, '');
  const spec = readJson(`specs/${file}`);
  for (const lang of Object.keys(LANGS)) {
    const outPath = `output/${id}.${lang}.json`;
    written.add(`${id}.${lang}.json`);
    const prev = existsSync(root + outPath) ? readJson(outPath) : null;
    const out = buildPlatform(spec, resumes, lang);
    writeFileSync(root + outPath, toJson(out));

    const heading = `### ${spec.platform}（${LANG_NAME[lang]}）`;
    const next = flatten(out);
    if (!prev?.sections) {
      logLines.push(heading, '', `- [ ] 首次產出，共 ${next.size} 個欄位`, '');
    } else {
      const old = flatten(prev);
      const changes = [];
      for (const key of new Set([...old.keys(), ...next.keys()])) {
        const a = old.get(key) ?? '';
        const b = next.get(key) ?? '';
        if (a !== b) changes.push(`- [ ] ${key}`, `  - 舊值：${show(a)}`, `  - 新值：${show(b)}`);
      }
      if (changes.length) logLines.push(heading, '', ...changes, '');
    }

    for (const s of out.sections) {
      for (const item of s.items) {
        for (const f of item.fields) {
          if (!f.over) continue;
          const where = [s.name, item.title, f.label].filter((x) => x !== null).join(' › ');
          warnings.push(`- ⚠️ ${spec.platform}（${LANG_NAME[lang]}）${where}：${f.length} / ${f.limit}`);
        }
      }
    }
  }
}

// 規格已刪除的平台，產出也一併刪掉
for (const f of readdirSync(`${root}output`)) {
  if (!written.has(f)) rmSync(`${root}output/${f}`);
}

// ---- logs/ ----
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
const logPath = `${root}logs/${day}.md`;
mkdirSync(`${root}logs`, { recursive: true });
const body = [`## ${time}`, ''];
if (logLines.length) body.push(...logLines);
else body.push('沒有變動', '');
if (warnings.length) body.push('超過字數上限：', '', ...warnings, '');
if (!existsSync(logPath)) appendFileSync(logPath, `# 更新紀錄 ${day}\n\n`);
appendFileSync(logPath, body.join('\n') + '\n');

console.log(logLines.length ? `有變動，見 logs/${day}.md` : '沒有變動');
for (const w of warnings) console.log(w);
