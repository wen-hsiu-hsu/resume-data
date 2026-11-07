---
description: 更新某個求職平台的欄位規格 specs/<平台>.json
argument-hint: "<linkedin|104|cakeresume|yourator>"
---

平台：$ARGUMENTS

先讀 `CLAUDE.md` 的規則並遵守，再讀目前的 `specs/<平台>.json` 和 `source/resume.json`。

## LinkedIn

- **不要讀取 LinkedIn 的任何個人頁面或編輯頁**（使用者協議禁止自動化操作）。
- 用網路搜尋 LinkedIn 官方說明文件（優先 `linkedin.com/help`，其次 LinkedIn 官方網域的其他頁面），整理各欄位的字數上限。
- 每個數字都要附來源網址（寫在該欄位的 `note`）；找不到官方來源的 `limit` 寫 `null`、`note` 寫「待確認」，不要用第三方文章的數字。

## 104、CakeResume、Yourator

使用 Claude in Chrome（先載入 `claude-in-chrome` skill 確認目前的使用方式）。

1. 請我自己在 Chrome 登入並打開履歷編輯頁，等我說好了再開始。**104 每次登入都要手機驗證碼，一定要我本人操作。**
2. **只讀取，不輸入、不點擊儲存或送出**，也不要點任何可能跳出確認視窗的按鈕。需要展開某個區塊時先問我。
3. 依編輯頁的順序記錄每個欄位的名稱、字數上限（頁面上的計數器或 `maxlength`，在 `note` 註明出處），以及在 `source/resume.json` 的路徑。頁面上看不出上限的 `limit` 寫 `null`、`note` 寫「待確認」。不要記錄 selector、按鈕位置或欄位裡現有的值。

## 規格格式

```json
{ "platform": "104", "hosts": ["pda.104.com.tw"], "source": "來源頁面或說明網址", "checked": "YYYY-MM-DD",
  "sections": [{ "name": "工作經驗", "each": "work", "title": "name", "fields": [
    { "label": "公司名稱", "limit": 200, "path": "name" },
    { "label": "工作描述", "limit": 2000, "path": ["summary", "highlights"], "format": "summary+bullets" },
    { "label": "英文姓名", "path": "basics.name", "lang": "en" },
    { "label": "產業", "path": null, "note": "原始資料沒有" } ]}]}
```

- `each`：多筆區塊對應的陣列，`path` 相對於每一筆；沒有 `each` 時 `path` 從根開始。`title`（選填）：每筆的標題路徑，預設用第一個有值的欄位。
- `path`：字串或字串陣列；`a[].b` 會展開陣列並略過 `hidden: true` 的項目。`null` 表示原始資料沒有，也不打算放（例如私密資訊）。
- `format`：`text`（預設）、`ym`、`lines`、`tags`、`summary+bullets`。`lines`、`tags` 的 `limit` 是項目數。
- `lang`（選填）：不管產出語言，固定取這個語言的值。

## 原始資料缺的欄位

平台有、`source/resume.json` 沒有、但可以公開的欄位（例如 104 的職務類別、個人格言），提議在對應的 `ext` 底下新增（例如 `work[].ext.jobCategory`），規格的 `path` 指向它：

- 內容只能依 `source/resume.json` 既有的事實寫，不可以捏造；沒有事實根據的留空，請我自己填。
- 列出要新增的路徑和中英內容，**等我確認後才寫入** `source/resume.json`。
- 私密資訊（電話、生日、兵役等）不新增，`path` 寫 `null`。

## 最後

更新 `specs/<平台>.json`（`checked` 寫今天日期），執行 `npm run build` 確認沒有錯誤，顯示 `git diff`，**等我確認後才 commit**，訊息為 `docs: update <平台> spec`。
