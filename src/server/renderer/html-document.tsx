import renderToString from "preact-render-to-string";
import { IFRAME_SANDBOX } from "../../core/iframe-style.js";
import {
  SSE_INITIAL_RETRY_MS,
  SSE_MAX_RETRIES,
  SSE_MAX_RETRY_MS,
} from "../../core/sse-constants.js";

type HtmlDocumentProps = {
  readonly title: string;
  readonly rawContentUrl: string;
};

export function HtmlDocument({ title, rawContentUrl }: HtmlDocumentProps) {
  const sseReloadScript = `(function () {
  var maxRetries = ${SSE_MAX_RETRIES};
  var retryCount = 0;
  var initialDelay = ${SSE_INITIAL_RETRY_MS};
  var maxDelay = ${SSE_MAX_RETRY_MS};

  function connect() {
    var es = new EventSource("/sse");

    es.addEventListener("file-changed", function () {
      var f = document.getElementById("content-frame");
      if (f && f.contentWindow) {
        f.contentWindow.location.reload();
      }
    });

    es.onopen = function () {
      retryCount = 0;
    };

    es.onerror = function () {
      es.close();
      retryCount++;
      if (retryCount > maxRetries) return;
      var delay = Math.min(
        initialDelay * Math.pow(2, retryCount - 1),
        maxDelay
      );
      setTimeout(connect, delay);
    };
  }

  connect();
})()`;
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
          sandbox={IFRAME_SANDBOX}
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
  if (!rawContentUrl.startsWith("/")) {
    throw new Error(
      `rawContentUrl must be an absolute path, got: ${rawContentUrl}`,
    );
  }
  return `<!DOCTYPE html>${renderToString(<HtmlDocument title={title} rawContentUrl={rawContentUrl} />)}`;
}
