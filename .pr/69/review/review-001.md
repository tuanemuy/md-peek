# PR Review #001 — fix: add idempotency guard to ServerInstance.shutdown()

**PR:** #69
**Date:** 2026-03-24
**Round:** 1回目

---

## Summary

- Blockers: 0
- Warnings: 3 (すべてスコープ外/低リスクのため見送り)
- Notes: 7
- Verdict: **APPROVED**

---

### Infrastructure

#### Blockers

なし

#### Warnings

- **[W-001]** `close` が `ServerInstance` の public API として露出しており、`shutdown` を経由せず直接呼ぶと二重呼び出しの可能性がある
  - 場所: `src/server/index.ts:41-46`（型定義）
  - → 見送り: 現時点で `close` を直接呼ぶコードパスはない。API設計の問題でありこのPRのスコープ外

- **[W-002]** rejected Promise がキャッシュされ永続する
  - 場所: `src/server/index.ts:185-201`
  - → 見送り: `close()` が reject するのは二重呼び出し時のみで、Promise キャッシュでそのケース自体が排除される。リスク極めて低い

#### Notes

- **[N-001]** Promise キャッシュパターンの選択は妥当。boolean フラグでは2回目が即resolveして完了を待てない問題を正しく解決
- **[N-002]** `async` → 通常関数への変更で不要なPromiseラップが1段減り合理的
- **[N-003]** `src/index.ts` の `shuttingDown` フラグ維持はUI二重表示防止として正しい判断

---

### Test

#### Blockers

なし

#### Warnings

- **[W-003]** `afterEach` の `.catch(() => {})` がべき等化により不要になった可能性
  - 場所: `src/server/index.test.ts:43`
  - → 見送り: `close()` 自体のエラーでは依然reject可能。安全策として維持

#### Notes

- **[N-004]** 逐次・並行の両パターンでべき等性を正しく検証
- **[N-005]** `toEqual([undefined, undefined])` で並行テストのアサーションが具体的

---

### Correctness

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-006]** JS のシングルスレッドモデルにより `shutdownPromise` 代入にレースコンディションなし
- **[N-007]** `src/index.ts` の `shuttingDown` と `shutdown()` のPromiseキャッシュは異なる責務。矛盾なく共存

---

## Design Decisions

特になし
