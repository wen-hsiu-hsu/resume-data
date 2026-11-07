# resume-data 規則

- `data/*.json` 是唯一資料來源，格式為 JSON Resume。`resume_en.json` 和 `resume_zh_TW.json` 的結構必須保持一致。
- 修改 `data/` 後，push 前要確認 JSON 合法：`jq empty data/*.json`。JSON 壞掉網站就會壞掉。
- 這個 repo 是 public，而且整個透過 GitHub Pages 公開（包含 commit 歷史和 `output/`）。**不可以放任何私密資訊**，例如投遞紀錄、期望薪資、聯絡電話。
- 不可以自動寫入任何求職平台。LinkedIn 的使用者協議禁止自動化操作，連讀取頁面也不行。
- 104 會員規約第六條(八)禁止使用非 104 提供的自動化操作工具（https://accounts.104.com.tw/terms），使用者已知情並決定：`/spec-update 104` 可以讀取使用者自己打開的編輯頁欄位，但不可以自動寫入、儲存或送出。
- 產出內容只能根據 `data/` 的事實改寫或濃縮，**不可以捏造經歷、數字或技能**。
- 不要寫入舊的 gist（`b5a572372312fe91f0f36721e9d15007`），它已停用。
- 規格檔的字數上限不可憑印象填寫，沒有來源就寫「待確認」。
