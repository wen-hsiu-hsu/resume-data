---
description: 更新某個求職平台的欄位規格 specs/<平台>.md
argument-hint: "<linkedin|104|cakeresume|yourator>"
---

平台：$ARGUMENTS

先讀 `CLAUDE.md` 的規則並遵守，再讀目前的 `specs/<平台>.md`。

## LinkedIn

- **不要讀取 LinkedIn 的任何個人頁面或編輯頁**（使用者協議禁止自動化操作）。
- 用網路搜尋 LinkedIn 官方說明文件（優先 `linkedin.com/help`，其次 LinkedIn 官方網域的其他頁面），整理各欄位的字數上限。
- 每個數字都要附來源網址；找不到官方來源的寫「待確認」，不要用第三方文章的數字。

## 104、CakeResume、Yourator

使用 Claude in Chrome（先載入 `claude-in-chrome` skill 確認目前的使用方式）。

1. 請我自己在 Chrome 登入並打開履歷編輯頁，等我說好了再開始。**104 每次登入都要手機驗證碼，一定要我本人操作。**
2. **只讀取，不輸入、不點擊儲存或送出**，也不要點任何可能跳出確認視窗的按鈕。需要展開某個區塊時先問我。
3. 記錄每個欄位的名稱、類型（文字／下拉／日期／富文本／標籤）、字數上限（頁面上的計數器或 `maxlength`），以及對應的 JSON Resume 路徑。頁面上看不出上限的寫「待確認」。

## 最後

更新 `specs/<平台>.md`（欄位規格表的格式維持不變，「來源」寫頁面或說明網址，「最後確認」寫今天日期），顯示 `git diff`，**等我確認後才 commit**，訊息為 `docs: update <平台> spec`。
