// 從 source/resume.json 產生 data/ 與 output/。純取值、確定性，不改寫內容。
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const LANGS = { zh: 'resume_zh_TW.json', en: 'resume_en.json' };

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isLang = (v) => isObj(v) && Object.keys(v).sort().join() === 'en,zh';
const readJson = (p) => JSON.parse(readFileSync(root + p, 'utf8'));
const toJson = (v) => JSON.stringify(v, null, 2) + '\n';

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

const source = readJson('source/resume.json');

for (const [lang, file] of Object.entries(LANGS)) {
  writeFileSync(`${root}data/${file}`, toJson(pick(source, lang, true)));
}
