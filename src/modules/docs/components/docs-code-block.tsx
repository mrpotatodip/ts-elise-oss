export function DocsCodeBlock({ code }: { code: string }) {
  return (
    <pre className="max-h-96 overflow-auto rounded-md border border-border/60 bg-muted/40 p-3 text-xs leading-relaxed">
      <code className="font-mono">{code.trim()}</code>
    </pre>
  );
}
