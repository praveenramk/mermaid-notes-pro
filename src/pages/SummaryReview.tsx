import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Edit3, RotateCcw, Play, Check, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const SummaryReview = () => {
  const { contentData, setContentData, setMermaidCode } = useApp();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState("");
  const [promptFocused, setPromptFocused] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const [editingSummary, setEditingSummary] = useState(false);
  const [editingKeyPoints, setEditingKeyPoints] = useState(false);
  const [editedSummary, setEditedSummary] = useState(contentData?.summary || "");
  const [editedKeyPoints, setEditedKeyPoints] = useState(
    contentData?.keyPoints.map((kp) => ({ ...kp })) || []
  );
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedKeyPoints, setCopiedKeyPoints] = useState(false);

  if (!contentData) {
    navigate("/");
    return null;
  }

  const handleCopy = useCallback(async (text: string, type: "summary" | "keypoints") => {
    await navigator.clipboard.writeText(text);
    if (type === "summary") {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } else {
      setCopiedKeyPoints(true);
      setTimeout(() => setCopiedKeyPoints(false), 2000);
    }
    toast({ title: "Copied to clipboard!" });
  }, []);

  const handleRegenerate = useCallback(async (customPrompt?: string) => {
    setIsRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-summary", {
        body: {
          content: contentData.rawContent,
          sourceType: contentData.sourceType,
          customPrompt: customPrompt || prompt,
        },
      });

      if (error) throw error;

      const newSummary = data?.summary || contentData.summary;
      const newKeyPoints = data?.keyPoints || contentData.keyPoints;

      setContentData({ ...contentData, summary: newSummary, keyPoints: newKeyPoints });
      setEditedSummary(newSummary);
      setEditedKeyPoints(newKeyPoints.map((kp: any) => ({ ...kp })));
      toast({ title: "Content regenerated!" });
    } catch (e) {
      console.error("Regeneration error:", e);
      toast({ title: "Regeneration failed", variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  }, [contentData, prompt, setContentData]);

  const handlePromptSubmit = useCallback(() => {
    if (!prompt.trim()) return;
    handleRegenerate(prompt);
    setPrompt("");
  }, [prompt, handleRegenerate]);

  const handleSaveSummary = useCallback(() => {
    setContentData({ ...contentData, summary: editedSummary });
    setEditingSummary(false);
  }, [contentData, editedSummary, setContentData]);

  const handleSaveKeyPoints = useCallback(() => {
    setContentData({ ...contentData, keyPoints: editedKeyPoints });
    setEditingKeyPoints(false);
  }, [contentData, editedKeyPoints, setContentData]);

  const handleGenerateMermaid = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-mermaid", {
        body: {
          content: contentData.summary,
          keyPoints: contentData.keyPoints,
          visualizationType: "mindmap",
          subOption: "spidermap",
        },
      });

      if (error) throw error;
      if (data?.mermaidCode) setMermaidCode(data.mermaidCode);
      navigate("/diagram");
    } catch (e) {
      console.error("Mermaid generation error:", e);
      toast({ title: "Failed to generate mermaid code", variant: "destructive" });
      navigate("/diagram");
    }
  }, [contentData, setMermaidCode, navigate]);

  const keyPointsText = contentData.keyPoints
    .map((kp) => `${kp.emoji} ${kp.title}: ${kp.description}`)
    .join("\n");

  return (
    <div className="min-h-screen mode-gradient-bg">
      <Header />
      <main className="container mx-auto max-w-6xl px-6 py-8">
        {/* Prompt Bar */}
        <div className="mb-8 flex gap-3">
          <div className="relative flex-1">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setPromptFocused(true)}
              onBlur={() => !prompt && setPromptFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && handlePromptSubmit()}
              placeholder={promptFocused ? "Enter your custom query to refine the summary..." : "Overall Summary"}
              className="h-14 border-mode-border/40 pr-14 text-base focus-visible:ring-mode"
            />
          </div>
          <Button
            onClick={handlePromptSubmit}
            disabled={!prompt.trim() || isRegenerating}
            className="h-14 gap-2 bg-mode px-6 text-mode-foreground hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            Submit
          </Button>
        </div>

        {/* Two Panes */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Summary Pane */}
          <div className="rounded-2xl border border-mode-border/30 bg-card p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-foreground">📋 Summary</h3>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleCopy(contentData.summary, "summary")}
                  className="h-8 w-8"
                >
                  {copiedSummary ? <Check className="h-4 w-4 text-mode" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (editingSummary) handleSaveSummary();
                    else { setEditedSummary(contentData.summary); setEditingSummary(true); }
                  }}
                  className="h-8 w-8"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRegenerate()}
                  disabled={isRegenerating}
                  className="h-8 w-8"
                >
                  <RotateCcw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
            {editingSummary ? (
              <div className="space-y-3">
                <Textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  className="min-h-[200px] border-mode-border/40 focus-visible:ring-mode"
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingSummary(false)}>Cancel</Button>
                  <Button size="sm" className="bg-mode text-mode-foreground" onClick={handleSaveSummary}>Save</Button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {contentData.summary}
              </p>
            )}
          </div>

          {/* Key Points Pane */}
          <div className="rounded-2xl border border-mode-border/30 bg-card p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-foreground">🔑 Key Points</h3>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleCopy(keyPointsText, "keypoints")}
                  className="h-8 w-8"
                >
                  {copiedKeyPoints ? <Check className="h-4 w-4 text-mode" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (editingKeyPoints) handleSaveKeyPoints();
                    else { setEditedKeyPoints(contentData.keyPoints.map((kp) => ({ ...kp }))); setEditingKeyPoints(true); }
                  }}
                  className="h-8 w-8"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {editingKeyPoints ? (
              <div className="space-y-3">
                {editedKeyPoints.map((kp, i) => (
                  <div key={kp.id} className="space-y-1.5 rounded-lg border border-border p-3">
                    <Input
                      value={kp.title}
                      onChange={(e) => {
                        const updated = [...editedKeyPoints];
                        updated[i] = { ...updated[i], title: e.target.value };
                        setEditedKeyPoints(updated);
                      }}
                      className="h-8 text-sm font-medium"
                      placeholder="Title"
                    />
                    <Input
                      value={kp.description}
                      onChange={(e) => {
                        const updated = [...editedKeyPoints];
                        updated[i] = { ...updated[i], description: e.target.value };
                        setEditedKeyPoints(updated);
                      }}
                      className="h-8 text-sm"
                      placeholder="Description"
                    />
                  </div>
                ))}
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingKeyPoints(false)}>Cancel</Button>
                  <Button size="sm" className="bg-mode text-mode-foreground" onClick={handleSaveKeyPoints}>Save</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {contentData.keyPoints.map((kp) => (
                  <div key={kp.id} className="rounded-lg border border-border/50 bg-muted/30 p-3">
                    <p className="text-sm font-medium text-foreground">
                      {kp.emoji} {kp.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{kp.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Generate Mermaid Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleGenerateMermaid}
            size="lg"
            className="gap-2 bg-mode px-10 py-4 text-lg text-mode-foreground shadow-xl transition-all hover:opacity-90 hover:shadow-2xl"
          >
            <Play className="h-5 w-5" />
            Generate Mermaid
          </Button>
        </div>
      </main>
    </div>
  );
};

export default SummaryReview;
