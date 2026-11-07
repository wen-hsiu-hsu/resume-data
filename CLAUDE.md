# resume-data 規則

- `source/resume.json` 是唯一資料來源，結構沿用 JSON Resume：中英不同的值寫成 `{ "zh": …, "en": … }`，相同的只寫一次；JSON Resume 沒有的平台欄位放在各筆的 `ext` 底下。
- `data/resume_zh_TW.json`、`data/resume_en.json` 由 `npm run build` 產生，不可以手改；`data/icon.json` 手改，build 不碰。
- 修改 `source/` 後要跑 `npm run build`，push 前確認 JSON 合法：`jq empty source/*.json data/*.json`。JSON 壞掉網站就會壞掉。
- 這個 repo 是 public，而且整個透過 GitHub Pages 公開（包含 commit 歷史和 `output/`）。**不可以放任何私密資訊**，例如投遞紀錄、期望薪資、聯絡電話。
- LinkedIn 的使用者協議禁止自動化操作，連讀取頁面也不行。`extension/` 擴充功能只能讀分頁網址來判斷預設平台，不可以在 linkedin.com 注入 content script，也不可以讀取或操作頁面內容；其他工具一律不碰 LinkedIn 頁面。
- 任何工具都不可以在求職平台上輸入、儲存、送出或刪除；內容一律由使用者自己複製貼上。
- 104 會員規約第六條(八)禁止使用非 104 提供的自動化操作工具（https://accounts.104.com.tw/terms）。使用者已知情，決定自行承擔帳號風險，只允許 `/spec-update` 讀取欄位。
- 私密欄位（電話、生日、兵役等）只放在不進版控的 `private.json`，不可以放進 `source/`、`data/`、`output/` 或任何會 commit 的檔案。
- `ext` 與產出內容只能根據 `source/` 既有的事實改寫或濃縮，**不可以捏造經歷、數字或技能**。
- 不要寫入舊的 gist（`b5a572372312fe91f0f36721e9d15007`），它已停用。
- 規格檔的字數上限不可憑印象填寫，沒有來源就寫「待確認」。
