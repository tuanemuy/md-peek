# PR Review #001 — feat: add console.warn logging on file watcher errors

**PR:** #65
**Date:** 2026-03-23
**Round:** 1回目

---

## Summary

- Blockers: 1
- Warnings: 2
- Notes: 4
- Verdict: **BLOCKED**

---

### Infrastructure

#### Blockers
- **[B-001]** `console.warn` を直接使用しており、プロジェクトの `logger` モジュールを使用していない
  - 場所: `src/lib/watcher.ts:43`, `src/lib/watcher.ts:63`
  - 理由: プロジェクトには `src/lib/logger.ts` が存在し、`[peek]` プレフィックスを付与する統一されたロガーが提供されている。他のサーバーサイドコードはすべて `logger` を使用しており、`console.warn` を直接呼び出すと出力の統一性が損なわれる。
  - 提案: `import { logger } from "./logger.js";` を追加し、`console.warn(...)` を `logger.warn(...)` に置き換える。テスト側も対応を修正する。

#### Warnings
なし

#### Notes
- **[N-001]** `FSWatcher` のエラーイベントの型アノテーション `(error: Error)` は `@types/node` の定義と正確に一致しており型安全。
- **[N-002]** `console.warn` は stderr に出力されるため、SSE接続やHTTP応答には影響しない点は適切。

---

### Test

#### Blockers
なし

#### Warnings
- **[W-001]** "callback is not invoked after error closes watcher" テストで `console.warn` がモックされておらず、テスト実行時にstderrにログが漏れる
  - 場所: `src/lib/watcher.error-handling.test.ts:54-66`, `src/lib/watcher.error-handling.test.ts:90-102`
  - 理由: エラーイベントを意図的に発行するテストなのに、ログ出力が制御されていない。テスト出力のノイズになる。
  - 提案: `beforeEach`/`afterEach` でファイル全体の `console.warn` スパイを管理する。

- **[W-002]** `warnSpy` のセットアップ・リストアが各テストケース内にインラインで書かれている
  - 場所: `src/lib/watcher.error-handling.test.ts:35,50`, `src/lib/watcher.error-handling.test.ts:71,86`
  - 理由: `beforeEach`/`afterEach` で一括管理すれば、スパイの設定忘れを構造的に防げる。テスト途中失敗時の `mockRestore` 漏れも防止できる。
  - 提案: `beforeEach` に `vi.spyOn(console, "warn").mockImplementation(() => {})` を、`afterEach` に `vi.restoreAllMocks()` を追加する。

#### Notes
- **[N-003]** テストの構造自体は良い。「エラーでwatcherが閉じること」と「エラー後にコールバックが呼ばれないこと」の2つの観点をwatchFile/watchDirectory両方でテストしており網羅性は十分。
- **[N-004]** 全212テストがパスしており、既存テストへの悪影響はない。

---

## Design Decisions

特になし
