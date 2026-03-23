# 実装計画 — Issue #67: ServerInstance.shutdown() にべき等性ガードを追加

**Issue:** #67
**作成日:** 2026-03-24

---

## 目的

`ServerInstance.shutdown()` を複数回呼び出しても安全に動作するようにする。現在は2回目の呼び出しで `server.close()` が `ERR_SERVER_NOT_RUNNING` で reject するため、呼び出し元で個別にガードが必要になっている。

## スコープ

### 含まれるもの
- `shutdown()` 内部にPromiseキャッシュパターンによるべき等性ガードを追加
- 既存テストの更新（2回目呼び出しが reject → resolve に変更）
- 並行呼び出しテストの追加

### 含まれないもの
- `src/index.ts` 側の `shuttingDown` ガードの変更（UIの二重表示防止として維持）
- `shutdown()` の戻り値型の変更

## 実装ステップ

### 1. `shutdown()` にPromiseキャッシュパターンを追加

- **対象ファイル:** `src/server/index.ts`
- **変更内容:** `startServer` 関数内に `let shutdownPromise` を追加し、`shutdown()` を通常関数に変更。1回目はIIFEでPromise生成しキャッシュ、2回目以降は同じPromiseを返す
- **理由:** booleanフラグでは2回目が即resolve して完了を待てない。Promiseキャッシュなら並行呼び出しでも1回目の完了を待てる

### 2. テストを更新

- **対象ファイル:** `src/server/index.test.ts`
- **変更内容:** 逐次テスト（2回目がresolve）と並行テスト（`Promise.all`）を追加
- **理由:** べき等性ガードの逐次・並行の両パスを検証

## リスクと注意点

- `shutdownPromise` が reject した場合、キャッシュされた rejected Promise が永続しリトライ不可。ただし現行コードパスでは `close()` のreject は二重呼び出し時のみであり、Promiseキャッシュでそのケース自体が排除される
- `src/index.ts` の `shuttingDown` フラグは維持し、UIの二重表示防止を担保する

## テスト方針

- 逐次呼び出し: 2回連続でresolveすること
- 並行呼び出し: `Promise.all` でresolveすること
- `pnpm test` で全テスト通過を確認
