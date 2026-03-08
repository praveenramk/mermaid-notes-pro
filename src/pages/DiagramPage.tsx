import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Header from "@/components/Header";
import MermaidPreview from "@/components/MermaidPreview";
import { Button } from "@/components/ui/button";
import { Copy, Check, ArrowLeft, ExternalLink } from "lucide-react";
import { VISUALIZATION_OPTIONS, VisualizationType } from "@/types/app";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const DiagramPage = () => {
  const {
    mode, contentData, mermaidCode, setMermaidCode,
    selectedVisualization, setSelectedVisualization,
    selectedSubOption, setSelectedSubOption,
  } = useApp();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentViz = VISUALIZATION_OPTIONS.find((v) => v.id === selectedVisualization);

  // When viz or sub-option changes, regenerate mermaid code
  useEffect(() => {
    if (!contentData) return;
    generateMermaidForViz();
  }, [selectedVisualization, selectedSubOption]);

  const generateMermaidForViz = useCallback(async () => {
    if (!contentData) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-mermaid", {
        body: {
          content: mode === "summary-overview" ? contentData.summary : contentData.rawContent,
          keyPoints: contentData.keyPoints,
          visualizationType: selectedVisualization,
          subOption: selectedSubOption,
        },
      });

      if (error) throw error;
      if (data?.mermaidCode) setMermaidCode(data.mermaidCode);
    } catch (e) {
      console.error("Mermaid generation error:", e);
      toast({ title: "Failed to generate diagram", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }, [contentData, mode, selectedVisualization, selectedSubOption, setMermaidCode]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Mermaid code copied!" });
  }, [mermaidCode]);

  const handleSelectVisualization = useCallback((vizId: VisualizationType) => {
    setSelectedVisualization(vizId);
    const viz = VISUALIZATION_OPTIONS.find((v) => v.id === vizId);
    setSelectedSubOption(viz?.subOptions?.[0]?.id || null);
  }, [setSelectedVisualization, setSelectedSubOption]);

  if (!contentData) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen mode-gradient-bg">
      <Header />
      <main className="container mx-auto max-w-7xl px-6 py-6">
        {/* Back Navigation */}
        <button
          onClick={() => navigate(mode === "summary-overview" ? "/summary" : "/")}
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {mode === "summary-overview" ? "Back to Summary" : "Back to Upload"}
        </button>

        {/* Title */}
        <h2 className="mb-6 font-display text-2xl font-bold text-foreground">
          {contentData.sourceType === "url" ? "URL Content Analysis" : "Content Analysis"} — Diagram
        </h2>

        {/* Visualization Type Selector */}
        <div className="mb-3 flex flex-wrap gap-2">
          {VISUALIZATION_OPTIONS.map((viz) => (
            <button
              key={viz.id}
              onClick={() => handleSelectVisualization(viz.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                selectedVisualization === viz.id
                  ? "bg-mode text-mode-foreground shadow-md"
                  : "border border-border bg-card text-muted-foreground hover:border-mode-border hover:text-foreground"
              }`}
            >
              {viz.label}
            </button>
          ))}
        </div>

        {/* Sub-options */}
        {currentViz?.subOptions && (
          <div className="mb-6 flex gap-2">
            {currentViz.subOptions.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubOption(sub.id)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                  selectedSubOption === sub.id
                    ? "bg-mode/20 text-mode border border-mode-border"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Preview Pane */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-mode-border/30 bg-card p-4 shadow-md">
              <h3 className="mb-3 font-display text-sm font-semibold text-foreground">
                📊 Diagram Preview
              </h3>
              {isGenerating ? (
                <div className="flex h-[300px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-mode border-t-transparent" />
                    <p className="text-xs text-muted-foreground">Generating...</p>
                  </div>
                </div>
              ) : (
                <MermaidPreview code={mermaidCode} />
              )}
            </div>
          </div>

          {/* Code Pane */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-mode-border/30 bg-card p-4 shadow-md">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-foreground">
                  💻 Mermaid Code
                </h3>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCopy}
                  className="h-7 w-7"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-mode" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <pre className="max-h-[400px] overflow-auto rounded-lg bg-muted/50 p-4 font-mono text-xs leading-relaxed text-foreground">
                {mermaidCode || "No code generated yet."}
              </pre>
            </div>
          </div>

          {/* External Tools Pane */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-mode-border/30 bg-card p-4 shadow-md">
              <h3 className="mb-4 font-display text-sm font-semibold text-foreground">
                🚀 Open in Design Tools
              </h3>
              <div className="space-y-3">
                <a
                  href="https://excalidraw.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 shadow-md"
                  style={{ backgroundColor: "#9D00FF" }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Excalidraw
                </a>
                <a
                  href="https://app.diagrams.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 shadow-md"
                  style={{ backgroundColor: "#FF9900" }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Draw.io
                </a>
                <a
                  href="https://miro.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-all hover:opacity-90 shadow-md"
                  style={{ backgroundColor: "#FFD02F" }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Miro
                </a>
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                💡 <strong>Tip:</strong> Copy the Mermaid code above, then paste it into any of these tools to visualize your diagram.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DiagramPage;
