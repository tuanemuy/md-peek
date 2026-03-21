# PR Review #005 — fix: handle EACCES error in directory watcher

**PR:** #58
**Date:** 2026-03-22
**Round:** 5回目（最終）

---

## Summary

- Blockers: 0
- Warnings: 0
- Notes: 4
- Verdict: **APPROVED**

---

### Infrastructure

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-001]** watchDirectory に watchFile と同じパターンのエラーハンドラが追加された。最小限の変更でクラッシュを防止。
- **[N-002]** 既存の close()/debounce 構造はそのまま維持されており、影響範囲が最小。

---

### Test

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-003]** watchFile/watchDirectory それぞれ2テスト（error closes watcher、callback not invoked after error）で対称的にカバー。
- **[N-004]** 全 212 テストパス。typecheck、lint、format すべてクリーン。

---

## Design Decisions

特になし
