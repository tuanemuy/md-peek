# 実装計画 — Issue #56: 権限の無いアイテムを含むディレクトリで起動すると落ちる場合がある

**Issue:** #56
**作成日:** 2026-03-22

---

## 目的

権限のないファイル/ディレクトリを含むディレクトリで peek を起動したとき、`EACCES` エラーでプロセスがクラッシュしないようにする。

## スコープ

### 含まれるもの
- `watchDirectory` のエラーハンドリング追加
- エラー発生時のテスト追加

### 含まれないもの
- ファイルツリー構築（`buildFileTree`）側の権限エラーハンドリング（別Issue）
- 権限エラーのUI通知

## 実装ステップ

### 1. `watchDirectory` にエラーハンドラを追加

- **対象ファイル:** `src/lib/watcher.ts`
- **変更内容:** `watchDirectory` 内で作成される `FSWatcher` に `.on("error", ...)` ハンドラを追加し、エラー発生時に watcher を close する。`watchFile` と同じパターンを適用する。
- **理由:** 現在 `watchFile` にはエラーハンドラがあるが `watchDirectory` にはない。`node:fs.watch` で `{ recursive: true }` でディレクトリを監視中、権限のないファイルにアクセスすると `error` イベントが発生し、ハンドラがないため unhandled error としてプロセスがクラッシュする。

### 2. テストを追加

- **対象ファイル:** `src/lib/watcher.test.ts`
- **変更内容:** `watchDirectory` でエラーイベントが発生しても例外がスローされないことを確認するテストを追加する。
- **理由:** 修正の動作確認と将来のリグレッション防止。

## リスクと注意点

- `watchDirectory` の watcher を close すると、ディレクトリ全体の監視が停止する。ただし現在の `watchFile` も同様の挙動であり、一貫性がある。
- `{ recursive: true }` の挙動はOS依存だが、エラーハンドリング自体はOS非依存。

## テスト方針

- `watcher.on("error", ...)` が呼ばれたときに watcher が正常に close され、例外がスローされないことをテストする
- 既存テストが通ることを確認する
