# PR Review #002 — fix: add idempotency guard to ServerInstance.shutdown()

**PR:** #69
**Date:** 2026-03-24
**Round:** 2回目

---

## Summary

- Blockers: 0
- Warnings: 0
- Notes: 4
- Verdict: **APPROVED**

---

### 総合レビュー

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-001]** Promise キャッシュパターンの実装は正確。`shutdownPromise` のスコープは `startServer` のクロージャ内に閉じており、インスタンス間の干渉なし
- **[N-002]** 逐次・並行テストの両パスがカバーされており、テスト品質十分
- **[N-003]** `src/index.ts` の `shuttingDown` フラグはUI二重表示防止として独立した責務を持ち、`shutdown()` のべき等性ガードと正しく共存
- **[N-004]** 変更量が最小限（実装12行、テスト15行）でスコープ明確。マージ可能

---

**2回連続クリーン（Round 1: Blocker 0, Round 2: Blocker 0 & Warning 0）— レビュー完了**
