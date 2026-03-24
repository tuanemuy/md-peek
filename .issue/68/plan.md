# 実装計画 — Issue #68: 2回目のSIGINTでプロセスを強制終了する

**Issue:** #68
**作成日:** 2026-03-24

---

## 目的

`shutdown` 関数の `shuttingDown` ガードが2回目の Ctrl+C を無視しているため、`server.shutdown()` がハングした場合にユーザーがプロセスを強制終了できない。2回目のシグナルで `process.exit(1)` を呼ぶことで安全な脱出手段を提供する。

## スコープ

### 含まれるもの
- `src/index.ts` の `shutdown` 関数で2回目のシグナル時に `process.exit(1)` する変更

### 含まれないもの
- `server.shutdown()` のタイムアウト機構の追加
- `ServerInstance` 側の変更
- 新規テストファイルの追加（`process.exit` を呼ぶ挙動はユニットテストで検証困難）

## 実装ステップ

### 1. `src/index.ts` の `shutdown` 関数を修正

- **対象ファイル:** `src/index.ts`
- **変更内容:** `if (shuttingDown) return;` を `if (shuttingDown) { process.exit(1); }` に変更する。Issueの対応案そのままの形。
- **理由:** 2回目のSIGINT/SIGTERMで即座に強制終了し、ハング時の脱出手段を確保する。

## 設計判断

特になし。Issueの対応案がシンプルかつ適切であり、他の選択肢を検討する必要がない。

## リスクと注意点

- `process.exit(1)` はクリーンアップなしで即座に終了する。しかし、これは1回目の `shutdown` が既にクリーンアップ中（またはハング中）であるため意図通りの挙動。
- 終了コード `1` はエラー終了を示す。正常な `shutdown` 完了時の `0` と区別される。

## テスト方針

- 既存テスト（`pnpm test`）がパスすることを確認
- `process.exit(1)` の呼び出しはユニットテストで検証困難なため、testing.md の手動確認で担保
