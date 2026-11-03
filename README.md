# resume-data

[resume.hsiu.soy](https://resume.hsiu.soy) 的資料來源。履歷資料採用 [JSON Resume](https://jsonresume.org/schema) 格式，透過 GitHub Pages 以靜態 JSON 提供。

| 檔案 | 網址 |
|---|---|
| 英文履歷 | https://d.resume.hsiu.soy/data/resume_en.json |
| 中文履歷 | https://d.resume.hsiu.soy/data/resume_zh_TW.json |
| 技能 icon 對應 | https://d.resume.hsiu.soy/data/icon.json |

## 其他內容

- `specs/`：各求職平台（LinkedIn、104、CakeResume、Yourator）的欄位規格。
- `output/`：`/resume-sync` 產出的各平台貼上用內容，由本人手動貼到各平台。
- `.claude/commands/`：Claude Code 指令 `/resume-sync`、`/spec-update`。

push 到 `main` 後，網站最晚約 20 分鐘更新（Pages 部署＋快取＋網站 SWR 10 分鐘）。
