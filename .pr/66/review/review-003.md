# PR Review #003 — fix: add error handling to shutdown() and lifecycle tests

**PR:** #66
**Date:** 2026-03-23
**Round:** 3回目

---

## Summary

- Blockers: 0
- Warnings: 0 (指摘2件はいずれもPRスコープ外の既存課題)
- Notes: 6
- Verdict: **APPROVED**

---

### Infrastructure

#### Blockers

なし

#### Warnings

なし

(Reviewer指摘: 2回目のSIGINTで強制終了するパスがない点 — 本PRで新たに導入された問題ではなく既存コードの特性。スコープ外として許容)

#### Notes

- **[N-001]** `src/index.ts` の try-catch 追加は最小限で的確。Issue #63 の主目的であるプロセスハング防止を正しく実現
- **[N-002]** `logger.error("Failed to shut down server:", e)` はプロジェクト内の既存パターンと完全に一貫
- **[N-003]** `getFreePort()` に `srv.on("error", reject)` が反映済み

---

### Test

#### Blockers

なし

#### Warnings

なし

(Reviewer指摘: `src/index.ts` の `shutdown` 関数の try-catch を直接テストしていない — CLIエントリポイント + `process.exit` の制約上、直接テストが困難。plan.md で計画段階から認識済みの制約。テストケース4が try-catch の必要性を実証しており、実用上許容可能)

#### Notes

- **[N-004]** HTMLモード使用でテスト高速化の判断が適切
- **[N-005]** 4テストケースがライフサイクルの主要パスを網羅
- **[N-006]** 5回連続実行でフレークなし

---

## Design Decisions

特になし
