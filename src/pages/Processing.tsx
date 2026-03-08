import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const steps = [
  { label: "Analyzing content", duration: 2000 },
  { label: "Processing with AI", duration: 4000 },
  { label: "Complete!", duration: 500 },
];

const Processing = () => {
  const { mode, contentData, setContentData, setMermaidCode } = useApp();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  const abortRef = useRef(false);

  useEffect(() => {
    if (!contentData) {
      navigate("/");
      return;
    }

    const process = async () => {
      // Step 1: Analyzing
      setCurrentStep(0);
      for (let i = 0; i <= 30; i++) {
        if (abortRef.current) return;
        setProgress(i);
        await new Promise((r) => setTimeout(r, 60));
      }

      // Step 2: Processing with AI
      setCurrentStep(1);
      try {
        // Call edge function to generate summary
        const { data: summaryData, error: summaryError } = await supabase.functions.invoke("generate-summary", {
          body: {
            content: contentData.rawContent,
            sourceType: contentData.sourceType,
          },
        });

        if (abortRef.current) return;

        if (summaryError) throw summaryError;

        const summary = summaryData?.summary || "Summary of the provided content.";
        const keyPoints = summaryData?.keyPoints || [
          { id: "1", emoji: "📌", title: "Key Insight", description: "Main takeaway from the content" },
          { id: "2", emoji: "💡", title: "Important Detail", description: "A notable detail worth highlighting" },
          { id: "3", emoji: "🔍", title: "Analysis Point", description: "Deeper analysis of the content" },
        ];

        setContentData({
          ...contentData,
          summary,
          keyPoints,
        });

        for (let i = 30; i <= 70; i++) {
          if (abortRef.current) return;
          setProgress(i);
          await new Promise((r) => setTimeout(r, 40));
        }

        if (mode === "direct-mermaid") {
          // Also generate mermaid code directly
          const { data: mermaidData, error: mermaidError } = await supabase.functions.invoke("generate-mermaid", {
            body: {
              content: summary,
              keyPoints,
              visualizationType: "mindmap",
              subOption: "spidermap",
            },
          });

          if (abortRef.current) return;
          if (!mermaidError && mermaidData?.mermaidCode) {
            setMermaidCode(mermaidData.mermaidCode);
          }
        }

        for (let i = 70; i <= 100; i++) {
          if (abortRef.current) return;
          setProgress(i);
          await new Promise((r) => setTimeout(r, 30));
        }

        // Step 3: Complete
        setCurrentStep(2);
        await new Promise((r) => setTimeout(r, 800));

        if (abortRef.current) return;

        if (mode === "direct-mermaid") {
          navigate("/diagram");
        } else {
          navigate("/summary");
        }
      } catch (error) {
        console.error("Processing error:", error);
        toast({
          title: "Processing Error",
          description: "Failed to process content. Please try again.",
          variant: "destructive",
        });
        navigate("/");
      }
    };

    process();
  }, []);

  const handleCancel = () => {
    abortRef.current = true;
    setCancelled(true);
    navigate("/");
  };

  return (
    <div className="min-h-screen mode-gradient-bg">
      <Header />
      <main className="container mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-6">
        <div className="w-full rounded-2xl border border-mode-border/30 bg-card p-10 shadow-xl">
          <h2 className="mb-8 text-center font-display text-2xl font-bold text-foreground">
            {cancelled ? "Cancelled" : "Processing Your Content"}
          </h2>

          {/* Steps */}
          <div className="mb-8 space-y-4">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                {i < currentStep ? (
                  <CheckCircle className="h-5 w-5 text-mode" />
                ) : i === currentStep && !cancelled ? (
                  <Loader2 className="h-5 w-5 animate-spin text-mode" />
                ) : cancelled ? (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-border" />
                )}
                <span
                  className={`text-sm font-medium ${
                    i <= currentStep ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <Progress value={progress} className="h-2 [&>div]:bg-mode" />
          </div>
          <p className="mb-6 text-center text-sm text-muted-foreground">{progress}% complete</p>

          {/* Source info */}
          {contentData && (
            <p className="mb-6 text-center text-xs text-muted-foreground">
              Source: {contentData.sourceName}
            </p>
          )}

          {/* Cancel */}
          {!cancelled && currentStep < 2 && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleCancel} className="border-mode-border/40">
                Cancel
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Processing;
