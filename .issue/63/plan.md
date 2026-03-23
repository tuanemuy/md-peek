# 実装計画 — Issue #63: shutdown()のエラーハンドリングと自動テスト追加

**Issue:** #63
**作成日:** 2026-03-23

---

## 目的

`server.shutdown()` のエラーハンドリング不備によるプロセスハングを防止し、`startServer()` / `shutdown()` の自動テストを追加してリグレッション検出手段を確保する。

## スコープ

### 含まれるもの
- `src/index.ts` の `shutdown` 関数に try-catch を追加
- `src/server/index.test.ts` を新規作成し、`startServer` / `shutdown` のライフサイクルテストを追加

### 含まれないもの
- `ServerInstance.shutdown()` 内部へのエラーハンドリング追加（呼び出し元で対応する方針）
- `ServerInstance` 型の拡張（`address()` の公開等）
- ルーティングやSSEの個別テスト（既存テストでカバー済み）

## 実装ステップ

### 1. `src/index.ts` の `shutdown` 関数にエラーハンドリングを追加

- **対象ファイル:** `src/index.ts` (172-180行目)
- **変更内容:** `await server.shutdown()` を try-catch で囲み、catch 節で `logger.error()` を呼ぶ
- **理由:** `server.close()` が `ERR_SERVER_NOT_RUNNING` 等で reject した場合、未捕捉例外となり `process.exit(0)` に到達せずプロセスがハングする。`logger` は既にインポート済み

```typescript
// 変更後
const shutdown = async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log();
  intro(pc.bgYellow(pc.black(" Shutting down... ")));
  try {
    await server.shutdown();
  } catch (e: unknown) {
    logger.error("Failed to shut down server:", e);
  }
  outro(pc.green("Server stopped. Bye!"));
  process.exit(0);
};
```

### 2. `src/server/index.test.ts` を新規作成し自動テストを追加

- **対象ファイル:** `src/server/index.test.ts` (新規)
- **変更内容:** 以下のテストケースを実装
- **理由:** `startServer()` / `shutdown()` のテストが一切存在せず、リグレッション検出手段がない

**テスト設計:**
- HTML ファイルモード (`contentType: "html"`) を使用し、`initMarkdown()` の依存を排除（テスト高速化・セットアップ簡素化）
- テスト用の一時 HTML ファイルを `beforeAll` / `afterAll` で作成・削除
- ポート番号はテスト内のヘルパー関数 `getFreePort()` で OS にランダム空きポートを割り当てさせる（`node:http` の `createServer` + `listen(0)` + `address()` で取得後 `close`）
- `afterEach` で `server?.shutdown().catch(() => {})` を呼びリソースリーク防止（既に shutdown 済みの場合のエラーを握りつぶす）

**テストケース:**

1. **`startServer` がサーバーを起動し HTTP リクエストに応答すること**
   - `startServer()` を呼び、`fetch(`http://localhost:{port}/`)` で 200 が返ることを確認

2. **`shutdown()` が正常に resolve すること**
   - `startServer()` 後に `shutdown()` が例外なく resolve することを確認

3. **`shutdown()` 後にサーバーが接続を受け付けないこと**
   - `shutdown()` 後に `fetch` が reject されることを `expect(...).rejects.toThrow()` で確認（エラーの種類は問わない）

4. **`shutdown()` を2回呼んだ場合に reject すること**
   - `startServer()` 後に `shutdown()` を1回呼び、2回目の `shutdown()` が `ERR_SERVER_NOT_RUNNING` で reject されることを確認。これにより `src/index.ts` 側の try-catch が必要な理由を実証する

## 設計判断

- **エラーハンドリングの配置場所**: `ServerInstance.shutdown()` 内部ではなく呼び出し元（`src/index.ts`）で catch する。`shutdown()` はエラーを呼び出し元に伝播させ、処理方法は呼び出し元に委ねるのが責務分離として適切。Issue の対応案とも一致。
- **catch 節での `logger.error()`**: Issue の対応案はコメントのみだが、デバッグの手がかりを残すため `logger.error()` でエラーを記録する。プロジェクト規約とも整合。
- **テストで HTML モード使用**: テスト対象はサーバーのライフサイクルであり、レンダリング内容は無関係。HTML モードなら `initMarkdown()` が不要で高速・シンプル。

## リスクと注意点

- **ポート競合**: `getFreePort()` ヘルパーで OS にランダムポートを割り当てさせることで回避。ただし `getFreePort()` がポートを解放してから `startServer()` が bind するまでの微小な時間差で別プロセスがそのポートを奪う可能性はゼロではない（実用上はほぼ問題ない）
- **テストの実行時間**: 実サーバーの起動/停止を伴うが、vitest の `testTimeout: 30000` の範囲内
- **`src/index.ts` の変更は最小限**: try-catch の追加のみでロジック変更なし。リグレッションリスクは極めて低い

## テスト方針

- **自動テスト**: `pnpm test` で `src/server/index.test.ts` が実行されることを確認
- **手動テスト**: `pnpm dev:server` でサーバー起動 → Ctrl+C で正常シャットダウンを確認
- **品質チェック**: `pnpm typecheck`, `pnpm lint:fix`, `pnpm format` を実行

## 参考: エージェント比較

| 観点 | エージェント1 (アーキテクチャ) | エージェント2 (保守性) | エージェント3 (シンプルさ) |
|------|-------------------------------|------------------------|---------------------------|
| ベース採用 | × | × | ○ |
| 取り込んだ点 | `logger.error()` の追加 | HTML モードでのテスト簡素化 | — |

## レビュー反映

### 修正した点
- P-001: 固定ポート（49200番台）→ `getFreePort()` ヘルパーで OS にランダム空きポートを割り当てる方式に変更。`ServerInstance` 型の拡張は不要
- P-002: `logger.error("Shutdown error:", e)` → `logger.error("Failed to shut down server:", e)` に変更（既存パターン `"Failed to ..."` に統一）

### 取り込んだ改善提案
- S-001: `shutdown()` 二重呼び出しのテストケースを追加（Issue の主目的であるエラーハンドリングの必要性を直接実証）
- S-002: `afterEach` で `.catch(() => {})` を使い、既に shutdown 済みの場合のエラーを握りつぶす設計に変更
- S-003（Reviewer 3）: `fetch` エラー検出は `rejects.toThrow()` で種類を問わず確認する方針を明記

### 見送った提案とその理由
- S-001（Reviewer 3）: Issue 対応案の「SSE接続確立後の shutdown テスト」との差異指摘 — SSE のテストは既存 `sse.test.ts` でカバー済みであり、ライフサイクルテストに絞る判断を維持
- S-002（Reviewer 3）: テスト用フィクスチャの配置場所を `os.tmpdir()` に変更する提案 — 既存テストとの一貫性を優先し、`import.meta.dirname` ベースの方式を維持
