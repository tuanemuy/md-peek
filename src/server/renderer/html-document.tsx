import renderToString from "preact-render-to-string";

type HtmlDocumentProps = {
  readonly title: string;
  readonly rawContentUrl: string;
};

export function HtmlDocument({ title, rawContentUrl }: HtmlDocumentProps) {
  const sseReloadScript = [
    "(function () {",
    "  var maxRetries = 10;",
    "  var retryCount = 0;",
    "  var initialDelay = 1000;",
    "  var maxDelay = 30000;",
    "",
    "  function connect() {",
    '    var es = new EventSource("/sse");',
    "",
    '    es.addEventListener("file-changed", function () {',
    '      var f = document.getElementById("content-frame");',
    "      if (f && f.contentWindow) {",
    "        f.contentWindow.location.reload();",
    "      }",
    "    });",
    "",
    "    es.onerror = function () {",
    "      es.close();",
    "      retryCount++;",
    "      if (retryCount > maxRetries) return;",
    "      var delay = Math.min(",
    "        initialDelay * Math.pow(2, retryCount - 1),",
    "        maxDelay",
    "      );",
    "      setTimeout(connect, delay);",
    "    };",
    "",
    "    setTimeout(function () {",
    "      retryCount = 0;",
    "    }, 5000);",
    "  }",
    "",
    "  connect();",
    "})()",
  ].join("\n");
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} - peek</title>
        <style
          dangerouslySetInnerHTML={{
            __html:
              "html,body{margin:0;padding:0;height:100%;overflow:hidden}iframe{border:none;width:100%;height:100%}",
          }}
        />
      </head>
      <body>
        <iframe
          id="content-frame"
          title={title}
          src={rawContentUrl}
          sandbox="allow-scripts"
        />
        <script dangerouslySetInnerHTML={{ __html: sseReloadScript }} />
      </body>
    </html>
  );
}

export function renderHtmlDocument(
  title: string,
  rawContentUrl: string,
): string {
  return `<!DOCTYPE html>${renderToString(<HtmlDocument title={title} rawContentUrl={rawContentUrl} />)}`;
}
