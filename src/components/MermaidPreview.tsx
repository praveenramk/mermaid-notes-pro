import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { sanitizeMermaidCode } from "@/lib/mermaid-sanitizer";

interface MermaidPreviewProps {
  code: string;
}

const MermaidPreview = ({ code }: MermaidPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "strict",
      fontFamily: "Inter, sans-serif",
    });
  }, []);

  useEffect(() => {
    if (!code) {
      setSvgContent("");
      setError(null);
      return;
    }

    const renderDiagram = async () => {
      const sanitized = sanitizeMermaidCode(code);
      try {
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, sanitized);
        setSvgContent(svg);
        setError(null);
      } catch (e) {
        console.warn("Mermaid render failed, trying sanitized:", e);
        // Second attempt with more aggressive sanitization
        try {
          const furtherSanitized = sanitized
            .split("\n")
            .filter((line) => line.trim())
            .join("\n");
          const id2 = `mermaid-retry-${Date.now()}`;
          const { svg } = await mermaid.render(id2, furtherSanitized);
          setSvgContent(svg);
          setError(null);
        } catch (e2) {
          setError("Could not render diagram. The mermaid code may have syntax issues.");
          setSvgContent("");
        }
      }
    };

    renderDiagram();
  }, [code]);

  if (error) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <div className="text-center">
          <p className="text-sm font-medium text-destructive">⚠️ Preview Error</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border border-border bg-muted/30 p-6">
        <p className="text-sm text-muted-foreground">Select a visualization to see the preview</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-[300px] items-center justify-center overflow-auto rounded-lg border border-mode-border/30 bg-card p-4"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default MermaidPreview;
