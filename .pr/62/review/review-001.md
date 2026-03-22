# PR Review #001 — fix: ensure Ctrl+C exits cleanly when SSE connections are active

**PR:** #62
**Date:** 2026-03-22
**Round:** 1回目

---

## Summary

- Blockers: 0
- Warnings: 4
- Notes: 8
- Verdict: **APPROVED**

---

## Infrastructure

#### Blockers

なし

#### Warnings

- **[W-001]** `in` 演算子による型ガードは実行時には常に `true` だが、将来の `@hono/node-server` の型変更でサイレントスキップになり得る
  - 場所: `src/server/index.ts:192-194`
  - 理由: 現在のアプローチは型安全で正しいが、将来 `serve()` が `Http2Server` を返すようになった場合にコンパイルエラーにならずスキップされる
  - 提案: 低優先度。現在のアプローチを否定するものではない
  - → **対応不要**: `in` ガードは型アサーションよりも安全側に倒しており、現時点で最適な選択

- **[W-002]** `shutdown()` 内でエラーハンドリングがない
  - 場所: `src/server/index.ts:189-196`
  - 理由: `server.close()` がエラーを返した場合に `process.exit(0)` に到達しない可能性
  - 提案: 呼び出し元で `try/catch` を追加し、shutdown 失敗時にも確実に終了させる
  - → **スコープ外**: 既存コードの問題であり、本PRで新たに導入されたリスクではない

## Test

#### Blockers

なし

#### Warnings

- **[W-001]** `shutdown()` メソッドに対する自動テストが存在しない
  - 場所: `src/server/index.ts:189-196`
  - 理由: 今回の修正が将来リグレッションした場合に検出する手段がない
  - 提案: `startServer` でサーバーを起動し、SSE接続確立後に `shutdown()` が resolve することを確認するテスト
  - → **スコープ外**: plan.md で明示的にスコープ外と判断済み。変更が1行追加のみであり、testing.md に詳細な手動テスト計画が記載されている

- **[W-002]** `in` 演算子型ガードの `false` パスにカバレッジがない
  - 場所: `src/server/index.ts:192-194`
  - 理由: Test W-001 と同根。テストがあればリグレッション検知が可能
  - → **スコープ外**: W-001 と同様

## Notes

- **[N-001]** `closeAllConnections()` の呼び出し位置・順序は適切（Honoストリーム層 → TCPソケット → サーバー停止）
- **[N-002]** Node.js 18.2+ 要件を満たしており、`in` ガードによるフォールバックも安全
- **[N-003]** 変更量が最小限（3行追加）で、既存フローを壊していない
- **[N-004]** `shuttingDown` フラグにより二重呼び出しリスクはない
- **[N-005]** 既存テスト 21ファイル 212テストが全てパス
- **[N-006]** testing.md に手動テスト計画が詳細に記載されている
- **[N-007]** plan.md でテスト追加をスコープ外とした判断は妥当
- **[N-008]** コード品質チェック（typecheck, lint, format）全てパス

---

## Design Decisions

特になし
