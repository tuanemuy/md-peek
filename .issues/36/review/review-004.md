# PR Review #004 — feat: add HTML file preview support

**PR:** #37
**Issue:** #36
**Date:** 2026-03-14
**Round:** 4回目（最終）

---

## Summary

- Blockers: 0
- Warnings: 0 (新規)
- Notes: 5
- Verdict: **APPROVED**

---

## Blocker 最終確認

| ID | 内容 | ステータス |
|---|---|---|
| B-001 | iframe sandbox allow-same-origin + allow-scripts | ADR-001 で設計判断済み |
| B-002 | useNavigation state 更新順序 | 修正確認済み |
| B-003 | onContentUpdate("") セマンティクス | onHtmlReload に分離、修正確認済み |
| B-004 | catch-all route SSR/hydration mismatch | renderHtmlDocument 使用、修正確認済み |

全てのBlockerが解消され、2回連続（Round 3, 4）でBlocker 0件を達成。

---

## Notes

- 全 208 テストパス、typecheck/lint クリーン
- catch-all route の修正が `/`, `/view` ルートに悪影響なし
- HTML/Markdown 両方のフローが正しく動作
- 既存 Markdown 機能にリグレッションなし
- import の整合性に問題なし

---

## 残存 Warnings（修正不要）

| ID | 概要 | 判定 |
|---|---|---|
| W-001 | symlink traversal 未考慮 | ローカルツールのためリスク低 |
| W-002 | null byte injection 防御なし | 現行 Node.js で実質リスクゼロ |
| W-003 | SSE アクセス制御なし | localhost bind が既定 |
| W-006 | resolveAndValidatePath 責務混在 | 2箇所のみ、許容範囲 |
| W-007 | renderFileContent 非対称処理 | コメント済み |
| W-008 | SSE 再接続ロジック重複 | 定数共有化で緩和 |
| W-012 | useNavigation の無駄な fetchContent | 機能上問題なし |
| W-013 | htmlReloadKey による iframe 再マウント | 設計判断 |
| W-016-18 | テストカバレッジの軽微な不足 | 間接カバー |
