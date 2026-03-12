import renderToString from "preact-render-to-string";

type HtmlDocumentProps = {
  readonly title: string;
  readonly rawContentUrl: string;
};

export function HtmlDocument({ title, rawContentUrl }: HtmlDocumentProps) {
  const sseReloadScript = `(function(){var es=new EventSource("/sse");es.addEventListener("file-changed",function(){document.getElementById("content-frame").contentWindow.location.reload()})})()`;
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
        <iframe id="content-frame" title={title} src={rawContentUrl} />
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
