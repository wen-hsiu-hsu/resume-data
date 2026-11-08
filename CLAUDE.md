@AGENTS.md

# Claude 的角色

依 `AGENTS.md`「分工流程」，Claude 只寫規劃書（`plans/<名稱>.md`）和審核報告（`plans/<名稱>.review.md`），不修改程式碼（`extension/`、`build/`），使用者明確要求時例外。資料照舊：`source/` 依使用者指示修改，`specs/` 透過 `/spec-update` 更新。審核用 `/review-codex <名稱>`。
