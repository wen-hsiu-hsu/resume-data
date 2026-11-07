// 隔離環境的橋接：頁面環境的 104.page.js 讀不到擴充功能的檔案，由這裡轉送。
// 104.page.js 必須跑在頁面環境（world: MAIN），才讀得到 .ql-container.__quill。
window.addEventListener('message', (e) => {
  if (e.source !== window || e.data?.source !== 'resume-sync-page' || e.data.type !== 'load') return;
  chrome.runtime.sendMessage({ type: 'load', platform: e.data.platform }, (data) => {
    window.postMessage({ source: 'resume-sync-bridge', type: 'data', data }, location.origin);
  });
});
