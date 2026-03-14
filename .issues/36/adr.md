# ADR — Issue #36 / PR #37: feat: add HTML file preview support

## ADR-001: iframe sandbox に `allow-same-origin` + `allow-scripts` を採用し、セキュリティリスクを許容する

### Status
Accepted

### Context
HTMLファイルプレビューではiframeでユーザーのHTMLファイルを表示する。`allow-same-origin` と `allow-scripts` を同時指定すると、iframe内のスクリプトが親ページと同一オリジンとして扱われ、`parent.document` 操作、cookie/localStorage アクセス、`fetch("/api/raw?path=...")` による他ファイル読み取りが理論上可能になる。

### Decision
ローカルプレビューツールという性質上、このリスクを許容する。理由:
1. ユーザーは自身のローカルファイルをプレビューしており、信頼できないHTMLを開くユースケースは想定外
2. `allow-same-origin` を外すと、HTML内の相対パスリソース（CSS、画像等）が読み込めなくなり、プレビューとしての価値が大幅に低下する
3. デフォルトで localhost にバインドされるため、外部からのアクセスリスクは低い

### Consequences
- 信頼できないHTMLファイルをプレビューした場合、理論上は同一サーバー上の他ファイルが読み取り可能
- 将来的に必要であれば、`/api/raw` レスポンスに `Content-Security-Policy: sandbox allow-scripts` を付与して二重サンドボックスを適用可能
