type MarkdownContentProps = {
  readonly htmlContent: string;
};

export function MarkdownContent({ htmlContent }: MarkdownContentProps) {
  return (
    <div
      id="markdown-content"
      class="markdown-body"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
