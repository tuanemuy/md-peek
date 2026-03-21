# PR Review #004 — fix: handle EACCES error in directory watcher

**PR:** #58
**Date:** 2026-03-22
**Round:** 4回目

---

## Summary

- Blockers: 0
- Warnings: 0
- Notes: 8
- Verdict: **APPROVED**

---

### Infrastructure

#### Blockers

なし

#### Warnings

なし

以下は前回から繰り返し指摘されていた項目で、今回の修正で解消または許容範囲と判断:
- debounce timer cleanup: エラーハンドラ内では未クリアだが、`closed` フラグの二重防御で実害なし。スコープ外。
- for...of ループ中の splice: スナップショット方式に修正済み。

#### Notes

- **[N-001]** close() でスナップショットを取ってからイテレートする形に改善された
- **[N-002]** watchFile/watchDirectory のエラーハンドラが一貫したパターン
- **[N-003]** OS非依存のエラーハンドリングでポータビリティ良好

---

### Test

#### Blockers

なし

#### Warnings

なし

以下は前回指摘されていた軽微な項目で、現状で十分と判断:
- mockWatcher シングルトン: beforeEach で適切にリセットされており実害なし
- 配列除去テストの実装依存: テスト意図は明確で現時点では問題なし
- isSupportedFile 依存: removeAllListeners() でリスナー自体が除去されるため到達しない

#### Notes

- **[N-004]** mock watch がコールバックをリスナー登録する修正で偽陽性が解消
- **[N-005]** vi.useFakeTimers() でデバウンス依存排除
- **[N-006]** watchFile/watchDirectory で対称的な3テストずつ
- **[N-007]** mockWatcher.close に removeAllListeners() で実 FSWatcher の挙動をシミュレート
- **[N-008]** 全 214 テストパス

---

## Design Decisions

特になし
