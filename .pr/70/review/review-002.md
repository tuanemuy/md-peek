# PR Review #002 — fix: force exit on second SIGINT/SIGTERM

**PR:** #70
**Date:** 2026-03-24
**Round:** 2回目

---

## Summary

- Blockers: 0
- Warnings: 2
- Notes: 7
- Verdict: **BLOCKED** (Warnings require resolution)

---

### Infrastructure

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-001]** W-001 の修正が提案通り正確に実装されている
- **[N-002]** `shutdown` 関数全体の構造が健全。制御フローが明確で読みやすい
- **[N-003]** `ServerInstance.shutdown()` の冪等性ガードと CLI 層の強制終了ガードが異なるレイヤーで異なる責務を担っており、設計として正しい

### Test

#### Blockers

なし

#### Warnings

- **[W-001]** `kill -SIGINT $PID && kill -SIGINT $PID` は2回目のシグナルが確実に届く保証がない
  - 場所: `.issue/68/testing.md:30`
  - 理由: 1回目の shutdown が高速完了すると、2回目の kill 送信前にプロセスが終了している可能性がある。`&&` だと1回目の成否に依存する。
  - 提案: `kill -SIGINT $PID; sleep 0.1; kill -SIGINT $PID` に変更。セミコロンで成否に関わらず実行し、sleep でイベントループが1回目を処理する時間を確保。

- **[W-002]** `pgrep -f "tsx.*src/index.ts"` が複数PIDを返す可能性への言及がない
  - 場所: `.issue/68/testing.md:29`
  - 理由: `pnpm dev` が tsx を子プロセスとして起動するため、複数マッチする場合がある。
  - 提案: 注記を追加するか、`head -1` で絞り込む。

#### Notes

- **[N-001]** Round 1 W-004 への対応として kill コマンドベースの手順が追記されており方向性は正しい
- **[N-002]** 既存テスト 217 件は全てパス
- **[N-003]** process.exit(1) の自動テスト欠落はプロジェクトの一貫した方針に従い手動テストで代替する判断が妥当
- **[N-004]** testing.md の確認項目は網羅的で手動テスト計画として十分な品質

---

## Design Decisions

特になし
