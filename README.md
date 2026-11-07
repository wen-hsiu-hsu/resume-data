# resume-data

[resume.hsiu.soy](https://resume.hsiu.soy) 的資料來源。履歷資料採用 [JSON Resume](https://jsonresume.org/schema) 格式，透過 GitHub Pages 以靜態 JSON 提供。

| 檔案 | 網址 |
|---|---|
| 英文履歷 | https://d.resume.hsiu.soy/data/resume_en.json |
| 中文履歷 | https://d.resume.hsiu.soy/data/resume_zh_TW.json |
| 技能 icon 對應 | https://d.resume.hsiu.soy/data/icon.json |

## 其他內容

- `source/resume.json`：唯一資料來源。中英不同的值寫成 `{ "zh": …, "en": … }`，JSON Resume 沒有的平台欄位放在 `ext`。
- `specs/<平台>.json`：各求職平台（LinkedIn、104、CakeResume、Yourator）的欄位規格。
- `output/<平台>.<zh|en>.json`：依規格產出的各平台貼上用內容。
- `logs/YYYY-MM-DD.md`：每次 build 後 `output/` 的變動清單。
- `.claude/commands/`：Claude Code 指令 `/spec-update`。

## 更新資料

1. 修改 `source/resume.json`。
2. 執行 `npm run build`（Node 24 以上，沒有相依套件）：產生 `data/resume_*.json`、`output/`，並在 `logs/` 記下這次的變動；超過字數上限的欄位會標 ⚠️，不會截斷。
3. 依 log 逐項到各平台貼上，完成的打勾。

## 複製面板（Chrome 擴充功能）

`extension/` 是一個獨立視窗的複製面板：按一下就複製，再由自己貼到求職平台。它不注入任何程式到網頁，只讀目前分頁的網址來決定預設平台。

1. 在 `chrome://extensions` 開啟「開發人員模式」，按「載入未封裝項目」，選 `extension/`。
2. 在求職平台的分頁按工具列圖示，就會打開面板視窗。視窗可以拖曳、調整大小，下次會開在同樣的位置與大小。
3. 「本站資料」：依平台規格的順序列出欄位，可切平台和中英文；標籤類欄位可以逐項複製。「原始資料」：`source/resume.json` 的每個值，中英並列。
4. 資料從 `https://d.resume.hsiu.soy/` 抓，所以 push 並部署後面板才會看到新資料，按 ↻ 重新抓。

改了 `extension/` 的程式後，要在 `chrome://extensions` 按 🔄 重新載入。

push 到 `main` 後，網站最晚約 20 分鐘更新（Pages 部署＋快取＋網站 SWR 10 分鐘）。
