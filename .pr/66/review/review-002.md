# PR Review #002 — fix: add error handling to shutdown() and lifecycle tests

**PR:** #66
**Date:** 2026-03-23
**Round:** 2回目

---

## Summary

- Blockers: 0
- Warnings: 0
- Notes: 5
- Verdict: **APPROVED**

---

### Infrastructure

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-001]** Round 1 の W-001（`getFreePort()` の `error` イベント未処理）は `srv.on("error", reject)` の追加により正しく修正済み
- **[N-002]** TOCTOU ウィンドウは理論上存在するが、`startServer()` 内部で `error` イベントが適切にハンドリングされており実害なし
- **[N-003]** `src/index.ts` の try-catch 追加は最小限かつ正確

---

### Test

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-004]** Round 1 の W-003（テストコード重複）は `baseConfig` 定数への抽出により正しく修正済み
- **[N-005]** 全216テスト通過、テスト実行時間も適切

---

## Design Decisions

特になし
