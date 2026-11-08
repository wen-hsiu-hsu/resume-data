---
description: 對照規劃書審核 Codex 在 feat/<名稱> 的開發，寫出審核報告並請使用者逐條決定
argument-hint: <規劃名稱，例如 panel-redesign>
---

依 `AGENTS.md`「分工流程」步驟 4 審核 `$ARGUMENTS`。只審核，不修改程式碼。

1. **讀資料**
   - 讀 `plans/$ARGUMENTS.md`，包括最後的「開發回報」。
   - 如果 `plans/$ARGUMENTS.review.md` 已經存在，也讀它，並以它最後一輪的「給 Codex」和「Codex 回覆」為準。
   - 跑 `git log --oneline main..feat/$ARGUMENTS` 和 `git diff main...feat/$ARGUMENTS`。
   - branch 不存在，或「開發回報」還沒填，就停下來告訴使用者。
2. **實際跑一次**
   - 用 `git worktree add` 把 branch checkout 到 scratchpad，不要動使用者的工作目錄。
   - 在那個 worktree 起 `AGENTS.md` 寫的本機 server，抽查規劃書驗收清單中跟這次改動有關的項目。
   - 不可以開任何求職平台頁面。
   - 結束後關掉 server，移除 worktree。
3. **審核**
   - 對照規劃書：每一條規格和驗收是否做到、範圍以外的檔案是否被改。
   - 對照 `AGENTS.md`：私密資訊、平台限制、不捏造、無外部資源。
   - 檢查正確性與可及性。
   - 「開發回報」裡寫的驗收結果，要和你自己跑出來的一致。
   - 可以分軸派 `reviewer` 子代理，結論由你判斷是否成立。
4. **寫報告**：在 `plans/$ARGUMENTS.review.md` 新增一節「第 N 輪（日期，審核的 commit SHA）」。
   - **發現**：表格，欄位為「編號、嚴重度（必修／建議／小節）、位置 `檔案:行`、問題、建議修法、預設（修／不修）」。
   - **給 Codex**：先留空，等使用者決定。
   - **Codex 回覆**：留空，由 Codex 填。
5. **請使用者決定**
   - 在對話中列出發現，每條附上預設。會改變使用者看到的畫面或操作的項目，要逐條單獨問。
   - 使用者決定後，把要修的項目寫進「給 Codex」。每條都要能獨立看懂，寫出檔案、問題和預期結果。
   - 報告和規劃書的變更要 commit 到 `main` 嗎？先問使用者。
6. **收尾**
   - 有要修的項目：告訴使用者對 Codex 說 `依 plans/$ARGUMENTS.review.md 第 N 輪「給 Codex」修正`。
   - 全部通過：該輪寫「通過」，問使用者是否合併 `feat/$ARGUMENTS` 到 `main` 並 push。合併方式依 repo 慣例。
