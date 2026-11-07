# resume-data

[resume.hsiu.soy](https://resume.hsiu.soy) 的資料來源。履歷資料採用 [JSON Resume](https://jsonresume.org/schema) 格式，透過 GitHub Pages 以靜態 JSON 提供。

| 檔案 | 網址 |
|---|---|
| 英文履歷 | https://d.resume.hsiu.soy/data/resume_en.json |
| 中文履歷 | https://d.resume.hsiu.soy/data/resume_zh_TW.json |
| 技能 icon 對應 | https://d.resume.hsiu.soy/data/icon.json |

## 其他內容

- `specs/`：各求職平台（LinkedIn、104、CakeResume、Yourator）的欄位規格。
- `output/`：`/resume-sync` 產出的各平台貼上用內容（`.md`），以及給同步擴充功能讀的 `.json`。
- `.claude/commands/`：Claude Code 指令 `/resume-sync`、`/spec-update`。
- `sync/`：把 `output/` 的內容比對並填入求職平台編輯頁的 Chrome 擴充功能（目前支援 104 的工作經驗和自傳），設計見 [`docs/sync-script.md`](docs/sync-script.md)。

## 同步到 104

腳本只會填欄位，「儲存」一律由使用者自己按。

1. 第一次使用：在 Chrome 打開 `chrome://extensions`，開啟「開發人員模式」，按「載入未封裝項目」，選 `sync/extension/`。
2. `data/` 改過後，先跑 `/resume-sync 104`，更新 `output/104.<zh|en>.json`。
3. 執行 `npm run sync -- 104`：把本地資料複製進擴充功能，並用 Chrome 打開 104 履歷編輯頁。
4. 在頁面右側的「履歷同步 · 104」面板按「比對」，有差異的項目會加上黃框。
5. 對要更新的那一筆按「打開並同步」，或按「新增到頁面」，勾選欄位後按「同步選取的」。
6. 自己檢查一遍，補上本地資料沒有的必填欄位（例如「職務類別」），再按頁面上的「儲存」。

改了 `sync/extension/` 的程式後，要在 `chrome://extensions` 按 🔄 重新載入，再重新整理頁面；面板標題的版本號會跟著變。只改資料的話，重跑 `npm run sync -- 104` 再按「比對」就好。

> 104 會員規約第六條(八)禁止使用非 104 提供的自動化工具，使用這個擴充功能的帳號風險由使用者自行承擔。LinkedIn 不支援。

push 到 `main` 後，網站最晚約 20 分鐘更新（Pages 部署＋快取＋網站 SWR 10 分鐘）。
