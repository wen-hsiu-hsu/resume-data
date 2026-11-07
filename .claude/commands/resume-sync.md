---
description: 依各平台規格，從 data/ 產出可直接貼上的中英文履歷內容
argument-hint: "[linkedin|104|cakeresume|yourator] [--full]"
---

參數：$ARGUMENTS

先讀 `CLAUDE.md` 的規則並遵守。平台參數可省略，省略時處理全部四個平台（linkedin、104、cakeresume、yourator）。

1. **決定處理範圍**
   - 如果 `.last-sync` 不存在，或參數帶了 `--full`：處理全部內容。
   - 否則執行 `git diff $(cat .last-sync) HEAD -- data/`，只處理有變動的區塊（例如某段 work、summary、skills）。
2. **沒有變動**：直接告訴我「data/ 自上次同步後沒有變動」，然後結束，不寫任何檔案。
3. **產出**：對每個平台 × 每種語言（zh 讀 `data/resume_zh_TW.json`，en 讀 `data/resume_en.json`），依 `specs/<平台>.md` 的欄位對應和字數上限，寫入 `output/<平台>.<zh|en>.md`：
   - 依照平台編輯頁的順序（即規格表的順序），每個欄位一個區塊，標題寫欄位名稱，內容放在 code block 裡方便複製。
   - 每個區塊標明這次是「新增」、「修改」還是「未變」。增量模式下，未變的區塊保留上次的內容並標「未變」。
   - 超過字數上限的欄位標 ⚠️，附上目前字數和精簡版本。
   - 規格標「待確認」的欄位照樣產出，並註明「規格未確認」。
   - 中文版和英文版分開兩份，不要在同一欄位中英並列。
   - 只能根據 `data/` 的事實改寫或濃縮，不可以捏造經歷、數字或技能。
   - 規格有「編輯方式」表的平台（目前只有 104），另外寫 `output/<平台>.<zh|en>.json` 給同步擴充功能讀，格式見 `docs/sync-script.md`。內容與 `.md` 相同，只是改成結構化，換行用 `\n`：
     - `fields.work[]`：每筆含 `match`（`name`、`startDate`）、`work.name`、`work.position`、`work.start`／`work.end`（`{ "year", "month" }`，在職中為 `null`）、`work.current`、`work.description`（摘要＋空一行＋`• ` 開頭的條列）、`work.skills`。
     - `work.skills` 只能從 `skills[].keywords[]` 挑出在該筆 `summary`／`highlights` 裡字面出現過的關鍵字，數量不超過規格上限，不可以推測。
     - `fields["bio.<zh|en>"]`：對應語言的 `basics.summary`。
     - 增量模式也要寫出完整 JSON，不是只寫有變動的部分。
4. **摘要**：在對話裡列出哪些平台、哪些欄位需要更新。
5. **記錄並 commit**：把 `git rev-parse HEAD` 寫入 `.last-sync`，把 `output/`（含 `.json`）和 `.last-sync` 一起 commit，訊息為 `chore: resume-sync YYYY-MM-DD`（當天日期）。不要 push，問我要不要 push。
