# 実装計画 — Issue #59: ファイルウォッチャーのエラー時にログを出力する

**Issue:** #59
**作成日:** 2026-03-23

---

## 目的

`watchFile` / `watchDirectory` でエラーが発生した際に `console.warn` でログを出力し、ユーザーが原因を特定できるようにする。

## スコープ

### 含まれるもの
- `watcher.ts` のエラーハンドラに `console.warn` によるログ出力を追加
- 既存のエラーハンドリングテストに `console.warn` 呼び出しの検証を追加

### 含まれないもの
- ログレベルの仕組みの導入やロガーライブラリの追加
- エラー時のリトライ処理
- UIへの通知（トースト等）

## 実装ステップ

### 1. `watcher.ts` の `watchFile` エラーハンドラにログ出力を追加

- **対象ファイル:** `src/lib/watcher.ts`
- **変更内容:** 42行目の `watcher.on("error", () => {` を修正し、エラーオブジェクトを受け取って `console.warn` で出力する
- **変更前:**
  ```typescript
  watcher.on("error", () => {
    watcher.close();
  });
  ```
- **変更後:**
  ```typescript
  watcher.on("error", (error: Error) => {
    console.warn(`File watcher error for ${filePath}:`, error.message);
    watcher.close();
  });
  ```
- **理由:** エラーが発生してwatcherが停止したことをユーザーに通知するため

### 2. `watcher.ts` の `watchDirectory` エラーハンドラにログ出力を追加

- **対象ファイル:** `src/lib/watcher.ts`
- **変更内容:** 61行目の `watcher.on("error", () => {` を修正し、エラーオブジェクトを受け取って `console.warn` で出力する
- **変更前:**
  ```typescript
  watcher.on("error", () => {
    watcher.close();
  });
  ```
- **変更後:**
  ```typescript
  watcher.on("error", (error: Error) => {
    console.warn(`Directory watcher error for ${dirPath}:`, error.message);
    watcher.close();
  });
  ```
- **理由:** 同上

### 3. テストに `console.warn` の検証を追加

- **対象ファイル:** `src/lib/watcher.error-handling.test.ts`
- **変更内容:** 既存の「error event closes watcher without throwing」テストに `console.warn` が呼ばれることの検証を追加する。`vi.spyOn(console, "warn")` を使用する。
- **理由:** ログ出力が正しく行われることを自動テストで担保するため

## リスクと注意点

- `console.warn` はプロセスのstderrに出力されるため、SSE接続やHTTP応答には影響しない
- エラーオブジェクトの `message` プロパティのみ出力することで、スタックトレースの過剰表示を避ける

## テスト方針

- 既存テストが引き続きパスすることを確認
- `console.warn` が正しいメッセージで呼ばれることをテストで検証
- `pnpm typecheck`, `pnpm lint`, `pnpm test` がすべてパスすることを確認
