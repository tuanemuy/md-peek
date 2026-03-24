# PR Review #004 — fix: force exit on second SIGINT/SIGTERM

**PR:** #70
**Date:** 2026-03-24
**Round:** 4回目

---

## Summary

- Blockers: 0
- Warnings: 0
- Notes: 7
- Verdict: **APPROVED** (2回連続クリーン達成)

---

### Infrastructure

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-001]** `shutdown` 関数の制御フローが正しい。1回目は正常シャットダウン、2回目はフィードバック付き強制終了
- **[N-002]** `ServerInstance.shutdown()` の冪等性ガードと CLI 層の強制終了ガードがレイヤーごとに独立した責務を担い、設計として健全
- **[N-003]** テスト 217 件全パス、typecheck/lint エラーなし

### Test

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-004]** testing.md の手順改善（`;` + `sleep 0.1`、`head -1`）が正しく反映済み
- **[N-005]** 正常シャットダウン / 強制終了 / SIGTERM の3パターンを網羅
- **[N-006]** `process.exit(1)` の自動テスト不在はプロジェクトの一貫した方針に沿っている
- **[N-007]** 2回連続クリーン達成。マージ可能

---

## Design Decisions

特になし
