# resume-data 規則

Codex 與 Claude 共用這份規則；`CLAUDE.md` 只是匯入它。

## 資料與產出

- `source/resume.json` 是唯一資料來源，結構沿用 JSON Resume：中英不同的值寫成 `{ "zh": …, "en": … }`，相同的只寫一次；JSON Resume 沒有的平台欄位放在各筆的 `ext` 底下。不再使用任何同步腳本。
- `data/resume_zh_TW.json`、`data/resume_en.json` 由 `npm run build` 產生，不可以手改；`data/icon.json` 手改，build 不碰。
- 修改 `source/` 後要跑 `npm run build`，push 前確認 JSON 合法：`jq empty source/*.json data/*.json specs/*.json output/*.json`。JSON 壞掉網站就會壞掉。
- build 會在 `logs/` 附加段落；只為檢查而跑時，事後用 `git checkout logs` 還原。
- 對外的資料網址一律寫 `https://d.resume.hsiu.soy/`（例如 `/data/`、`/output/`），不寫 github.io。
- `ext` 與產出內容只能根據 `source/` 既有的事實改寫或濃縮，**不可以捏造經歷、數字或技能**。
- 規格檔的字數上限不可憑印象填寫，沒有來源就寫「待確認」。
- 不要寫入舊的 gist（`b5a572372312fe91f0f36721e9d15007`），它已停用。

## 隱私

- 這個 repo 是 public，而且整個透過 GitHub Pages 公開（包含 commit 歷史和 `output/`）。**不可以放任何私密資訊**，例如投遞紀錄、期望薪資、聯絡電話。
- 私密欄位（電話、生日、兵役等）只放在不進版控的 `private.json`，不可以放進 `source/`、`data/`、`output/` 或任何會 commit 的檔案。

## 求職平台

- 任何工具都不可以在求職平台上輸入、儲存、送出或刪除；內容一律由使用者自己複製貼上。
- LinkedIn 的使用者協議禁止自動化操作，連讀取頁面也不行。任何工具都不碰 LinkedIn 頁面，也不要提議自動填表。
- 104 會員規約第六條(八)禁止使用非 104 提供的自動化操作工具（https://accounts.104.com.tw/terms）。使用者已知情，決定自行承擔帳號風險，只允許 `/spec-update` 讀取欄位。
- 104 會擋 Playwright 開的 Chrome。不要用 Playwright 開 104，也不要嘗試繞過偵測。
- 104 的「職務類別」必填但原始檔沒有，貼 104 工作經驗時要提醒使用者自己選；要寫入 `ext.jobCategory` 必須先經使用者確認。

## 慣例

- commit message 用英文 conventional commits（`feat:`、`fix:`、`docs:`）；程式註解和文件用繁體中文。
- commit 可以，push 必須先經使用者同意。

## 分工流程：Claude 規劃與審核，Codex 開發

角色：

- **Claude**：只寫規劃書和審核報告，不改程式碼（`build/`）。資料照舊：`source/` 依使用者指示修改，`specs/` 透過 `/spec-update` 更新。
- **Codex**：只照規劃書或審核報告開發，不自行擴大範圍；規劃書沒寫清楚就停下來，在回報裡提問，不要猜。
- **使用者**：核准規劃書，決定每一條審核意見要不要修，決定何時合併與 push。

檔案（`plans/` 會公開，同樣不可以放私密資訊）：

- `plans/<名稱>.md`：規劃書，Claude 寫。Codex 只填最後的「開發回報」一節。
- `plans/<名稱>.review.md`：審核報告，Claude 寫，每輪一節。Codex 只處理「給 Codex」清單裡的項目。

步驟：

1. Claude 寫好規劃書，使用者核准後 commit 到 `main`。
2. 使用者在 repo 根目錄啟動 Codex：`依 plans/<名稱>.md 開發`。
3. Codex 從 `main` 開 branch `feat/<名稱>`，照規劃書開發並跑完驗收步驟。在 branch 上 commit，填好「開發回報」後一起 commit。不 push、不合併。
4. 使用者在 Claude Code 跑 `/review-codex <名稱>`。Claude 對照規劃書審核 diff，寫出第 N 輪審核報告，並在對話中逐條請使用者決定修或不修。
5. 有要修的項目：使用者告訴 Codex `依 plans/<名稱>.review.md 第 N 輪「給 Codex」修正`。Codex 修完後在同一個 branch commit，並在該輪「Codex 回覆」逐條註明怎麼處理。之後回到步驟 4。
6. 審核通過，使用者同意後才合併到 `main` 並 push。
