# 規劃書：複製面板重新設計（panel-redesign）

- 狀態：已核准（2026-11-09）
- 規劃：Claude，2026-11-09
- 開發：Codex，branch `feat/panel-redesign`（從 `main` 開）
- 流程與規則：見 `AGENTS.md`，開工前先讀完。

## 目標

照新設計稿重做 `extension/` 面板的版面，並改變複製的操作方式：

- 可以用滑鼠選取一段文字，選完就自動複製。
- 複製結果顯示在該欄位旁邊，不再用底部 toast。

資料來源、抓取方式、平台判斷都不變。

## 設計參考

- `plans/panel-redesign.design.html`：Claude Design 稿的原始碼（`.dc.html` 格式，不能直接開）。只拿來參考結構、尺寸和色票，**不要複製它的 runtime 寫法**（`<x-dc>`、`{{…}}`、`DCLogic`）。
- 設計稿與本規劃書衝突時，以本規劃書為準。已知的衝突是：設計稿把整塊值做成按鈕，本規劃書改成可選取的文字（見「複製」）。

## 範圍

只改以下三個檔案：

- `extension/panel.html`
- `extension/panel.css`
- `extension/panel.js`

不改的部分：

- `background.js`、`manifest.json`
- `build/`、`output/` 的格式
- 抓取與預設平台邏輯（`fetchJson`、`load`、`defaultPlatform`、`onMessage`）
- `PRIVATE_KEYS` 過濾

## 不做

- o15：標出上次更新後變動的欄位。
- 英文資料的處理方式（中／EN 照舊切換 `output/<平台>.<語言>.json`）。
- 外部字型、外部 script、npm 依賴、新的權限。
- 區段捷徑列不標示目前所在的區段。

## 規格

### 版面

- `body` 佔滿視窗高度（`100vh`），直向 flex：header 和捷徑列固定在上方，`main` 自己捲動（`overflow-y: auto`）。
- header 與捷徑列都要 `flex-shrink: 0`。上一版設計稿就是因為沒加而跑版。
- 用 CSS 變數定義色票，以 `prefers-color-scheme` 切換深淺色：

| 變數 | 淺色 | 深色 |
|---|---|---|
| `--bg` | `#f5f6f8` | `#15171b` |
| `--surface` | `#ffffff` | `#1d2026` |
| `--line` | `#e2e5ea` | `#2f333b` |
| `--text` | `#1b1e24` | `#e8eaee` |
| `--muted` | `#5f6673` | `#9aa1ad` |
| `--subtle` | `#eceef2` | `#262a31` |
| `--accent` | `#2357d9` | `#8fb0ff` |
| `--ok` | `#1a7f4b` | `#4cc38a` |
| `--ok-bg` | `#eaf6ef` | `#16301f` |
| `--warn` | `#a14a12` | `#f3a46b` |
| `--warn-bg` | `#fdf0e6` | `#3a2415` |

- 字型沿用現有的 `system-ui, -apple-system, "PingFang TC", sans-serif`，基準 13px／1.5。

### Header（由上而下）

1. **第一排**：
   - 左側是分頁切換「本站資料／原始資料」。外觀是分段按鈕：外框用 `--subtle` 底，選中的那顆用 `--surface` 底加淡陰影。標上 `role="tablist"`、`role="tab"` 和 `aria-selected`。
   - 右側是重新抓取按鈕，34×34，內嵌 stroke SVG 圖示（不用 ↻ 字元），加 `aria-label="重新抓取資料"`。
2. **第二排**（只在「本站資料」顯示）：
   - 平台選單：外框裡放「平台」小字，後面接 `<select>`，佔滿剩餘寬度。
   - 語言分段按鈕：「中」「EN」，標上 `aria-pressed`。
3. **meta 行**：一個 `--ok` 色的小圓點，加上文字。
   - 本站資料：`<平台名稱> · 規格最後確認 <checked 或「未確認」>`
   - 原始資料：`source/resume.json`

### 區段捷徑列

- 位置在 header 下方，兩個分頁都顯示。
- 內容由目前畫面的 `<section>` 產生：每個 section 給 id `sec-<序號>`，捷徑文字就是該區段的 `h2`。
- 標籤用 `<a href="#sec-N">`，外觀為圓角膠囊，高 28px，文字不換行。
- 列本身不換行；放不下時橫向捲動，並隱藏捲軸（`scrollbar-width: none`）。
- 點擊時 `preventDefault`，改呼叫 `section.scrollIntoView({ block: 'start' })`。因為捲動的是 `main`，header 不會蓋住標題。
- 切換分頁、平台或語言時重新產生捷徑列，`main` 捲回頂端。

### 欄位卡片

- 每個 section 的標題（`h2`）用 12px、`--muted` 色。
- 每個 item 是一張卡片：`--surface` 底、`--line` 框線、圓角 10px。
- item 有 title 時，放在卡片頂部（`h3`，14px，粗體）；卡片內的欄位以上框線分隔。
- 欄位頭一行由左到右依序是：
  - 標籤（粗體）
  - 字數徽章（`margin-left: auto`）
  - 複製狀態
  - 複製按鈕（圖示加「複製」，高至少 32px，加 `aria-label="複製<標籤>"`）
- `note` 照舊顯示在標頭下方。
- 值：放在 `<pre class="value">` 裡，可選取（`user-select: text; cursor: text`）。樣式為 `--bg` 底、`--line` 框線、圓角 8px、padding `9px 10px`。
- 原始資料沒有的欄位：改成虛線框，文字改為「**原始資料沒有，請在平台上自己填**」，也不顯示複製按鈕。
- chips（`list` 超過一項時）：前面加一個「逐項複製」小字，後面是膠囊按鈕。

### 字數徽章

- 格式不變：`<字數>[ / <上限>] 字|項`。
- 徽章分三種狀態：

| 狀態 | 條件 | 外觀 |
|---|---|---|
| 一般 | 其他情況 | `--subtle` 底、`--muted` 字 |
| 接近 | 有上限、未超過，而且 `length >= limit * 0.9` | `--warn-bg` 底、`--warn` 字 |
| 超過 | `f.over` | `--warn-bg` 底、`--warn` 字、粗體，前面保留 ⚠️ |

### 複製（行為改變，重點）

1. **按複製按鈕**：複製整個值。
2. **選取後自動複製**：
   - 在某個 `pre.value` 裡用滑鼠拖曳選取、雙擊或三擊，放開滑鼠（`mouseup`）時觸發；用 Shift＋方向鍵選取時，放開按鍵（`keyup`）時觸發。
   - 觸發時讀 `getSelection()`。只有同時符合下列三項才複製選取的文字，複製後保留選取範圍：
     - 選取範圍不是空的（非 collapsed）。
     - 範圍的 `commonAncestorContainer` 在這個 `pre` 裡。
     - `toString().trim()` 不是空字串。
   - 選取範圍跨到其他欄位、或只是單擊（collapsed）時，不複製，也不顯示任何狀態。
3. **chip**：複製該項。
4. **就地回饋**：
   - 複製成功時，該欄位標頭顯示 `--ok` 色勾勾加「已複製」；如果是選取複製，顯示「已複製選取的 <字數> 字」。值的框線改 `--ok`、底色改 `--ok-bg`；chip 則是那顆 chip 變色。
   - 1.4 秒後恢復。
   - 同一時間只有一個欄位顯示狀態，複製別的欄位時，前一個立刻恢復。
   - 狀態元素加 `aria-live="polite"`。
5. **失敗**：`navigator.clipboard.writeText` 拒絕時，例如視窗沒有焦點，在同一位置顯示「複製失敗」，用 `--warn` 色。不可以吞掉錯誤。
6. **移除**：移除 `#toast` 的 HTML、CSS 和 JS。

### 原始資料分頁

- 外觀和本站資料一致：每個 item 一張卡片。
- 欄位頭顯示路徑，等寬字、`--muted` 色。
- 中英不同的值：左右兩欄（中／英），每欄各有自己的 `pre.value`、複製按鈕和狀態，複製規則同上。
- 中英相同的值：一欄，標「中英相同」。

### 可及性

- 所有可點的東西都是 `<button>` 或 `<a href>`。
- `:focus-visible` 顯示 2px `--accent` 外框。
- 文字對比至少 4.5:1；色票表的組合都符合。

## 驗收（Codex 開發完要逐項跑，結果寫進「開發回報」）

用本機 server 測（指令見 `AGENTS.md`），視窗寬 360px 與 480px 都要看。

1. `?host=pda.104.com.tw` 預設 104，`?host=www.linkedin.com` 預設 LinkedIn，不帶 host 預設 104。
2. header 兩排加 meta 行。切到原始資料後第二排隱藏，meta 顯示 `source/resume.json`。
3. 捷徑列：
   - 每個標籤都能跳到對應區段，標題不被蓋住。
   - 標籤放不下時能橫向捲動，高度不被壓扁、不換行。
   - 切換分頁、平台、語言後，捷徑列和內容一致。
4. 複製按鈕：剪貼簿內容等於整個值。
5. 選取複製，剪貼簿內容逐字等於選取的文字：
   - 拖曳選取一段。
   - 雙擊一個詞。
   - 用 Shift＋方向鍵選取。
6. 選取範圍跨兩個欄位時不複製；單擊不複製。
7. chip 複製單項。
8. 就地回饋：
   - 1.4 秒後消失。
   - 連續複製兩個欄位，只有後一個亮。
   - 頁面上沒有 toast。
9. 字數徽章：目前沒有接近上限的真實資料。測試方法是暫時改本機 `output/` 的某個 `length`，看三種狀態，測完用 `git checkout output` 還原。不可以 commit 測試資料。
10. 深色模式：用 DevTools 模擬 `prefers-color-scheme: dark`，看起來正常。
11. console 沒有錯誤；畫面上沒有 phone 等私密欄位。
12. `jq empty source/*.json data/*.json specs/*.json output/*.json` 通過；`git status` 只有規劃範圍內的檔案和本規劃書的開發回報。
13. `grep -n "https\?://" extension/panel.*` 只出現 `BASE` 的網址。

截圖放在 repo 以外的地方，不要 commit。

## 合併後由使用者實測

這些項目只有在真實 Chrome 才測得到，屬於 open item o17：

- 載入擴充功能後按 🔄。
- 在 104、LinkedIn、一般頁按圖示，確認預設平台。
- 在面板複製，再貼到平台。
- 視窗大小與位置是否被記住。

## 開發回報（Codex 填）

- commit：本次提交 `feat: redesign panel with selection copying`，位於從 `main` 建立的 `feat/panel-redesign`。面板三個檔案與本回報一起提交；未合併、未 push。
- 驗收結果（逐項，寫出實際看到的）：
  1. 通過。本機 `host=pda.104.com.tw` 預設 104、`host=www.linkedin.com` 預設 LinkedIn，無 host 預設 104。只使用本機 URL 參數，沒有開啟任何求職平台。
  2. 通過。本站資料有兩排控制項與 meta；原始資料隱藏整個第二排，meta 為 `source/resume.json`。分頁與語言按鈕的 ARIA 狀態同步更新。
  3. 通過。104 七個捷徑逐一點擊，對應標題都未被 header 遮住。360px、480px 的捷徑維持 28px 高、不換行，放不下能橫向捲動；四個平台的中英文與原始資料分頁都會重建捷徑並回到內容頂端。
  4. 通過。實際按鈕操作後讀取剪貼簿，內容等於整個值。原始資料的中、英欄位也各有獨立按鈕與狀態。
  5. 通過。獨立 Chrome 的原生滑鼠拖曳得到 `en-Hs`、雙擊得到 `Wen`；雙擊後用 Shift＋方向鍵延伸為 `Wen-H`，實際剪貼簿均逐字相同，選取範圍仍保留。另以 DOM Range 檢查選取內的空白不會被 trim 掉。
  6. 通過。跨兩欄、collapsed 與純空白的選取均未呼叫剪貼簿，也未產生新狀態。三擊英文姓名時，Chrome 的選取會包含區塊末尾換行，祖先落在 `pre` 外，因此依規定的範圍條件略過複製。
  7. 通過。實際點擊 Vue chip，剪貼簿為 `Vue`；只有該 chip 變色，整欄值不變色。
  8. 通過。狀態與值框在 1.4 秒後恢復；連續複製只保留最後一欄的狀態。另測試非同步請求完成順序顛倒與複製中切換分頁，不會復活舊狀態。模擬剪貼簿拒絕時就地顯示警告色「複製失敗」。HTML、CSS、JS 已移除 toast。
  9. 通過。臨時將本機 `output/104.zh.json` 的前三欄設為 89／100、90／100、101／100（最後一欄 over），實際畫面分別為一般、接近、超過徽章；超過保留 ⚠️ 並加粗。另測 100／100 的接近邊界。測完以原始位元組還原，`git diff --exit-code -- output` 通過。
  10. 通過。360px 與 480px、本站與原始資料、深淺色共八種畫面均截圖檢查；配色正常，無頁面橫向溢出，原始資料維持左右雙欄。
  11. 通過。獨立測試瀏覽器未收到 console error／warning 或 pageerror。原始資料沒有 phone、birthDate、birthday、military 路徑；本站資料既有的私密欄位缺值提示保留，不含私密值。另逐段比對確認 `PRIVATE_KEYS`、`leaves`、`fetchJson`、`load`、`defaultPlatform`、onMessage 未變動。
  12. 通過。`jq empty source/*.json data/*.json specs/*.json output/*.json`、`node --check extension/panel.js`、`git diff --check` 均通過。tracked 變更只有面板三檔與本回報；開工前已存在的未追蹤 `.serena/` 保留且未納入提交。
  13. 通過。搜尋 `extension/panel.*` 的 HTTP(S) 網址，只有 `BASE` 的 `https://d.resume.hsiu.soy/`。
- 與規劃書不同之處與原因：
  - 產品範圍無變更；未新增依賴、權限或修改資料來源。
  - DevTools MCP 在讀取實際剪貼簿時停住，後續改用環境已安裝的 Playwright 與獨立無頭 Chrome 完成原生操作、剪貼簿與色彩模擬驗收；全程只開本機測試頁。先以 DevTools 跑過基本失敗／成功檢查及 360px 淺色檢視。
  - 自動驗收共 60 個斷言，測試頁、腳本、結果與截圖均放 `/tmp/panel-redesign-*`，沒有納入 repo。只有面板靜態檔案變更，未執行會產生資料與 logs 的 `npm run build`。
- 待使用者或 Claude 決定的問題：無新增阻擋事項。仍須依流程由 Claude 審核；o17 的真實擴充功能重載、跨頁預設平台、貼到平台與視窗記憶由使用者實測。三擊選取仍受上述 `pre` 範圍條件限制。
