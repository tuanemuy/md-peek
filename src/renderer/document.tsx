import type { ComponentChildren, VNode } from "preact";
import renderToString from "preact-render-to-string";
import type { ResolvedStyles } from "../config/styles.js";
import type { InitialState } from "../types/initial-state.js";
import { clientBundle } from "./client-bundle.js";
import { faviconBase64 } from "./favicon.js";
import globalCss from "./global.css";

const themeInitScript = `(function(){var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")})()`;

type DocumentProps = {
  readonly title: string;
  readonly styles: ResolvedStyles;
  readonly initialState?: InitialState;
  readonly children: ComponentChildren;
};

export function Document({
  title,
  styles,
  initialState,
  children,
}: DocumentProps) {
  const initialStateScript = initialState
    ? `window.__INITIAL_STATE__=${JSON.stringify(initialState).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029")}`
    : "";
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} - peek</title>
        {faviconBase64 && (
          <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        )}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <style dangerouslySetInnerHTML={{ __html: globalCss }} />
        <style
          dangerouslySetInnerHTML={{
            __html: styles.contentCss.replaceAll("</style", "<\\/style"),
          }}
        />
      </head>
      <body class="bg-background text-foreground min-h-screen">
        <div id="app">{children}</div>
        {initialStateScript && (
          <script dangerouslySetInnerHTML={{ __html: initialStateScript }} />
        )}
        <script dangerouslySetInnerHTML={{ __html: clientBundle }} />
      </body>
    </html>
  );
}

export function renderDocument(vnode: VNode): string {
  return `<!DOCTYPE html>${renderToString(vnode)}`;
}
