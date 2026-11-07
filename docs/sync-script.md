# 同步腳本設計

把本地履歷資料同步到求職平台的編輯頁。先做 104 的工作經驗和自傳，跑通後再擴充到其他區塊和 CakeResume、Yourator。**LinkedIn 永遠不在範圍內**（見 `CLAUDE.md`）。

## 流程

1. 使用者執行 `npm run sync -- 104`，腳本用 Playwright 開啟一個專用 Chrome profile 的分頁，連到該平台的履歷頁。
2. 使用者自己登入（104 要手機驗證碼）、進到編輯頁，並打開要同步的區塊。
3. 使用者在面板上按「比對」，腳本讀取目前打開的表單欄位，與本地資料比對。
4. 面板列出每個不同的欄位（頁面值 vs 本地值），頁面上對應欄位加黃框。
5. 使用者勾選要同步的欄位，按「同步選取的」一次寫入，或在單筆上按「同步這筆」。寫入一律以本地資料為準。
6. 寫入後欄位改成綠框，面板標記「已更改，請按儲存」。
7. 使用者自己檢查並按該區塊的「儲存」。**腳本不點儲存、送出、刪除或取消。**

## 資料來源

- `output/<平台>.<zh|en>.json`：由 `/resume-sync` 產出，內容已依規格的字數上限改寫，鍵是規格「編輯方式」表的欄位 id。範例：

  ```json
  {
    "platform": "104",
    "lang": "zh",
    "dataCommit": "5afd614",
    "fields": {
      "bio.zh": "具設計背景的前端工程師……",
      "work": [
        {
          "match": { "name": "某公司", "startDate": "2023-03" },
          "work.name": "某公司",
          "work.position": "前端工程師",
          "work.start": { "year": 2023, "month": 3 },
          "work.end": null,
          "work.description": "- 獨立開發……",
          "work.skills": ["JavaScript", "VueJS"]
        }
      ]
    }
  }
  ```

- `private.json`：私密欄位（電話、生日、兵役等），放在 repo 根目錄但列入 `.gitignore`，格式同上的 `fields`。第一版用不到，先建立 `.gitignore` 規則即可。
- 一頁可能同時有中英文欄位（104 自傳），腳本依欄位 id 的語言後綴讀取對應的 JSON。

## 多筆區塊的對應

工作經驗、學歷這類有多筆的區塊，使用者一次只打開一筆。腳本用 `match`（公司名稱＋開始年月）找出本地對應的那一筆；找不到或有多筆符合時，面板顯示下拉選單讓使用者選擇。

## 比對規則

- 文字：去掉頭尾空白、把連續空白壓成一個再比對。
- 富文本：取純文字後套用上面的規則，忽略 HTML 標籤差異。
- 標籤：視為集合比對，順序不同不算差異。
- 日期：比對年和月。
- 本地值超過字數上限時，不允許同步，並在面板上標 ⚠️。

## 寫入方式

每個欄位的寫入方式記在 `specs/<平台>.md` 的「編輯方式」表，類型如下：

| 寫入方式 | 做法 |
|---|---|
| `input` | 用原生 value setter 設值，再觸發 `input` 和 `change` 事件，讓框架（Vue／React）收到變更 |
| `quill` | 透過 Quill 實例 `setText`／`clipboard.dangerouslyPasteHTML` 寫入。**假設，要先驗證**：頁面上能取得 Quill 實例 |
| `dropdown` | 點開自訂下拉，再點文字相符的選項 |
| `tags` | 先刪除多出的標籤（點標籤上的 ×），再在輸入框輸入並按 Enter 新增缺少的 |
| `checkbox` | 狀態不同時點一下 |

## 面板

- 固定在頁面右側，可以收合；樣式用 shadow DOM 隔離，不影響頁面。
- 顯示：目前偵測到的區塊、對應的本地資料筆數、差異清單（全選／個別勾選）、「比對」「同步選取的」按鈕。
- 黃框表示有差異，綠框表示已寫入、待儲存，灰框表示本地沒有對應資料。
- 頁面上的表單關閉或切換後，清除框線，要重新比對。

## 技術選擇

- Node + Playwright，`launchPersistentContext` 搭配 `channel: 'chrome'`。
- Chrome profile 放在 repo 外（`~/.resume-sync/chrome-profile`），裡面有登入 cookie，不可以放進 repo。
- **假設，要先驗證**：在 Playwright 開的 Chrome 裡，104 的登入與手機驗證可以正常完成，而且重新開啟後登入狀態還在。第一個實作步驟就是驗證這點；不行的話改用 Chrome 擴充功能或 userscript，再回來討論。
- 面板和比對邏輯用 `page.addInitScript` 注入，所有寫入都在頁面內執行，由面板按鈕觸發。

## 第一版範圍（104）

| 欄位 id | 欄位 | 寫入方式 |
|---|---|---|
| `work.name` | 公司名稱 | `input` |
| `work.position` | 職務名稱 | `input` |
| `work.start` / `work.end` | 任職期間（月份下拉＋年份數字） | `dropdown` + `input` |
| `work.description` | 工作描述 | `quill` |
| `work.skills` | 工作技能 | `tags` |
| `bio.zh` | 中文自傳 | `quill` |
| `bio.en` | 英文自傳 | `quill` |

這些欄位的 selector 要先用 `/spec-update 104` 補進「編輯方式」表。

## 驗收

- 打開一筆工作經驗，按「比對」，差異欄位有黃框，面板列出的值和頁面一致。
- 同步選取的欄位後，頁面上的值與本地值一致，欄位變成綠框；腳本沒有點過「儲存」。
- 使用者按儲存後重新整理頁面、再比對，該筆沒有差異。
- 本地值超過字數上限時，同步按鈕不能按。
