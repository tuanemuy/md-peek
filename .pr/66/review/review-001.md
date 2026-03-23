# PR Review #001 — fix: add error handling to shutdown() and lifecycle tests

**PR:** #66
**Date:** 2026-03-23
**Round:** 1回目

---

## Summary

- Blockers: 0
- Warnings: 3 (修正対象)
- Notes: 5
- Verdict: **APPROVED (with minor fixes)**

---

### Infrastructure

#### Blockers

なし

#### Warnings

- **[W-001]** `getFreePort()` で `srv.listen(0)` の `error` イベントが未処理
  - 場所: `src/server/index.test.ts:14-18`
  - 理由: fd 枯渇等の極稀なケースで `listen` が失敗した場合、unhandled error イベントが発生しテストプロセスがクラッシュする
  - 提案: `srv.on("error", reject)` を追加する

- **[W-002]** テストのフィクスチャディレクトリがソースツリー内に作成されるが `.gitignore` に未登録
  - 場所: `src/server/index.test.ts:9`
  - 理由: テスト異常終了時にゴミファイルが残り、`git add .` でコミットされるリスク
  - 提案: 既存テスト（watcher.test.ts 等）も同じパターンを使っているため、本PRのスコープ外とする。既存パターンと一貫した対応。

#### Notes

- **[N-001]** `src/index.ts` の try-catch 追加は最小限かつ的確。`process.exit(0)` に確実に到達するようになっている
- **[N-002]** `afterEach` での `.catch(() => {})` パターンが堅実

---

### Test

#### Blockers

なし

#### Warnings

- **[W-003]** 各テストケースで `startServer` の呼び出しコードが完全に重複している
  - 場所: `src/server/index.test.ts:39-47`, `54-62`, `68-76`, `84-92`
  - 理由: 4つのテストすべてで同一の config パラメータが繰り返されている
  - 提案: 共通 config オブジェクトを定数化し、各テストでは `port` だけスプレッドで上書きする

#### Notes

- **[N-003]** HTML モード使用でテスト高速化の判断が適切
- **[N-004]** テスト4ケースがライフサイクルの主要パスを適切にカバー
- **[N-005]** `getFreePort()` による動的ポート割り当ては CI でのポート競合回避に有効

---

## Design Decisions

特になし
