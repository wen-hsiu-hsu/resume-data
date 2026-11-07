# resume-data 規則

- `data/*.json` 是唯一資料來源，格式為 JSON Resume。`resume_en.json` 和 `resume_zh_TW.json` 的結構必須保持一致。
- 修改 `data/` 後，push 前要確認 JSON 合法：`jq empty data/*.json`。JSON 壞掉網站就會壞掉。
- 這個 repo 是 public，而且整個透過 GitHub Pages 公開（包含 commit 歷史和 `output/`）。**不可以放任何私密資訊**，例如投遞紀錄、期望薪資、聯絡電話。
- LinkedIn 的使用者協議禁止自動化操作，連讀取頁面也不行，任何工具都不可以碰 LinkedIn 頁面。
- 任何工具都不可以在求職平台上輸入、儲存、送出或刪除；內容一律由使用者自己複製貼上。
- 104 會員規約第六條(八)禁止使用非 104 提供的自動化操作工具（https://accounts.104.com.tw/terms）。使用者已知情，決定自行承擔帳號風險，只允許 `/spec-update` 讀取欄位。
- 私密欄位（電話、生日、兵役等）只放在不進版控的 `private.json`，不可以放進 `data/`、`output/` 或任何會 commit 的檔案。
- 產出內容只能根據 `data/` 的事實改寫或濃縮，**不可以捏造經歷、數字或技能**。
- 不要寫入舊的 gist（`b5a572372312fe91f0f36721e9d15007`），它已停用。
- 規格檔的字數上限不可憑印象填寫，沒有來源就寫「待確認」。
