# PR Review #002 — feat: add HTML file preview support

**PR:** #37
**Issue:** #36
**Date:** 2026-03-14
**Round:** 2回目

---

## Summary

- Blockers: 1 (新規発見: SSR/hydration mismatch → 修正済み)
- Warnings: 13
- Notes: 17
- Verdict: **BLOCKED** → 修正してRound 3へ

---

### Security

#### Blockers
なし（Round 1 の B-001 は ADR-001 で設計判断済み、B-002/B-003 は修正確認済み）

#### Warnings
- W-001: symlink traversal 未考慮（Round 1 から継続）
- W-002: null byte injection 防御なし（Round 1 から継続）
- W-003: SSE アクセス制御なし（Round 1 から継続）
- W-004: getContentType が raw query に対して評価（Round 1 から継続）
- W-005: (新規) /api/raw に Content-Type 明示なし

#### Notes
- renderHtmlDocument の URL validation 追加は適切
- IFRAME_SANDBOX 定数の共有化は良い改善
- SSE 定数の共有化で不整合リスク排除

---

### Architecture

#### Blockers
なし

#### Warnings
- W-006: resolveAndValidatePath 3責務混在（Round 1 から継続、acceptable）
- W-007: renderFileContent 非対称処理（Round 1 から継続）
- W-008: SSE 再接続ロジック重複（定数は共有化済み、戦略の差異は残存）
- W-011: contentTypeRef コメント不足（取り下げ: 同パターンのため不要）
- W-012: useNavigation の無駄な fetchContent（Round 1 から継続）
- W-019: (新規) ServerConfig と AppContext の型重複
- W-020: (新規) index.ts の serverConfig 構築ロジックが複雑

#### Notes
- ServerConfig の discriminated union 改善は良い設計判断
- fileContentType 変数で SSOT 違反解消

---

### Frontend

#### Blockers
- **[B-004]** (新規) catch-all route で HTML ファイルアクセス時の SSR/hydration mismatch → **修正済み**（renderHtmlDocument を使用）

#### Warnings
- W-012: useNavigation の無駄な fetchContent（Round 1 から継続）
- W-013: htmlReloadKey による iframe 再マウント UX（Round 1 から継続）
- W-020: (新規) setHtmlReloadKey(0) リセットの中途半端さ（軽微）

#### Notes
- B-002, B-003, W-014, W-015 全て修正確認済み
- AbortController の実装は適切

---

### Test

#### Blockers
なし

#### Warnings
- W-016: renderFileContent 500 エラーパス未テスト（Round 1 から継続）
- W-017: ContentView ユニットテストなし（Round 1 から継続）
- W-018: watcher.test.ts HTML 未テスト（Round 1 から継続）
- W-019: (新規) useEffect cleanup 関数未テスト
- W-020: (新規) fetchTree abort テスト不足
- W-021: (新規) SSE リトライリセット戦略差異のテスト/コメント不足

#### Notes
- 全 208 テストパス
- abort behavior テスト追加は適切
- createTestApp ヘルパーでボイラープレート削減

---

## Design Decisions

- catch-all route の HTML ファイル: `renderHtmlDocument` を使用して Preact hydration を回避。FileApp は Markdown 専用のまま維持。
