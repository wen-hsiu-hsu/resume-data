// 用法：npm run sync -- 104
// 把本地資料複製進擴充功能（sync/extension/data/，不進版控），再用 Chrome 打開平台編輯頁。
// 擴充功能要先在 chrome://extensions 以「載入未封裝項目」載入 sync/extension/。設計見 docs/sync-script.md。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PLATFORMS = {
  104: { url: 'https://pda.104.com.tw/profile/edit' },
};

const platform = process.argv[2];
const conf = PLATFORMS[platform];
if (!conf) {
  console.error(`用法：npm run sync -- <${Object.keys(PLATFORMS).join('|')}>`);
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const dataDir = path.join(here, 'extension', 'data');
fs.rmSync(dataDir, { recursive: true, force: true });
fs.mkdirSync(dataDir, { recursive: true });

const files = [`output/${platform}.zh.json`, `output/${platform}.en.json`, 'private.json'];
const copied = files.filter((f) => {
  const src = path.join(repo, f);
  if (!fs.existsSync(src)) return false;
  JSON.parse(fs.readFileSync(src, 'utf8')); // JSON 壞掉就在這裡停下
  fs.copyFileSync(src, path.join(dataDir, path.basename(f)));
  return true;
});
if (!copied.some((f) => f.startsWith('output/'))) {
  console.error(`找不到 output/${platform}.<zh|en>.json，先執行 /resume-sync ${platform}`);
  process.exit(1);
}
console.log(`已複製到擴充功能：${copied.join('、')}`);

execFileSync('open', ['-a', 'Google Chrome', conf.url]);
console.log(`已用 Chrome 打開 ${conf.url}。進到編輯頁後按右側面板的「比對」。`);
