# PR Review #002 — fix: handle EACCES error in directory watcher

**PR:** #58
**Date:** 2026-03-22
**Round:** 2回目

---

## Summary

- Blockers: 1
- Warnings: 3
- Notes: 14
- Verdict: **BLOCKED**

---

### Infrastructure

#### Blockers

なし

#### Warnings

- **[W-001]** エラーハンドラ内で debounceTimers のクリーンアップが行われない
  - 場所: `src/lib/watcher.ts:63-67`, `src/lib/watcher.ts:42-46`
  - 理由: 既にスケジュール済みのデバウンスタイマーが残り、エラー後に1回だけコールバックが発火する可能性がある
  - 提案: 実害は限定的なのでスコープ外とする

#### Notes

- **[N-001]** 前回 W-002（二重close）は適切に修正された
- **[N-002]** watchFile と watchDirectory のエラーハンドラが一貫している
- **[N-003]** close() 内のイテレーション中に splice が発生するレースは、Node.js の同期的動作により起きない

---

### Test

#### Blockers

- **[B-001]** テスト「callback is not invoked after error closes watcher」がデバウンスタイミングに依存した偽陽性
  - 場所: `src/lib/watcher.error-handling.test.ts:53-64`
  - 理由: `mockWatcher.close` が no-op のため、エラー後もリスナーが残る。テストがパスするのはデバウンスタイマーが未発火なだけ
  - 提案: `mockWatcher.close` に `removeAllListeners()` を含めるか、`vi.useFakeTimers()` でタイマーを進めてから検証する

#### Warnings

- **[W-002]** `watchFile` にエラー後の状態テストがない（watchDirectory との非対称性）
  - 場所: `src/lib/watcher.error-handling.test.ts:22-36`
  - 提案: B-001 修正後に追加する

- **[W-003]** `mockWatcher.close` が no-op で、close の副作用をシミュレートしていない
  - 場所: `src/lib/watcher.error-handling.test.ts:5`
  - 提案: `mockWatcher.close` に `removeAllListeners()` を含める

#### Notes

- **[N-004]** 前回 B-001（mock状態リセット）は beforeEach で修正済み
- **[N-005]** 前回 W-005（ファイル名）はリネーム済み
- **[N-006]** 前回 W-006（複数エラー）はテスト追加済み

---

## Design Decisions

特になし
