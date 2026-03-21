# PR Review #003 — fix: handle EACCES error in directory watcher

**PR:** #58
**Date:** 2026-03-22
**Round:** 3回目

---

## Summary

- Blockers: 0
- Warnings: 2
- Notes: 6
- Verdict: **APPROVED** (Warnings only)

---

### Infrastructure

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-001]** watchFile と watchDirectory のエラーハンドラが完全に対称で保守性が高い
- **[N-002]** close() の for...of ループ中に splice が走るレースは Node.js のシングルスレッド特性で安全
- **[N-003]** mockWatcher.close に removeAllListeners() を含めたことでテスト信頼性が向上

---

### Test

#### Blockers

なし

#### Warnings

- **[W-001]** 「callback is not invoked after error closes watcher」テストが空振り（偽陽性）
  - 場所: `src/lib/watcher.error-handling.test.ts:42-54`, `72-84`
  - 理由: モック watch がコールバックを change リスナーとして登録しないため、エラーハンドラがなくてもテストがパスする
  - 提案: モック watch がコールバックをリスナーとして登録するよう修正

- **[W-002]** watchFile に「watcher is removed from internal array after error」テストがない
  - 場所: `src/lib/watcher.error-handling.test.ts:27-55`
  - 提案: watchDirectory の同等テストを追加

#### Notes

- **[N-004]** error closes watcher テストと array removal テストは正しく動作
- **[N-005]** vi.useFakeTimers() の導入でタイミング依存の不安定さが解消
- **[N-006]** 全 213 テストパス

---

## Design Decisions

特になし
