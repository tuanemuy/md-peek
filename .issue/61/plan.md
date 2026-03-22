# 実装計画 — Issue #61: Ctrl+Cで終了できないことがある

**Issue:** #61
**作成日:** 2026-03-22

---

## 目的

Ctrl+C (SIGINT) を受けた際にプロセスが確実に終了するようにする。

## 根本原因

`shutdown()` 内の `server.close()` は、全てのアクティブなTCP接続が終了するまでコールバックを呼ばない。`sseCloseAll()` はHonoのストリーム層（`WritableStream`、`AbortController`）を閉じるが、Node.jsのHTTPレベルのTCPソケットは破棄しない。そのため、SSEのlong-lived接続が残っている状態では `await close()` が永久にハングし、`process.exit(0)` に到達しない。

## スコープ

### 含まれるもの
- `shutdown()` メソッドで `server.closeAllConnections()` を呼び出し、全TCP接続を強制切断する

### 含まれないもの
- シャットダウンのタイムアウト機構（`closeAllConnections()` で十分なため不要）
- SSEクライアント側のgraceful disconnectロジック
- シャットダウンのユニットテスト追加（統合テスト相当になるためスコープ外）

## 実装ステップ

### 1. `shutdown()` で `server.closeAllConnections()` を呼び出す

- **対象ファイル:** `src/server/index.ts`
- **変更内容:** `shutdown()` メソッド内で、`sseCloseAll()` と `watcher.close()` の後、`await close()` の前に `server.closeAllConnections()` を追加する。
- **理由:** `closeAllConnections()` はサーバーに紐づく全ソケットを即座に `destroy()` するため、`server.close()` のコールバックが確実に呼ばれるようになる。CLIツールのシャットダウンなのでgraceful drain は不要。

変更前:
```typescript
async shutdown() {
  sseCloseAll();
  watcher.close();
  await close();
},
```

変更後:
```typescript
async shutdown() {
  sseCloseAll();
  watcher.close();
  if ("closeAllConnections" in server) {
    server.closeAllConnections();
  }
  await close();
},
```

**型の注意点:** `@hono/node-server` の `serve()` は `ServerType = Server | Http2Server | Http2SecureServer` を返す。`closeAllConnections()` は `http.Server` にのみ存在し `Http2Server` には存在しないため、`in` 演算子による型ガードで安全にアクセスする。実行時には常に `http.Server` が返るため、この分岐は常に `true` になる。

## 設計判断

- **`closeAllConnections()` vs タイムアウト**: `closeAllConnections()` は全ソケットを即座に破棄するため、タイムアウトのフォールバックは不要。YAGNI原則に従い最小限の変更とする。
- **`closeAllConnections()` vs `closeIdleConnections()`**: SSE接続はアクティブ接続なので `closeIdleConnections()` では解決しない。`closeAllConnections()` が適切。
- **呼び出し順序**: `sseCloseAll()` → `watcher.close()` → `closeAllConnections()` → `await close()` の順。Honoストリームのクリーンアップ（clients.delete等）を先に行い、残存するTCPソケットを最後に強制破棄する。

## リスクと注意点

- `closeAllConnections()` は Node.js 18.2+ で利用可能。Node.js 18 は2025年4月にEOL済みで、このプロジェクトはNode.js 22をターゲットにしているため問題なし。
- 処理中の通常HTTPリクエストも中断されるが、Ctrl+Cでのシャットダウン時なので許容範囲。
- 変更は1行の追加のみで、既存のシャットダウンフローを壊すリスクは極めて低い。

## テスト方針

- 手動テスト: サーバー起動 → ブラウザでプレビュー表示（SSE接続確立） → Ctrl+C → 即座に終了することを確認
- 既存テスト: `pnpm test`, `pnpm typecheck`, `pnpm lint` が全てパスすることを確認

## レビュー反映

### 修正した点
- P-001への対応: `server.closeAllConnections()` を `in` 演算子による型ガードで囲み、TypeScript の型チェックを通るようにした。`ServerType` ユニオン型で `Http2Server` には `closeAllConnections` が存在しないため。

### 取り込んだ改善提案
- なし

### 見送った提案とその理由
- S-001（ヘルパー関数の抽出）: 1行の追加に対して過剰な設計変更。現行のクロージャ直接参照で十分。

## 参考: エージェント比較

| 観点 | エージェント1 (アーキテクチャ) | エージェント2 (保守性) | エージェント3 (シンプルさ) |
|------|-------------------------------|------------------------|---------------------------|
| ベース採用 | × | × | ○ |
| 取り込んだ点 | 根本原因の詳細分析 | close()のPromiseラッパー分析 | — |
