// 讀取 npm run sync 複製進來的本地資料（data/ 不進版控）
const read = (file) => fetch(chrome.runtime.getURL(`data/${file}`)).then((r) => (r.ok ? r.json() : null)).catch(() => null);

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg?.type !== 'load') return;
  Promise.all([read(`${msg.platform}.zh.json`), read(`${msg.platform}.en.json`), read('private.json')])
    .then(([zh, en, priv]) => reply({ zh, en, private: priv }));
  return true;
});
