type MarkdownContentProps = {
  readonly htmlContent: string;
};

export function MarkdownContent({ htmlContent }: MarkdownContentProps) {
  // htmlContent is trusted: rendered server-side from local markdown files.
  // If this tool is ever exposed to untrusted input, add HTML sanitization (e.g. DOMPurify).
  return (
    <div
      id="markdown-content"
      class="markdown-body"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
