# PR Review #003 — feat: add HTML file preview support

**PR:** #37
**Issue:** #36
**Date:** 2026-03-14
**Round:** 3回目

---

## Summary

- Blockers: 0
- Warnings: 2 (新規)
- Notes: 6
- Verdict: **APPROVED (pending Round 4 confirmation)**

---

## Blocker 修正確認

| ID | 内容 | ステータス |
|---|---|---|
| B-001 | iframe sandbox allow-same-origin + allow-scripts | ADR-001 で設計判断済み |
| B-002 | useNavigation state 更新順序 | 修正確認済み |
| B-003 | onContentUpdate("") セマンティクス | onHtmlReload に分離、修正確認済み |
| B-004 | catch-all route SSR/hydration mismatch | renderHtmlDocument 使用、修正確認済み |

---

## Warnings (新規のみ)

- **[W-019]** useNavigation が HTML ファイルでも /api/content を呼ぶ（Round 1 W-012 継続、低優先度）
- **[W-020]** renderFileContent の HTML access() と /api/raw 間の TOCTOU race（ローカルツールとして許容可能）

## Notes

- SSE 定数の共有化は適切
- AbortController の統合は完全
- ServerConfig の discriminated union は正確
- テストカバレッジは充実（208件）
- catch-all route のテストで `__INITIAL_STATE__` 非存在を確認

---

## Design Decisions

特になし（Round 2 で記録済み）
