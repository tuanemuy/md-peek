# PR Review #001 — fix: handle EACCES error in directory watcher

**PR:** #58
**Date:** 2026-03-22
**Round:** 1回目

---

## Summary

- Blockers: 1
- Warnings: 6
- Notes: 6
- Verdict: **BLOCKED**

---

### Infrastructure

#### Blockers

なし

#### Warnings

- **[W-001]** エラー発生時に watcher を close すると、ディレクトリ全体の監視が永久に停止し、ユーザーへの通知がない
  - 場所: `src/lib/watcher.ts:61-63`
  - 理由: ディレクトリ監視が無言で停止すると、ユーザーは「なぜか更新が反映されない」状態になる
  - 提案: 最低限 `console.warn` でログを出す → **スコープ外: Issue #56 は「クラッシュ防止」が目的。ログ追加は別Issue**

- **[W-002]** `watcher.close()` の二重呼び出しの安全性が保証されていない
  - 場所: `src/lib/watcher.ts:61-63`
  - 理由: エラーハンドラで close した watcher が `watchers` 配列に残り、`handle.close()` で再度 close される
  - 提案: エラーハンドラで close した watcher を `watchers` 配列から除去する

#### Notes

- **[N-001]** `watchFile` に既にあるパターンとの一貫性が良い
- **[N-002]** 修正スコープが適切に制限されている
- **[N-003]** シングルスレッドのイベントループにより、レースコンディションの心配は不要

---

### Test

#### Blockers

- **[B-001]** `mockWatcher` がモジュールスコープのシングルトンで、テスト間で状態がリセットされない
  - 場所: `src/lib/watcher-error.test.ts:4-5`
  - 理由: テスト追加時にリスナーやモック呼び出し履歴がリークし、偽陽性/偽陰性を引き起こす
  - 提案: `beforeEach` で `mockWatcher.removeAllListeners()` と `vi.clearAllMocks()` を実行する

#### Warnings

- **[W-003]** `watchFile` のエラーハンドリングに対応するテストが存在しない
  - 場所: `src/lib/watcher.ts:42-44`
  - 理由: エラーハンドリング修正のPRでありながら、既存の `watchFile` のエラーハンドリングがテストされていない
  - 提案: `watchFile` のエラーイベントテストを追加する → **スコープ内: watchFile のテスト追加はこのPRで対応可能**

- **[W-004]** エラーハンドラ内で `watcher.close()` が呼ばれた後の状態テストが不足
  - 場所: `src/lib/watcher-error.test.ts:18-30`
  - 理由: close が呼ばれることだけでなく、実際に監視が停止されていることを検証すべき
  - 提案: エラー後にイベントを発生させてコールバックが呼ばれないことを確認

- **[W-005]** テストファイル名 `watcher-error.test.ts` が紛らわしい
  - 場所: `src/lib/watcher-error.test.ts`
  - 理由: 「watcher-error」モジュールのテストに見える
  - 提案: `watcher.error-handling.test.ts` 等に変更

- **[W-006]** 複数エラーイベント連続発生のテストがない
  - 場所: `src/lib/watcher-error.test.ts:18-30`
  - 理由: 実環境ではエラーが複数回発生する可能性がある
  - 提案: エラーを2回連続でエミットし、例外がスローされないことを確認

#### Notes

- **[N-004]** `vi.mock` + `await import()` の手法は正しい
- **[N-005]** 本体修正は `watchFile` パターンと完全に一致
- **[N-006]** 全 209 テストパス確認済み

---

## Design Decisions

特になし
