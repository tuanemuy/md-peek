# PR Review #001 — feat: add HTML file preview support

**PR:** #37
**Issue:** #36
**Date:** 2026-03-14
**Round:** 1回目

---

## Summary

- Blockers: 3
- Warnings: 16
- Notes: 17
- Verdict: **BLOCKED**

---

### Security

#### Blockers

- **[B-001]** `allow-same-origin` + `allow-scripts` の iframe sandbox 組み合わせにより、sandbox が実質無効化される
  - 場所: `src/components/content-view.tsx:37`, `src/server/renderer/html-document.tsx:67`, `src/server/routes/api.tsx:35`
  - 理由: `allow-same-origin` と `allow-scripts` を同時指定すると、iframe 内スクリプトは親ページと同一オリジンとして扱われ、`parent.document` 操作、`top.document.cookie` / `localStorage` アクセス、`fetch("/api/raw?path=...")` による他ファイル読み取りが可能。ローカルプレビューツールとはいえ、信頼できない HTML を開いた場合のリスクが高い。
  - 提案: (1) `/api/raw` レスポンスに `Content-Security-Policy: sandbox allow-scripts` を付与し、レスポンスレベルでも sandbox を二重適用する。または (2) `allow-same-origin` を外して null オリジンで動作させる（ただし相対パスリソース読み込みに影響あり）。最低限、リスクをドキュメントに明記する。

#### Warnings

- **[W-001]** `resolveAndValidatePath` がシンボリックリンクトラバーサルを考慮していない
  - 場所: `src/server/routes/api.tsx:55`
  - 理由: `resolve(basePath, normalize(query))` は論理パスのみ正規化し、symlink を解決しない。`file-tree.ts` では `realpath` を使っているが、`/api/raw` では未使用。ローカルツールのためリスクは低いが防御的プログラミングとして不十分。
  - 提案: `realpath` で解決後のパスにも `isWithinBase` チェックを行う。

- **[W-002]** `/api/raw` に null byte injection 防御がない
  - 場所: `src/server/routes/api.tsx:55`
  - 理由: 現行 Node.js では実質リスクゼロだが、防御的プログラミングとして query に null byte が含まれていないことを検証すべき。
  - 提案: `if (query.includes('\0')) return { ok: false, status: 400, message: "Invalid path" };` を追加。

- **[W-003]** SSE エンドポイントにアクセス制御がない
  - 場所: SSE routes 全般
  - 理由: `--host 0.0.0.0` で起動した場合、ネットワーク上の他端末からファイル変更通知（パス含む）を受信可能。
  - 提案: `0.0.0.0` バインド時の警告表示を確認、または簡易トークンベースのアクセス制御を検討。

- **[W-004]** CSP 省略と B-001 の組み合わせで影響範囲が拡大
  - 場所: `src/server/routes/api.tsx:131-133`
  - 理由: CSP なしのため iframe 内から任意の外部リソース読み込みに加え、`fetch("/api/raw?path=...")` で同一サーバー上の他ファイル読み取りも可能。
  - 提案: B-001 と連動して対応。

- **[W-005]** `getContentType` が resolved path ではなく raw query に対して評価されている
  - 場所: `src/server/routes/api.tsx:59`
  - 理由: validation 対象と operation 対象の不一致（TOCTOU 的懸念）。現状は実質問題にならないが設計上の懸念。
  - 提案: `getContentType(fullPath)` に変更。

---

### Architecture

#### Blockers

なし

#### Warnings

- **[W-006]** `resolveAndValidatePath` が 3 つの責務を混在させている（パス解決 + セキュリティ検証 + contentType 判定）
  - 場所: `src/server/routes/api.tsx:46-64`
  - 理由: 将来新しい contentType 追加時や contentType に依存しないパス検証だけが必要なケースで再利用しにくい。現時点では 2 箇所でしか使われておらず acceptable だが、将来のリファクタ候補。
  - 提案: contentType 判定を呼び出し側に分離する検討。

- **[W-007]** `renderFileContent` の非対称処理がレイヤー境界を曖昧にしている
  - 場所: `src/server/routes/directory.tsx:74-103`
  - 理由: HTML 時は `access()` で存在確認のみ＋空文字列返却、Markdown 時は `readTextFile` + `renderMarkdown`。関数名 `renderFileContent` から HTML 時の挙動が推測できない。
  - 提案: 関数名を `prepareFileContent` に変更するか、HTML 分岐を関数外に出す。

- **[W-008]** `html-document.tsx` と `client/lib/sse.ts` で SSE 再接続ロジックが重複
  - 場所: `src/server/renderer/html-document.tsx:15-48`, `src/client/lib/sse.ts:34-84`
  - 理由: リトライリセット戦略が異なる（`onopen` 即リセット vs `SSE_STABLE_THRESHOLD_MS` 経過後リセット）。SSE 仕様変更時に片方だけ更新される危険。
  - 提案: リトライ戦略を統一するか、対応関係をコメントで明記。

- **[W-009]** `createApiRoutes` が `getContentType(config.targetPath)` を内部で再計算しており Single Source of Truth に反する
  - 場所: `src/server/routes/api.tsx:68-69`
  - 理由: `ServerConfig` で既に判定済みの `contentType` が `ApiConfig` に渡されず、再計算されている。
  - 提案: `FileApiConfig` に `contentType` フィールドを追加。

- **[W-010]** File mode + HTML での `useSseUpdates` の不使用がコード上不明確
  - 場所: `src/client/hooks/use-sse-updates.ts` JSDoc
  - 理由: HTML file mode では `html-document.tsx` のインライン SSE スクリプトが使われるため `useSseUpdates` は呼ばれないが、その旨がドキュメントされていない。
  - 提案: JSDoc に明記。

---

### Frontend

#### Blockers

- **[B-002]** `useNavigation` コールバック内で `getContentType(path)` チェック前に state が更新されてしまう（PR push 済みコード）
  - 場所: `src/client/directory-app.tsx:40-51`（PR diff 版）
  - 理由: `currentPathRef.current = path` と `setCurrentPath(path)` を実行してから `getContentType` をチェックしている。null 時に `return` しても state は既にサポート外パスに更新済みで、SSE パス比較がずれる。working tree では修正済みだが PR 未反映。
  - 提案: working tree の修正（チェックを state 更新前に移動）をコミットして PR に反映。

- **[B-003]** `useSseUpdates` の `onContentUpdate("")` による HTML reload 通知はセマンティクスとして不正確（PR push 済みコード）
  - 場所: `src/client/hooks/use-sse-updates.ts:38-40`, `src/client/directory-app.tsx:59-64`（PR diff 版）
  - 理由: 空文字列を「リロードシグナル」として使うのは不自然。呼び出し側で `contentTypeRef` を再チェックする必要があり、hook インターフェースが不明確。working tree では `onHtmlReload` コールバックに分離済みだが PR 未反映。
  - 提案: working tree の `onHtmlReload` 分離をコミットして PR に反映。

#### Warnings

- **[W-011]** `contentTypeRef` の二重管理にコメントがない
  - 場所: `src/client/directory-app.tsx:53-54`
  - 理由: `currentPathRef` と同じパターンだが、なぜ ref が必要かのコメントがない。
  - 提案: `currentPathRef` と同様のコメントを付ける。

- **[W-012]** `useNavigation` が HTML ファイルでも `/api/content` を無駄に呼んでいる
  - 場所: `src/client/hooks/use-navigation.ts:25`
  - 理由: HTML 時は `ContentView` が `rawUrl` prop で iframe を直接レンダリングするため、`/api/content` のレスポンス（iframe 断片 HTML）は使われない。無駄なネットワークリクエスト。
  - 提案: `getContentType(path) === "html"` 時は `fetchContent` をスキップ。

- **[W-013]** `htmlReloadKey` による iframe 再マウントの UX 影響
  - 場所: `src/components/content-view.tsx:30`
  - 理由: `key` 変更で iframe 完全再マウント → スクロール位置・フォーム入力状態が全て失われる。file mode では `contentWindow.location.reload()` を使っており挙動が非対称。
  - 提案: iframe ref + `contentWindow.location.reload()` の方が UX 上望ましい。設計判断の理由をコメントに残す。

- **[W-014]** PR push 済みコードで `useSseUpdates` に abort 制御がない
  - 場所: `src/client/hooks/use-sse-updates.ts`（PR diff 版）
  - 理由: SSE イベント連続発火時に古い `fetchContent` レスポンスが後着して最新コンテンツを上書きする race condition。working tree では修正済みだが PR 未反映。
  - 提案: working tree の abort 制御をコミットして PR に反映。

- **[W-015]** テストと実装の乖離（PR push 済み vs working tree）
  - 場所: `src/client/hooks/use-sse-updates.test.ts`
  - 理由: PR diff 版テストは `onContentUpdate("")` を期待するが、working tree は `onHtmlReload` を使用。
  - 提案: 実装とテストの変更を同時にコミット・push。

---

### Test

#### Blockers

なし

#### Warnings

- **[W-016]** `renderFileContent` の 500 エラーパス（`access()` の ENOENT 以外のエラー、`readTextFile` の非 file-not-found エラー）がテストされていない
  - 場所: `src/server/routes/directory.tsx:83-89`, `98-100`
  - 理由: この PR で新設された共通関数だが、500 エラーを返す 2 つのパスにテストがない。
  - 提案: モックまたはパーミッション操作でエラーパスをテスト。

- **[W-017]** `ContentView` コンポーネントのユニットテストが存在しない
  - 場所: `src/components/content-view.tsx`
  - 理由: 新規追加コンポーネントで HTML/Markdown 分岐あり。間接的に `directory.test.ts` でカバーされるが、直接テストが望ましい。
  - 提案: `preact-render-to-string` で props ごとの出力を検証する軽量テスト追加。

- **[W-018]** `watcher.test.ts` が HTML/HTM ファイルの監視をテストしていない
  - 場所: `src/lib/watcher.test.ts`
  - 理由: `isSupportedFile` に変更されたが、テストは `.md` のみ。
  - 提案: `.html` ファイル変更時のコールバック発火テストを追加。

---

## Design Decisions

- **iframe sandbox に `allow-same-origin` + `allow-scripts` を採用**: ユーザーの HTML ファイルが相対パスのリソース（CSS、画像等）を読み込めるようにするため。ただしセキュリティ上の影響が大きく、再検討が必要（B-001）。
- **HTML file mode では専用テンプレート（`html-document.tsx`）を使用**: Preact/バンドラーに依存しないインライン SSE スクリプトでライブリロードを実現。シンプルだが SSE ロジックの重複を生む（W-008）。
- **`onContentUpdate("")` による間接的リロードシグナル**: working tree では `onHtmlReload` コールバックに改善済み（B-003）。
