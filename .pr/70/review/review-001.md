# PR Review #001 — fix: force exit on second SIGINT/SIGTERM

**PR:** #70
**Date:** 2026-03-24
**Round:** 1回目

---

## Summary

- Blockers: 0
- Warnings: 5
- Notes: 7
- Verdict: **BLOCKED** (Warnings require resolution)

---

### Infrastructure

#### Blockers

なし

#### Warnings

- **[W-001]** `process.exit(1)` はユーザーへのフィードバックなしに即座に終了する
  - 場所: `src/index.ts:174`
  - 理由: 2回目の Ctrl+C を押したユーザーは、プロセスが「強制終了された」のか「クラッシュした」のか区別できない。一般的な CLI ツールは2回目のシグナル受信時にメッセージを表示してから終了する。
  - 提案: `process.exit(1)` の前に `console.error("\nForce exiting...");` を追加する。

- **[W-002]** 終了コード 1 はシグナルによる強制終了を正確に表現していない
  - 場所: `src/index.ts:174`
  - 理由: UNIX慣習では `128 + シグナル番号` だが、ローカルプレビューCLIとしては実害小。Issue対応案で `process.exit(1)` が指定されている。
  - 提案: 現状維持で可。情報共有レベル。

### Test

#### Blockers

なし

#### Warnings

- **[W-003]** `process.exit(1)` の自動テストが欠落している
  - 場所: `src/index.ts:173-175`
  - 理由: child process spawn でのインテグレーションテストで自動化可能だが、プロジェクト全体としてCLIエントリポイントのプロセスレベル挙動はテスト対象外とする一貫した方針がある。
  - 提案: スコープ外。プロジェクトの既存方針に従い、手動テストで代替。

- **[W-004]** 手動テスト計画の「Ctrl+C を素早く2回押す」の再現性が低い
  - 場所: `.issue/68/testing.md:28-29`
  - 理由: 1回目のshutdownが高速完了すると2回目のSIGINTが到達前にプロセス終了する可能性。
  - 提案: testing.md に `kill -SIGINT <PID>` を使った確実な確認手順を追記。

- **[W-005]** `ServerInstance.shutdown()` の冪等性と CLI 層の `shutdown` 関数の強制終了の挙動の違いがドキュメントに反映されていない
  - 場所: `src/index.ts:171-186`
  - 理由: `ServerInstance.shutdown()` は2回呼んでも安全に resolve するが、CLI層は2回目で `process.exit(1)` する。層の責務の違いが明示されていない。
  - 提案: スコープ外。コードの読み手にとって自明な範囲。

#### Notes

- **[N-001]** 変更のスコープが極めて小さく、影響範囲が明確で良い
- **[N-002]** `server.shutdown()` の冪等性ガードとの共存が正しく設計されている
- **[N-003]** `process.exit()` は Node.js のシグナルハンドラー内で呼ぶことが認められたパターン
- **[N-004]** 既存テスト 217 件は全てパス、変更による影響なし
- **[N-005]** プロジェクト内の他の `process.exit(1)` 箇所も自動テスト対象外であり一貫性あり
- **[N-006]** 変更量3行で自明なロジック。手動テスト計画の内容も妥当
- **[N-007]** CLI エントリポイントのプロセスレベル挙動をテスト対象外とする既存方針と整合

---

## Design Decisions

特になし
