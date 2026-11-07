// 點工具列圖示：打開（或叫出）面板視窗，並把目前分頁的網域交給面板判斷預設平台。
// 只讀分頁網址，不注入任何 content script，也不讀取或操作頁面內容。
const DEFAULT_BOUNDS = { width: 480, height: 760 };

chrome.action.onClicked.addListener(async (tab) => {
  let host = '';
  try {
    host = new URL(tab.url).hostname;
  } catch {}

  const { panelId } = await chrome.storage.session.get('panelId');
  if (panelId !== undefined) {
    try {
      await chrome.windows.update(panelId, { focused: true });
      chrome.runtime.sendMessage({ type: 'host', host }).catch(() => {});
      return;
    } catch {
      // 視窗已經被關掉
    }
  }

  const { bounds } = await chrome.storage.local.get('bounds');
  const win = await chrome.windows.create({
    url: `panel.html?host=${encodeURIComponent(host)}`,
    type: 'popup',
    ...(bounds ?? DEFAULT_BOUNDS),
  });
  await chrome.storage.session.set({ panelId: win.id });
});

chrome.windows.onBoundsChanged.addListener(async (win) => {
  const { panelId } = await chrome.storage.session.get('panelId');
  if (win.id !== panelId) return;
  const { left, top, width, height } = win;
  await chrome.storage.local.set({ bounds: { left, top, width, height } });
});

chrome.windows.onRemoved.addListener(async (id) => {
  const { panelId } = await chrome.storage.session.get('panelId');
  if (id === panelId) await chrome.storage.session.remove('panelId');
});
