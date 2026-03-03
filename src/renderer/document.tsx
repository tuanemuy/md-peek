import { raw } from "hono/html";
import type { Child } from "hono/jsx";
import type { ResolvedStyles } from "../config/styles.js";
import { clientBundle } from "./client-bundle.js";
import { faviconBase64 } from "./favicon.js";
import globalCss from "./global.css";

const themeInitScript = `(function(){var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")})()`;

type DocumentProps = {
  readonly title: string;
  readonly styles: ResolvedStyles;
  readonly mode: "file" | "directory";
  readonly children: Child;
};

export function Document({ title, styles, mode, children }: DocumentProps) {
  return (
    <>
      {raw("<!DOCTYPE html>")}
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>{title} - peek</title>
          {faviconBase64 && (
            <link rel="icon" href="/favicon.ico" type="image/x-icon" />
          )}
          <script>{raw(themeInitScript)}</script>
          <style>{raw(globalCss)}</style>
          <style>
            {raw(styles.contentCss.replaceAll("</style", "<\\/style"))}
          </style>
        </head>
        <body
          class="bg-background text-foreground min-h-screen"
          data-mode={mode}
        >
          {children}
          <script>{raw(clientBundle)}</script>
        </body>
      </html>
    </>
  );
}
